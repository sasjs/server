/**
 * The source of the `webout()` helper, written into each JS session folder as
 * `sasjs-webout.js` and required by the generated program.
 *
 * It mirrors the `%ms_webout()` macro in @sasjs/core, so a JS stored program is
 * laid out the way a SAS one is:
 *
 *     webout('OPEN')
 *     webout('ARR', 'mytable', rowsOfArrays)
 *     webout('OBJ', 'mytable', rowsOfObjects)
 *     webout('CLOSE')
 *
 * `OPEN` truncates the webout file, starts one JSON object and appends
 * `content-type: application/json` to the session header file. `ARR` and `OBJ`
 * append one named member each - an array of rows, positional for `ARR` and
 * keyed by column name for `OBJ`, which is how `%mp_jsonout()` shapes them.
 * `CLOSE` appends the system block and closes the object.
 *
 * The source is a plain string rather than a copied asset so it travels inside
 * the compiled build and the packaged executables with no extra build wiring.
 */
export const weboutHelperFileName = 'sasjs-webout.js'

export const weboutHelperSource = `/**
 * webout() - send data back from a JS stored program, the way %ms_webout() does
 * from a SAS one.
 *
 * Written into this session folder by SASjs Server; require it, do not edit it.
 */
const fs = require('fs')
const os = require('os')

const monthNames = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
]

const pad = (value) => String(value).padStart(2, '0')

/* SAS DATE9, eg 02NOV2026 */
const sasDate = (date) =>
  pad(date.getDate()) + monthNames[date.getMonth()] + date.getFullYear()

/* SAS TIME8, eg 11:45:32 */
const sasTime = (date) =>
  pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())

/* SAS SIZEKMG, eg 15.6G. The value is the memory this host has, because a JS
 * program has no MEMSIZE option to report. */
const sasMemsize = () => {
  const bytes = os.totalmem()
  const gigabytes = bytes / (1024 * 1024 * 1024)

  return gigabytes >= 1
    ? gigabytes.toFixed(1) + 'G'
    : Math.round(bytes / (1024 * 1024)) + 'M'
}

module.exports = function (config) {
  let opened = false
  let closed = false
  let streamed = false

  const append = (text) =>
    fs.appendFileSync(config.weboutPath, text, 'utf-8')

  /* Every member after SYSTIME carries its own leading comma, so a caller
   * never has to track commas between tables. A value that is undefined
   * stringifies to the text 'undefined', which would make the whole envelope
   * unparseable, so it is written as null instead. */
  const member = (name, value) =>
    append(
      ',' +
        JSON.stringify(String(name)) +
        ':' +
        JSON.stringify(value === undefined ? null : value)
    )

  const open = () => {
    if (closed)
      throw new Error(
        "webout('OPEN') cannot follow webout('CLOSE') - the body is already complete"
      )

    if (opened)
      throw new Error(
        "webout('OPEN') has already been called - call webout('CLOSE') first"
      )

    const now = new Date()

    fs.writeFileSync(
      config.weboutPath,
      '{"SYSDATE":"' + sasDate(now) + '","SYSTIME":"' + sasTime(now) + '"',
      'utf-8'
    )
    /* The header file is seeded with a text/html line that carries no trailing
     * newline, so the leading newline keeps this entry on its own line. */
    fs.appendFileSync(
      config.headersPath,
      '\\ncontent-type: application/json\\n',
      'utf-8'
    )

    opened = true
    streamed = true
  }

  const table = (action, name, rows) => {
    if (!opened)
      throw new Error(
        "webout('" + action + "') requires webout('OPEN') first"
      )

    if (!name)
      throw new Error(
        "webout('" +
          action +
          "') needs a member name, eg webout('OBJ', 'mytable', rows)"
      )

    if (!Array.isArray(rows))
      throw new Error(
        "webout('" +
          action +
          "') needs an array of rows, got " +
          (rows === null ? 'null' : typeof rows)
      )

    if (action === 'ARR' && rows.some((row) => !Array.isArray(row)))
      throw new Error(
        "webout('ARR') takes positional rows - one array per row, like the SAS " +
          "array format. Use webout('OBJ') for rows keyed by column name."
      )

    if (
      action === 'OBJ' &&
      rows.some(
        (row) => row === null || typeof row !== 'object' || Array.isArray(row)
      )
    )
      throw new Error(
        "webout('OBJ') takes rows keyed by column name - one object per row, " +
          "like the SAS object format. Use webout('ARR') for positional rows."
      )

    member(name, rows)
  }

  const close = () => {
    /* Test the closed state first: after a successful CLOSE, 'opened' is false,
     * so checking 'opened' first reports a duplicate CLOSE as a missing OPEN. */
    if (closed) throw new Error("webout('CLOSE') has already been called")

    if (!opened)
      throw new Error("webout('CLOSE') requires webout('OPEN') first")

    member('_DEBUG', config.debug)
    member('_PROGRAM', config.program)
    member('AUTOEXEC', '')
    member('MF_GETUSER', config.username)
    member('SYSCC', 0)
    member('SYSENCODING', 'utf-8')
    member('SYSERRORTEXT', '')
    member('SYSHOSTINFOLONG', os.type() + ' ' + os.release() + ' ' + os.arch())
    member('SYSHOSTNAME', os.hostname())
    member('SYSPROCESSID', String(process.pid))
    member('SYSPROCESSMODE', 'Stored Program')
    member('SYSPROCESSNAME', 'NodeJS')
    member('SYSJOBID', String(process.pid))
    member('SYSSCPL', process.platform)
    member('SYSSITE', '')
    member('SYSTCPIPHOSTNAME', config.apiServerUrl)
    member('SYSUSERID', config.userId)
    member('SYSVLONG', process.version)
    member('SYSWARNINGTEXT', '')
    member('END_DTTM', new Date().toISOString())
    member('MEMSIZE', sasMemsize())

    append('}')

    opened = false
    closed = true
  }

  const webout = (action, name, rows) => {
    const requested = String(action === undefined || action === null ? '' : action)
      .toUpperCase()

    if (requested === 'OPEN') return open()
    if (requested === 'ARR' || requested === 'OBJ') return table(requested, name, rows)
    if (requested === 'CLOSE') return close()

    throw new Error(
      "webout: unknown action '" + action + "' - use OPEN, ARR, OBJ or CLOSE"
    )
  }

  /* Writes the body the program left in _webout, when it did not use webout(),
   * and reports anything the program left unfinished. The streamed flag decides
   * whether _webout is written or ignored, and it lives here rather than being
   * read by the generated tail. It does not repair an unclosed object: that is
   * invalid JSON, exactly as a SAS program that omits %ms_webout(CLOSE) leaves
   * one. */
  webout.finalise = (body) => {
    if (streamed) {
      if (body)
        console.log(
          'webout: _webout was assigned as well as using webout() - ' +
            'the assignment is ignored'
        )
    } else if (body) {
      fs.writeFileSync(config.weboutPath, body)
    }

    if (opened)
      console.log(
        "webout: webout('OPEN') was called but webout('CLOSE') was not - " +
          'the response body is not valid JSON'
      )
  }

  return webout
}
`
