// Chrome announces its ephemeral DevTools port on stderr, including when the
// browser and its parent do not share the same view of the profile directory.
export function waitForDevTools(child, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let output = ''
    let settled = false
    const finish = (error, port) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      error ? reject(error) : resolve(port)
    }
    const diagnostic = () => output.trim() || '(no browser diagnostics)'
    const timer = setTimeout(
      () => finish(new Error(`Chromium startup timed out:\n${diagnostic()}`)),
      timeout
    )
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      output = (output + chunk).slice(-65536)
      const match = output.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)
      if (match) finish(null, Number(match[1]))
    })
    child.once('error', (error) => finish(error))
    child.once('close', (code, signal) =>
      finish(new Error(`Chromium exited (${signal || code}):\n${diagnostic()}`))
    )
  })
}
