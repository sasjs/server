import { SyntheticEvent } from 'react'
import { LogInstance } from './'

export const parseErrorsAndWarnings = (log: string) => {
  const logLines = log.split('\n')
  const errorLines: LogInstance[] = []
  const warningLines: LogInstance[] = []

  logLines.forEach((line: string, index: number) => {
    // INFO: check if content in element starts with ERROR
    if (/<.*>ERROR/gm.test(line)) {
      const errorLine = line.substring(line.indexOf('E'), line.length - 1)

      errorLines.push({
        body: errorLine,
        line: index,
        type: 'error',
        id: errorLines.length
      })
    }

    // INFO: check if line starts with ERROR
    else if (/^ERROR/gm.test(line)) {
      errorLines.push({
        body: line,
        line: index,
        type: 'error',
        id: errorLines.length
      })

      logLines[index] =
        `<font id="error_${
          errorLines.length - 1
        }" style="color: red;" ref={scrollTo}>` +
        logLines[index] +
        '</font>'
    }

    // INFO: check if content in element starts with WARNING
    else if (/<.*>WARNING/gm.test(line)) {
      const warningLine = line.substring(line.indexOf('W'), line.length - 1)

      warningLines.push({
        body: warningLine,
        line: index,
        type: 'warning',
        id: warningLines.length
      })
    }

    // INFO: check if line starts with WARNING
    else if (/^WARNING/gm.test(line)) {
      warningLines.push({
        body: line,
        line: index,
        type: 'warning',
        id: warningLines.length
      })

      logLines[index] =
        `<font id="warning_${warningLines.length - 1}" style="color: green;">` +
        logLines[index] +
        '</font>'
    }
  })

  return { errors: errorLines, warnings: warningLines, logLines }
}

export const defaultChunkSize = 20000

export const isTheLastChunk = (
  lineCount: number,
  chunkNumber: number,
  chunkSize = defaultChunkSize
) => {
  if (lineCount <= chunkSize) return true

  const chunksNumber = Math.ceil(lineCount / chunkSize)

  return chunkNumber === chunksNumber
}

export const splitIntoChunks = (log: string, chunkSize = defaultChunkSize) => {
  if (!log) return []

  const logLines: string[] = log.split(`\n`)

  if (logLines.length <= chunkSize) return [log]

  const chunks: string[] = []

  while (logLines.length) {
    const chunk = logLines.splice(0, chunkSize)

    chunks.push(chunk.join(`\n`))
  }

  return chunks
}

export const clearErrorsAndWarningsHtmlWrapping = (log: string) =>
  log.replace(/^<font[^>]*>/gm, '').replace(/<\/font>/gm, '')

export const download = (evt: SyntheticEvent, log: string, fileName = '') => {
  evt.stopPropagation()

  const padWithZero = (num: number) => (num < 9 ? `0${num}` : `${num}`)

  const date = new Date()
  const datePrefix = [
    date.getFullYear(),
    padWithZero(date.getMonth() + 1),
    padWithZero(date.getDate()),
    padWithZero(date.getHours()),
    padWithZero(date.getMinutes()),
    padWithZero(date.getSeconds())
  ].join('')

  const file = new Blob([log])
  const url = URL.createObjectURL(file)

  const a = document.createElement('a')
  a.href = url
  a.download = `${datePrefix}${fileName}.log`
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)
}
