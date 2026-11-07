/**
 * Whether the content a program wrote to `_webout` is a page rather than text.
 *
 * A Studio run hands back whatever went to the fileref: an ODS or SASjs app
 * page, but just as often JSON from `%webout()` or a printed line. Only the
 * first is worth rendering as a page - an iframe parses everything as HTML, so a
 * JSON or text webout would lose its whitespace and read as one long line.
 *
 * A leading `<` is the whole test: a page starts with its first tag or a
 * doctype, and none of the text shapes a program writes to `_webout` do.
 */
export const isHtmlOutput = (output: string) => /^\s*</.test(output)

/**
 * The webout as parsed JSON, or `null` when it is not a JSON document.
 *
 * Only an object or an array counts. A bare `123`, `"x"`, `true` or `null` is
 * technically JSON, but a program writing one of those to `_webout` is writing
 * a line of text, and offering to "format" it would put a toggle on something
 * with nothing to toggle. A document is what has structure worth showing.
 */
export const parseJsonOutput = (output: string): unknown | null => {
  const text = output.trim()

  if (!text) return null
  if (text[0] !== '{' && text[0] !== '[') return null

  try {
    const parsed = JSON.parse(text)

    return parsed !== null && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/**
 * The webout indented for reading, or `null` when it is not JSON.
 *
 * The text is re-emitted from the parsed document, so what a reader sees is the
 * same data rather than a re-serialisation of a lossy parse: a number past
 * `Number.MAX_SAFE_INTEGER` still reads wrong, which is why the RAW view stays
 * one click away and is the truth of what the program wrote.
 */
export const prettyJsonOutput = (output: string): string | null => {
  const parsed = parseJsonOutput(output)

  return parsed === null ? null : JSON.stringify(parsed, null, 2)
}
