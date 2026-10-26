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

  it('should not read exponent or hex forms as numbers', () => {
    // Number() would take these as 1000 and 16, which no macro compares against
    expect(parseDebugValue('1e3')).toEqual(DEBUG_ON)
    expect(parseDebugValue('0x10')).toEqual(DEBUG_ON)
    expect(parseDebugValue('Infinity')).toEqual(DEBUG_ON)
  })

  it('should translate a named level to the debug-on value', () => {
    // %mx_execute defaults to _debug=log; there is no per-level behaviour to
    // preserve, so a name means "return the session log"
    expect(parseDebugValue('log')).toEqual(DEBUG_ON)
    expect(parseDebugValue('LOG')).toEqual(DEBUG_ON)
    expect(parseDebugValue('trace')).toEqual(DEBUG_ON)
  })

  it('should read any other name as logging on', () => {
    // one effect behind the parameter, so a word SAS would not know still means
    // what the caller asked for
    expect(parseDebugValue('false')).toEqual(DEBUG_ON)
    expect(parseDebugValue('anything')).toEqual(DEBUG_ON)
  })

  it('should treat absent and empty values as not set', () => {
    expect(parseDebugValue(undefined)).toBeUndefined()
    expect(parseDebugValue(null)).toBeUndefined()
    expect(parseDebugValue('')).toBeUndefined()
    expect(parseDebugValue('   ')).toBeUndefined()
  })
})
