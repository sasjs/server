/**
 * The name an app is published under when the caller does not choose one.
 *
 * The old default was `AppStreamName${count + 1}`, derived from how many apps
 * were published - so unpublishing anything made the next default collide with
 * an existing entry and overwrite it, which re-points a name at a different app
 * without a new grant or an audit trail. The name is now a function of the app's
 * folder, which is what makes it stable across deploys.
 */
import { deriveStreamServiceName } from '../index'

type Published = Record<string, { appLoc: string }>

const none: Published = {}

describe('deriving an app stream name', () => {
  it('uses the last segment of the app folder', () => {
    expect(deriveStreamServiceName('/Public/apps/dashdemo', none)).toEqual(
      'dashdemo'
    )
    expect(deriveStreamServiceName('/Public/My App', none)).toEqual('My-App')
  })

  it('ignores trailing and repeated separators', () => {
    expect(deriveStreamServiceName('/Public/apps/demo/', none)).toEqual('demo')
    expect(deriveStreamServiceName('//Public//demo', none)).toEqual('demo')
  })

  it('reduces a segment that cannot be a URL path', () => {
    expect(deriveStreamServiceName('/Public/report?x=1#top', none)).toEqual(
      'report-x-1-top'
    )
    expect(deriveStreamServiceName('/Public/..', none)).toEqual('app')
    expect(deriveStreamServiceName('/', none)).toEqual('app')
  })

  it('returns the readable name for the app that already holds it', () => {
    const published: Published = {
      demo: { appLoc: '/Public/apps/demo' }
    }

    // republishing the same folder keeps the same name
    expect(deriveStreamServiceName('/Public/apps/demo', published)).toEqual(
      'demo'
    )
  })

  it('separates two folders whose last segment is the same', () => {
    const published: Published = {
      demo: { appLoc: '/Public/one/demo' }
    }

    const derived = deriveStreamServiceName('/Public/two/demo', published)

    // a readable name plus a digest of the folder, and never the held name
    expect(derived).not.toEqual('demo')
    expect(derived).toMatch(/^demo-[0-9a-f]{6}$/)
  })

  it('derives the same name on every call for the same folder', () => {
    const published: Published = {
      demo: { appLoc: '/Public/one/demo' }
    }

    const first = deriveStreamServiceName('/Public/two/demo', published)

    published[first] = { appLoc: '/Public/two/demo' }

    expect(deriveStreamServiceName('/Public/two/demo', published)).toEqual(
      first
    )
  })

  it('lengthens the digest when even the suffixed name is held', () => {
    const published: Published = {
      demo: { appLoc: '/Public/one/demo' }
    }

    const six = deriveStreamServiceName('/Public/two/demo', published)
    published[six] = { appLoc: '/Public/three/demo' }

    const longer = deriveStreamServiceName('/Public/two/demo', published)

    expect(longer).toMatch(/^demo-[0-9a-f]{8}$/)
  })
})
