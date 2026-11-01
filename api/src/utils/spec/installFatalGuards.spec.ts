import { installFatalGuards } from '..'

describe('installFatalGuards', () => {
  const errorSpy = jest.fn()
  let exitSpy: jest.SpyInstance
  let dispose: () => void

  beforeEach(() => {
    errorSpy.mockClear()

    process.logger = { error: errorSpy } as any

    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      // node's own process.exit never returns; a mock that returns is what lets
      // the assertions below run after the call
    }) as any)

    dispose = installFatalGuards()
  })

  afterEach(() => {
    dispose()
    exitSpy.mockRestore()
  })

  const emit = (event: string, ...args: any[]) =>
    (process as any).emit(event, ...args)

  it('logs the stack of an unhandled rejection and exits non-zero', () => {
    const reason = new Error('session lookup failed')

    emit('unhandledRejection', reason, Promise.resolve())

    expect(errorSpy).toHaveBeenCalledTimes(1)

    const message = errorSpy.mock.calls[0][0] as string

    expect(message).toContain('fatal: unhandled promise rejection')
    expect(message).toContain('session lookup failed')
    expect(message).toContain('Error: session lookup failed')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('exits on an uncaught exception', () => {
    emit('uncaughtException', new Error('boom'), 'uncaughtException')

    const message = errorSpy.mock.calls[0][0] as string

    expect(message).toContain('fatal: uncaught exception')
    expect(message).toContain('boom')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('reports a rejection reason that is not an Error', () => {
    emit('unhandledRejection', { code: 'ECONNRESET' }, Promise.resolve())

    const message = errorSpy.mock.calls[0][0] as string

    expect(message).toContain('fatal: unhandled promise rejection')
    expect(message).toContain('ECONNRESET')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('reports a string reason as it is', () => {
    emit('uncaughtException', 'something broke', 'uncaughtException')

    expect(errorSpy.mock.calls[0][0]).toContain('something broke')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('always exits, because the listener replaces the default that would have', () => {
    // a listener on either event suppresses Node's own exit: without the exit
    // call the server would keep serving after a fault of unknown extent
    emit('unhandledRejection', new Error('first'), Promise.resolve())
    emit('uncaughtException', new Error('second'), 'uncaughtException')

    expect(exitSpy).toHaveBeenCalledTimes(2)
    expect(exitSpy).toHaveBeenNthCalledWith(1, 1)
    expect(exitSpy).toHaveBeenNthCalledWith(2, 1)
  })

  it('removes both listeners when disposed', () => {
    dispose()

    emit('unhandledRejection', new Error('ignored'), Promise.resolve())
    emit('uncaughtException', new Error('ignored'), 'uncaughtException')

    expect(errorSpy).not.toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
  })
})
