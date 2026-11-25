import { getWeboutPrelude } from '@sasjs/utils'
import {
  closeStreamedEnvelope,
  STREAMED_ENVELOPE_HEAD
} from '../closeStreamedEnvelope'

/**
 * The bytes `webout('OPEN')` really writes, taken from the block the server
 * ships rather than from a copy of its shape.
 *
 * The head is this feature's whole premise: if the prelude writes it differently
 * - spacing, member order, another field - a hand-written fixture and the regex
 * would agree with each other and disagree with the producer, every test would
 * pass, and the repair would never fire.
 */
const openHead = () => {
  const written = { webout: '', headers: '' }
  const fsStub = {
    writeFileSync: (_path: string, text: string) => (written.webout = text),
    appendFileSync: (_path: string, text: string) => (written.headers += text)
  }
  const prelude = getWeboutPrelude({
    weboutPath: '/sasjs/sessions/test/webout.txt',
    headersPath: '/sasjs/sessions/test/stpsrv_header.txt',
    program: '/Public/app/test/services/getdata',
    debug: '',
    username: 'tester',
    userId: '0',
    apiServerUrl: 'http://localhost:5000'
  })

  // the prelude binds globalThis.webout, which the run's own program would do
  try {
    new Function('require', `${prelude}\nwebout('OPEN');`)(() => fsStub)
  } finally {
    delete (globalThis as any).webout
  }

  return written.webout
}

describe('closeStreamedEnvelope', () => {
  it("recognises the head webout('OPEN') writes", () => {
    // the coupling the regex has to the producer, asserted directly: this is
    // what fails - rather than the repair silently never firing - if the
    // prelude's OPEN changes shape
    expect(openHead()).toMatch(STREAMED_ENVELOPE_HEAD)
  })

  it('closes the envelope of a program that stopped before CLOSE', () => {
    const body = `${openHead()},"sasjsAbort":[{"MSG":"not authorised"}]`

    const repaired = closeStreamedEnvelope(body)

    expect(repaired).not.toBeNull()
    expect(repaired!.truncated).toBe(false)
    expect(JSON.parse(repaired!.webout).sasjsAbort[0].MSG).toBe(
      'not authorised'
    )
  })

  it('leaves an envelope that was closed alone', () => {
    expect(
      closeStreamedEnvelope(`${openHead()},"users":[{"NAME":"ann"}]}`)
    ).toBeNull()
  })

  it('closes a stream that ended on a member whose value ends in a brace', () => {
    // showmeta writes its metadata object after the table, so the last
    // character is `}` while the document's own brace is still missing
    const body = `${openHead()},"users":[{"NAME":"ann"}],"$users":{"vars":{"NAME":{"label":"Name"}}}`

    const repaired = closeStreamedEnvelope(body)

    expect(JSON.parse(repaired!.webout).$users.vars.NAME.label).toBe('Name')
  })

  it('does not claim a body cut mid-member is readable', () => {
    const body = `${openHead()},"users":[`

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
