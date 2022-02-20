import { extractHeaders } from '..'

describe('extractHeaders', () => {
  it('should return valid http headers', () => {
    const headers = extractHeaders(`
      Content-type: application/csv
      Cache-Control: public, max-age=2000
      Content-type: application/text
      Cache-Control: public, max-age=1500
      Content-type: application/zip
      Cache-Control: public, max-age=1000
    `)

    expect(headers).toEqual({
      'content-type': 'application/zip',
      'cache-control': 'public, max-age=1000'
    })
  })

  it('should not return http headers if last occurrence is blank', () => {
    const headers = extractHeaders(`
      Content-type: application/csv
      Cache-Control: public, max-age=1000
      Content-type: application/text
      Content-type:    
    `)

    expect(headers).toEqual({ 'cache-control': 'public, max-age=1000' })
  })

  it('should return only valid http headers', () => {
    const headers = extractHeaders(`
      Content-type[]: application/csv
      Content//-type: application/text
      Content()-type: application/zip
    `)

    expect(headers).toEqual({})
  })

  it('should return http headers if empty', () => {
    const headers = extractHeaders('')

    expect(headers).toEqual({})
  })

  it('should return http headers if not provided', () => {
    const headers = extractHeaders()

    expect(headers).toEqual({})
  })
})
