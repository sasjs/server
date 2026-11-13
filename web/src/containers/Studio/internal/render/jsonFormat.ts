/**
 * Tidying a JSON document: parse it, write it back the way this codebase writes
 * JSON - two spaces, one key per line, a trailing newline.
 *
 * The formatter is deliberately strict: it answers the formatted text or the reason
 * it will not touch the file, and never guesses. A document with a trailing comma,
 * a comment or a single quote is not JSON, and "formatting" it would be inventing.
 *
 * It is also not a rewrite of the VALUES, and the parse is why that needed saying.
 * Two documents survive `JSON.parse` and come out of `JSON.stringify` as something
 * else, and both appear in files people keep - a config, a rules file, an export:
 *
 *   - an integer past `Number.MAX_SAFE_INTEGER`, which a double cannot hold:
 *     `{"id": 9007199254740993}` comes back as `9007199254740992`;
 *   - a duplicated key in one object, where the parse keeps the last value and the
 *     first one is gone: `{"a":1,"a":2}` comes back as `{"a": 2}`.
 *
 * Neither is a change of notation, so neither is formatting. Both are refused with
 * a message naming what would have been lost, which is the same ground
 * `prettyJson` (internal/pretty.ts) stands on when it only rewrites canonical
 * minified text. Numbers whose notation alone changes - `1e3` to `1000`, `0.500` to
 * `0.5` - are not refused: they are the same value, written differently.
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
    // The whole sentence, not the parser's fragment: the caller shows this text
    // as it stands, whichever of the three refusals produced it.
    return {
      ok: false,
      error: `This is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    }
  }

  const loss = lossesIn(text)

  if (loss.number) {
    return {
      ok: false,
      error: `The number ${loss.number} cannot be written back exactly - a JSON double holds ${Number(
        loss.number
      )} - so the file was left as it is.`
    }
  }

  if (loss.duplicate) {
    return {
      ok: false,
      error: `The key "${loss.duplicate}" appears twice in one object, and formatting would keep only its last value, so the file was left as it is.`
    }
  }

  // A trailing newline is the file convention everywhere else in the drive, and
  // an empty document stays empty rather than becoming the four characters
  // `null`.
  return { ok: true, text: `${JSON.stringify(value, null, INDENT)}\n` }
}

interface Losses {
  /** An integer literal that a double cannot hold, as written. */
  number?: string
  /** A key that appears twice in the same object. */
  duplicate?: string
}

/**
 * A JSON string's contents, unescaped - `"a\u0062"` and `"ab"` name the same key,
 * and a duplicate that escaped its name is still a duplicate.
 */
const decodeKey = (raw: string): string => {
  if (!raw.includes('\\')) return raw

  try {
    return JSON.parse(`"${raw}"`) as string
  } catch {
    // not a valid escape: JSON.parse refused the document already, so this is a
    // key compared as written rather than one this formatter could mis-name
    return raw
  }
}

/**
 * A decimal literal split into its digits and a power of ten, with the zeros that
 * carry no information removed.
 *
 * Digits are a STRING rather than a BigInt: the app targets a JavaScript level
 * without BigInt literals, and comparing two digit strings costs nothing.
 */
interface Decimal {
  negative: boolean
  digits: string
  exponent: number
}

const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/

const asDecimal = (token: string): Decimal | undefined => {
  const match = DECIMAL.exec(token)

  if (!match) return undefined

  const [, sign, whole, fraction = '', exponent = '0'] = match

  let digits = (whole + fraction).replace(/^0+/, '')
  let scale = Number(exponent) - fraction.length

  if (!digits) return { negative: false, digits: '', exponent: 0 }

  while (digits.endsWith('0')) {
    digits = digits.slice(0, -1)
    scale += 1
  }

  // zero is zero: `-0` and `0` are the same number however they are written
  return { negative: sign === '-', digits, exponent: scale }
}

/**
 * Whether a numeric literal survives the round trip through a double.
 *
 * The comparison is between the literal's exact value and the exact value of the
 * literal `Number` writes back for it, not between their spellings: `1e3` and
 * `1000` are the same decimal and both are fine, `1e400` is not finite at all, and
 * `9007199254740993e0` names a decimal a double cannot hold.
 */
const keepsItsValue = (token: string): boolean => {
  const value = Number(token)

  if (!Number.isFinite(value)) return false

  const written = asDecimal(token)
  const canonical = asDecimal(String(value))

  if (!written || !canonical) return false

  return (
    written.negative === canonical.negative &&
    written.digits === canonical.digits &&
    written.exponent === canonical.exponent
  )
}

const isWhitespace = (character: string) =>
  character === ' ' ||
  character === '\t' ||
  character === '\n' ||
  character === '\r'

/**
 * What a round trip through the parser would destroy.
 *
 * A scan rather than a reviver, because neither case is visible after the parse: a
 * duplicate key is already collapsed by the time a reviver runs, and a lost integer
 * has already become the double. Both are properties of the TEXT, so the text is
 * read - strings skipped so that `"1e999"` inside one is not a number and `"a"` in a
 * value is not a key, and an object stack kept so that a repeated key in two
 * DIFFERENT objects is the ordinary case it is.
 */
const lossesIn = (text: string): Losses => {
  const losses: Losses = {}
  const stack: Array<{
    isObject: boolean
    keys: Set<string>
    expectingKey: boolean
  }> = []

  let inString = false
  let escaped = false
  let stringIsKey = false
  let string = ''
  let number = ''
  let inNumber = false

  const flushNumber = () => {
    if (!inNumber) return

    const token = number

    number = ''
    inNumber = false

    // The VALUE, not the shape of the literal: `9007199254740993e0` is the same
    // loss as the integer spelled out, and `1e400` parses to Infinity, which
    // `JSON.stringify` writes as `null`.
    if (!keepsItsValue(token)) losses.number ??= token
  }

  for (const character of text) {
    if (inString) {
      if (escaped) {
        escaped = false
        // kept WITH its backslash: a key's escapes are how it is compared
        string += `\\${character}`

        continue
      }

      if (character === '\\') {
        escaped = true

        continue
      }

      if (character === '"') {
        inString = false

        const top = stack[stack.length - 1]

        if (stringIsKey && top?.isObject) {
          // decoded, so that `"a\u0062"` and `"ab"` are the same key
          const key = decodeKey(string)

          if (top.keys.has(key)) losses.duplicate ??= key

          top.keys.add(key)
          top.expectingKey = false
        }

        stringIsKey = false
        string = ''

        continue
      }

      string += character

      continue
    }

    if (inNumber && !/[0-9eE+\-.]/.test(character)) flushNumber()

    if (character === '"') {
      const top = stack[stack.length - 1]

      inString = true
      stringIsKey = !!top?.isObject && top.expectingKey

      continue
    }

    if (character === '{') {
      stack.push({ isObject: true, keys: new Set(), expectingKey: true })

      continue
    }

    if (character === '[') {
      // the container above is done waiting for its key: a `[` follows the `:`
      const top = stack[stack.length - 1]

      if (top) top.expectingKey = false

      stack.push({ isObject: false, keys: new Set(), expectingKey: false })

      continue
    }

    if (character === '}' || character === ']') {
      flushNumber()
      stack.pop()

      continue
    }

    if (character === ',') {
      const top = stack[stack.length - 1]

      // only an object has keys; a comma in an array begins another value
      if (top) top.expectingKey = top.isObject

      continue
    }

    if (/[0-9+\-.]/.test(character) || (character === 'e' && inNumber)) {
      number += character
      inNumber = true

      continue
    }

    if (isWhitespace(character)) flushNumber()
  }

  flushNumber()

  return losses
}
