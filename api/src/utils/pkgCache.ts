import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

/**
 * The prefix pkg's extracted-asset cache takes inside `<SASJS_ROOT>/tmp`.
 *
 * `pkg` appends its own `pkg/tmp-XXXXXX` below the directory it is given, so the
 * instance's folder is removed whole rather than file by file.
 */
const cacheFolderPrefix = 'pkg-cache-'

/**
 * How often a running instance refreshes its folder's timestamp.
 *
 * The sweep below removes folders by AGE, because no pid check can tell a live
 * instance from a dead one across process namespaces - under Docker this server
 * is pid 1 in every container. A heartbeat is what a live instance leaves
 * instead: as long as it is running, its folder is never old.
 */
const heartbeatMs = 60 * 60 * 1000

/** How old a folder no instance is refreshing has to be before a start removes it. */
export const staleAfterMs = 24 * 60 * 60 * 1000

const isPackaged = () => Boolean(process.pkg)

export interface SweepPkgCachesOptions {
  tmpFolder: string
  now?: number
  staleAfter?: number
}

/**
 * Removes cache folders that no running instance is refreshing.
 *
 * A process that dies without running its `exit` handler - SIGKILL from a
 * supervisor, an OOM kill, a crash - leaves its folder behind, and this is what
 * keeps that from accumulating. Only folders this module named are considered,
 * and a folder younger than `staleAfter` is left alone whatever it is.
 */
export const sweepStalePkgCaches = ({
  tmpFolder,
  now = Date.now(),
  staleAfter = staleAfterMs
}: SweepPkgCachesOptions) => {
  let entries: string[]

  try {
    entries = fs.readdirSync(tmpFolder)
  } catch {
    return // the folder is created lazily by configurePkgCache, so a missing one is fine
  }

  entries.forEach((entry) => {
    if (!entry.startsWith(cacheFolderPrefix)) return

    const folder = path.join(tmpFolder, entry)

    try {
      const { mtimeMs } = fs.statSync(folder)

      if (now - mtimeMs < staleAfter) return

      fs.rmSync(folder, { recursive: true, force: true })
    } catch {
      // a folder that cannot be inspected or removed costs disk, not correctness
    }
  })
}

export interface PkgCacheOptions {
  packaged?: boolean
  root?: string
  now?: number
}

/**
 * Directs pkg's extracted-asset cache into this instance's own folder inside
 * SASJS_ROOT, and removes it when the process exits.
 *
 * A packaged executable reads its bundled files from a snapshot inside the
 * binary, and pkg externalises each one it is asked for into `pkgCacheDir()` - `~/.cache/pkg`
 * unless `PKG_NATIVE_CACHE_PATH` says otherwise - under a random `tmp-XXXXXX`
 * name. It registers that folder's removal on `beforeExit`, which is not emitted
 * for `process.exit()` (yao-pkg/pkg#52), and this server's shutdown path ends
 * with exactly that call. Every start that refreshed the drive therefore left a
 * folder holding the 192 macro files it copied in the service account's home,
 * where nothing looks and nothing cleans - sasjs/server#523.
 *
 * Three decisions make the leak go away without depending on upstream:
 *
 * - the cache lives in the data root the operator already watches, not in a
 *   home directory nobody does;
 * - the folder name carries a random id as well as the pid, so two instances -
 *   including two containers that are both pid 1 - never share one, and an exit
 *   can remove exactly its own;
 * - liveness is a timestamp the instance refreshes hourly, not a pid probe, so a
 *   sweep can run without a namespace-aware view of the process table.
 *
 * A `PKG_NATIVE_CACHE_PATH` the operator has set is left alone: on a host whose
 * SASJS_ROOT is small or read-only, that is their call to make.
 *
 * Note the scope: pkg resolves the directory it extracts NATIVE ADDONS into when
 * its prelude loads, before any application code runs, so `~/.cache/pkg` can
 * still appear for a native addon. This server ships none - the assets here are
 * the ones the application reads.
 *
 * @returns the folder pkg is directed to, or undefined when this process is not
 * a pkg executable or the operator has set the variable themselves.
 */
export const configurePkgCache = ({
  packaged = isPackaged(),
  root = process.sasjsRoot,
  now = Date.now()
}: PkgCacheOptions = {}): string | undefined => {
  if (!packaged) return
  if (process.env.PKG_NATIVE_CACHE_PATH) return

  const tmpFolder = path.join(root, 'tmp')
  const cacheFolder = path.join(
    tmpFolder,
    `${cacheFolderPrefix}${process.pid}-${randomUUID()}`
  )

  sweepStalePkgCaches({ tmpFolder, now })

  fs.mkdirSync(cacheFolder, { recursive: true })

  process.env.PKG_NATIVE_CACHE_PATH = cacheFolder

  // A directory's mtime moves when its own entries change, and pkg writes into
  // the folder BELOW this one - so the heartbeat has to set the time explicitly.
  const heartbeat = setInterval(() => {
    try {
      const time = new Date()

      fs.utimesSync(cacheFolder, time, time)
    } catch {
      // the folder has gone; the exit handler below has nothing left to do
    }
  }, heartbeatMs)

  heartbeat.unref()

  // `exit` runs on `process.exit()` as well as on a drained event loop, and the
  // removal is synchronous, so it completes before the process goes.
  process.once('exit', () => {
    clearInterval(heartbeat)

    try {
      fs.rmSync(cacheFolder, { recursive: true, force: true })
    } catch {
      // there is nothing useful to do about it on the way out
    }
  })

  return cacheFolder
}
