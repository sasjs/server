import {
  API_PREFIX,
  API_ALIAS,
  APP_STREAM_PREFIX,
  APP_STREAM_ALIAS,
  API_PREFIXES,
  APP_STREAM_PREFIXES,
  canonicalPrefix
} from '../routePrefixes'

describe('canonicalPrefix', () => {
  it('maps the short API prefix to the canonical spelling', () => {
    expect(canonicalPrefix(API_ALIAS)).toEqual(API_PREFIX)
  })

  it('maps the short App Stream prefix to the canonical spelling', () => {
    expect(canonicalPrefix(APP_STREAM_ALIAS)).toEqual(APP_STREAM_PREFIX)
  })

  it('canonicalises the first segment of a deeper path', () => {
    // The shape the permission gate sees: Express sub-mounts the API routers,
    // so `baseUrl` has already grown a segment by the time the gate runs.
    expect(canonicalPrefix('/api/code')).toEqual('/SASjsApi/code')
    expect(canonicalPrefix('/api/code/execute')).toEqual(
      '/SASjsApi/code/execute'
    )
    expect(canonicalPrefix('/api/drive/deploy/upload')).toEqual(
      '/SASjsApi/drive/deploy/upload'
    )
    expect(canonicalPrefix('/app/Mario/')).toEqual('/AppStream/Mario/')
  })

  it('is insensitive to case', () => {
    expect(canonicalPrefix('/API')).toEqual(API_PREFIX)
    expect(canonicalPrefix('/API/code/execute')).toEqual(
      '/SASjsApi/code/execute'
    )
    expect(canonicalPrefix('/APP/Mario')).toEqual('/AppStream/Mario')
  })

  it('keeps the rest of the path exactly as it was sent', () => {
    expect(canonicalPrefix('/api/drive/fileTree?_path=/a')).toEqual(
      '/SASjsApi/drive/fileTree?_path=/a'
    )
  })

  it('leaves the canonical spellings alone', () => {
    expect(canonicalPrefix(API_PREFIX)).toEqual(API_PREFIX)
    expect(canonicalPrefix('/SASjsApi/code/execute')).toEqual(
      '/SASjsApi/code/execute'
    )
    expect(canonicalPrefix(APP_STREAM_PREFIX)).toEqual(APP_STREAM_PREFIX)
  })

  it('does not treat a longer word as the alias', () => {
    // `/apps` is the interface's own screen, not an app called "s" under
    // `/app`. A prefix match on the string rather than on the segment would
    // send it to `/AppStream/s` - and, at the gate, to a grant that is not its
    // own.
    expect(canonicalPrefix('/apps')).toEqual('/apps')
    expect(canonicalPrefix('/apples')).toEqual('/apples')
    expect(canonicalPrefix('/apix')).toEqual('/apix')
  })

  it('leaves anything else alone', () => {
    expect(canonicalPrefix('/SASLogon')).toEqual('/SASLogon')
    expect(canonicalPrefix('')).toEqual('')
  })
})

describe('mounted prefixes', () => {
  it('mounts each router at the canonical spelling and the short one', () => {
    expect(API_PREFIXES).toEqual([API_PREFIX, API_ALIAS])
    expect(APP_STREAM_PREFIXES).toEqual([APP_STREAM_PREFIX, APP_STREAM_ALIAS])
  })
})
