import { consola, createConsola, LogLevels } from 'consola'

import { instantiateLogger } from '..'

// `Intl.Segmenter` is not in the ES5 lib this project compiles against, and the
// executables built by `pkg` embed a small-icu Node where `pkg` replaces
// `Intl.Segmenter.prototype.segment` with a throw before any application code
// runs. Simulating that here is the only way the unit suite - which runs on a
// full-icu Node - can see the crash a packaged binary hits on its first log
// line.
const Segmenter = (Intl as any).Segmenter

const breakSegmenter = () => {
  Segmenter.prototype.segment = () => {
    throw new RangeError(
      'pkg: Intl.Segmenter is unavailable in this executable'
    )
  }
}

// The reporter writes to the stream the instance carries - warn and error go to
// `stderr`, the rest to `stdout` - so replacing both is how the rendered lines
// are captured. Spying on `process.stdout` is not enough, because jest owns
// that object by the time a spec runs.
const fakeStream = (sink: string[]) => ({
  columns: 0,
  write: (chunk: any) => {
    sink.push(String(chunk))

    return true
  }
})

const reporterName = (instance: { options: { reporters: unknown[] } }) =>
  (instance.options.reporters[0] as { constructor: { name: string } })
    .constructor.name

describe('instantiateLogger', () => {
  const originalLogger = process.logger
  const originalSegment = Segmenter.prototype.segment
  const originalReporters = (consola as any).options.reporters
  const originalLevel = consola.level
  const originalStdout = (consola as any).options.stdout
  const originalStderr = (consola as any).options.stderr

  let written: string[]

  beforeEach(() => {
    written = []
    breakSegmenter()

    // jest sets NODE_ENV=test, where consola's own default reporter is already
    // the plain one - while a packaged binary has no NODE_ENV and gets the
    // fancy one. Start from the reporter production starts from, or this spec
    // proves nothing.
    consola.setReporters(
      createConsola({ fancy: true, level: LogLevels.info }).options.reporters
    )

    // consola drops anything below its own level before a reporter sees it, and
    // in a test process that level is `warn`.
    consola.level = LogLevels.info

    ;(consola as any).options.stdout = fakeStream(written)
    ;(consola as any).options.stderr = fakeStream(written)
  })

  afterEach(() => {
    Segmenter.prototype.segment = originalSegment
    consola.setReporters(originalReporters as any)
    consola.level = originalLevel
    ;(consola as any).options.stdout = originalStdout
    ;(consola as any).options.stderr = originalStderr
    process.logger = originalLogger
  })

  it('replaces the reporter that cannot render on a small-icu build', () => {
    // The state the packaged binary is in when its first log line runs.
    expect(reporterName(consola)).toBe('FancyReporter')
    expect(() => consola.info('control line')).toThrow(RangeError)

    instantiateLogger()

    expect(reporterName(consola)).toBe('BasicReporter')
    expect(() => consola.info('replacement line')).not.toThrow()
  })

  it('logs at every level while the ICU call is broken', () => {
    instantiateLogger()

    expect(() => {
      process.logger.info('info line')
      process.logger.success('success line')
      process.logger.warn('warn line')
      process.logger.error('error line')
    }).not.toThrow()

    const output = written.join('')

    // The level names the line, which is what the fancy reporter's icon did.
    expect(output).toContain('[info] info line')
    expect(output).toContain('[success] success line')
    expect(output).toContain('[warn] warn line')
    expect(output).toContain('[error] error line')
  })
})
