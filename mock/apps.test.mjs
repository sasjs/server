/**
 * The packaged apps, tested without the network.
 *
 * Every failure this guards against is one that publishes quietly: an archive
 * read through the central directory's offsets (which yields garbage from a
 * working zip), a page written to the drive still base64-encoded (a blank app and
 * no error), a PNG written as text (a broken image), a data file left behind so a
 * program cannot read it, an index written twice (two tiles for one app), or a
 * snapshot that drops the files the site already shipped. None of those fail a
 * build; all of them fail the page, which is why the pieces are asserted here.
 */
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import test from 'node:test'

import {
  LATEST,
  MACRO_DASH,
  PUBLISHED_APPS,
  MINIMAL_SEED_APP,
  REACT_SEED_APP,
  ANGULAR_SEED_APP,
  appEntry,
  appVersion,
  packFiles,
  latestReleaseUrl,
  releaseUrl,
  resolveRelease,
  unzipEntry,
  withPublishedApp,
  withPublishedApps
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

  const localExtra = Buffer.from([
    0x55, 0x54, 0x05, 0x00, 0x01, 0x02, 0x03, 0x04
  ])
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
      // the deploy's manifest: carries no program, so it stays off the drive
      {
        name: 'sasjs.app.json',
        type: 'file',
        code: code('{"appLoc":"/Public/app/macrodash"}')
      },
      {
        // what `sasjs cb` puts beside services/ for a project with jobs
        name: 'jobs',
        type: 'folder',
        members: [
          { name: 'nightly', type: 'job', code: '%macro nightly;%mend;' },
          { name: 'scores', type: 'job', code: '%macro scores;%mend;' }
        ]
      },
      {
        // and the test tree: a test service, a test file, and a macro folder
        name: 'tests',
        type: 'folder',
        members: [
          {
            name: 'services',
            type: 'folder',
            members: [
              {
                name: 'rungetdata',
                type: 'service',
                code: '%macro rungetdata;%mend;'
              }
            ]
          },
          {
            name: 'jobs',
            type: 'folder',
            members: [
              {
                name: 'testscores',
                type: 'service',
                code: '%macro testscores;%mend;'
              }
            ]
          },
          { name: 'testSetup.sas', type: 'file', code: code('%let setup = 1;') }
        ]
      },
      {
        name: 'services',
        type: 'folder',
        members: [
          {
            name: 'common',
            type: 'folder',
            members: [
              // a service is SAS by type; the JS one beside it is a file, which
              // is what a browser host can run
              {
                name: 'configure',
                type: 'service',
                code: '%macro configure;%mend;'
              },
              {
                name: 'configure.js',
                type: 'file',
                code: code('const rootdir = "x"\n_webout = "{}"')
              }
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
                  {
                    name: 'game.js',
                    type: 'file',
                    code: code('console.log(1)')
                  }
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
    assert.equal(
      read.toString('utf8'),
      body.toString('utf8'),
      `method ${method}`
    )
  }
})

test('refuses an archive with no such member, and one that is not a zip', () => {
  assert.throws(
    () => unzipEntry(zipWith('other.json', Buffer.from('{}')), 'server.json'),
    /holds no server\.json/
  )
  assert.throws(
    () => unzipEntry(Buffer.from('not a zip at all'), 'server.json'),
    /not a zip/
  )
})

test('decodes the file tree, and writes the app under its appLoc', () => {
  const files = packFiles(pack, MACRO_DASH)
  const byPath = Object.fromEntries(
    files.map((file) => [file.path, file.contents])
  )

  // the app's assets, the JS program beside them that the host runs, and the SAS
  // the same service is deployed as - the half of a SASjs app a reader browsing the
  // demo came for
  assert.deepEqual(Object.keys(byPath).sort(), [
    '/Public/app/macrodash/jobs/nightly.sas',
    '/Public/app/macrodash/jobs/scores.sas',
    '/Public/app/macrodash/services/common/configure.js',
    '/Public/app/macrodash/services/common/configure.sas',
    '/Public/app/macrodash/services/web/index.html',
    '/Public/app/macrodash/services/web/js/game.js',
    '/Public/app/macrodash/services/web/macrodash.png',
    '/Public/app/macrodash/tests/jobs/testscores.sas',
    '/Public/app/macrodash/tests/services/rungetdata.sas',
    '/Public/app/macrodash/tests/testSetup.sas'
  ])

  // the jobs and the tests are programs, so they land as `.sas` like the services -
  // and are the reason an app with a scheduler is worth opening in Studio
  assert.equal(
    byPath['/Public/app/macrodash/jobs/nightly.sas'],
    '%macro nightly;%mend;'
  )
  assert.equal(
    byPath['/Public/app/macrodash/tests/jobs/testscores.sas'],
    '%macro testscores;%mend;'
  )
  assert.equal(
    byPath['/Public/app/macrodash/tests/testSetup.sas'],
    '%let setup = 1;'
  )

  // the manifest is not a program and is not published
  assert.equal(byPath['/Public/app/macrodash/sasjs.app.json'], undefined)

  // a service member's code is the compiled SAS as TEXT, not base64: it goes on
  // the drive as it stands, or the file a visitor opens is gibberish
  assert.equal(
    byPath['/Public/app/macrodash/services/common/configure.sas'],
    '%macro configure;%mend;'
  )

  assert.equal(
    byPath['/Public/app/macrodash/services/common/configure.js'],
    'const rootdir = "x"\n_webout = "{}"'
  )

  // base64 in, text on the drive - a page left encoded is a blank app
  assert.equal(
    byPath['/Public/app/macrodash/services/web/index.html'],
    '<!doctype html><title>Macro Dash</title>'
  )
  assert.equal(
    byPath['/Public/app/macrodash/services/web/js/game.js'],
    'console.log(1)'
  )

  // and the PNG is a byte entry, marked the way the runtime reads
  assert.equal(
    byPath['/Public/app/macrodash/services/web/macrodash.png'],
    '\u0000base64:iVBORw0KGgo='
  )
})

test('a service with no code is refused by name, like a file with none', () => {
  const nameless = {
    ...pack,
    fileTree: {
      name: 'files',
      members: [
        {
          name: 'services',
          type: 'folder',
          members: [
            { name: 'getdata', type: 'service' },
            {
              name: 'web',
              type: 'folder',
              members: [
                { name: 'index.html', type: 'file', code: code('<p>x</p>') }
              ]
            }
          ]
        }
      ]
    }
  }

  // an untitled program is not an empty one: publishing a zero-byte .sas is a
  // service nobody can explain, where the truth is a tree this build cannot read
  assert.throws(
    () => packFiles(nameless, MACRO_DASH),
    /getdata carries no code/
  )
})

test('a job with no code is refused too, not published blank', () => {
  const jobless = {
    ...pack,
    fileTree: {
      name: 'files',
      members: [
        {
          name: 'services',
          type: 'folder',
          members: [
            {
              name: 'web',
              type: 'folder',
              members: [
                { name: 'index.html', type: 'file', code: code('<p>x</p>') }
              ]
            }
          ]
        },
        {
          name: 'jobs',
          type: 'folder',
          members: [{ name: 'nightly', type: 'job' }]
        }
      ]
    }
  }

  assert.throws(() => packFiles(jobless, MACRO_DASH), /nightly carries no code/)
})

test('a pack laid out at the root publishes its jobs and tests once', () => {
  // the fallback layout: no `services/` folder, everything at the top - which the
  // walk takes for the services tree. The jobs and tests are then walked at the
  // root as well, and used to be written twice: under services/ AND where they
  // belong.
  const rootLayout = {
    appLoc: '/Public/app/rooty',
    streamWebFolder: 'web',
    streamServiceName: 'Rooty',
    fileTree: {
      name: 'files',
      members: [
        {
          name: 'web',
          type: 'folder',
          members: [
            { name: 'index.html', type: 'file', code: code('<p>x</p>') }
          ]
        },
        {
          name: 'jobs',
          type: 'folder',
          members: [
            { name: 'nightly', type: 'job', code: '%macro nightly;%mend;' }
          ]
        },
        {
          name: 'tests',
          type: 'folder',
          members: [
            {
              name: 'testSetup.sas',
              type: 'file',
              code: code('%let setup = 1;')
            }
          ]
        }
      ]
    }
  }

  const paths = packFiles(rootLayout, MACRO_DASH).map((file) => file.path)

  // the web folder keeps its `services/web` address even at the root - that is the
  // path the App Stream serves - and each job and test appears exactly once
  assert.deepEqual(paths.sort(), [
    '/Public/app/rooty/jobs/nightly.sas',
    '/Public/app/rooty/services/web/index.html',
    '/Public/app/rooty/tests/testSetup.sas'
  ])
})

test('a text file that begins with the marker is escaped, not misread as bytes', () => {
  const leading = {
    ...pack,
    fileTree: {
      members: [
        {
          name: 'web',
          type: 'folder',
          members: [
            { name: 'index.html', type: 'file', code: code('\u0000text:hello') }
          ]
        }
      ]
    }
  }

  const [file] = packFiles(leading, MACRO_DASH)
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
            {
              name: 'index.html',
              type: 'file',
              code: code('<p>v{{VERSION}}</p>')
            }
          ]
        }
      ]
    }
  }

  // a stated tag, because the descriptor itself says `latest` - filling the
  // placeholder from an unresolved descriptor is the state the resolution step
  // exists to prevent, and asserting `vlatest` would pass for exactly that
  const [file] = packFiles(placeholder, { ...MACRO_DASH, release: 'v2.0.0' })

  assert.equal(file.contents, '<p>v2.0.0</p>')
})

test('a package with no streamed web folder is refused by name', () => {
  assert.throws(
    () => packFiles({ ...pack, streamWebFolder: 'dist' }, MACRO_DASH),
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
            {
              name: 'index.html',
              type: 'file',
              code: '<!doctype html><title>x</title>'
            }
          ]
        }
      ]
    }
  }

  assert.throws(
    () => packFiles(raw, MACRO_DASH),
    /index\.html does not carry base64/
  )
})

test('a file member with no code is refused, while an empty one is a blank file', () => {
  const tree = (member) => ({
    ...pack,
    fileTree: { members: [{ name: 'web', type: 'folder', members: [member] }] }
  })

  // a missing `code` is a tree this build does not understand: coerced to '' it
  // would publish a zero-byte asset and report success
  assert.throws(
    () => packFiles(tree({ name: 'empty.js', type: 'file' }), MACRO_DASH),
    /empty\.js carries no code/
  )

  // what base64 calls an empty file is legitimate, and is an empty text entry
  const [file] = packFiles(
    tree({ name: 'empty.js', type: 'file', code: '' }),
    MACRO_DASH
  )
  assert.equal(file.contents, '')
})

test('the index carries the registration a deploy would have written', () => {
  const entry = appEntry(pack, MACRO_DASH, '2026-11-11T00:00:00.000Z')

  assert.deepEqual(entry, {
    id: MACRO_DASH.id,
    name: MACRO_DASH.name,
    appLoc: '/Public/app/macrodash',
    streamWebFolder: 'web',
    logo: 'macrodash.png',
    publishedAt: '2026-11-11T00:00:00.000Z'
  })
})

test('the snapshot keeps the files the site already shipped, and gains the app', () => {
  const snapshot = {
    format: 1,
    files: {
      '/sasjs/drive/files/Public/demo/orders.csv':
        'order_id,customer\n1,Alice\n'
    }
  }

  const published = withPublishedApp(
    snapshot,
    pack,
    MACRO_DASH,
    '2026-11-11T00:00:00.000Z'
  )
  const index = JSON.parse(
    published.files['/sasjs/drive/files/.sasjs/apps.json']
  )

  assert.equal(published.format, 1)
  assert.equal(
    published.files['/sasjs/drive/files/Public/demo/orders.csv'],
    snapshot.files['/sasjs/drive/files/Public/demo/orders.csv']
  )
  assert.equal(
    published.files[
      '/sasjs/drive/files/Public/app/macrodash/services/web/index.html'
    ],
    '<!doctype html><title>Macro Dash</title>'
  )
  assert.equal(index.length, 1)
  assert.equal(index[0].id, MACRO_DASH.id)

  // the input is not mutated: the build writes one snapshot from one read
  assert.equal(
    snapshot.files[
      '/sasjs/drive/files/Public/app/macrodash/services/web/index.html'
    ],
    undefined
  )
})

test('publishing twice replaces the entry rather than listing the app twice', () => {
  const first = withPublishedApp(
    { format: 1, files: {} },
    pack,
    MACRO_DASH,
    '2026-11-11T00:00:00.000Z'
  )
  const second = withPublishedApp(
    first,
    pack,
    MACRO_DASH,
    '2026-11-12T00:00:00.000Z'
  )
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
    MACRO_DASH,
    '2026-11-11T00:00:00.000Z'
  )

  const index = JSON.parse(
    published.files['/sasjs/drive/files/.sasjs/apps.json']
  )
  assert.equal(index.length, 1)
})

/**
 * The minimal seed app's shape: a JS program that reads a data file from beside
 * itself, and a SAS service of the same name that this host cannot run.
 *
 * `getdata.js` resolves `<drive>/<appLoc>/services/common/springs.json` with
 * `fs`, so a build that carried only `.js` files would publish an app whose data
 * call throws - an empty table on a page that otherwise loaded.
 */
const seedPack = {
  appLoc: '/Public/app/minimal-seed-app',
  streamWebFolder: 'web',
  streamServiceName: 'minimal-seed-app',
  streamLogo: 'favicon.ico',
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
              // the SAS service, which this host has no engine for
              {
                name: 'getdata',
                type: 'service',
                code: '%macro getdata;%mend;'
              },
              {
                name: 'getdata.js',
                type: 'file',
                code: code('webout("OPEN")')
              },
              // and the dataset the JS program reads by path
              {
                name: 'springs.json',
                type: 'file',
                code: code('[{"AREA":"x"}]')
              }
            ]
          },
          {
            name: 'web',
            type: 'folder',
            members: [
              {
                name: 'index.html',
                type: 'file',
                code: code('<!doctype html><title>Seed</title>')
              }
            ]
          }
        ]
      }
    ]
  }
}

test('a data file beside a program travels with it, so the program can read it', () => {
  const byPath = Object.fromEntries(
    packFiles(seedPack, MINIMAL_SEED_APP).map((file) => [
      file.path,
      file.contents
    ])
  )

  // the program, the data it reads, and the SAS the same service deploys as
  assert.deepEqual(Object.keys(byPath).sort(), [
    '/Public/app/minimal-seed-app/services/common/getdata.js',
    '/Public/app/minimal-seed-app/services/common/getdata.sas',
    '/Public/app/minimal-seed-app/services/common/springs.json',
    '/Public/app/minimal-seed-app/services/web/index.html'
  ])

  assert.equal(
    byPath['/Public/app/minimal-seed-app/services/common/springs.json'],
    '[{"AREA":"x"}]'
  )
})

/**
 * The React seed app's shape: a JavaScript twin of each of its three services -
 * two under `services/common` and `upload` under `services/files` - the dataset
 * the twins read, and the built frontend: one bundle, since its webpack config
 * emits a single `index.bundle.js` rather than the seed app's handful of files.
 *
 * The SAS service of the same name travels as a `service` member, which this host
 * cannot run: `RUN_TIMES` here is JavaScript, so the `.js` twin is what answers.
 */
const reactPack = {
  appLoc: '/Public/app/react-seed-app',
  streamWebFolder: 'web',
  streamServiceName: 'React',
  streamLogo: 'logo512.png',
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
              {
                name: 'appinit',
                type: 'service',
                code: '%macro appinit;%mend;'
              },
              {
                name: 'appinit.js',
                type: 'file',
                code: code('webout("OPEN")')
              },
              {
                name: 'getdata',
                type: 'service',
                code: '%macro getdata;%mend;'
              },
              {
                name: 'getdata.js',
                type: 'file',
                code: code('webout("OPEN")')
              },
              {
                name: 'springs.json',
                type: 'file',
                code: code('[{"AREA":"Adak"}]')
              }
            ]
          },
          {
            // the release's twins are not all in one folder: upload lives under
            // services/files, so the walk has to reach a second level
            name: 'files',
            type: 'folder',
            members: [
              { name: 'upload', type: 'service', code: '%macro upload;%mend;' },
              { name: 'upload.js', type: 'file', code: code('webout("OPEN")') }
            ]
          },
          {
            name: 'web',
            type: 'folder',
            members: [
              {
                name: 'index.html',
                type: 'file',
                code: code('<!doctype html><title>React Seed</title>')
              },
              {
                name: 'index.bundle.js',
                type: 'file',
                code: code('console.log("bundle")')
              }
            ]
          }
        ]
      }
    ]
  }
}

test('the React seed app publishes its JS services, dataset and bundle', () => {
  const byPath = Object.fromEntries(
    packFiles(reactPack, REACT_SEED_APP).map((file) => [
      file.path,
      file.contents
    ])
  )

  // every service twice: the `.js` twin the browser host runs, and the `.sas` the
  // service is deployed as - one under `services/files`, so the walk is checked at
  // two levels for both kinds
  assert.deepEqual(Object.keys(byPath).sort(), [
    '/Public/app/react-seed-app/services/common/appinit.js',
    '/Public/app/react-seed-app/services/common/appinit.sas',
    '/Public/app/react-seed-app/services/common/getdata.js',
    '/Public/app/react-seed-app/services/common/getdata.sas',
    '/Public/app/react-seed-app/services/common/springs.json',
    '/Public/app/react-seed-app/services/files/upload.js',
    '/Public/app/react-seed-app/services/files/upload.sas',
    '/Public/app/react-seed-app/services/web/index.bundle.js',
    '/Public/app/react-seed-app/services/web/index.html'
  ])

  assert.equal(
    byPath['/Public/app/react-seed-app/services/common/springs.json'],
    '[{"AREA":"Adak"}]'
  )
})

/**
 * The Angular seed app's shape: the same three JavaScript twins and the dataset
 * they read, with the frontend its own build emits - a handful of hashed files
 * under `web/` rather than one bundle.
 *
 * As with the React app, the SAS service of each name travels as a `service`
 * member, and this host runs the `.js` twin instead.
 */
const angularPack = {
  appLoc: '/Public/app/angular-seed-app',
  streamWebFolder: 'web',
  streamServiceName: 'Angular',
  streamLogo: 'assets/angular-logo.png',
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
              {
                name: 'appinit',
                type: 'service',
                code: '%macro appinit;%mend;'
              },
              {
                name: 'appinit.js',
                type: 'file',
                code: code('webout("OPEN")')
              },
              {
                name: 'getdata',
                type: 'service',
                code: '%macro getdata;%mend;'
              },
              {
                name: 'getdata.js',
                type: 'file',
                code: code('webout("OPEN")')
              },
              {
                name: 'springs.json',
                type: 'file',
                code: code('[{"AREA":"Adak"}]')
              }
            ]
          },
          {
            name: 'files',
            type: 'folder',
            members: [
              { name: 'upload', type: 'service', code: '%macro upload;%mend;' },
              { name: 'upload.js', type: 'file', code: code('webout("OPEN")') }
            ]
          },
          {
            name: 'web',
            type: 'folder',
            members: [
              {
                name: 'index.html',
                type: 'file',
                code: code('<!doctype html><title>Angular Seed</title>')
              },
              {
                name: 'main-K4JT6XUZ.js',
                type: 'file',
                code: code('console.log("main")')
              }
            ]
          }
        ]
      }
    ]
  }
}

test('the Angular seed app publishes its JS services and bundle', () => {
  const byPath = Object.fromEntries(
    packFiles(angularPack, ANGULAR_SEED_APP).map((file) => [
      file.path,
      file.contents
    ])
  )

  assert.deepEqual(Object.keys(byPath).sort(), [
    '/Public/app/angular-seed-app/services/common/appinit.js',
    '/Public/app/angular-seed-app/services/common/appinit.sas',
    '/Public/app/angular-seed-app/services/common/getdata.js',
    '/Public/app/angular-seed-app/services/common/getdata.sas',
    '/Public/app/angular-seed-app/services/common/springs.json',
    '/Public/app/angular-seed-app/services/files/upload.js',
    '/Public/app/angular-seed-app/services/files/upload.sas',
    '/Public/app/angular-seed-app/services/web/index.html',
    '/Public/app/angular-seed-app/services/web/main-K4JT6XUZ.js'
  ])

  assert.equal(
    byPath['/Public/app/angular-seed-app/services/common/springs.json'],
    '[{"AREA":"Adak"}]'
  )
})

test("every app follows its repository's newest release, unless it pins one", async () => {
  const asked = []
  const getJson = async (url) => {
    asked.push(url)
    return { tag_name: 'v9.9.9' }
  }

  // all four descriptors say `latest`, so all four are resolved
  assert.deepEqual(
    PUBLISHED_APPS.map((app) => app.release),
    [LATEST, LATEST, LATEST, LATEST]
  )

  const resolved = await Promise.all(
    PUBLISHED_APPS.map(async (app) => await resolveRelease(app, getJson))
  )

  assert.deepEqual(
    asked.sort(),
    [
      latestReleaseUrl(MACRO_DASH),
      latestReleaseUrl(MINIMAL_SEED_APP),
      latestReleaseUrl(REACT_SEED_APP),
      latestReleaseUrl(ANGULAR_SEED_APP)
    ].sort()
  )

  resolved.forEach((app) => {
    assert.equal(app.release, 'v9.9.9')
    assert.equal(app.resolved, true)
  })

  // a stated tag is a pin: nothing is asked about it, and the URL keeps the tag
  const pinned = await resolveRelease(
    { ...MINIMAL_SEED_APP, release: 'v1.6.1' },
    getJson
  )
  assert.equal(pinned.release, 'v1.6.1')
  assert.equal(
    releaseUrl(pinned),
    'https://github.com/sasjs/minimal-seed-app/releases/download/v1.6.1/server.json.zip'
  )

  // and the resolved tag is what the asset URL and the version placeholder use
  assert.equal(
    releaseUrl({ ...MACRO_DASH, release: 'v2.0.0' }),
    'https://github.com/sasjs/macro-dash/releases/download/v2.0.0/macro-dash-server.json.zip'
  )
  assert.equal(appVersion({ ...MACRO_DASH, release: 'v2.0.0' }), '2.0.0')
})

test('an unreadable latest falls back to the last known tag, and says so', async () => {
  const warnings = []
  const { warn } = console
  console.warn = (message) => warnings.push(message)

  try {
    const onApiError = await resolveRelease(MINIMAL_SEED_APP, async () => {
      throw new Error('403 rate limit exceeded')
    })
    const onNoTag = await resolveRelease(MINIMAL_SEED_APP, async () => ({}))

    assert.equal(onApiError.release, MINIMAL_SEED_APP.fallback)
    assert.equal(onNoTag.release, MINIMAL_SEED_APP.fallback)
    // `resolved: false` is what makes the build say it fell back rather than
    // publish an old release as if it were the newest
    assert.equal(onApiError.resolved, false)
    assert.equal(warnings.length, 2)
    assert.match(warnings[0], /building minimal-seed-app from v1\.6\.1 instead/)
  } finally {
    console.warn = warn
  }

  // a descriptor with no fallback and no readable release fails by name
  await assert.rejects(
    () =>
      resolveRelease(
        { ...MINIMAL_SEED_APP, fallback: undefined },
        async () => ({})
      ),
    /Could not read the newest release of sasjs\/minimal-seed-app/
  )
})

test('every app is published into one index, and each keeps its own files', () => {
  const published = withPublishedApps(
    { format: 1, files: {} },
    [
      { app: MACRO_DASH, pack },
      { app: MINIMAL_SEED_APP, pack: seedPack },
      { app: REACT_SEED_APP, pack: reactPack },
      { app: ANGULAR_SEED_APP, pack: angularPack }
    ],
    '2026-11-11T00:00:00.000Z'
  )

  const index = JSON.parse(
    published.files['/sasjs/drive/files/.sasjs/apps.json']
  )

  assert.deepEqual(
    index.map((entry) => [entry.name, entry.appLoc]),
    [
      ['macro-dash', '/Public/app/macrodash'],
      ['minimal-seed-app', '/Public/app/minimal-seed-app'],
      ['react-seed-app', '/Public/app/react-seed-app'],
      ['angular-seed-app', '/Public/app/angular-seed-app']
    ]
  )

  // each app's files are on the drive, and none overwrote another
  assert.equal(
    published.files[
      '/sasjs/drive/files/Public/app/macrodash/services/web/index.html'
    ],
    '<!doctype html><title>Macro Dash</title>'
  )
  assert.equal(
    published.files[
      '/sasjs/drive/files/Public/app/minimal-seed-app/services/common/springs.json'
    ],
    '[{"AREA":"x"}]'
  )
  assert.equal(
    published.files[
      '/sasjs/drive/files/Public/app/react-seed-app/services/web/index.bundle.js'
    ],
    'console.log("bundle")'
  )
})
