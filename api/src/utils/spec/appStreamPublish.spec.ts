import path from 'path'
import { deleteFolder } from '@sasjs/utils'

import * as fileUtilModules from '../file'
import { prepareDeploy, publishDeployedApp } from '../appStreamPublish'
import {
  appStreamIds,
  readStoredAppStreamEntries,
  refreshAppStreamIndex
} from '../appStreamConfig'
import type { PublishedApp } from '../appStreamPublish'

const tmpFolder = path.join(
  process.cwd(),
  `tmp-appstream-publish-${process.pid}`
)

jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))

/** A bundle: the manifest at the root, and the web assets under services/. */
const bundle = (manifest: unknown, webFolder = 'web') => ({
  members: [
    {
      name: 'sasjs.app.json',
      type: 'file' as const,
      code: typeof manifest === 'string' ? manifest : JSON.stringify(manifest)
    },
    {
      name: 'services',
      type: 'folder' as const,
      members: [
        {
          name: webFolder,
          type: 'folder' as const,
          members: [
            { name: 'index.html', type: 'file' as const, code: '<h1/>' }
          ]
        }
      ]
    }
  ]
})

describe('what a deploy publishes', () => {
  beforeAll(() => {
    ;(process as any).logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  })

  beforeEach(async () => {
    await deleteFolder(tmpFolder)
    await refreshAppStreamIndex()
  })

  afterAll(async () => {
    await deleteFolder(tmpFolder)
  })

  it('reads the app out of the manifest, and keeps the manifest out of the tree', () => {
    const { tree, request } = prepareDeploy({
      appLoc: '/Public/apps/mario',
      fileTree: bundle({ name: 'Mario', streamWebFolder: 'web' })
    })

    expect(request).toMatchObject({
      appLoc: '/Public/apps/mario',
      streamWebFolder: 'web',
      name: 'Mario'
    })

    // the manifest describes the deploy; writing it into the deployment would
    // publish a file nothing serves
    expect((tree as any).members.map((member: any) => member.name)).toEqual([
      'services'
    ])
  })

  it('lets the request correct the archive where both speak', () => {
    const { request } = prepareDeploy({
      appLoc: '/Public/apps/mario',
      fileTree: bundle({ name: 'Mario', streamWebFolder: 'web' }),
      streamServiceName: 'Corrected',
      streamWebFolder: 'web'
    })

    expect(request?.name).toBe('Corrected')
  })

  it('publishes nothing when neither the request nor the bundle says how', () => {
    const { request } = prepareDeploy({
      appLoc: '/Public/apps/mario',
      fileTree: { members: [{ name: 'run', type: 'service', code: '' }] }
    })

    expect(request).toBeUndefined()
  })

  it('refuses a tree with no folder to serve before anything is written', () => {
    const input = {
      appLoc: '/Public/apps/mario',
      fileTree: {
        members: [
          {
            name: 'services',
            type: 'folder',
            members: [{ name: 'run', type: 'service', code: '' }]
          }
        ]
      },
      streamWebFolder: 'web'
    }

    expect(() => prepareDeploy(input)).toThrow(/has no "services\/web" folder/)

    // the advice names where the folder came from: this caller stated it, so
    // dropping the field is a fix they can make
    expect(() => prepareDeploy(input)).toThrow(/omit streamWebFolder\./)
  })

  it('tells a bundle to fix the folder its manifest names', () => {
    // the manifest stated the folder, so "omit streamWebFolder" is not advice the
    // caller can take - the manifest cannot leave the field out
    expect(() =>
      prepareDeploy({
        appLoc: '/Public/apps/mario',
        fileTree: bundle({ name: 'Mario', streamWebFolder: 'web' }, 'assets')
      })
    ).toThrow(/correct the folder sasjs\.app\.json names\./)
  })

  it('refuses a folder the index could not accept', () => {
    // the drive root is not an app: a deploy there writes `//index.html`
    expect(() =>
      prepareDeploy({
        appLoc: '/',
        fileTree: bundle({ streamWebFolder: 'web' })
      })
    ).toThrow(/drive root/)

    // a web folder is one segment, or it climbs out of the app
    expect(() =>
      prepareDeploy({
        appLoc: '/Public/apps/mario',
        fileTree: bundle({ streamWebFolder: '../etc' })
      })
    ).toThrow(/single path segment/)
  })

  it('refuses a manifest that is not JSON, naming what was wrong', () => {
    expect(() =>
      prepareDeploy({
        appLoc: '/Public/apps/mario',
        fileTree: bundle('{not json')
      })
    ).toThrow(/sasjs\.app\.json/)
  })

  it('indexes the app after the deploy, minting an id once', async () => {
    const { request } = prepareDeploy({
      appLoc: '/Public/apps/mario',
      fileTree: bundle({ name: 'Mario', streamWebFolder: 'web' })
    })

    const answer: { app?: PublishedApp } & Record<string, unknown> = {}
    await publishDeployedApp(answer, request)

    const app = answer.app as { id: string; name: string; url: string }

    expect(app.name).toBe('Mario')
    expect(app.url).toBe(`/app/${app.id}/`)
    // the gate's inventory is refreshed in the same breath, or a grant on the
    // new app's route would not work until the server restarted
    expect(appStreamIds()).toContain(app.id)

    const second: { app?: PublishedApp } & Record<string, unknown> = {}
    await publishDeployedApp(second, request)

    // same folder, same app: the URL survives a redeploy
    expect((second.app as { id: string }).id).toBe(app.id)
    expect(await readStoredAppStreamEntries()).toHaveLength(1)
  })

  it('indexes nothing when the deploy published nothing', async () => {
    const answer: { app?: PublishedApp } & Record<string, unknown> = {}

    await publishDeployedApp(answer, undefined)

    expect(answer.app).toBeUndefined()
    expect(await readStoredAppStreamEntries()).toEqual([])
  })
})
