/**
 * The boot path stays silent when the estate is not mounted.
 *
 * The other half of `viyaBootNotice.spec.ts`, and it has to be its own file: the
 * flag is read while `app` initialises, and a module registry cannot be made to
 * forget it without also forgetting the `consola` singleton the spy is on. One
 * boot per file, one flag per boot.
 *
 * A server that announces an emulation it is not running is worse than one that
 * says nothing - an operator would look for an estate that is not there - so the
 * absence is pinned rather than assumed.
 */
import '../../api/spec/sessionEnv'
import { consola } from 'consola'

describe('a boot with no emulated estate', () => {
  it('does not mention Viya emulation at all', async () => {
    const saved = process.env.EMULATE_VIYA
    delete process.env.EMULATE_VIYA

    const warn = jest.spyOn(consola, 'warn').mockImplementation(() => {})

    try {
      const { default: appPromise } = await import('../../../app')

      await appPromise

      const lines = warn.mock.calls.map((call) => String(call[0]))

      expect(lines.filter((line) => line.includes('Viya emulation'))).toEqual(
        []
      )
    } finally {
      warn.mockRestore()

      if (saved === undefined) delete process.env.EMULATE_VIYA
      else process.env.EMULATE_VIYA = saved
    }
  })
})
