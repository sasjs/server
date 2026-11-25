import { closeStreamedEnvelope } from '../closeStreamedEnvelope'

/** The head `webout('OPEN')` writes. */
const head = '{"SYSDATE":"24NOV26","SYSTIME":"22:44"'

describe('closeStreamedEnvelope', () => {
  it('closes the envelope of a program that stopped before CLOSE', () => {
    const body = `${head},"sasjsAbort":[{"MSG":"not authorised"}]`

    const repaired = closeStreamedEnvelope(body)

    expect(repaired).not.toBeNull()
    expect(repaired!.truncated).toBe(false)
    expect(JSON.parse(repaired!.webout).sasjsAbort[0].MSG).toBe(
      'not authorised'
    )
  })

  it('leaves an envelope that was closed alone', () => {
    expect(
      closeStreamedEnvelope(`${head},"users":[{"NAME":"ann"}]}`)
    ).toBeNull()
  })

  it('closes a stream that ended on a member whose value ends in a brace', () => {
    // showmeta writes its metadata object after the table, so the last
    // character is `}` while the document's own brace is still missing
    const body = `${head},"users":[{"NAME":"ann"}],"$users":{"vars":{"NAME":{"label":"Name"}}}`

    const repaired = closeStreamedEnvelope(body)

    expect(JSON.parse(repaired!.webout).$users.vars.NAME.label).toBe('Name')
  })

  it('does not claim a body cut mid-member is readable', () => {
    const body = `${head},"users":[`

    expect(closeStreamedEnvelope(body)).toEqual({
      webout: body,
      truncated: true
    })
  })

  it('leaves a body the prelude did not open alone', () => {
    expect(closeStreamedEnvelope('{"mine":1')).toBeNull()
    expect(closeStreamedEnvelope('<html>ok</html>')).toBeNull()
    expect(closeStreamedEnvelope('')).toBeNull()
  })

  it('leaves a binary body alone', () => {
    expect(closeStreamedEnvelope(Buffer.from([0, 255, 1]))).toBeNull()
  })
})
