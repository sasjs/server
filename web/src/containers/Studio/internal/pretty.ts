/**
 * Shows a one-line JSON file indented.
 *
 * A JSON file on the drive is often kept on a single line, which reads badly in
 * the editor. Re-emitting the parsed document with two spaces of indentation is
 * only safe when the stored text is exactly the canonical minified form: then
 * this rewrites whitespace and nothing else, so a value JSON cannot round-trip
 * - an integer past `Number.MAX_SAFE_INTEGER`, a duplicated key with different
 * values - leaves the file as it is rather than being silently replaced.
 */
export const prettyJson = (text: string): string => {
  if (!text.trim()) return text

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return text
  }

  if (text.trim() !== JSON.stringify(parsed)) return text

  const indented = JSON.stringify(parsed, null, 2)

  return text.endsWith('\n') ? `${indented}\n` : indented
}
