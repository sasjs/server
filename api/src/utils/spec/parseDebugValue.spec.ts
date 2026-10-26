import { DEBUG_ON, parseDebugValue } from '../parseDebugValue'

describe('parseDebugValue', () => {
  it('should keep a numeric value as it is', () => {
    expect(parseDebugValue(131)).toEqual(131)
    expect(parseDebugValue(0)).toEqual(0)
  })

  it('should read a numeric string', () => {
    expect(parseDebugValue('131')).toEqual(131)
    expect(parseDebugValue(' 132 ')).toEqual(132)
  })

  it('should translate a named level to the debug-on value', () => {
    // %mx_execute defaults to _debug=log; there is no per-level behaviour to
    // preserve, so a name means "return the session log"
    expect(parseDebugValue('log')).toEqual(DEBUG_ON)
    expect(parseDebugValue('trace')).toEqual(DEBUG_ON)
  })

  it('should treat absent and empty values as not set', () => {
    expect(parseDebugValue(undefined)).toBeUndefined()
    expect(parseDebugValue(null)).toBeUndefined()
    expect(parseDebugValue('')).toBeUndefined()
  })
})
