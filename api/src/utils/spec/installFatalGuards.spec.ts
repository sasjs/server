// writeSync on the real `fs` is a non-configurable property, so the module is
// replaced rather than spied: the guard under test imports `writeSync` by name,
// which the factory below swaps for a mock.
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeSync: jest.fn()
}))

import * as fs from 'fs'

import { installFatalGuards } from '..'

const writeSync = fs.writeSync as unknown as jest.Mock

describe('installFatalGuards', () => {
  const originalLogger = process.logger

  let exitSpy: jest.SpyInstance
  let dispose: () => void

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      // node's own process.exit never returns; a mock that returns is what lets
      // the assertions below run after the call
    }) as any)

    writeSync.mockReset()
    writeSync.mockImplementation(
      ((_fd: number, buf: Buffer) => buf.length) as any
    )

    dispose = installFatalGuards()
  })

  afterEach(() => {
    dispose()
    exitSpy.mockRestore()
    process.logger = originalLogger
  })

  const emit = (event: string, ...args: any[]) =>
    (process as any).emit(event, ...args)

  const written = (): string =>
    writeSync.mock.calls.map((call) => String(call[1])).join('')

  it('writes the stack of an unhandled rejection to stderr and exits non-zero', () => {
    emit(
      'unhandledRejection',
      new Error('session lookup failed'),
      Promise.resolve()
    )

    expect(writeSync).toHaveBeenCalledTimes(1)
    expect(writeSync.mock.calls[0][0]).toBe(2)

    expect(written()).toContain('fatal: unhandled promise rejection')
    expect(written()).toContain('session lookup failed')
    expect(written()).toContain('Error: session lookup failed')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('exits on an uncaught exception', () => {
    emit('uncaughtException', new Error('boom'), 'uncaughtException')

    expect(written()).toContain('fatal: uncaught exception')
    expect(written()).toContain('boom')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('reports a rejection reason that is not an Error', () => {
    emit('unhandledRejection', { code: 'ECONNRESET' }, Promise.resolve())

    expect(written()).toContain('fatal: unhandled promise rejection')
    expect(written()).toContain('ECONNRESET')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('reports a string reason as it is', () => {
    emit('uncaughtException', 'something broke', 'uncaughtException')

    expect(written()).toContain('something broke')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('does not need process.logger to be initialised', () => {
    process.logger = undefined as any

    emit(
      'uncaughtException',
      new Error('before the logger exists'),
      'uncaughtException'
    )

    expect(written()).toContain('before the logger exists')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('writes the remainder after a partial write', () => {
    let call = 0

    writeSync.mockImplementation(((_fd: number, buf: Buffer) => {
      call++

      // the first attempt accepts half the line, as a nearly full pipe does
      return call === 1 ? Math.floor(buf.length / 2) : buf.length
    }) as any)

    emit('uncaughtException', new Error('partial'), 'uncaughtException')

    expect(writeSync).toHaveBeenCalledTimes(2)
    expect(written()).toContain('fatal: uncaught exception')
    expect(written()).toContain('partial')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('retries EAGAIN instead of falling back to the async logger', () => {
    const errorSpy = jest.fn()

    process.logger = { error: errorSpy } as any

    let call = 0

    writeSync.mockImplementation(((_fd: number, buf: Buffer) => {
      call++

      if (call === 1) {
        const busy: any = new Error('EAGAIN: resource temporarily unavailable')
        busy.code = 'EAGAIN'
        throw busy
      }

      return buf.length
    }) as any)

    emit('uncaughtException', new Error('pipe was full'), 'uncaughtException')

    expect(writeSync).toHaveBeenCalledTimes(2)
    expect(written()).toContain('pipe was full')
    expect(errorSpy).not.toHaveBeenCalled()
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('falls back to the logger when stderr cannot be written', () => {
    const errorSpy = jest.fn()

    process.logger = { error: errorSpy } as any

    writeSync.mockImplementation(() => {
      const broken: any = new Error('EBADF')
      broken.code = 'EBADF'
      throw broken
    })

    emit('uncaughtException', new Error('stderr is gone'), 'uncaughtException')

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toContain('stderr is gone')
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

    expect(writeSync).not.toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
  })
})
