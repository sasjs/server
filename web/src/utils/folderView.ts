/**
 * What a folder page says about the folder it is showing.
 *
 * The page exists because the tree answers "where is the file" and nothing answers
 * "what is in here": the tree shows one level at a time, one line per entry, with
 * no room for a date, a size or a count. The numbers on this page are derived from
 * the level the tree already fetched - no request of its own - so a reader who
 * opens a folder sees its contents summarised at once.
 *
 * Pure functions of a level, so `scripts/test-folder-view.mjs` can assert them
 * without rendering anything; the page itself is `components/folderView.tsx`.
 */
import type { TreeNode } from './types'

/** What one level of the drive holds, as the page's summary line reads it. */
export interface FolderStats {
  files: number
  folders: number
  /**
   * Bytes across the files whose size the host reports, or null when it reports
   * none - which is what the drive's tree does today. A total that silently
   * counted a subset would be a wrong number said confidently, so the page says
   * nothing rather than something approximate.
   */
  bytes: number | null
  /** The most recent date in the level, ISO, or null for a level with none. */
  newest: string | null
}

/** Whether a node carries a date at all, and what the later of its two is. */
const dateOf = (node: TreeNode): string | null => {
  const dates = [node.modified, node.created].filter(
    (date): date is string =>
      typeof date === 'string' && !isNaN(Date.parse(date))
  )

  if (!dates.length) return null

  return dates.sort().reverse()[0]
}

/**
 * A level summarised: how many files, how many folders, how big, how recent.
 *
 * `bytes` is null unless at least one file reports a size, and the count is of the
 * files that DO report one - but a level where only some files report a size is
 * still reported, because that is a host that reports sizes for some formats and
 * not others, and a missing size on one file says nothing about the others. The
 * page only prints the total when every file has one, which is checked in
 * `totalBytes`.
 */
export const folderStats = (children: TreeNode[]): FolderStats => {
  const files = children.filter((child) => !child.isFolder)
  const sizes = files
    .map((file) => file.size)
    .filter((size): size is number => typeof size === 'number')

  const dates = children
    .map(dateOf)
    .filter((date): date is string => date !== null)
    .sort()

  return {
    files: files.length,
    folders: children.length - files.length,
    bytes: sizes.length ? sizes.reduce((total, size) => total + size, 0) : null,
    newest: dates.length ? dates[dates.length - 1] : null
  }
}

/**
 * The level's total, or null when any file's size is unknown.
 *
 * The distinction `folderStats.bytes` keeps is "we have some sizes"; this is the
 * one the page prints, and it has to be all of them or nothing.
 */
export const totalBytes = (children: TreeNode[]): number | null => {
  const files = children.filter((child) => !child.isFolder)

  if (!files.length) return 0
  if (files.some((file) => typeof file.size !== 'number')) return null

  return files.reduce((total, file) => total + (file.size as number), 0)
}

/**
 * A byte count as a reader reads one.
 *
 * Binary units, because that is what a file manager and the drive's own limits
 * use. One decimal place, because "1.4 MB" is what a reader compares - and a
 * trailing `.0` is dropped so a round number does not read as a measurement.
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return ''

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  const shown = unit === 0 ? `${Math.round(value)}` : value.toFixed(1)

  return `${Number(shown)} ${units[unit]}`
}

/**
 * A date as the page shows it, or '' for one the host did not report.
 *
 * The empty string rather than a dash: the caller decides what a missing date
 * looks like in its column, and a formatter that invented "—" would put one in
 * the middle of a sentence too.
 */
export const formatWhen = (iso?: string): string => {
  if (!iso) return ''

  const when = new Date(iso)

  if (isNaN(when.getTime())) return ''

  return when.toLocaleString()
}

/**
 * A folder's path as crumbs, the drive first: `/Public/demo` is
 * files / Public / demo.
 *
 * The drive root has no name of its own - its relativePath is '' - so it is
 * called what the tree calls it.
 */
export const breadcrumbOf = (
  folderPath: string
): Array<{ name: string; path: string }> => {
  const crumbs = [{ name: 'files', path: '' }]

  let current = ''

  for (const segment of folderPath.split('/').filter(Boolean)) {
    current += `/${segment}`
    crumbs.push({ name: segment, path: current })
  }

  return crumbs
}

/**
 * The entries a filter leaves, folders first as the tree shows them.
 *
 * The filter is over the NAME, not the path: the reader is looking at one folder,
 * so every entry is under the same folder and the part of a path that differs is
 * the name. Two characters is the shortest query the header's box accepts, and it
 * is the same rule here - one character matches most of a folder.
 */
export const filterChildren = (
  children: TreeNode[],
  filter: string
): TreeNode[] => {
  const needle = filter.trim().toLowerCase()

  if (needle.length < 2) return children

  return children.filter((child) => child.name.toLowerCase().includes(needle))
}

/**
 * A level in the order a reader scans it: folders, then files, each by name.
 *
 * The drive's own answer is already sorted that way, but the page must not depend
 * on the host's ordering - a tree that came back in creation order, or with the
 * folders after the files, would put a folder in the middle of the file list.
 */
export const inFolderOrder = (children: TreeNode[]): TreeNode[] =>
  [...children].sort((first, second) => {
    if (first.isFolder !== second.isFolder) return first.isFolder ? -1 : 1

    return first.name.localeCompare(second.name)
  })
