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
