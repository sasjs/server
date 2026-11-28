import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * The drive files a server creates for itself, that a captured snapshot does not
 * carry.
 *
 * `mock/drive.json` is a capture of a drive someone filled, so it holds the files
 * that were put there by hand. A server also writes a few of its own at startup,
 * and the one a visitor notices is the drive root's `.sasjslint`: the rules file
 * every SAS file with no nearer one is linted against, which the Studio tree shows
 * at the root of a real installation (api/src/app.ts seeds it on boot).
 *
 * The content is read from the API's own JSON rather than restated here, so the
 * demonstration site and a server cannot seed different rules.
 */
export const DRIVE_ROOT = '/sasjs/drive/files'

/** The drive with the server-seeded files on it, as a new snapshot. */
export const withServerSeededFiles = (snapshot, lintConfiguration) => ({
  ...snapshot,
  files: {
    ...(snapshot.files ?? {}),
    [`${DRIVE_ROOT}/.sasjslint`]: lintConfiguration
  }
})

/**
 * Code the demo carries on its drive, under `/code`.
 *
 * The point of the site is a server you can look at, and a drive with nothing but
 * two demo programs cannot show one: the macro core is what half of SASjs uses,
 * and the SAS Packages framework is the other library people arrive with. Both
 * are read when the site is built, at whatever npm and the framework's default
 * branch hold that day - see `mock/build.mjs`, which says why nothing is pinned.
 *
 * Archives are left out: a drive is a file tree a visitor browses, and a `.zip` of
 * a package is a download nobody can open in an editor. So are `.git` and
 * `node_modules`, and any symlink - a link can point outside the tree, and the
 * host would publish whatever it found. A source can also name folders to skip,
 * which is how the framework's papers and logos stay out: 12MB of PDFs and
 * screenshots for a tree people open to read SAS.
 *
 * What is left is carried whole, so this walk bounds it: a published snapshot is
 * downloaded by every visitor, and a tree that grows without anyone noticing is a
 * slow site nobody can explain. `MAX_CODE_BYTES` bounds what the snapshot carries
 * - the stored string, so a binary counts four thirds - and passing it fails the
 * build at the file that did it rather than publishing a site to be fixed later.
 *
 * A source can also carry a file that is not in the tree it came from, named in
 * `additions` against the folder's own root. The toolbox's rules file is the one
 * that needs it: no upstream repository holds the rules a demo lints its tree
 * against, and the drive root's mark most of a third-party library.
 */
export const MAX_CODE_BYTES = 20 * 1024 * 1024

export const withCodeSources = (drive, sources) => {
  const files = { ...(drive.files ?? {}) }

  let carried = 0

  for (const { folder, root, skip = [], additions = {} } of sources) {
    for (const file of listFiles(root)) {
      if (file.relative.endsWith('.zip')) continue
      if (skip.some((prefix) => file.relative.startsWith(prefix))) continue

      carried += file.contents.length

      if (carried > MAX_CODE_BYTES)
        throw new Error(
          `The code on the drive passed ${MAX_CODE_BYTES} bytes at ${folder}/${file.relative}. ` +
            `Every visitor downloads the drive snapshot, so a tree this large needs a decision rather than a build.`
        )

      files[`${DRIVE_ROOT}/code/${folder}/${file.relative}`] = file.contents
    }

    // a file the source does not hold: counted the same way, because what
    // bounds the snapshot is what a visitor downloads, not where it came from
    for (const [relative, contents] of Object.entries(additions)) {
      carried += Buffer.byteLength(contents)

      if (carried > MAX_CODE_BYTES)
        throw new Error(
          `The code on the drive passed ${MAX_CODE_BYTES} bytes at ${folder}/${relative}. ` +
            `Every visitor downloads the drive snapshot, so a tree this large needs a decision rather than a build.`
        )

      files[`${DRIVE_ROOT}/code/${folder}/${relative}`] = contents
    }
  }

  return { ...drive, files }
}

/**
 * Every file under `root`, as text when the bytes survive a UTF-8 round trip and
 * as the drive's byte marker otherwise.
 *
 * The marker is the host's own (`runtime-core.js` reads a leading NUL as base64),
 * and it is written here rather than by the host because this runs at build time,
 * where the bytes are on disk.
 */
const listFiles = (root, base = root) => {
  const out = []

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (
      entry.name === '.git' ||
      entry.name === 'node_modules' ||
      entry.isSymbolicLink()
    )
      continue

    const absolute = path.join(root, entry.name)
    const relative = path.relative(base, absolute).split(path.sep).join('/')

    if (entry.isDirectory()) {
      out.push(...listFiles(absolute, base))
      continue
    }

    const bytes = readFileSync(absolute)
    const text = bytes.toString('utf8')

    out.push({
      relative,
      bytes: bytes.length,
      contents: Buffer.from(text, 'utf8').equals(bytes)
        ? text
        : BINARY_PREFIX + bytes.toString('base64')
    })
  }

  return out
}

/** The marker `runtime-core.js` reads as base64. */
const BINARY_PREFIX = '\u0000base64:'
