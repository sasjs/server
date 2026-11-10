import fs from 'fs'
import os from 'os'
import path from 'path'

import { copySASjsCore } from './copySASjsCore'

describe('copySASjsCore', () => {
  let root: string
  let folder: string
  let coreFolder: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-core-copy-'))
    folder = path.join(root, 'sas', 'sasautos')
    coreFolder = path.join(root, 'core')

    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(path.join(folder, 'old.sas'), '%put;')

    for (const sub of ['base', 'ddl', 'fcmp', 'lua', 'server']) {
      fs.mkdirSync(path.join(coreFolder, sub), { recursive: true })
      fs.writeFileSync(path.join(coreFolder, sub, `mf_${sub}.sas`), '%put;')
    }
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('should remove the legacy cache and rebuild the folder from core', async () => {
    // The layout an upgraded tree has: the old cache beside the macros folder.
    const legacy = path.join(root, 'sas', 'sasautos-download')
    fs.mkdirSync(legacy)
    fs.writeFileSync(path.join(legacy, 'stale.sas'), '%put;')

    await copySASjsCore(folder, coreFolder)

    expect(fs.existsSync(legacy)).toBe(false)
    // The folder is recreated from core, so nothing from before survives.
    expect(fs.existsSync(path.join(folder, 'old.sas'))).toBe(false)
    expect(fs.readdirSync(folder).sort()).toEqual([
      '.macrolist',
      'mf_base.sas',
      'mf_ddl.sas',
      'mf_fcmp.sas',
      'mf_lua.sas',
      'mf_server.sas'
    ])
    expect(
      fs
        .readFileSync(path.join(folder, '.macrolist'), 'utf8')
        .split('\n')
        .sort()
    ).toEqual([
      'mf_base.sas',
      'mf_ddl.sas',
      'mf_fcmp.sas',
      'mf_lua.sas',
      'mf_server.sas'
    ])
  })

  it('should leave the live cache alone and run without a legacy one', async () => {
    // The cache the download uses lives beside `sas/`, not inside it. A
    // deletion that widened to it would wipe the payload on every start, which
    // is the regression worth pinning here.
    const liveCache = path.join(root, '.sasautos-download')
    fs.mkdirSync(liveCache)
    fs.writeFileSync(path.join(liveCache, 'cached.sas'), '%put;')

    await copySASjsCore(folder, coreFolder)

    expect(fs.existsSync(path.join(liveCache, 'cached.sas'))).toBe(true)
    expect(fs.readdirSync(folder)).toContain('mf_base.sas')
  })
})
