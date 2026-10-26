import {
  executeProgramRawValidation,
  triggerProgramValidation
} from '../validation'
import { DEBUG_ON } from '../parseDebugValue'

/**
 * `_debug` arrives from @sasjs/core, where `%mx_execute` defaults it to `log`
 * and `%ms_runstp` puts whatever it was given into the URL. Rejecting a name
 * failed the whole query validation, and the middleware then reported the body
 * error - "_program is required" - for a request whose `_program` was in the URL.
 */
describe('_debug validation', () => {
  it('should accept a named level as _debug', () => {
    const { error } = executeProgramRawValidation({
      _program: '/Public/app/run.sas',
      _debug: 'log'
    })

    expect(error).toBeUndefined()
  })

  it('should accept a numeric _debug', () => {
    const { error, value } = executeProgramRawValidation({
      _program: '/Public/app/run.sas',
      _debug: '131'
    })

    expect(error).toBeUndefined()
    expect(value._debug).toEqual(131)
  })

  it('should accept a name for the trigger route too', () => {
    const { error } = triggerProgramValidation({
      _program: '/Public/app/run.sas',
      _debug: 'log',
      expiresAfterMins: '5'
    })

    expect(error).toBeUndefined()
  })

  it('should refuse a name that is not one of the levels', () => {
    // a typo used to be silently accepted once the value stopped being numeric
    const { error } = executeProgramRawValidation({
      _program: '/Public/app/run.sas',
      _debug: 'lgo'
    })

    expect(error).toBeDefined()
  })

  it('should still require _program', () => {
    const { error } = executeProgramRawValidation({ _debug: 'log' })

    expect(error?.details[0].message).toContain('_program')
  })

  it('should expose the debug-on value the macros expect', () => {
    expect(DEBUG_ON).toEqual(131)
  })
})
