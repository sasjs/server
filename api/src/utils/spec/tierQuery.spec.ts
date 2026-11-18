import { normalizeTierQuery } from '../tierQuery'

describe('web tier query normalization', () => {
  it('canonicalizes every key while preserving raw values and prototype-like keys', () => {
    const result = normalizeTierQuery(
      '/?x=a+b%26c&toString=v&__proto__=z&x=two%3D2&_fILe=one%2Btwo&blank&empty=&'
    )
    expect(result.search).toBe(
      '?x=a+b%26c&tostring=v&__proto__=z&x=two%3D2&_FILE=one%2Btwo&blank&empty=&'
    )
    expect(result.hasFile).toBe(true)
  })

  it('canonicalizes encoded keys but retains duplicate values for API validation', () => {
    const result = normalizeTierQuery(
      '/?_program=first&_FILE=one&_filePath=a&%5FPRoGrAm=last&%5Ffile=two&_FILEPATH=b'
    )
    expect(result).toEqual({
      search:
        '?_program=first&_FILE=one&_filePath=a&_program=last&_FILE=two&_filePath=b',
      hasFile: true,
      hasProgram: true
    })
  })

  it('keeps absence, empty values, and malformed unrelated escapes distinct', () => {
    expect(normalizeTierQuery('/').search).toBe('')
    expect(normalizeTierQuery('/?odd%ZZ=value&_file')).toEqual({
      search: '?odd%25zz=value&_FILE',
      hasFile: true,
      hasProgram: false
    })
  })
})
