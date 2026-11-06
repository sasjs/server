/**
 * The identifier the server puts either side of a run's log.
 *
 * It is the same literal `@sasjs/adapter` splits on, because a Studio run and a
 * web app's `request()` read the same response shape.
 */
export const SASJS_LOGS_SEPARATOR =
  'SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784'

/** The three parts a `/SASjsApi/code/execute` response carries. */
export interface ExecutionResponseParts {
  /** What the program wrote to `_webout`, or '' when it wrote nothing. */
  webout: string
  /** The program log, whole. */
  log: string
  /** The SAS listing, where the runtime produces one. */
  printOutput: string
}

/** Drops the newline the server joins with, keeping anything the program wrote. */
const withoutLeadingNewline = (text: string) =>
  text.startsWith('\n') ? text.slice(1) : text

const withoutTrailingNewline = (text: string) =>
  text.endsWith('\n') ? text.slice(0, -1) : text

/**
 * Splits a `/SASjsApi/code/execute` body into its webout, log and print output.
 *
 * The server joins the parts with newlines and wraps the log in the separator:
 * `[webout]? SEP log SEP [print]?`. The log ITSELF can contain the separator -
 * a service's log embeds the response of a nested call, and a program's source
 * is echoed into its log, so the literal appears wherever sasjs/core's
 * `ms_runstp` or `ms_testservice` is part of the submitted code. The separator
 * therefore marks the boundaries of the log rather than a fixed number of
 * parts: everything between the first and the last occurrence is the log,
 * however many occurrences it holds, and only the text after the last one is
 * print output.
 *
 * The newline at each boundary belongs to the framing, not to the output, so it
 * is dropped: each part is the text the program produced.
 *
 * A webout or listing that carried the literal itself would move the boundary: a
 * program that echoes another framed response into `_webout` can put one there.
 * Nothing the server emits does, and `@sasjs/adapter` takes the first chunk as
 * the webout in exactly the same way.
 *
 * A body with no separator at all is a webout on its own - the shape a run
 * without `_debug` returns - so it is taken whole.
 *
 * This mirrors `@sasjs/adapter`'s parse, so a response reads the same in the
 * Studio as it does in a SASjs web app.
 */
export const parseExecutionResponse = (
  data: string
): ExecutionResponseParts => {
  const chunks = data.split(SASJS_LOGS_SEPARATOR)

  if (chunks.length === 1) return { webout: data, log: '', printOutput: '' }

  const endsWithSeparator = data.endsWith(SASJS_LOGS_SEPARATOR)

  // The last chunk is the print output when there is one, and an empty string
  // when the response closes on the separator - either way it is not log.
  const printOutput = endsWithSeparator
    ? ''
    : withoutLeadingNewline(chunks[chunks.length - 1])

  const logChunks = chunks.slice(1, chunks.length - 1)

  if (logChunks.length) {
    logChunks[0] = withoutLeadingNewline(logChunks[0])
    logChunks[logChunks.length - 1] = withoutTrailingNewline(
      logChunks[logChunks.length - 1]
    )
  }

  return {
    webout: withoutTrailingNewline(chunks[0]),
    log: logChunks.join(SASJS_LOGS_SEPARATOR),
    printOutput
  }
}
