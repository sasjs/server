const headerUtils = require('http-headers-validation')

export interface HTTPHeaders {
  [key: string]: string
}

export const extractHeaders = (content?: string): HTTPHeaders => {
  const headersObj: HTTPHeaders = {}
  const headersArr = content
    ?.split('\n')
    .map((line) => line.trim())
    .filter((line) => !!line)

  headersArr?.forEach((headerStr) => {
    const [key, value] = headerStr.split(':').map((data) => data.trim())

    if (value && headerUtils.validateHeader(key, value)) {
      headersObj[key.toLowerCase()] = value
    } else {
      delete headersObj[key.toLowerCase()]
    }
  })

  return headersObj
}
