/**
 * Tidying a JSON document: parse it, write it back the way this codebase writes
 * JSON - two spaces, one key per line, a trailing newline.
 *
 * The formatter is deliberately strict: it answers the parsed value or the parse
 * error, and never guesses. A document with a trailing comma, a comment or a
 * single quote is not JSON, and "formatting" it would be inventing.
 *
 * This is not `prettyJson` (internal/pretty.ts), and the difference is the job:
 * that one only rewrites whitespace when the stored text is already the canonical
 * minified form, because it runs over an API response nobody asked to change. The
 * format button is a request to change the file, so the parse is authoritative
 * here and the text is whatever the value serialises to.
 *
 * Numbers are the one place where the round trip is not the text: `1e3` comes back
 * as `1000` and `0.500` as `0.5`, because JSON.stringify writes the VALUE. Both
 * are the same document to a parser, and this is the only formatter the editor
 * offers for JSON.
 */
export type JsonFormat =
  { ok: true; text: string } | { ok: false; error: string }

const INDENT = 2

export const formatJson = (text: string): JsonFormat => {
  if (!text.trim()) return { ok: true, text }

  let value: unknown

  try {
    value = JSON.parse(text)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // A trailing newline is the file convention everywhere else in the drive, and
  // an empty document stays empty rather than becoming the four characters
  // `null`.
  return { ok: true, text: `${JSON.stringify(value, null, INDENT)}\n` }
}
