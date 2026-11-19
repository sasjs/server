/**
 * The server says out loud when it is answering as an emulated Viya estate.
 *
 * Decision 5 of sasjs/server#665 asks for three defences against an emulated
 * answer being read as a real one: the `x-sasjs-emulated` header on every
 * emulated-path response, the setting in the documented settings page, and a line
 * at startup. The header is only visible to a client and the settings page only
 * to whoever goes looking, so the startup line is the one that reaches the
 * operator who is reading a log to find out which mode produced a result.
 *
 * What these cases pin is that the line exists, names the version the answers
 * themselves name, states that this is not a Viya deployment, and stays silent
 * when the mode is off - a server that announces an emulation it is not running
 * is worse than one that says nothing.
 */
import { VIYA_TARGET_VERSION } from '@sasjs/api'

import { viyaEmulationNotice, isViyaEmulationEnabled } from '../services'

describe('the startup notice for the emulated estate', () => {
  let saved: string | undefined

  beforeEach(() => {
    saved = process.env.EMULATE_VIYA
    delete process.env.EMULATE_VIYA
  })

  afterEach(() => {
    if (saved === undefined) delete process.env.EMULATE_VIYA
    else process.env.EMULATE_VIYA = saved
  })

  it('says nothing when the estate is not mounted', () => {
    expect(isViyaEmulationEnabled()).toBe(false)
    expect(viyaEmulationNotice()).toBeUndefined()
  })

  it.each(['false', 'off', '0', 'maybe', ''])(
    'says nothing for EMULATE_VIYA=%p, which does not mount the estate',
    (value) => {
      process.env.EMULATE_VIYA = value

      expect(isViyaEmulationEnabled()).toBe(false)
      expect(viyaEmulationNotice()).toBeUndefined()
    }
  )

  it.each(['true', '1', 'yes', 'on', 'TRUE', 'On'])(
    'names the estate for EMULATE_VIYA=%p, the values the mount accepts',
    (value) => {
      process.env.EMULATE_VIYA = value

      expect(isViyaEmulationEnabled()).toBe(true)
      expect(viyaEmulationNotice()).toContain('Viya emulation is ON')
    }
  )

  it('names the Viya version the answers themselves carry', () => {
    process.env.EMULATE_VIYA = 'true'

    expect(viyaEmulationNotice()).toContain(VIYA_TARGET_VERSION)
  })

  it('states that the estate is not a Viya deployment', () => {
    process.env.EMULATE_VIYA = 'true'

    expect(viyaEmulationNotice()).toMatch(/not a Viya deployment/)
  })

  // The token port is the one Viya path this server answers itself: the emulator
  // holds no account to check a credential against, so `/SASLogon/oauth/token` is
  // answered from this server's own accounts and carries no `x-sasjs-emulated`
  // header. A notice that listed it among the emulated paths would be exactly the
  // overstatement decision 5 exists to prevent.
  it('names the token port as this server own, not as emulated', () => {
    process.env.EMULATE_VIYA = 'true'

    const notice = viyaEmulationNotice() as string

    expect(notice).toContain(
      "/SASLogon/oauth/token is answered by this server's own accounts"
    )
    expect(notice).not.toMatch(/\/SASLogon[\s\S]*are answered as an emulated/)
  })

  // The notice is one log line. A multi-line message splits the one statement an
  // operator greps for across lines, and a log shipper that keeps a record per
  // line then carries half of it.
  it('is a single line', () => {
    process.env.EMULATE_VIYA = 'true'

    expect(viyaEmulationNotice()).not.toMatch(/[\r\n]/)
  })
})
