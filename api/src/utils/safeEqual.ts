/**
 * Constant-time string comparison, for values a caller could guess at.
 *
 * `timingSafeEqual` throws on differing lengths, which would itself disclose the
 * length, so the lengths are compared first. Used where a refusal could otherwise
 * be timed: the OAuth state parameter and a client secret.
 */
import { timingSafeEqual } from 'crypto'

export const safeEqual = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)

  if (bufferA.length !== bufferB.length) return false

  return timingSafeEqual(bufferA, bufferB)
}
