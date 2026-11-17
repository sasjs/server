describe('desktop host environment helper', () => {
  const original = process.env.MODE
  const afterAllSpy = jest.spyOn(global, 'afterAll')

  afterEach(() => {
    if (original === undefined) delete process.env.MODE
    else process.env.MODE = original
    afterAllSpy.mockReset()
  })

  afterAll(() => afterAllSpy.mockRestore())

  it.each(['server', undefined])('restores the original mode %s', (mode) => {
    if (mode === undefined) delete process.env.MODE
    else process.env.MODE = mode
    afterAllSpy.mockReset()
    afterAllSpy.mockImplementation(() => undefined as any)
    jest.isolateModules(() => require('./fetchContextDesktopEnv'))
    expect(process.env.MODE).toBe('desktop')
    expect(afterAllSpy).toHaveBeenCalledTimes(1)
    const restore = afterAllSpy.mock.calls[0][0] as () => void
    restore()
    expect(process.env.MODE).toBe(mode)
    if (mode === undefined) expect('MODE' in process.env).toBe(false)
  })
})
