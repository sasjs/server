import { readDebugWebout, saveDebugWebout, debugPage } from '../webJobDebug'

describe('local Viya debug output', () => {
  it('expires entries rather than serving old output', () => {
    jest.useFakeTimers()
    try {
      const id = saveDebugWebout('ephemeral')!
      expect(readDebugWebout(id)).toBe('ephemeral')
      jest.advanceTimersByTime(15 * 60 * 1000)
      expect(readDebugWebout(id)).toBeUndefined()
    } finally {
      jest.useRealTimers()
    }
  })

  it('bounds the number and total size of cached output', () => {
    const first = saveDebugWebout('first')!
    for (let i = 0; i < 128; i++) saveDebugWebout(String(i))
    expect(readDebugWebout(first)).toBeUndefined()
    expect(saveDebugWebout('x'.repeat(8 * 1024 * 1024 + 1))).toBeUndefined()
    const large = saveDebugWebout('x'.repeat(8 * 1024 * 1024))!
    expect(readDebugWebout(large)).toHaveLength(8 * 1024 * 1024)
    saveDebugWebout('new')
    expect(readDebugWebout(large)).toBeUndefined()
  })

  it('escapes markup in log content', () => {
    const body = debugPage('abc', `<script>&'"</script>`)
    expect(body).toContain('&lt;script&gt;&amp;&#39;&quot;&lt;/script&gt;')
  })
})
