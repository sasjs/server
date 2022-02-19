import { parseLogToArray } from '..'

describe('parseLogToArray', () => {
  it('should parse log to array type', () => {
    const log = parseLogToArray(`
line 1 of log content
line 2 of log content
line 3 of log content
line 4 of log content
    `)

    expect(log).toEqual([
      { line: '' },
      { line: 'line 1 of log content' },
      { line: 'line 2 of log content' },
      { line: 'line 3 of log content' },
      { line: 'line 4 of log content' },
      { line: '    ' }
    ])
  })

  it('should parse log to array type if empty', () => {
    const log = parseLogToArray('')

    expect(log).toEqual([])
  })

  it('should parse log to array type if not provided', () => {
    const log = parseLogToArray()

    expect(log).toEqual([])
  })
})
