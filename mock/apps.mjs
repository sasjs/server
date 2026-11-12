/**
 * The apps the demonstration site publishes.
 *
 * The Apps screen lists what a server has published, so a demo with nothing
 * published shows an empty page and a sentence about an administrator - true of
 * this host, and useless to a reader who came to see what the screen looks like
 * with an app on it. Three apps are published: Macro Dash, a game with a set of
 * SAS services behind it, the Minimal Seed App, which is the template a reader
 * setting out to build one is pointed at, and the React Seed App, which is the
 * one the SAS Apps team starts from. Each is streamed from SAS on a real
 * deployment, which is exactly the shape the App Stream serves, and each is
 * packaged here from its release rather than rebuilt, so this build carries
 * versions someone can name instead of a copy of another repository's source.
 *
 * The packaging is the release's own `server.json`, the file a `sasjs deploy`
 * sends to a SASjs server: it names the appLoc, the streamed web folder and the
 * file tree, so what this module writes onto the demo's drive is what a deploy
 * would have written there.
 *
 * Two paths, both on the drive, per app:
 *
 *   - the app's files, at `<appLoc>/services/<streamWebFolder>/...`, because that
 *     is where `@sasjs/api`'s App Stream looks for an app's assets;
 *   - the index, at `/.sasjs/apps.json` (`APP_STREAM_INDEX` in `@sasjs/api`),
 *     which is the register the browser host reads a listing from.
 *
 * The site's drive snapshot is a whole drive, so every app goes into the same file
 * the build already ships - see `withPublishedApps`.
 */
import { inflateRawSync } from 'node:zlib'

/**
 * An app this site publishes, as the release that carries it.
 *
 * A descriptor rather than a constant per app: everything below works from one, so
 * a third app is a third entry and a release bump is one string.
 *
 * `release` is `latest` by default: the demonstration should show the newest app
 * each repository has published, not the one that was current when someone last
 * edited this file. It is resolved at build time against the repository's
 * `releases/latest`, and the tag that came back is what the build logs and what
 * the app's own version placeholder is filled from - so a rebuild is still
 * traceable to three tags, without a commit per release. A descriptor may state a
 * tag instead, which pins that app; that is the escape hatch for holding one back
 * while its latest release is known to be broken.
 *
 * `id` is fixed rather than minted per build, because an app is addressed by its id
 * (`/app/<id>/`) - a fresh UUID on every build would change the app's URL weekly and
 * break every bookmark of it. It is a constant of the demonstration, not a record of
 * anything: the registry entry is the only place it appears.
 *
 * `name` is the tile's label AND the app's readable URL, so it is a URL segment
 * rather than prose - no space, no capital that a reader has to reproduce - which is
 * also the rule a deploy is held to (`@sasjs/api` refuses a stated name that is not
 * one).
 *
 * `asset` is the deploy document inside the release, and its name is the app's own:
 * macro-dash names the file after itself, while the minimal seed app ships a bare
 * `server.json.zip`. That is why the asset is stated rather than derived.
 */
/** What a descriptor says when it should follow the repository's newest release. */
export const LATEST = 'latest'

export const MACRO_DASH = {
  id: '3f2b9c1e-8d4a-4b7e-9c2f-5a6d1e0b7c34',
  name: 'macro-dash',
  release: LATEST,
  asset: 'macro-dash-server.json.zip'
}

export const MINIMAL_SEED_APP = {
  id: 'b7c1d0e2-4a63-4f18-9b52-6d3e8c0741af',
  name: 'minimal-seed-app',
  // v1.6.1, not v1.6.0: 1.6.0's page wires its controls in <head>, so it throws
  // on a host that serves the page as it is - which this one does - and the app
  // paints as a heading with nothing behind it. The release that carries the fix
  // (sasjs/minimal-seed-app#36) is what belongs here; until it exists this build
  // fails at the download, by design, rather than publishing a dead app.
  // latest, not v1.6.0: that release wires its controls in <head>, so it throws on
  // a host that serves the page as it is - which this one does - and the app paints
  // as a heading with nothing behind it. The fix is in 1.6.1 and anything after it
  // (sasjs/minimal-seed-app#36), which is what `latest` resolves to. If a future
  // release breaks the page this way again, state that tag here and the app is held
  // back until it is fixed.
  release: LATEST,
  asset: 'server.json.zip'
}

export const REACT_SEED_APP = {
  id: 'd4e7a1b9-2c56-4f03-8a71-9b5c2e6d4f18',
  name: 'react-seed-app',
  // latest resolves to a release that carries the JavaScript twin of each service
  // (appinit.js, getdata.js, upload.js and the dataset they read), which arrived in
  // v1.8.0. This host runs JavaScript, so a release from before that - SAS services
  // only - would publish a tile that loads and then cannot answer anything, and
  // stating v1.8.0 here is how to hold it back if `latest` ever moves somewhere
  // older than that.
  release: LATEST,
  asset: 'server.json.zip'
}

/** The apps the demo drive carries, in the order the build publishes them. */
export const PUBLISHED_APPS = [MACRO_DASH, MINIMAL_SEED_APP, REACT_SEED_APP]

/**
 * The version an app displays, without the tag's `v`.
 *
 * Macro Dash's page carries `v{{VERSION}}` - a placeholder its own Pages job fills
 * in from `package.json` before publishing - so a copy taken straight from the
 * release asset would show the placeholder on its title screen. This build knows
 * which release it packaged, so it fills it in the same way rather than shipping a
 * page that reads as unfinished. An app with no placeholder is unaffected by the
 * substitution, which is why it is applied to every app rather than to one.
 */
export const appVersion = (app) => app.release.replace(/^v/, '')

/** The release asset that carries an app's deploy document. */
export const releaseUrl = (app) =>
  `https://github.com/sasjs/${app.name}/releases/download/${app.release}/${app.asset}`

/** The GitHub API endpoint naming an app repository's newest release. */
export const latestReleaseUrl = (app) =>
  `https://api.github.com/repos/sasjs/${app.name}/releases/latest`

/**
 * GitHub's answer, as JSON, with the token CI already has.
 *
 * Unauthenticated calls to the API are rate limited by IP, and a shared runner's
 * IP is not ours; the token is what keeps a build from failing for that. It is
 * optional, because a local build usually has none and three calls are nothing.
 */
const fetchJson = async (url) => {
  const headers = { accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const response = await fetch(url, { headers })

  if (!response.ok)
    throw new Error(
      `Could not read ${url}: ${response.status} ${response.statusText}`
    )

  return response.json()
}

/**
 * A descriptor with its release resolved: `latest` becomes the tag the repository
 * currently calls its newest release, and a stated tag is returned untouched.
 *
 * `getJson` is injected so the resolution can be tested without the network, the
 * same way `fetchPack` is tested against a packed archive.
 */
export const resolveRelease = async (app, getJson = fetchJson) => {
  if (app.release !== LATEST) return app

  const release = await getJson(latestReleaseUrl(app))
  const tag = release && release.tag_name

  if (!tag)
    throw new Error(
      `Could not read the newest release of sasjs/${app.name}: ${latestReleaseUrl(app)} answered no tag_name`
    )

  return { ...app, release: tag }
}

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
      throw new Error(
        `That archive is not a zip: ${wanted} has no local header.`
      )

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
 *   - every file beside it under `services/`, which is what the host runs and what
 *     a program reads while it runs. A JS program (`services/common/getdata.js`) is
 *     written by a pack built for a server that can run JS - the `server` target of
 *     a SASjs app with its JS mocks in `serviceFolders` - and only a JS server,
 *     which is what this host is, can execute it. A DATA file travels with it
 *     because the program reads it by path: the minimal seed app's `getdata.js`
 *     reads `springs.json` from beside itself, and a drive without it serves an app
 *     whose data call fails. So the rule is "every file under services except the
 *     streamed web folder", not "every `.js` file" - the set of files a program
 *     needs is the app's to state, not this build's to guess.
 *
 * The `.sas` services in the same pack stay out of the drive: they are `service`
 * members rather than files, this host has no SAS to run them, and they travel with
 * a real deployment instead.
 */
export const packFiles = (pack, app) => {
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

    const text = bytes
      .toString('utf8')
      .replaceAll('{{VERSION}}', appVersion(app))

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
   * The services the app calls, and the data they read beside themselves.
   *
   * The streamed web folder is skipped by name - it is served rather than run,
   * and its own `js/` folder is the app's source, not a service.
   */
  const walkServices = (node, prefix) => {
    for (const member of node.members ?? []) {
      const name = `${prefix}/${member.name}`

      if (member.type === 'folder') {
        if (name === `/${pack.streamWebFolder}`) continue
        walkServices(member, name)
        continue
      }

      if (member.type !== 'file') continue

      files.push({
        path: `${appLoc}/services${name}`,
        ...entryFor(decodeCode(member))
      })
    }
  }

  walkWeb(web, '')
  walkServices(services, '')
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
export const appEntry = (pack, app, publishedAt) => ({
  id: app.id,
  name: app.name,
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
export const withPublishedApp = (snapshot, pack, app, publishedAt) => {
  const files = { ...(snapshot.files ?? {}) }

  for (const file of packFiles(pack, app))
    files[`${DRIVE_ROOT}${file.path}`] = file.contents

  const indexPath = `${DRIVE_ROOT}/${APP_INDEX_DRIVE_PATH}`
  let entries = []

  try {
    const parsed = JSON.parse(files[indexPath] ?? '[]')
    if (Array.isArray(parsed)) entries = parsed
  } catch (error) {
    // an index this build cannot read is replaced by the one it just made: the
    // alternative is a site whose Apps screen throws on a stale file
  }

  const entry = appEntry(pack, app, publishedAt)
  const merged = [
    ...entries.filter((existing) => existing?.id !== entry.id),
    entry
  ]

  files[indexPath] = JSON.stringify(merged, null, 2)

  return { ...snapshot, files }
}

/**
 * The site's drive with every app on it, each published, in one pass.
 *
 * `published` is a list of `{ app, pack }` - the descriptor and the deploy document
 * downloaded for it - and each one is folded in by `withPublishedApp`, so the index
 * is read and rewritten once per app and ends up holding all of them.
 */
export const withPublishedApps = (snapshot, published, publishedAt) =>
  published.reduce(
    (drive, { app, pack }) => withPublishedApp(drive, pack, app, publishedAt),
    snapshot
  )

/**
 * An app's release, downloaded and parsed.
 *
 * Fetched at build time like the CLI beside it, so a site can be built from a
 * clean checkout with no artefact committed here - and a release that has gone
 * missing fails the build with the URL in the message rather than publishing a
 * site whose Apps screen is missing an app.
 */
export const fetchPack = async (url) => {
  const response = await fetch(url)

  if (!response.ok)
    throw new Error(
      `Could not download the packaged app from ${url}: ${response.status} ${response.statusText}`
    )

  const archive = Buffer.from(await response.arrayBuffer())

  return JSON.parse(unzipEntry(archive, 'server.json').toString('utf8'))
}
