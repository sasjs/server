/**
 * The first two members `webout('OPEN')` writes.
 *
 * It is the prelude's own marker, not a guess at a service's output: `OPEN`
 * opens the envelope with the SAS date and time, so a body that begins with
 * them is one a run started streaming and a program did not close.
 */
export const STREAMED_ENVELOPE_HEAD = /^\{"SYSDATE":"[^"]*","SYSTIME":"[^"]*"/

/**
 * Closes a streamed envelope a program left open.
 *
 * `webout()` writes each member to the session's `_webout` as it is added, and
 * `finalise` appends the closing brace after the payload - so a program that
 * stops before `webout('CLOSE')` leaves a complete JSON prefix behind. Served
 * as it is, that body is not JSON at all: the caller's parse fails, and an app
 * reports its own parse error instead of whatever the service was trying to
 * say - the opposite of what an abort is for.
 *
 * Both endings reach here. A throw (which is what `mp_abort` is in a JS
 * service) ends the interpreter with a non-zero status, and a service that
 * returns early after writing the refusal leaves no error at all: either way
 * the body on the drive is an open envelope.
 *
 * A body the prelude did not open is never touched: a program that writes its
 * own JSON, or its own truncated text, is answering with what it wrote, and
 * repairing that would be inventing output.
 *
 * Whether the envelope is already closed is decided by parsing it, not by its
 * last character: a member's own value can end in `}` - `showmeta` writes a
 * metadata object after its table (`, "$mytable": {"vars": {...}}`) - so a body
 * that ends in a brace may still be missing the document's own.
 *
 * The brace is only offered when it completes the document. A write can be cut
 * anywhere, and a brace appended to a half-written member leaves a body that is
 * still not JSON, only differently so; that case is reported as truncated and
 * the body is answered as it was found.
 *
 * @param body - the `_webout` a run produced, as read from the drive.
 * @returns the body to serve, or null when there was nothing to close.
 */
export const closeStreamedEnvelope = (
  body: string | Buffer
): { webout: string; truncated: boolean } | null => {
  if (typeof body !== 'string') return null
  const trimmed = body.replace(/\s+$/, '')
  if (!STREAMED_ENVELOPE_HEAD.test(trimmed)) return null
  try {
    JSON.parse(trimmed)
    return null
  } catch (e) {
    // one brace is all finalise appends, and every member before it was written
    // whole, so the prefix plus that brace is the document the program meant
    const closed = trimmed + '}'
    try {
      JSON.parse(closed)
      return { webout: closed, truncated: false }
    } catch (e2) {
      return { webout: body, truncated: true }
    }
  }
}
