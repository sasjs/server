/**
 * The published app the demonstration site ships with.
 *
 * The Apps screen lists what a server has published, so a demo with nothing
 * published shows an empty page and a sentence about an administrator - true of
 * this host, and useless to a reader who came to see what the screen looks like
 * with an app on it. Macro Dash is the app: it is streamed from SAS on a real
 * deployment, which is exactly the shape the App Stream serves, and it is
 * packaged here from its release rather than rebuilt, so this build carries a
 * version someone can name instead of a copy of another repository's source.
 *
 * The packaging is the release's own `server.json`, the file a `sasjs deploy`
 * sends to a SASjs server: it names the appLoc, the streamed web folder and the
 * file tree, so what this module writes onto the demo's drive is what a deploy
 * would have written there.
 *
 * Two paths, both on the drive:
 *
 *   - the app's files, at `<appLoc>/services/<streamWebFolder>/...`, because that
 *     is where `@sasjs/api`'s App Stream looks for an app's assets;
 *   - the index, at `/.sasjs/apps.json` (`APP_STREAM_INDEX` in `@sasjs/api`),
 *     which is the register the browser host reads a listing from.
 *
 * The site's drive snapshot is a whole drive, so both go into the same file the
 * build already ships - see `withPublishedApp`.
 */
import { inflateRawSync } from 'node:zlib'

/**
 * The Macro Dash release this site carries.
 *
 * A TAG, not `latest`: two deploys of the same commit have to publish the same
 * app, and a release that changed the game's look would otherwise arrive here
 * as a rebuild of the site with no commit saying so. Bumping it is a one-line
 * change with a reason in the PR.
 */
export const MACRO_DASH_RELEASE = 'v1.7.0'

/**
 * The version the app displays, without the tag's `v`.
 *
 * The release's page carries `v{{VERSION}}` - a placeholder its own Pages job
 * fills in from `package.json` before publishing - so a copy taken straight from
 * the release asset shows the placeholder on its title screen. This build knows
 * which release it packaged, so it fills it in the same way rather than shipping
 * a page that reads as unfinished.
 */
export const MACRO_DASH_VERSION = MACRO_DASH_RELEASE.replace(/^v/, '')

export const MACRO_DASH_URL =
  `https://github.com/sasjs/macro-dash/releases/download/` +
  `${MACRO_DASH_RELEASE}/macro-dash-server.json.zip`

/**
 * The app's id, fixed rather than minted per build.
 *
 * An app is addressed by its id (`/app/<id>/`), so a fresh UUID on every build
 * would change the app's URL weekly and break every bookmark of it. This is a
 * constant of the demonstration, not a record of anything: the registry entry
 * below is the only place it appears.
 */
export const MACRO_DASH_APP_ID = '3f2b9c1e-8d4a-4b7e-9c2f-5a6d1e0b7c34'

/**
 * The app's name: the tile's label AND its readable URL.
 *
 * `/app/macro-dash` is how the demo's app is shared, so the name is a URL
 * segment rather than prose - no space, no capital that a reader has to
 * reproduce - which is also the rule a deploy is held to (`@sasjs/api` refuses a
 * stated name that is not one). The tile reads the same string; a label a
 * deployment derives from its folder would read the same way.
 */
export const MACRO_DASH_NAME = 'macro-dash'

/**
 * Where `@sasjs/api` keeps a drive-backed app index - `APP_STREAM_INDEX` in that
 * package, and the path the browser host's `createDriveAppStreamStore` reads. It
 * is drive-relative; the site's snapshot keys are absolute, hence the root.
 */
const APP_INDEX_DRIVE_PATH = '.sasjs/apps.json'

/** The root every entry in the snapshot's file map is keyed under. */
const DRIVE_ROOT = '/sasjs/drive/files'

/**
 * The drive marker for a byte entry. `mockSite.ts` writes it when it seeds the
 * drive and `runtime-core.js` reads it, so a file that is not text survives the
 * round trip. A text file that would otherwise look like a marker is escaped, as
 * the runtime expects.
 */
const BINARY_PREFIX = '\u0000base64:'
const TEXT_PREFIX = '\u0000text:'

/**
 * Whether bytes are a file the drive can hold as text.
 *
 * The same test `mockSite.ts` applies when it seeds a drive - the bytes survive a
 * UTF-8 round trip - because the drive is one map of strings and a decoded image
 * written as text is a corrupt one.
 */
const isText = (bytes) => Buffer.from(bytes.toString('utf8'), 'utf8').equals(bytes)

/**
 * A file member's bytes.
 *
 * The deploy format this build consumes encodes every file member as base64 -
 * the release's own `index.html` arrives as `PCFET0NUWVBFIGh0bWw+` - and a
 * `Buffer.from(code, 'base64')` is lenient: handed the file's characters instead
 * of their encoding it decodes to mojibake, `isText` then says bytes, and the
 * build publishes a corrupt asset while reporting success. So the code is
 * validated first, with the check the browser host applies to a byte entry
 * (`cleanedBase64` in `runtime-core.js`): its alphabet, its padding, and a
 * length that decodes. A member that fails is refused by name, as every other
 * shape this module does not speak is.
 */
const decodeCode = (member) => {
  // a member with no `code` is not an empty file, it is a tree this build does
  // not understand: coercing it to '' passes the check below and publishes a
  // zero-byte asset, which is a blank screen nobody can trace back to here. An
  // empty STRING is legitimate - it is the base64 of an empty file - a missing
  // one is not
  if (typeof member.code !== 'string')
    throw new Error(
      `The packaged app's ${member.name} carries no code, so it cannot be read as a file.`
    )

  const code = member.code.replace(/\s+/g, '')

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(code) || code.length % 4)
    throw new Error(
      `The packaged app's ${member.name} does not carry base64 in its code, so it cannot be read as a file: ` +
        `this build reads the deploy format's file members, which are all encoded.`
    )

  return Buffer.from(code, 'base64')
}

/**
 * The single member of a zip archive, by name.
 *
 * A release asset is a zip because that is what GitHub distributes, and the
 * archive holds one JSON file. Node has no unzip, and the alternative - a
 * dependency installed at deploy time - is a third-party binary in the publish
 * path for one file, so this reads the two headers it needs: the central
 * directory (which names the members and where their data starts) and the local
 * header before the data (which is where the compressed bytes actually begin,
 * since a central entry's offsets are not the data's offsets).
 *
 * `stored` and `deflate` are the only methods an archive this build consumes
 * uses; anything else is refused by name rather than decoded wrongly.
 */
export const unzipEntry = (archive, wanted) => {
  // End of central directory: the last 22 bytes plus an optional comment, and
  // the only way in, since the entry count is not otherwise known.
  let eocd = -1
  for (let index = archive.length - 22; index >= 0; index--) {
    if (archive.readUInt32LE(index) === 0x06054b50) {
      eocd = index
      break
    }
  }

  if (eocd < 0) throw new Error('That archive is not a zip: no end of central directory.')

  const entries = archive.readUInt16LE(eocd + 10)
  let cursor = archive.readUInt32LE(eocd + 16)

  for (let entry = 0; entry < entries; entry++) {
    if (archive.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error('That archive is not a zip: a central directory entry is missing.')

    const method = archive.readUInt16LE(cursor + 10)
    const compressedSize = archive.readUInt32LE(cursor + 20)
    const nameLength = archive.readUInt16LE(cursor + 28)
    const extraLength = archive.readUInt16LE(cursor + 30)
    const commentLength = archive.readUInt16LE(cursor + 32)
    const localOffset = archive.readUInt32LE(cursor + 42)
    const name = archive.toString('utf8', cursor + 46, cursor + 46 + nameLength)

    cursor += 46 + nameLength + extraLength + commentLength

    if (name !== wanted) continue

    // the local header's name and extra lengths are its own, and they are not
    // the central entry's: reading the data from the central offsets is the
    // classic way to produce an archive that unpacks as garbage
    if (archive.readUInt32LE(localOffset) !== 0x04034b50)
      throw new Error(`That archive is not a zip: ${wanted} has no local header.`)

    const dataStart =
      localOffset +
      30 +
      archive.readUInt16LE(localOffset + 26) +
      archive.readUInt16LE(localOffset + 28)
    const data = archive.subarray(dataStart, dataStart + compressedSize)

    if (method === 0) return data
    if (method === 8) return inflateRawSync(data)

    throw new Error(
      `That archive holds ${wanted} with compression method ${method}, which this build cannot read.`
    )
  }

  throw new Error(`That archive holds no ${wanted}.`)
}

const folderNamed = (node, name) =>
  (node.members ?? []).find(
    (member) => member.type === 'folder' && member.name === name
  )

/**
 * The release's file tree as paths and contents, drive-relative.
 *
 * Every file member's `code` is base64 in this format - the release's own
 * `index.html` arrives as `PCFET0NUWVBFIGh0bWw+` - so each one is decoded and the
 * drive entry is chosen from the bytes: text where they survive a UTF-8 round
 * trip, bytes otherwise. Reading `code` as the file's characters (the obvious
 * reading, and what a `sasjs deploy` never does) would publish a page whose whole
 * content is base64.
 *
 * Two sets of files come out of the tree, because a browser host needs both to
 * run the app rather than only show it:
 *
 *   - the streamed web folder, which the App Stream serves as the app itself;
 *   - the executable programs beside it - a `.js` file anywhere else under
 *     `services/` - which the host runs when the app calls a service. A `.js`
 *     service is written by a pack built for a server that can run JS (the
 *     macro-dash `server` target carries both runtimes), and only a JS server -
 *     which is what this host is - can execute it. The `.sas` services in the
 *     same pack stay out of the drive: this host has no SAS to run them, and they
 *     travel with a real deployment instead.
 */
export const packFiles = (pack) => {
  const services = folderNamed(pack.fileTree, 'services') ?? pack.fileTree
  const web = folderNamed(services, pack.streamWebFolder)

  if (!web)
    throw new Error(
      `The packaged app has no ${pack.streamWebFolder} folder under services, so there is nothing to serve from it.`
    )

  const appLoc = pack.appLoc.replace(/\/+$/, '')
  const files = []
  const webFolder = `${appLoc}/services/${pack.streamWebFolder}`

  const entryFor = (bytes) => {
    if (!isText(bytes))
      return { contents: BINARY_PREFIX + bytes.toString('base64') }

    const text = bytes.toString('utf8').replaceAll('{{VERSION}}', MACRO_DASH_VERSION)

    return { contents: text.startsWith('\u0000') ? TEXT_PREFIX + text : text }
  }

  /** The app's own assets: what a browser is served, and what it requests. */
  const walkWeb = (node, prefix) => {
    for (const member of node.members ?? []) {
      const name = `${prefix}/${member.name}`

      if (member.type === 'folder') {
        walkWeb(member, name)
        continue
      }

      if (member.type !== 'file') continue

      files.push({
        path: `${webFolder}${name}`,
        ...entryFor(decodeCode(member))
      })
    }
  }

  /**
   * The services the app calls: JS programs, which are what this host executes.
   *
   * The streamed web folder is skipped by name - it is served rather than run,
   * and its own `js/` folder is the app's source, not a service.
   */
  const walkPrograms = (node, prefix) => {
    for (const member of node.members ?? []) {
      const name = `${prefix}/${member.name}`

      if (member.type === 'folder') {
        if (name === `/${pack.streamWebFolder}`) continue
        walkPrograms(member, name)
        continue
      }

      if (member.type !== 'file' || !member.name.endsWith('.js')) continue

      files.push({
        path: `${appLoc}/services${name}`,
        ...entryFor(decodeCode(member))
      })
    }
  }

  walkWeb(web, '')
  walkPrograms(services, '')
  return files
}

/**
 * The registry entry a deploy of this app would have written.
 *
 * The fields are `@sasjs/api`'s `AppStreamEntry`: the id addresses the app, the
 * name labels the tile, the appLoc and folder are where its files are read from,
 * and the logo is a file inside the app itself - the surface builds its URL from
 * the app's own, so a path that is not in the deployment is a broken image
 * rather than a 404 at publish time.
 */
export const appEntry = (pack, publishedAt) => ({
  id: MACRO_DASH_APP_ID,
  name: MACRO_DASH_NAME,
  appLoc: pack.appLoc,
  streamWebFolder: pack.streamWebFolder,
  ...(pack.streamLogo ? { logo: pack.streamLogo } : {}),
  publishedAt
})

/**
 * The site's drive with the app on it, and the app published.
 *
 * The snapshot is a whole drive and the host takes it whole (`fetchDrive` reads
 * the snapshot INSTEAD of the seed), so the app cannot be added beside it: this
 * returns a new snapshot - the files the site already shipped, plus the app's.
 *
 * An entry already in the index with this id is replaced rather than repeated: a
 * registry that listed the same app twice would draw two tiles for one app and
 * answer an ambiguous lookup for its label.
 */
export const withPublishedApp = (snapshot, pack, publishedAt) => {
  const files = { ...(snapshot.files ?? {}) }

  for (const file of packFiles(pack)) files[`${DRIVE_ROOT}${file.path}`] = file.contents

  const indexPath = `${DRIVE_ROOT}/${APP_INDEX_DRIVE_PATH}`
  let entries = []

  try {
    const parsed = JSON.parse(files[indexPath] ?? '[]')
    if (Array.isArray(parsed)) entries = parsed
  } catch (error) {
    // an index this build cannot read is replaced by the one it just made: the
    // alternative is a site whose Apps screen throws on a stale file
  }

  const entry = appEntry(pack, publishedAt)
  const merged = [...entries.filter((existing) => existing?.id !== entry.id), entry]

  files[indexPath] = JSON.stringify(merged, null, 2)

  return { ...snapshot, files }
}

/**
 * The release, downloaded and parsed.
 *
 * Fetched at build time like the CLI beside it, so a site can be built from a
 * clean checkout with no artefact committed here - and a release that has gone
 * missing fails the build with the URL in the message rather than publishing a
 * site whose Apps screen is empty.
 */
export const fetchPack = async (url = MACRO_DASH_URL) => {
  const response = await fetch(url)

  if (!response.ok)
    throw new Error(
      `Could not download the packaged app from ${url}: ${response.status} ${response.statusText}`
    )

  const archive = Buffer.from(await response.arrayBuffer())

  return JSON.parse(unzipEntry(archive, 'server.json').toString('utf8'))
}
