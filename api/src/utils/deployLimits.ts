import {
  FileMember,
  FolderMember,
  MemberType,
  ServiceMember
} from '@sasjs/utils'
import { isSafePathSegment } from './resolveWithinDrive'

/** Any member a file tree can hold, at any depth. */
export type TreeMember = FolderMember | ServiceMember | FileMember

/**
 * The deploy cap.
 *
 * `POST /SASjsApi/drive/deploy` writes a whole file tree in one request, which
 * makes it the one operation where a caller can fill the host's storage: the
 * drive's own routes write a single file at a time, each bounded by the upload
 * limit. So a tree is measured before a byte is written, and refused with `413`
 * naming the limit it breached and the figure it reached.
 *
 * The three dimensions are separate because they fail differently: an estate is
 * many small files (`entries`), a compiled service is one large file
 * (`fileBytes`), and the total is what the host holds in memory before the tree
 * reaches the drive (`totalBytes`).
 *
 * Binary megabytes throughout - the unit multer reports in - and compared
 * inclusively: a tree of exactly 10,000 entries and exactly 100 MB passes.
 */
export interface DeployLimits {
  readonly entries: number
  readonly totalBytes: number
  readonly fileBytes: number
}

export const DEPLOY_LIMITS: DeployLimits = {
  entries: 10000,
  totalBytes: 100 * 1024 * 1024,
  fileBytes: 20 * 1024 * 1024
}

export interface DeployMeasurements {
  entries: number
  totalBytes: number
  /** The largest single member, by decoded size, with its path in the tree. */
  largest: { path: string; bytes: number }
}

/** The refusal a deploy earns, in the shape the drive deploy routes render. */
export interface DeployRefusal {
  code: 400 | 413
  status: 'failure'
  message: string
}

/**
 * The bytes a member writes.
 *
 * A file member's `code` is base64 (the drive stores it decoded), so the
 * ENCODED length would overstate it by a third and refuse trees that fit. A
 * service member's `code` is the program text, measured as UTF-8 because that
 * is what reaches the disk.
 */
const decodedBytes = (member: ServiceMember | FileMember): number =>
  member.type === MemberType.file
    ? Buffer.from(member.code, 'base64').length
    : Buffer.byteLength(member.code ?? '', 'utf8')

/** The name the member is written under - services gain the extension. */
const memberName = (member: TreeMember): string =>
  member.type === MemberType.service ? `${member.name}.sas` : member.name

/**
 * Sizes as the message states them: one decimal in binary megabytes, and bytes
 * below a megabyte - a limit small enough to be measured in bytes should not
 * read as "0 MB", which is what a strict host would otherwise report.
 */
const describeSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${bytes} bytes`
    : `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`

/**
 * Walks a tree, counting it and checking every name on the way.
 *
 * Recursive because the tree is: the deepest member counts towards the same
 * totals as the shallowest, and the largest member keeps its path so a refusal
 * names the file the reader has to shrink. A name refusal is RETURNED rather
 * than thrown - the caller is a validator, and the first problem found is its
 * answer.
 */
const walk = (
  members: TreeMember[],
  parentPath: string,
  acc: DeployMeasurements
): DeployRefusal | null => {
  for (const member of members) {
    const name = memberName(member)
    const memberPath = parentPath ? `${parentPath}/${name}` : name

    // Every member name becomes a path SEGMENT under the deployment root. A
    // name carrying '/', '\' or '..' is a traversal attempt, and it is checked
    // here rather than during the write so a hostile tree writes nothing at
    // all - the same promise the cap makes.
    if (!isSafePathSegment(name))
      return {
        code: 400,
        status: 'failure',
        message: `Invalid member name: '${name}'. Member names must be single path segments (no '/', '\\', '..').`
      }

    acc.entries++

    if (member.type === MemberType.folder) {
      const nested = walk(member.members, memberPath, acc)

      if (nested) return nested

      continue
    }

    const bytes = decodedBytes(member)

    acc.totalBytes += bytes

    if (bytes > acc.largest.bytes) acc.largest = { path: memberPath, bytes }
  }

  return null
}

/**
 * Measures a tree without touching the drive.
 *
 * Throws away the name refusal: a caller that only wants the numbers (a spec, a
 * diagnostic) is not validating anything. `checkDeployTree` is the validator.
 */
export const measureDeployTree = (
  members: TreeMember[]
): DeployMeasurements => {
  const acc: DeployMeasurements = {
    entries: 0,
    totalBytes: 0,
    largest: { path: '', bytes: 0 }
  }

  walk(members, '', acc)

  return acc
}

/**
 * The refusal a file tree earns, or `null` when it can be written.
 *
 * Names are checked first, then the dimensions in a fixed order - entries,
 * total, single file - so a tree breaching two of them is refused for the same
 * one every time, which is what lets a caller key on the message and a test pin
 * it.
 *
 * The body is the deploy routes' own shape (`{status:'failure', message}`), not
 * the plain-text message the drive's CRUD routes send: these two routes answer
 * their `400` and `500` that way, and the document says so.
 *
 * `limits` defaults to `DEPLOY_LIMITS`; a host may pass its own, stricter set.
 */
export const checkDeployTree = (
  members: TreeMember[],
  limits: DeployLimits = DEPLOY_LIMITS
): DeployRefusal | null => {
  const acc: DeployMeasurements = {
    entries: 0,
    totalBytes: 0,
    largest: { path: '', bytes: 0 }
  }

  const refused = walk(members, '', acc)

  if (refused) return refused

  const measured = acc

  if (measured.entries > limits.entries)
    return {
      code: 413,
      status: 'failure',
      message: `The file tree exceeds the deploy limit: ${measured.entries} entries (maximum ${limits.entries}).`
    }

  if (measured.totalBytes > limits.totalBytes)
    return {
      code: 413,
      status: 'failure',
      message: `The file tree exceeds the deploy limit: ${describeSize(measured.totalBytes)} (maximum ${describeSize(limits.totalBytes)}).`
    }

  if (measured.largest.bytes > limits.fileBytes)
    return {
      code: 413,
      status: 'failure',
      message: `A file in the tree exceeds the deploy limit: ${measured.largest.path} is ${describeSize(measured.largest.bytes)} (maximum ${describeSize(limits.fileBytes)} per file).`
    }

  return null
}
