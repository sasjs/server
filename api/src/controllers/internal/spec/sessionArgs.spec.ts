import path from 'path'

import { buildSessionArgs } from '../Session'
import { Session } from '../../../types'

/**
 * The session's own SASUSER is a correctness fix, not a cosmetic one: it is what
 * stops every session opening with
 *
 *   WARNING: Unable to copy SASUSER registry to WORK registry.
 *
 * SAS copies the SASUSER profile into WORK at startup, so one shared SASUSER
 * fails or races across pooled sessions. A writable folder per session lets the
 * copy succeed - unlike `-RSASUSER`, which silences the warning by making the
 * writes a program makes to SASUSER fail. The warning is reported on Linux as
 * well as Windows, so the flag goes on both command lines; only the
 * dialog-suppressing flags stay gated on the Windows binary.
 */
const session = { path: path.join('/tmp', 'session') } as unknown as Session

describe('buildSessionArgs', () => {
  const windows = buildSessionArgs(
    'C:\\SASHome\\SASFoundation\\9.4\\sas.exe',
    session,
    '/tmp/session/autoexec.sas'
  )
  const unix = buildSessionArgs(
    '/opt/sas/SASHome/SASFoundation/9.4/sas',
    session,
    '/tmp/session/autoexec.sas'
  )

  it('should point SASUSER at the session folder on every host', () => {
    for (const args of [windows, unix]) {
      const i = args.indexOf('-SASUSER')
      expect(i).toBeGreaterThan(-1)
      expect(args[i + 1]).toEqual(path.join('/tmp', 'session', 'sasuser'))
    }
  })

  it('should not make SASUSER read-only, which would break writes to it', () => {
    expect(windows).not.toContain('-RSASUSER')
    expect(unix).not.toContain('-RSASUSER')
  })

  it('should still carry the session paths on both', () => {
    for (const args of [windows, unix]) {
      expect(args).toContain('-SYSIN')
      expect(args).toContain(path.join('/tmp', 'session', 'log.log'))
      expect(args).toContain(path.join('/tmp', 'session', 'output.lst'))
      expect(args).toContain('/tmp/session/autoexec.sas')
      expect(args).toContain('/tmp/session')
    }
  })

  it('should keep the desktop-suppressing flags to Windows', () => {
    expect(windows).toContain('-nodms')
    expect(unix).not.toContain('-nodms')
    expect(unix).not.toContain('-nosplash')
  })

  it('should point SYSIN at the session program on both', () => {
    for (const args of [windows, unix]) {
      const i = args.indexOf('-SYSIN')
      expect(args[i + 1]).toEqual(path.join('/tmp', 'session', 'code.sas'))
    }
  })
})
