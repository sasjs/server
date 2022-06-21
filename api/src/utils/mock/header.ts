import { Response } from 'express'
import { uuidv4 } from '@sasjs/utils'

export const setHeaders = (res: Response, isSuccess: boolean) => {
  res.setHeader(
    'cache-control',
    `no-cache, no-store, max-age=0, must-revalidate`
  )
  res.setHeader(
    'content-security-policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' *.sas.com blob: data:; style-src 'self' 'unsafe-inline'; child-src 'self' blob: data: mailto:;`
  )
  res.setHeader(
    'content-type',
    `application/vnd.sas.${isSuccess ? 'content.folder' : 'error'}+json${
      isSuccess ? '' : '; version=2;charset=UTF-8'
    }`
  )
  res.setHeader('pragma', `no-cache`)
  res.setHeader('server', `Apache/2.4`)
  res.setHeader('strict-transport-security', `max-age=31536000`)
  res.setHeader('Transfer-Encoding', `chunked`)
  res.setHeader('vary', `User-Agent`)
  res.setHeader('x-content-type-options', `nosniff`)
  res.setHeader('x-frame-options', `SAMEORIGIN`)
  res.setHeader('x-xss-protection', `1; mode=block`)

  if (isSuccess) {
    const uuid = uuidv4()

    res.setHeader('content-location', `/folders/folders/${uuid}`)
    res.setHeader('etag', `-2066812946`)
    res.setHeader('last-modified', `${new Date(Date.now()).toUTCString()}`)
    res.setHeader('location', `/folders/folders/${uuid}`)
  } else {
    res.setHeader('sas-service-response-flag', `true`)
  }
}
