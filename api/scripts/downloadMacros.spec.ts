import fs from 'fs'
import os from 'os'
import path from 'path'

import { sasJSCoreMacros } from '../src/utils/file'
import {
  cacheDownloads,
  cachedDownloadsAreCurrent,
  downloadCache,
  downloadMacros,
  installFromCache,
  macroFileName
} from './downloadMacros'

describe('downloadMacros', () => {
  let root: string
  let folder: string
  let cache: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-macros-'))
    folder = path.join(root, 'sasautos')
    cache = path.join(root, 'sasautos-download')
    fs.mkdirSync(folder)
    fs.mkdirSync(cache)
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  const write = (dir: string, names: string[]) =>
    names.forEach((name) => fs.writeFileSync(path.join(dir, name), '%put;'))

  const listOf = (dir: string) =>
    fs
      .readdirSync(dir)
      .filter((name) => name !== '.macrolist')
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

    it('should answer true when the list and every file it names are present', async () => {
      write(cache, ['mf_a.sas', 'mf_b.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_a.sas\nmf_b.sas\n')

      expect(
        await cachedDownloadsAreCurrent(
          cache,
          path.join(cache, '.macrolist'),
          false
        )
      ).toBe(true)
    })

    it('should answer false when a listed file is missing', async () => {
      write(cache, ['mf_a.sas'])
      fs.writeFileSync(path.join(cache, '.macrolist'), 'mf_a.sas\nmf_b.sas\n')

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
      fs.writeFileSync(
        path.join(cache, '.macrolist'),
        'mf_dl_a.sas\nmf_dl_b.sas\n'
      )

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

    it('should answer false when a cached macro is missing', async () => {
      write(folder, ['mf_core.sas'])
      write(cache, ['mf_dl_a.sas'])
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
    it('should install a warm cache without fetching', async () => {
      write(folder, ['mf_core.sas'])
      fs.writeFileSync(path.join(folder, '.macrolist'), 'mf_core.sas\n')

      write(cache, ['mf_dl_a.sas', 'mf_dl_b.sas'])
      fs.writeFileSync(
        path.join(cache, '.macrolist'),
        'mf_dl_a.sas\nmf_dl_b.sas\n'
      )
      fs.writeFileSync(path.join(cache, 'mf_dl_a.sas'), 'cached-a')
      fs.writeFileSync(path.join(cache, 'mf_dl_b.sas'), 'cached-b')

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
  })

  describe('cacheDownloads', () => {
    it('should rebuild the cache with the downloaded macros only', async () => {
      write(folder, ['mf_core.sas', 'mf_dl_a.sas', 'mf_dl_b.sas'])
      write(cache, ['mf_stale.sas'])

      await cacheDownloads(['mf_dl_a.sas', 'mf_dl_b.sas'], folder, cache)

      expect(listOf(cache)).toEqual(['mf_dl_a.sas', 'mf_dl_b.sas'])
      expect(readList(cache)).toEqual(['mf_dl_a.sas', 'mf_dl_b.sas'])
    })
  })
})
