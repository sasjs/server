/**
 * Reading an uploaded archive, without a server in the way.
 *
 * The route-level behaviour is `drive.spec.ts`; this file pins the decisions the
 * archive reader makes on its own - what counts as a deploy document, and what
 * the cap does before anything is decompressed.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import AdmZip from 'adm-zip'

import { checkDeployTree } from '@sasjs/api'
import type { DeployLimits } from '@sasjs/api'
import { extractDeployDocumentFromZip, extractFileTreeFromZip } from '../zipped'

let workdir: string

const archive = (
  entries: Record<string, string | Buffer>
): Express.Multer.File => {
  const zip = new AdmZip()

  for (const [name, contents] of Object.entries(entries))
    zip.addFile(
      name,
      Buffer.isBuffer(contents) ? contents : Buffer.from(contents)
    )

  const file = path.join(workdir, `${Math.random().toString(36).slice(2)}.zip`)

  fs.writeFileSync(file, zip.toBuffer())

  return {
    path: file,
    originalname: path.basename(file),
    mimetype: 'application/zip'
  } as Express.Multer.File
}

beforeAll(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-spec-'))
})

afterAll(() => {
  fs.rmSync(workdir, { recursive: true, force: true })
})

describe('what counts as a deploy document', () => {
  it('reads a root-level JSON file that names appLoc and fileTree', async () => {
    const file = archive({
      'deploy.json': JSON.stringify({ appLoc: '/Public/app', fileTree: {} }),
      'index.html': '<h1>Hello</h1>'
    })

    await expect(extractDeployDocumentFromZip(file)).resolves.toContain(
      'fileTree'
    )
  })

  it('leaves a manifest that an app ships to the app', async () => {
    const file = archive({
      'manifest.json': JSON.stringify({ name: 'the app', version: '1' }),
      'index.html': '<h1>Hello</h1>'
    })

    // no appLoc, no fileTree: not a document, so the archive is the app
    await expect(extractDeployDocumentFromZip(file)).resolves.toBeUndefined()
  })

  it('leaves a JSON file in a subfolder to the app', async () => {
    const file = archive({
      'data/deploy.json': JSON.stringify({
        appLoc: '/Public/app',
        fileTree: {}
      })
    })

    await expect(extractDeployDocumentFromZip(file)).resolves.toBeUndefined()
  })

  it('ignores a root-level JSON file that does not parse', async () => {
    const file = archive({ 'deploy.json': '{ not json' })

    await expect(extractDeployDocumentFromZip(file)).resolves.toBeUndefined()
  })
})

describe('the cap on an archive', () => {
  const limits: DeployLimits = { entries: 3, totalBytes: 20, fileBytes: 10 }

  it('refuses an archive with more entries than the cap, by count', async () => {
    const file = archive({
      'a.txt': 'aaaa',
      'b.txt': 'bbbb',
      'c.txt': 'cccc',
      'd.txt': 'dddd'
    })

    await expect(extractFileTreeFromZip(file, limits)).rejects.toMatchObject({
      code: 413,
      message: 'The file tree exceeds the deploy limit: 4 entries (maximum 3).'
    })
  })

  it('refuses a single entry over the per-file cap, before reading it', async () => {
    const file = archive({ 'big.bin': Buffer.alloc(11, 1) })

    await expect(extractFileTreeFromZip(file, limits)).rejects.toMatchObject({
      code: 413,
      message:
        'A file in the tree exceeds the deploy limit: big.bin is 11 bytes (maximum 10 bytes per file).'
    })
  })

  it('refuses an archive whose entries add up past the total', async () => {
    const file = archive({
      'a.bin': Buffer.alloc(8, 1),
      'b.bin': Buffer.alloc(8, 1),
      'c.bin': Buffer.alloc(8, 1)
    })

    await expect(extractFileTreeFromZip(file, limits)).rejects.toMatchObject({
      code: 413,
      message:
        'The file tree exceeds the deploy limit: 24 bytes (maximum 20 bytes).'
    })
  })

  /**
   * The archive refusals are the deploy cap's sentences, and that is the point:
   * a caller refused for the size of an uploaded archive reads the same wording
   * as one refused for the size of a JSON tree. This pins the two together, so a
   * change to either side's phrasing fails here rather than in a user's log.
   */
  it('speaks the deploy cap sentences for a tree refused by size', async () => {
    const overCount = await extractFileTreeFromZip(
      archive({ 'a.txt': 'a', 'b.txt': 'b', 'c.txt': 'c', 'd.txt': 'd' }),
      limits
    ).catch((error) => error)

    const fromPackage = checkDeployTree(
      [
        { name: 'a.txt', type: 'file', code: 'a' },
        { name: 'b.txt', type: 'file', code: 'b' },
        { name: 'c.txt', type: 'file', code: 'c' },
        { name: 'd.txt', type: 'file', code: 'd' }
      ],
      limits
    )

    expect(overCount.message).toEqual(fromPackage?.message)
  })
})

describe('reading an archive into a tree', () => {
  it('keeps the archive structure and marks every entry base64', async () => {
    const file = archive({
      'services/web/index.html': '<h1>Hello</h1>',
      'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47])
    })

    const tree = await extractFileTreeFromZip(file)
    const services = tree.members.find(
      (member) => member.name === 'services'
    ) as any

    expect(services.name).toEqual('services')
    expect(services.members[0].name).toEqual('web')
    expect(services.members[0].members[0]).toMatchObject({
      name: 'index.html',
      type: 'file',
      encoding: 'base64'
    })
    expect(
      Buffer.from(services.members[0].members[0].code, 'base64').toString()
    ).toEqual('<h1>Hello</h1>')
  })

  it('drops the entries macOS adds to an archive of a folder', async () => {
    const file = archive({
      'index.html': '<h1>Hello</h1>',
      '__MACOSX/._index.html': 'resource fork',
      '.DS_Store': 'junk'
    })

    const tree = await extractFileTreeFromZip(file)

    expect(tree.members.map((member) => member.name)).toEqual(['index.html'])
  })

  it('refuses an archive with nothing deployable in it', async () => {
    // every entry dropped, and an empty archive, are both a build that produced
    // nothing: deploying them would remove the folder and answer success
    const dropped = archive({
      '__MACOSX/._index.html': 'resource fork',
      '.DS_Store': 'junk'
    })

    await expect(extractFileTreeFromZip(dropped)).rejects.toMatchObject({
      code: 400,
      message: expect.stringContaining('contains no files to deploy')
    })

    await expect(extractFileTreeFromZip(archive({}))).rejects.toMatchObject({
      code: 400
    })
  })

  it('is a refusal object the routes can render', async () => {
    const file = archive({ 'big.bin': Buffer.alloc(11, 1) })

    const refusal = await extractFileTreeFromZip(file, {
      entries: 10,
      totalBytes: 100,
      fileBytes: 10
    }).catch((error) => error)

    // a refusal carries the status the routes render, whatever class runs the
    // prototype chain down to Error on an older target
    expect(refusal.code).toEqual(413)
    expect(refusal.status).toEqual('failure')
  })
})

/**
 * A file that is not an archive at all, which is the refusal a person reads.
 *
 * The case that prompted these is real: a release asset was published as the
 * multipart envelope an uploader sent instead of the file itself, so a "zip"
 * downloaded from a release began `------formdata-undici-...`. `AdmZip` answered
 * "Invalid CEN header (bad signature)", which names neither the file nor what it
 * holds, and reached the client as a `500` - so the reader now says which file it
 * was, quotes what the file begins with and states what an archive begins with.
 */
describe('a file that is not an archive', () => {
  /** A file of exactly these bytes, named as it would arrive from a browser. */
  const asFile = (bytes: Buffer, name: string): Express.Multer.File => {
    const file = path.join(
      workdir,
      `${Math.random().toString(36).slice(2)}.zip`
    )

    fs.writeFileSync(file, bytes)

    return {
      path: file,
      originalname: name,
      mimetype: 'application/zip'
    } as Express.Multer.File
  }

  /** The body an uploader sends when it posts a form to a host that wanted bytes. */
  const multipartBody = (): Buffer =>
    Buffer.concat([
      Buffer.from(
        '------formdata-undici-040361451847\r\n' +
          'Content-Disposition: form-data; name="file"; filename="server.json.zip"\r\n' +
          'Content-Type: application/octet-stream\r\n\r\n'
      ),
      fs.readFileSync(
        archive({
          'deploy.json': JSON.stringify({ appLoc: '/Public/app' })
        }).path
      )
    ])

  it('states the file, what it begins with, and what an archive begins with', async () => {
    const file = asFile(multipartBody(), 'server.json.zip')

    const refusal = await extractDeployDocumentFromZip(file).catch(
      (error) => error
    )

    expect(refusal.code).toEqual(400)
    expect(refusal.message).toContain('"server.json.zip" is not a zip archive')
    // the opening is quoted, so a reader can see the envelope that was uploaded
    expect(refusal.message).toContain('it begins with "------formdata-undici-')
    expect(refusal.message).toContain('a zip archive begins with "PK"')
  })

  it('says a file is empty rather than quoting nothing', async () => {
    const refusal = await extractFileTreeFromZip(
      asFile(Buffer.alloc(0), 'empty.zip')
    ).catch((error) => error)

    expect(refusal.code).toEqual(400)
    expect(refusal.message).toEqual(
      'The file "empty.zip" is empty, where a zip archive begins with "PK".'
    )
  })

  it('keeps the reader reason for an archive it cannot read, with the file name', async () => {
    // a zip whose central directory signature is damaged: it begins with PK, so
    // the opening check passes and the reader is the one that refuses it
    const bytes = archive({ 'index.html': '<h1>Hello</h1>' }).path
    const damaged = Buffer.from(fs.readFileSync(bytes))
    damaged[damaged.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))] = 0x58

    const refusal = await extractFileTreeFromZip(
      asFile(damaged, 'damaged.zip')
    ).catch((error) => error)

    expect(refusal.code).toEqual(400)
    expect(refusal.message).toContain(
      'The file "damaged.zip" could not be read as a zip archive:'
    )
    expect(refusal.message).toContain('Invalid CEN header')
  })

  it('refuses a truncated archive the same way', async () => {
    const whole = fs.readFileSync(archive({ 'index.html': 'x' }).path)

    const refusal = await extractDeployDocumentFromZip(
      asFile(whole.subarray(0, whole.length - 30), 'cut.zip')
    ).catch((error) => error)

    expect(refusal.code).toEqual(400)
    expect(refusal.message).toContain(
      '"cut.zip" could not be read as a zip archive'
    )
  })
})
