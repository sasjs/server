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

import { checkDeployTree, BACKEND_FOLDER, FRONTEND_FOLDER } from '@sasjs/api'
import type { DeployLimits } from '@sasjs/api'
import {
  extractDeployDocumentFromZip,
  extractFileTreeFromZip,
  isZipFile
} from '../zipped'

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

describe('the folder an archive was made from', () => {
  const roots = (tree: { members: { name: string }[] }) =>
    tree.members.map((member) => member.name)

  it('drops a single top-level folder when the archive is published', async () => {
    // "compress" on a folder gives `myapp/index.html`, not `index.html`
    const file = archive({
      'myapp/index.html': '<h1>Hi</h1>',
      'myapp/assets/app.js': 'console.log(1)'
    })

    const tree = await extractFileTreeFromZip(file)

    expect(roots(tree as any).sort()).toEqual(['assets', 'index.html'])
  })

  it('keeps the structure when the caller says the folder is part of the tree', async () => {
    // a deploy to a folder the request names keeps the archive's structure, so
    // the wrapper is the caller's own folder rather than something to drop
    const file = archive({ 'mysite/index.html': '<h1>Hi</h1>' })

    const tree = await extractFileTreeFromZip(file, undefined, {
      unwrap: false
    })

    expect(roots(tree as any)).toEqual(['mysite'])
  })

  it('never treats a folder a deployment is made of as a wrapper', async () => {
    // `services` is the legacy bundle's folder and `web` and `backend` are the
    // halves a package is split into: an archive holding one of them at its root
    // is a tree whose root that is, and stripping it would deploy the bundle's
    // contents one level up
    for (const root of ['services', FRONTEND_FOLDER, BACKEND_FOLDER]) {
      const file = archive({ [`${root}/index.html`]: '<h1>Hi</h1>' })

      const tree = await extractFileTreeFromZip(file)

      expect(roots(tree as any)).toEqual([root])
    }
  })

  it('reads a folder as compressed when the only root-level entry is one it drops', async () => {
    // macOS writes `.DS_Store` beside the folder as well as inside it, and the
    // tree builder drops it - so it cannot be what tells us the archive is not a
    // compressed folder, or an archive of `myapp/` deploys at
    // `apps/<name>/myapp/index.html` with no diagnostic
    const file = archive({
      '.DS_Store': 'junk',
      '__MACOSX/._index.html': 'junk',
      'myapp/index.html': '<h1>Hi</h1>',
      'myapp/assets/app.js': 'console.log(1)'
    })

    const tree = await extractFileTreeFromZip(file)

    expect(roots(tree as any).sort()).toEqual(['assets', 'index.html'])
  })
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
    expect(refusal.message).toContain(
      'a zip archive begins with the four bytes "PK\\x03\\x04"'
    )
  })

  it('says a file is empty rather than quoting nothing', async () => {
    const refusal = await extractFileTreeFromZip(
      asFile(Buffer.alloc(0), 'empty.zip')
    ).catch((error) => error)

    expect(refusal.code).toEqual(400)
    expect(refusal.message).toEqual(
      'The file "empty.zip" is empty, where a zip archive begins with the four bytes "PK\\x03\\x04".'
    )
  })

  it('says how short a file that stops inside the signature is', async () => {
    // `PK` alone is what a cut-off upload leaves: quoting it as "begins with PK,
    // where a zip begins with PK" would contradict itself
    const refusal = await extractFileTreeFromZip(
      asFile(Buffer.from('PK'), 'cut.zip')
    ).catch((error) => error)

    expect(refusal.code).toEqual(400)
    expect(refusal.message).toEqual(
      'The file "cut.zip" is not a zip archive: it holds 2 byte(s), so it ends inside "PK\\x03\\x04", the four bytes a zip archive begins with.'
    )

    const oneMore = await extractDeployDocumentFromZip(
      asFile(Buffer.from([0x50, 0x4b, 0x03]), 'cut2.zip')
    ).catch((error) => error)

    expect(oneMore.message).toContain('it holds 3 byte(s)')
  })

  it('quotes the signature the file actually stops inside', async () => {
    // `PK\x05` begins the EMPTY-archive signature, not the local-file one: quoting
    // the first signature for every short file would assert a prefix the file does
    // not have
    const empty = await extractFileTreeFromZip(
      asFile(Buffer.from([0x50, 0x4b, 0x05]), 'empty-cut.zip')
    ).catch((error) => error)

    expect(empty.message).toContain('it ends inside "PK\\x05\\x06"')

    const spanned = await extractFileTreeFromZip(
      asFile(Buffer.from([0x50, 0x4b, 0x07]), 'spanned-cut.zip')
    ).catch((error) => error)

    expect(spanned.message).toContain('it ends inside "PK\\x07\\x08"')
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

/**
 * The two questions `isZipFile` answers, each in the file's own terms.
 *
 * Both name the build the admin chose rather than the multipart field it travelled
 * in: `"file" has invalid type application/octet-stream` is a sentence about the
 * form, not about the upload. Only the type refusal is rendered by the deploy route
 * - a name that does not end `.zip` is read as a deploy document - so these pin the
 * wording of both rather than the route's rendering, which `deployPackage.spec.ts`
 * covers.
 */
describe('whether an upload is an archive, by name and type', () => {
  const upload = (originalname: string, mimetype: string) =>
    ({ originalname, mimetype }) as Express.Multer.File

  it('names the file a name did not make an archive', () => {
    expect(isZipFile(upload('build.json', 'application/json')).error).toBe(
      'The file "build.json" was not taken as an archive: its name ends ".json", where an archive\'s name ends ".zip".'
    )
  })

  it('names the file and the type it arrived as', () => {
    expect(
      isZipFile(upload('bundle.zip', 'application/octet-stream')).error
    ).toBe(
      'The file "bundle.zip" arrived as "application/octet-stream", where an archive arrives as "application/zip" or "application/x-zip-compressed".'
    )
  })

  it('takes a zip that is a zip by both', () => {
    const file = upload('bundle.zip', 'application/x-zip-compressed')

    expect(isZipFile(file).value).toBe(file)
  })
})
