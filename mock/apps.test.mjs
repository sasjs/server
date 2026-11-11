/**
 * The packaged app, tested without the network.
 *
 * Every failure this guards against is one that publishes quietly: an archive
 * read through the central directory's offsets (which yields garbage from a
 * working zip), a page written to the drive still base64-encoded (a blank app and
 * no error), a PNG written as text (a broken image), an index written twice (two
 * tiles for one app), or a snapshot that drops the files the site already
 * shipped. None of those fail a build; all of them fail the page, which is why
 * the pieces are asserted here.
 */
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import test from 'node:test'

import {
  appEntry,
  packFiles,
  unzipEntry,
  withPublishedApp,
  MACRO_DASH_APP_ID,
  MACRO_DASH_NAME
} from './apps.mjs'

/** A file member's `code`, which is base64 in this format for every file. */
const code = (text) => Buffer.from(text, 'utf8').toString('base64')

/**
 * A zip holding one member - the smallest archive the release has the shape of.
 *
 * Written here rather than committed as a fixture so both code paths are
 * exercised: `stored` (method 0) and `deflate` (method 8). The local header's
 * extra field is non-empty on purpose - a reader that takes the data's offset
 * from the central directory instead of the local header still finds the right
 * bytes when the two agree, so only a differing extra field proves the rule.
 */
const zipWith = (name, contents, method = 8) => {
  const data = method === 8 ? deflateRawSync(contents) : contents
  const nameBytes = Buffer.from(name)

  const localExtra = Buffer.from([0x55, 0x54, 0x05, 0x00, 0x01, 0x02, 0x03, 0x04])
  const centralExtra = Buffer.from([])

  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4) // version needed
  local.writeUInt16LE(0, 6) // flags
  local.writeUInt16LE(method, 8)
  local.writeUInt32LE(data.length, 18)
  local.writeUInt32LE(contents.length, 22)
  local.writeUInt16LE(nameBytes.length, 26)
  local.writeUInt16LE(localExtra.length, 28)

  const localRecord = Buffer.concat([local, nameBytes, localExtra, data])

  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(20, 4) // version made by
  central.writeUInt16LE(20, 6) // version needed
  central.writeUInt16LE(method, 10)
  central.writeUInt32LE(data.length, 20)
  central.writeUInt32LE(contents.length, 24)
  central.writeUInt16LE(nameBytes.length, 28)
  central.writeUInt16LE(centralExtra.length, 30)
  central.writeUInt32LE(0, 42) // local header offset

  const centralRecord = Buffer.concat([central, nameBytes, centralExtra])

  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(centralRecord.length, 12)
  end.writeUInt32LE(localRecord.length, 16)

  return Buffer.concat([localRecord, centralRecord, end])
}

const pack = {
  appLoc: '/Public/app/macrodash',
  streamWebFolder: 'web',
  streamServiceName: 'MacroDash',
  streamLogo: 'macrodash.png',
  fileTree: {
    name: 'files',
    members: [
      {
        name: 'services',
        type: 'folder',
        members: [
          {
            name: 'common',
            type: 'folder',
            members: [
              { name: 'configure', type: 'service', code: '%macro configure;%mend;' }
            ]
          },
          {
            name: 'web',
            type: 'folder',
            members: [
              {
                name: 'index.html',
                type: 'file',
                code: code('<!doctype html><title>Macro Dash</title>')
              },
              // a one-pixel PNG is plenty: what matters is that it does not survive
              // a UTF-8 round trip, so it must reach the drive as bytes
              { name: 'macrodash.png', type: 'file', code: 'iVBORw0KGgo=' },
              {
                name: 'js',
                type: 'folder',
                members: [
                  { name: 'game.js', type: 'file', code: code('console.log(1)') }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

test('reads the archive member, whichever way it was compressed', () => {
  const body = Buffer.from('{"appLoc":"/Public/app/macrodash"}')

  for (const method of [0, 8]) {
    const read = unzipEntry(zipWith('server.json', body, method), 'server.json')
    assert.equal(read.toString('utf8'), body.toString('utf8'), `method ${method}`)
  }
})

test('refuses an archive with no such member, and one that is not a zip', () => {
  assert.throws(
    () => unzipEntry(zipWith('other.json', Buffer.from('{}')), 'server.json'),
    /holds no server\.json/
  )
  assert.throws(() => unzipEntry(Buffer.from('not a zip at all'), 'server.json'), /not a zip/)
})

test('decodes the file tree, and writes the app under its appLoc', () => {
  const files = packFiles(pack)
  const byPath = Object.fromEntries(files.map((file) => [file.path, file.contents]))

  // the service is not in the web folder, so it is not served: only the app's own
  // assets are, which is what the App Stream answers for
  assert.deepEqual(Object.keys(byPath).sort(), [
    '/Public/app/macrodash/services/web/index.html',
    '/Public/app/macrodash/services/web/js/game.js',
    '/Public/app/macrodash/services/web/macrodash.png'
  ])

  // base64 in, text on the drive - a page left encoded is a blank app
  assert.equal(
    byPath['/Public/app/macrodash/services/web/index.html'],
    '<!doctype html><title>Macro Dash</title>'
  )
  assert.equal(byPath['/Public/app/macrodash/services/web/js/game.js'], 'console.log(1)')

  // and the PNG is a byte entry, marked the way the runtime reads
  assert.equal(
    byPath['/Public/app/macrodash/services/web/macrodash.png'],
    '\u0000base64:iVBORw0KGgo='
  )
})

test('a text file that begins with the marker is escaped, not misread as bytes', () => {
  const leading = {
    ...pack,
    fileTree: {
      members: [
        {
          name: 'web',
          type: 'folder',
          members: [{ name: 'index.html', type: 'file', code: code('\u0000text:hello') }]
        }
      ]
    }
  }

  const [file] = packFiles(leading)
  assert.equal(file.contents, '\u0000text:\u0000text:hello')
})

test('the version placeholder the release ships is filled in', () => {
  const placeholder = {
    ...pack,
    fileTree: {
      members: [
        {
          name: 'web',
          type: 'folder',
          members: [
            { name: 'index.html', type: 'file', code: code('<p>v{{VERSION}}</p>') }
          ]
        }
      ]
    }
  }

  const [file] = packFiles(placeholder)
  assert.equal(file.contents, `<p>v${'1.6.0'}</p>`)
})

test('a package with no streamed web folder is refused by name', () => {
  assert.throws(
    () => packFiles({ ...pack, streamWebFolder: 'dist' }),
    /no dist folder under services/
  )
})

test('a file member that is not base64 is refused by name, not published as mojibake', () => {
  const raw = {
    ...pack,
    fileTree: {
      members: [
        {
          name: 'web',
          type: 'folder',
          members: [
            // a build that shipped the page's characters rather than their
            // encoding: `Buffer.from(..., 'base64')` would decode this to
            // rubbish and the entry would ship as bytes
            { name: 'index.html', type: 'file', code: '<!doctype html><title>x</title>' }
          ]
        }
      ]
    }
  }

  assert.throws(() => packFiles(raw), /index\.html does not carry base64/)
})

test('a file member with no code is refused, while an empty one is a blank file', () => {
  const tree = (member) => ({
    ...pack,
    fileTree: { members: [{ name: 'web', type: 'folder', members: [member] }] }
  })

  // a missing `code` is a tree this build does not understand: coerced to '' it
  // would publish a zero-byte asset and report success
  assert.throws(
    () => packFiles(tree({ name: 'empty.js', type: 'file' })),
    /empty\.js carries no code/
  )

  // what base64 calls an empty file is legitimate, and is an empty text entry
  const [file] = packFiles(tree({ name: 'empty.js', type: 'file', code: '' }))
  assert.equal(file.contents, '')
})

test('the index carries the registration a deploy would have written', () => {
  const entry = appEntry(pack, '2026-11-11T00:00:00.000Z')

  assert.deepEqual(entry, {
    id: MACRO_DASH_APP_ID,
    name: MACRO_DASH_NAME,
    appLoc: '/Public/app/macrodash',
    streamWebFolder: 'web',
    logo: 'macrodash.png',
    publishedAt: '2026-11-11T00:00:00.000Z'
  })
})

test('the snapshot keeps the files the site already shipped, and gains the app', () => {
  const snapshot = {
    format: 1,
    files: { '/sasjs/drive/files/Public/demo/orders.csv': 'order_id,customer\n1,Alice\n' }
  }

  const published = withPublishedApp(snapshot, pack, '2026-11-11T00:00:00.000Z')
  const index = JSON.parse(published.files['/sasjs/drive/files/.sasjs/apps.json'])

  assert.equal(published.format, 1)
  assert.equal(
    published.files['/sasjs/drive/files/Public/demo/orders.csv'],
    snapshot.files['/sasjs/drive/files/Public/demo/orders.csv']
  )
  assert.equal(
    published.files['/sasjs/drive/files/Public/app/macrodash/services/web/index.html'],
    '<!doctype html><title>Macro Dash</title>'
  )
  assert.equal(index.length, 1)
  assert.equal(index[0].id, MACRO_DASH_APP_ID)

  // the input is not mutated: the build writes one snapshot from one read
  assert.equal(
    snapshot.files['/sasjs/drive/files/Public/app/macrodash/services/web/index.html'],
    undefined
  )
})

test('publishing twice replaces the entry rather than listing the app twice', () => {
  const first = withPublishedApp({ format: 1, files: {} }, pack, '2026-11-11T00:00:00.000Z')
  const second = withPublishedApp(first, pack, '2026-11-12T00:00:00.000Z')
  const index = JSON.parse(second.files['/sasjs/drive/files/.sasjs/apps.json'])

  assert.equal(index.length, 1)
  assert.equal(index[0].publishedAt, '2026-11-12T00:00:00.000Z')
})

test('an unreadable index is replaced, not carried forward', () => {
  const published = withPublishedApp(
    {
      format: 1,
      files: { '/sasjs/drive/files/.sasjs/apps.json': '{not json' }
    },
    pack,
    '2026-11-11T00:00:00.000Z'
  )

  const index = JSON.parse(published.files['/sasjs/drive/files/.sasjs/apps.json'])
  assert.equal(index.length, 1)
})
