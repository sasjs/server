/**
 * The boot path prints the line, not only the function that composes it.
 *
 * `viyaStartupNotice.spec.ts` pins the notice's words. That leaves the wiring
 * untested: a spec that calls the exported function stays green if `app.ts`
 * stops calling it, and then no boot anywhere prints the line - which is how the
 * third defence of sasjs/server#665 decision 5 was missing in the first place
 * (the flag was read, and nothing an operator reads was written).
 *
 * So this boots the app for real, with the flag set before the module loads, and
 * listens to the level the line is written at. `consola` is the sink every
 * `@sasjs/utils` Logger method funnels into, and `instantiateLogger` replaces the
 * Logger instance at import time - so the spy goes on the singleton rather than
 * on one instance, and the import of `app` happens inside the case, after the
 * spy is installed.
 */
// MODE and the runtime have to be in place before `app` loads: `setProcessVariables`
// reads them and the routers resolve their folders from them
import '../../api/spec/sessionEnv'
import { consola } from 'consola'

describe('a boot with the emulated estate mounted', () => {
  it('prints the notice once, naming the mode and the version', async () => {
    const saved = process.env.EMULATE_VIYA
    process.env.EMULATE_VIYA = 'true'

    const warn = jest.spyOn(consola, 'warn').mockImplementation(() => {})

    try {
      const { default: appPromise } = await import('../../../app')

      await appPromise

      const lines = warn.mock.calls.map((call) => String(call[0]))
      const notices = lines.filter((line) =>
        line.includes('Viya emulation is ON')
      )

      expect(notices).toHaveLength(1)
      expect(notices[0]).toMatch(/emulated Viya V\./)
      expect(notices[0]).toMatch(/not a Viya deployment/)
    } finally {
      warn.mockRestore()

      if (saved === undefined) delete process.env.EMULATE_VIYA
      else process.env.EMULATE_VIYA = saved
    }
  })
})
