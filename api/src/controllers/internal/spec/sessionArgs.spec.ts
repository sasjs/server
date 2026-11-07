import path from 'path'

import { buildSessionArgs } from '../Session'
import { Session } from '../../../types'

/**
 * `-RSASUSER` is a correctness fix, not a cosmetic one: it is what stops every
 * session opening with
 *
 *   WARNING: Unable to copy SASUSER registry to WORK registry.
 *
 * A server pools several sessions against one SASUSER, so the copy into WORK
 * fails or races and the log is noisy from line one. The warning is reported on
 * Linux as well as Windows (a read-only home or a shared SASUSER produces it),
 * so the flag goes on both command lines; only the dialog-suppressing flags stay
 * gated on the Windows binary.
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

  it('should open SASUSER read-only on every host, so the registry copy is not attempted', () => {
    expect(windows).toContain('-RSASUSER')
    // the warning is reported on Linux too: a read-only home, or a pooled server
    // sharing one SASUSER
    expect(unix).toContain('-RSASUSER')
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
