import AdmZip from 'adm-zip'
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import { sasJSCoreMacros } from '../src/utils/file'
import {
  cacheDownloads,
  cachedDownloadsAreCurrent,
  downloadCache,
  downloadMacros,
  installFromCache,
  macroFileName,
  removeStaleDownloads,
  SAS_PACKAGES_RELEASE,
  SAS_PACKAGES_RELEASE_SHA256,
  sasPackagesArchiveUrl,
  writeCacheManifest
} from './downloadMacros'

const sha256 = (buf: Buffer): string =>
  crypto.createHash('sha256').update(buf).digest('hex')

/** A byte-for-byte stand-in for the pinned release archive. */
const zipOf = (entries: Record<string, string | Buffer>): Buffer => {
  const zip = new AdmZip()

  for (const [entryPath, content] of Object.entries(entries))
    zip.addFile(
      entryPath,
      Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8')
    )

  return zip.toBuffer()
}

/** The pinned archive's shape: SPF/Macros plus files the download must ignore. */
const releaseArchive = (): Buffer =>
  zipOf({
    'SAS_PACKAGES-20261111/SPF/Macros/mf_getquoted.sas': '%quoted;',
    'SAS_PACKAGES-20261111/SPF/Macros/mf_getunquoted.sas': '%unquoted;',
    'SAS_PACKAGES-20261111/SPF/Macros/mf_xptree.sas': '%xptree;',
    'SAS_PACKAGES-20261111/README.md': '# SAS_PACKAGES',
    'SAS_PACKAGES-20261111/SPF/SPFinit.sas': '%init;'
  })

/**
 * A release archive whose SPF/Macros entry name is patched in the finished
 * zip's bytes. adm-zip's `addFile` normalizes `..` and backslashes out of entry
 * names, so the hostile name is swapped for an equal-length placeholder after
 * the zip is built: the name bytes sit verbatim in the local and the central
 * header, so every occurrence is replaced and the recorded name length stays
 * true.
 */
const zipWithPatchedEntryName = (
  placeholder: string,
  hostile: string
): Buffer => {
  const zip = new AdmZip()
  zip.addFile(
    'SAS_PACKAGES-20261111/SPF/Macros/mf_a.sas',
    Buffer.from('%a;', 'utf8')
  )
  zip.addFile(
    `SAS_PACKAGES-20261111/SPF/Macros/${placeholder}`,
    Buffer.from('%hostile;', 'utf8')
  )

  const buffer = zip.toBuffer()
  const from = Buffer.from(`SPF/Macros/${placeholder}`, 'utf8')
  const to = Buffer.from(`SPF/Macros/${hostile}`, 'utf8')

  expect(from.length).toBe(to.length)

  for (let at = buffer.indexOf(from); at !== -1;) {
    to.copy(buffer, at)
    at = buffer.indexOf(from, at + to.length)
  }

  return buffer
}

/**
 * A release archive whose second SPF/Macros entry reaches outside the folder.
 */
const zipWithTraversal = (): Buffer =>
  zipWithPatchedEntryName('aaaaaaaaaaaa.sas', '../../escape.sas')

/**
 * A local stand-in for codeload.github.com: it records every request it sees
 * and answers them with `respond`, so the tests exercise the real HTTP path
 * instead of a mocked client.
 */
const serve = async (
  respond: (seen: number, res: http.ServerResponse) => void
) => {
  const requests: {
    method?: string
    url?: string
    headers: http.IncomingHttpHeaders
  }[] = []

  const server = http.createServer((req, res) => {
    requests.push({
      method: req.method,
      url: req.url,
      headers: { ...req.headers }
    })

    respond(requests.length, res)
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  const { port } = server.address() as { port: number }

  return {
    requests,
    archiveUrl: `http://127.0.0.1:${port}/yabwon/SAS_PACKAGES/zip/refs/tags/20261111`,
    close: () =>
      new Promise<void>((resolve) => {
        // The http agent keeps idle connections open, which would hold
        // close() forever; drop them first.
        server.closeAllConnections()
        server.close(() => resolve())
      })
  }
}

const sends =
  (status: number, body: Buffer) =>
  (_seen: number, res: http.ServerResponse) => {
    res.writeHead(status, { 'Content-Length': String(body.length) })
    res.end(body)
  }

describe('downloadMacros', () => {
  let root: string
  let folder: string
  let cache: string
  let stub: Awaited<ReturnType<typeof serve>> | undefined

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-macros-'))
    folder = path.join(root, 'sasautos')
    cache = path.join(root, 'sasautos-download')
    fs.mkdirSync(folder)
    fs.mkdirSync(cache)
  })

  afterEach(async () => {
    if (stub) {
      await stub.close()
      stub = undefined
    }

    fs.rmSync(root, { recursive: true, force: true })
  })

  const write = (dir: string, names: string[]) =>
    names.forEach((name) => fs.writeFileSync(path.join(dir, name), '%put;'))

  /**
   * A cache as `cacheDownloads` leaves it: the files, then the list, the
   * contents digest and the release marker. Written last for the same reason
   * the script does it - the marker is the completion signal.
   */
  const markCache = async (
    dir: string,
    names: string[],
    release: string = SAS_PACKAGES_RELEASE_SHA256
  ) => writeCacheManifest(dir, names, release)

  const listOf = (dir: string) =>
    fs
      .readdirSync(dir)
      .filter(
        (name) =>
          name !== '.macrolist' &&
          name !== '.release-sha256' &&
          name !== '.content-sha256'
      )
      .sort()

  const readList = (dir: string) =>
    fs
      .readFileSync(path.join(dir, '.macrolist'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .sort()

  describe('cachedDownloadsAreCurrent', () => {
    it('should answer false when the cache has no list', async () => {
      write(cache, ['mf_a.sas'])

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(false)
    })

    it('should answer true when the list, the contents and the release agree', async () => {
      write(cache, ['mf_a.sas', 'mf_b.sas'])
      await markCache(cache, ['mf_a.sas', 'mf_b.sas'])

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(true)
    })

    it('should answer false when a cached macro was altered after the download', async () => {
      // The marker names the release, but this proves the cache still holds it:
      // an edited macro here would otherwise be installed as the pinned release.
      write(cache, ['mf_a.sas', 'mf_b.sas'])
      await markCache(cache, ['mf_a.sas', 'mf_b.sas'])
      fs.writeFileSync(path.join(cache, 'mf_b.sas'), '%put "tampered";')

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(false)
    })

    it('should answer false when the contents digest is missing', async () => {
      // A cache written before the digest existed, or one interrupted after
      // the list: it cannot prove its contents, so it is fetched again.
      write(cache, ['mf_a.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_a.sas\n')
      fs.writeFileSync(
        path.join(cache, '.release-sha256'),
        SAS_PACKAGES_RELEASE_SHA256
      )

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(false)
    })

    it('should answer false when a listed file is missing', async () => {
      write(cache, ['mf_a.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_a.sas\nmf_b.sas\n')
      fs.writeFileSync(
        path.join(cache, '.release-sha256'),
        SAS_PACKAGES_RELEASE_SHA256
      )

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(false)
    })

    it('should answer false when the list names no files', async () => {
      fs.writeFileSync(path.join(cache, '.macrolist'), '\n\n')

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(false)
    })

    it('should answer false when the download is forced', async () => {
      write(cache, ['mf_a.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_a.sas\n')

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          true
        )
      ).toBe(false)
    })
  })

  describe('installFromCache', () => {
    it('should answer false and leave the folder alone when the cache is empty', async () => {
      write(folder, ['mf_core.sas'])

      expect(
        await installFromCache(
          folder,
          cache,
          path.join(folder, '.macrolist'),
          false
        )
      ).toBe(false)
      expect(listOf(folder)).toEqual(['mf_core.sas'])
      expect(fs.existsSync(path.join(folder, '.macrolist'))).toBe(false)
    })

    it('should lay the cached macros over the core tree and list them all', async () => {
      // The state `initial` produces: copySASjsCore has just recreated the
      // folder with the core macros and written their inventory, and the
      // downloads are only in the cache. This is the order the skip has to
      // survive - a folder inventory alone must not be read as "downloaded".
      write(folder, ['mf_core.sas'])
      fs.writeFileSync(path.join(folder, '.macrolist'), 'mf_core.sas\n')

      write(cache, ['mf_dl_a.sas', 'mf_dl_b.sas'])
      await markCache(cache, ['mf_dl_a.sas', 'mf_dl_b.sas'])

      const installed = await installFromCache(
        folder,
        cache,
        path.join(folder, '.macrolist'),
        false
      )

      expect(installed).toBe(true)
      expect(listOf(folder)).toEqual([
        'mf_core.sas',
        'mf_dl_a.sas',
        'mf_dl_b.sas'
      ])
      // The runtime copies the drive's macros from this list, so it has to name
      // the core macros and the downloaded ones, and not itself.
      expect(readList(folder)).toEqual([
        'mf_core.sas',
        'mf_dl_a.sas',
        'mf_dl_b.sas'
      ])
    })

    it('should create the folder when the cache is installed into one that is absent', async () => {
      const absent = path.join(root, 'absent', 'sasautos')
      write(cache, ['mf_dl_a.sas'])
      await markCache(cache, ['mf_dl_a.sas'])

      expect(
        await installFromCache(
          absent,
          cache,
          path.join(absent, '.macrolist'),
          false
        )
      ).toBe(true)
      expect(listOf(absent)).toEqual(['mf_dl_a.sas'])
    })

    it('should answer false when a cached macro is missing', async () => {
      write(folder, ['mf_core.sas'])
      write(cache, ['mf_dl_a.sas'])
      fs.writeFileSync(
        path.join(cache, '.release-sha256'),
        SAS_PACKAGES_RELEASE_SHA256
      )
      fs.writeFileSync(
        path.join(cache, '.macrolist'),
        'mf_dl_a.sas\nmf_dl_b.sas\n'
      )

      expect(
        await installFromCache(
          folder,
          cache,
          path.join(folder, '.macrolist'),
          false
        )
      ).toBe(false)
      expect(listOf(folder)).toEqual(['mf_core.sas'])
    })
  })

  describe('downloadMacros', () => {
    it.each([undefined, 'old-release'])(
      'should refresh a cache with a missing or different release marker (%s)',
      async (marker) => {
        write(cache, ['stale.sas'])
        fs.writeFileSync(path.join(cache, '.macrolist'), 'stale.sas\n')
        if (marker)
          fs.writeFileSync(path.join(cache, '.release-sha256'), marker)
        const archive = releaseArchive()
        stub = await serve(sends(200, archive))
        await downloadMacros(folder, cache, false, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
        expect(stub.requests).toHaveLength(1)
        expect(fs.existsSync(path.join(folder, 'stale.sas'))).toBe(false)
        expect(
          fs.readFileSync(path.join(cache, '.release-sha256'), 'utf8')
        ).toBe(sha256(archive))
      }
    )

    it('should install a warm cache without fetching', async () => {
      write(folder, ['mf_core.sas'])
      fs.writeFileSync(path.join(folder, '.macrolist'), 'mf_core.sas\n')

      write(cache, ['mf_dl_a.sas', 'mf_dl_b.sas'])
      fs.writeFileSync(path.join(cache, 'mf_dl_a.sas'), 'cached-a')
      fs.writeFileSync(path.join(cache, 'mf_dl_b.sas'), 'cached-b')
      await markCache(cache, ['mf_dl_a.sas', 'mf_dl_b.sas'])

      await downloadMacros(folder, cache, false)

      // The cached content, not whatever GitHub would have served, proves the
      // branch replaced the download.
      expect(fs.readFileSync(path.join(folder, 'mf_dl_a.sas'), 'utf8')).toBe(
        'cached-a'
      )
      expect(fs.readFileSync(path.join(folder, 'mf_dl_b.sas'), 'utf8')).toBe(
        'cached-b'
      )
      expect(listOf(folder)).toEqual([
        'mf_core.sas',
        'mf_dl_a.sas',
        'mf_dl_b.sas'
      ])
    })

    it('should download the pinned release archive and extract only its SPF/Macros files', async () => {
      const archive = releaseArchive()
      stub = await serve(sends(200, archive))

      await downloadMacros(folder, cache, true, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      // One request, to the archive path - not a listing plus per-file fetches.
      expect(stub.requests).toHaveLength(1)
      expect(stub.requests[0].method).toBe('GET')
      expect(stub.requests[0].url).toBe(
        '/yabwon/SAS_PACKAGES/zip/refs/tags/20261111'
      )

      // Only the SPF/Macros entries land in the macros folder; the archive's
      // README.md and SPF/SPFinit.sas are not ours to install.
      expect(listOf(folder)).toEqual([
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
      expect(fs.readFileSync(path.join(folder, 'mf_xptree.sas'), 'utf8')).toBe(
        '%xptree;'
      )

      // The inventory describes the whole folder and not itself.
      expect(readList(folder)).toEqual([
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])

      // The cache is rebuilt from exactly the extracted macros.
      expect(listOf(cache)).toEqual([
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
      expect(readList(cache)).toEqual([
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
    })

    it('should send no Authorization header to the archive host', async () => {
      const archive = releaseArchive()
      stub = await serve(sends(200, archive))

      const token = process.env.GITHUB_TOKEN
      process.env.GITHUB_TOKEN = 'ghs_macros_spec'
      try {
        await downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
      } finally {
        if (token === undefined) delete process.env.GITHUB_TOKEN
        else process.env.GITHUB_TOKEN = token
      }

      // The token is for api.github.com; handing it to another host would leak
      // it, so the archive request carries none even when one is configured.
      expect(stub.requests[0].headers.authorization).toBeUndefined()
    })

    it('should not install a documentation folder that contains SPF/Macros', async () => {
      // Only the anchored prefix names a macro. A path that mentions the folder
      // part way along would otherwise be installed under a name it does not
      // own, so this archive is treated as holding no macros at all.
      const archive = zipOf({
        'SAS_PACKAGES-20261111/SPF/Documentation/SPF/Macros/mf_doc.sas': '%doc;'
      })
      stub = await serve(sends(200, archive))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/no SPF\/Macros files/)

      expect(listOf(folder)).toEqual([])
    })

    it('should install a macro byte for byte, including through the cache', async () => {
      // A macro that is not valid UTF-8: decoding it to a string and writing it
      // back would put U+FFFD where the pinned archive had bytes, and the
      // archive checksum would then prove nothing about what was installed.
      const notUtf8 = Buffer.concat([
        Buffer.from('%put;', 'utf8'),
        Buffer.from([0xff, 0xfe, 0x00, 0x41])
      ])
      const archive = zipOf({
        'SAS_PACKAGES-20261111/SPF/Macros/mf_bytes.sas': notUtf8
      })
      stub = await serve(sends(200, archive))

      await downloadMacros(folder, cache, true, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      expect(fs.readFileSync(path.join(folder, 'mf_bytes.sas'))).toEqual(
        notUtf8
      )
      expect(fs.readFileSync(path.join(cache, 'mf_bytes.sas'))).toEqual(notUtf8)

      // A start installs from the cache over a folder `copySASjsCore` recreated.
      fs.rmSync(path.join(folder, 'mf_bytes.sas'))
      await downloadMacros(folder, cache, false, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      // The cache answered, so nothing was fetched again.
      expect(stub.requests).toHaveLength(1)

      expect(fs.readFileSync(path.join(folder, 'mf_bytes.sas'))).toEqual(
        notUtf8
      )
    })

    it('should create the macros folder when it does not exist yet', async () => {
      // api/sas/sasautos is gitignored: a clean clone has no folder, and the
      // documented `npx ts-node ./scripts/downloadMacros.ts` has to work there.
      const absent = path.join(root, 'absent', 'sasautos')
      const archive = releaseArchive()
      stub = await serve(sends(200, archive))

      await downloadMacros(absent, cache, true, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      expect(fs.existsSync(path.join(absent, 'mf_xptree.sas'))).toBe(true)
      expect(fs.existsSync(path.join(absent, '.macrolist'))).toBe(true)
    })

    it('should abandon a stalled download and retry it', async () => {
      // A connection that never answers must not hold a build open: the timeout
      // turns it into the retryable failure the attempt loop already handles.
      stub = await serve(() => undefined)

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: '0'.repeat(64),
          waitSeconds: () => 0,
          timeoutMs: 50
        })
      ).rejects.toThrow(/after 3 attempt\(s\)/)

      expect(stub.requests).toHaveLength(3)
      expect(listOf(folder)).toEqual([])
    })

    it('should refuse an archive whose checksum is not the pinned release', async () => {
      stub = await serve(sends(200, releaseArchive()))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(Buffer.from('something else')),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/SHA-256 is/)

      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail when the archive is not a zip', async () => {
      stub = await serve(sends(200, Buffer.from('not a zip')))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(Buffer.from('not a zip')),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/not a valid zip/)

      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail when the archive is empty', async () => {
      stub = await serve(sends(200, Buffer.alloc(0)))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(Buffer.alloc(0)),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/not a valid zip/)

      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail when the archive holds no SPF/Macros files', async () => {
      const archive = zipOf({
        'SAS_PACKAGES-20261111/README.md': '# SAS_PACKAGES'
      })
      stub = await serve(sends(200, archive))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/no SPF\/Macros files/)

      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail when an archive entry reaches outside the macros folder', async () => {
      const archive = zipWithTraversal()
      stub = await serve(sends(200, archive))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/unsafe path/)

      // Neither the escape target nor any partial install may exist.
      expect(fs.existsSync(path.join(root, 'escape.sas'))).toBe(false)
      expect(fs.existsSync(path.join(folder, 'escape.sas'))).toBe(false)
      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail when an SPF/Macros entry names a path segment, not a file', async () => {
      // `..` is a segment of the path, not a file name: writing it would put
      // the archive's content in a parent directory, not a macro.
      const archive = zipWithPatchedEntryName('zz', '..')
      stub = await serve(sends(200, archive))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/unsafe path/)

      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail when an SPF/Macros entry separates its path with backslashes', async () => {
      // A `\` in a zip entry name is a literal file name character on posix,
      // but the packaged server also builds for Windows, where it is a
      // separator - and `..\..\evil.sas` there is an escape.
      const archive = zipWithPatchedEntryName(
        'zzzzzzzzzz.sas',
        '..\\..\\evil.sas'
      )
      stub = await serve(sends(200, archive))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: sha256(archive),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/unsafe path/)

      expect(fs.existsSync(path.join(root, 'evil.sas'))).toBe(false)
      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should fail without retrying when the archive is not found', async () => {
      stub = await serve(sends(404, Buffer.from('not found')))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: '0'.repeat(64),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/404/)

      expect(stub.requests).toHaveLength(1)
      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should retry a 5xx and install once the archive arrives', async () => {
      const archive = releaseArchive()
      stub = await serve((seen, res) => {
        if (seen === 1) return sends(503, Buffer.from('busy'))(seen, res)
        sends(200, archive)(seen, res)
      })

      await downloadMacros(folder, cache, true, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      expect(stub.requests).toHaveLength(2)
      expect(listOf(folder)).toEqual([
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
    })

    it('should give up after three attempts when the archive host is down', async () => {
      stub = await serve(sends(500, Buffer.from('boom')))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: '0'.repeat(64),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/after 3 attempt\(s\)/)

      expect(stub.requests).toHaveLength(3)
      expect(listOf(folder)).toEqual([])
      expect(fs.existsSync(path.join(cache, '.macrolist'))).toBe(false)
    })

    it('should re-download when the cache names a file it does not hold', async () => {
      // A half-populated cache: the list was never written, or was copied
      // without its files. The download must not install this partial tree.
      write(cache, ['mf_dl_a.sas'])
      fs.writeFileSync(
        path.join(cache, '.macrolist'),
        'mf_dl_a.sas\nmf_dl_b.sas\n'
      )

      const archive = releaseArchive()
      stub = await serve(sends(200, archive))

      await downloadMacros(folder, cache, false, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      expect(stub.requests).toHaveLength(1)
      expect(listOf(folder)).toEqual([
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
    })

    it('should remove a macro the new release no longer ships', async () => {
      // A forced refresh extracts over the folder, which also holds the core
      // macros - so it cannot be emptied. The cache's list is what the previous
      // download owned, and only those names may go.
      write(folder, ['mf_core.sas', 'mf_retired.sas'])
      fs.writeFileSync(path.join(folder, '.macrolist'), 'mf_core.sas\n')
      fs.writeFileSync(path.join(folder, 'mf_retired.sas'), '%retired;')

      write(cache, ['mf_retired.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_retired.sas\n')

      const archive = releaseArchive()
      stub = await serve(sends(200, archive))

      await downloadMacros(folder, cache, true, {
        archiveUrl: stub.archiveUrl,
        expectedSha256: sha256(archive),
        waitSeconds: () => 0
      })

      expect(fs.existsSync(path.join(folder, 'mf_retired.sas'))).toBe(false)
      expect(listOf(folder)).toEqual([
        'mf_core.sas',
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
      // The inventory follows the folder, so the retired macro is not listed
      // and therefore not copied into the drive on the next start.
      expect(readList(folder)).toEqual([
        'mf_core.sas',
        'mf_getquoted.sas',
        'mf_getunquoted.sas',
        'mf_xptree.sas'
      ])
    })

    it('should leave the cache untouched when the download fails', async () => {
      // A cache that is complete but stale: a failed refresh must not damage
      // it, so the next start can still install from it.
      write(cache, ['mf_dl_a.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_dl_a.sas\n')
      fs.writeFileSync(path.join(cache, 'mf_dl_a.sas'), 'cached-a')

      stub = await serve(sends(500, Buffer.from('boom')))

      await expect(
        downloadMacros(folder, cache, true, {
          archiveUrl: stub.archiveUrl,
          expectedSha256: '0'.repeat(64),
          waitSeconds: () => 0
        })
      ).rejects.toThrow(/after 3 attempt\(s\)/)

      expect(listOf(cache)).toEqual(['mf_dl_a.sas'])
      expect(fs.readFileSync(path.join(cache, 'mf_dl_a.sas'), 'utf8')).toBe(
        'cached-a'
      )
      expect(readList(cache)).toEqual(['mf_dl_a.sas'])
    })
  })

  describe('pins', () => {
    it('should pin the release tag, the archive URL and its checksum', () => {
      expect(SAS_PACKAGES_RELEASE).toBe('20261111')
      expect(sasPackagesArchiveUrl()).toBe(
        'https://codeload.github.com/yabwon/SAS_PACKAGES/zip/refs/tags/20261111'
      )
      expect(SAS_PACKAGES_RELEASE_SHA256).toBe(
        '8bbb0c1ae746faa3c9f1d0d136bce9337fd28fa89e1d9df1abc8d6ea763691c9'
      )
    })
  })

  describe('paths', () => {
    it('should keep the cache out of the sas/ tree the build copies', () => {
      const sasTree = path.dirname(sasJSCoreMacros)

      expect(downloadCache.startsWith(sasTree + path.sep)).toBe(false)
      expect(path.basename(downloadCache)).toBe('.sasautos-download')
    })

    it('should strip the SAS_PACKAGES prefix from a macro path', () => {
      expect(macroFileName('SPF/Macros/mf_a.sas')).toBe('mf_a.sas')
      expect(macroFileName('mf_b.sas')).toBe('mf_b.sas')
    })

    it('should strip the archive root folder from an archive entry path', () => {
      expect(macroFileName('SAS_PACKAGES-20261111/SPF/Macros/mf_a.sas')).toBe(
        'mf_a.sas'
      )
    })
  })

  describe('cacheDownloads', () => {
    it('should rebuild the cache with the downloaded macros only', async () => {
      write(folder, ['mf_core.sas', 'mf_dl_a.sas', 'mf_dl_b.sas'])
      write(cache, ['mf_stale.sas'])

      await cacheDownloads(['mf_dl_a.sas', 'mf_dl_b.sas'], folder, cache)

      expect(listOf(cache)).toEqual(['mf_dl_a.sas', 'mf_dl_b.sas'])
      expect(readList(cache)).toEqual(['mf_dl_a.sas', 'mf_dl_b.sas'])
    })

    it('should write records a later start can verify', async () => {
      write(folder, ['mf_dl_a.sas', 'mf_dl_b.sas'])

      await cacheDownloads(['mf_dl_a.sas', 'mf_dl_b.sas'], folder, cache)

      expect(fs.existsSync(path.join(cache, '.content-sha256'))).toBe(true)
      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(true)
    })
  })

  describe('removeStaleDownloads', () => {
    it('should keep a name the release still ships and ignore a path that leaves the folder', async () => {
      write(folder, ['mf_keep.sas', 'mf_drop.sas'])
      fs.writeFileSync(path.join(root, 'outside.sas'), '%outside;')

      await removeStaleDownloads(
        folder,
        ['mf_keep.sas', 'mf_drop.sas', '../outside.sas'],
        ['mf_keep.sas']
      )

      expect(listOf(folder)).toEqual(['mf_keep.sas'])
      expect(fs.existsSync(path.join(root, 'outside.sas'))).toBe(true)
    })
  })
})
