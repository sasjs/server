export const parseErrorsAndWarnings = (log: string) => {
  const logLines = log.split('\n')
  const errorLines: string[] = []
  const warningLines: string[] = []

  logLines.forEach((line: string, index: number) => {
    // INFO: check if content in element starts with ERROR
    if (/<.*>ERROR/gm.test(line)) {
      const errorLine = line.substring(line.indexOf('E'), line.length - 1)
      errorLines.push(errorLine)
    }

    // INFO: check if line starts with ERROR
    else if (/^ERROR/gm.test(line)) {
      errorLines.push(line)

      logLines[index] =
        `<font id="error_${errorLines.length - 1}" style="color: red;">` +
        logLines[index] +
        '</font>'
    }

    // INFO: check if content in element starts with WARNING
    else if (/<.*>WARNING/gm.test(line)) {
      const warningLine = line.substring(line.indexOf('W'), line.length - 1)
      warningLines.push(warningLine)
    }

    // INFO: check if line starts with WARNING
    else if (/^WARNING/gm.test(line)) {
      warningLines.push(line)

      logLines[index] =
        `<font id="warning_${warningLines.length - 1}" style="color: green;">` +
        logLines[index] +
        '</font>'
    }
  })

  return { errors: errorLines, warnings: warningLines, logLines }
}
