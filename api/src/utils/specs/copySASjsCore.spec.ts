import fs from 'fs'
import os from 'os'
import path from 'path'

import { copyMacrosByteForByte } from '../copySASjsCore'

describe('copyMacrosByteForByte', () => {
  let root: string
  let source: string
  let destination: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-drive-macros-'))
    source = path.join(root, 'sasautos')
    destination = path.join(root, 'drive', 'sasautos')

    fs.mkdirSync(source)
    fs.mkdirSync(destination, { recursive: true })
  })

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

  it('should copy every named macro', async () => {
    fs.writeFileSync(path.join(source, 'mf_a.sas'), '%a;')
    fs.writeFileSync(path.join(source, 'mf_b.sas'), '%b;')

    await copyMacrosByteForByte(source, destination, ['mf_a.sas', 'mf_b.sas'])

    expect(fs.readdirSync(destination).sort()).toEqual(['mf_a.sas', 'mf_b.sas'])
    expect(fs.readFileSync(path.join(destination, 'mf_a.sas'), 'utf8')).toBe(
      '%a;'
    )
  })

  it('should keep a macro that is not valid UTF-8 byte for byte', async () => {
    // Reading this as a string and writing it back would store U+FFFD
    // (efbfbd) where the bytes were, and the drive copy is the only copy SAS
    // reads - so the archive checksum would prove nothing about what runs.
    const notUtf8 = Buffer.concat([
      Buffer.from('%put;', 'utf8'),
      Buffer.from([0xff, 0xfe, 0x00, 0x41])
    ])
    fs.writeFileSync(path.join(source, 'mf_bytes.sas'), notUtf8)

    await copyMacrosByteForByte(source, destination, ['mf_bytes.sas'])

    expect(fs.readFileSync(path.join(destination, 'mf_bytes.sas'))).toEqual(
      notUtf8
    )
  })

  it('should skip the empty name a trailing newline leaves', async () => {
    fs.writeFileSync(path.join(source, 'mf_a.sas'), '%a;')

    await copyMacrosByteForByte(source, destination, ['mf_a.sas', ''])

    expect(fs.readdirSync(destination)).toEqual(['mf_a.sas'])
  })
})
