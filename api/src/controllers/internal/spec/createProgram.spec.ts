import { execFileSync } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import {
  createJSProgram,
  createPythonProgram,
  createRProgram,
  createSASProgram,
  createViyaSASProgram
} from '..'
import { extractHeaders } from '../../../utils'
/**
 * The generated stored-program source is assembled by string concatenation, so
 * a caller-controlled value that is not escaped can close the literal it was
 * meant to be part of and run as code in the spawned interpreter. These specs
 * pin the escaping, and - for the two interpreters a test runner has - prove it
 * by RUNNING the generated program and asserting the payload did not execute.
 *
 * The payloads are the ones from the deployment review: a query value that
 * breaks out of a template literal (JavaScript) or a single-quoted string
 * (Python).
 */
describe('generated stored-program source', () => {
  const session: any = { path: '' }
  const preProgramVariables: any = {
    username: 'testsuser',
    userId: '507f1f77bcf86cd799439011',
    displayName: 'Test User',
    serverUrl: 'http://localhost:5000'
  }

  let workDir: string
  let marker: string

  const jsPayload = () =>
    '`; require("child_process").execSync("touch ' + marker + '"); const _z = `'
  const pyPayload = () =>
    "'; import os; os.system('touch " + marker + "'); x = '"

  beforeAll(() => {
    workDir = mkdtempSync(path.join(tmpdir(), 'sasjs-program-'))
    marker = path.join(workDir, 'pwned')
    session.path = workDir
    ;(process as any).driveLoc = workDir
  })

  const generate = async (runTime: 'js' | 'py' | 'r', payload: string) => {
    const body = runTime === 'py' ? '# stored program' : '/* stored program */'

    const args: any[] = [
      body,
      preProgramVariables,
      { userparam: payload },
      session,
      path.join(workDir, 'webout.json'),
      path.join(workDir, 'headers.json'),
      path.join(workDir, 'token.json')
    ]

    switch (runTime) {
      case 'js':
        return createJSProgram(...(args as [any, any, any, any, any, any, any]))
      case 'py':
        return createPythonProgram(
          ...(args as [any, any, any, any, any, any, any])
        )
      case 'r':
        return createRProgram(...(args as [any, any, any, any, any, any, any]))
    }
  }

  afterEach(() => {
    if (existsSync(marker)) require('fs').unlinkSync(marker)
  })

  describe('JavaScript', () => {
    it('runs the value as a string, not as code', async () => {
      const program = await generate('js', jsPayload())
      const file = path.join(workDir, 'program.js')
      writeFileSync(file, program)

      // The payload's command would create the marker file if it executed.
      execFileSync(process.execPath, [file], { cwd: workDir })

      expect(existsSync(marker)).toEqual(false)
      expect(readFileSync(file, 'utf-8')).toContain(
        'const userparam = "`; require(\\"child_process\\")'
      )
    })
  })

  describe('Python', () => {
    it('runs the value as a string, not as code', async () => {
      const program = await generate('py', pyPayload())
      const file = path.join(workDir, 'program.py')
      writeFileSync(file, program)

      execFileSync('python3', [file], { cwd: workDir })

      expect(existsSync(marker)).toEqual(false)
      expect(readFileSync(file, 'utf-8')).toContain(
        "userparam = \"'; import os; os.system('touch"
      )
    })
  })

  describe('R', () => {
    it('emits the value as a single quoted literal', async () => {
      const program = await generate(
        'r',
        "'; system('touch " + marker + "'); x <- '"
      )

      // R is not installed in every environment the suite runs in, so this one
      // asserts on the generated source: the value is one literal, and the
      // payload's statement separator stays inside it.
      expect(program).toContain(".userparam <- \"'; system('touch")
      expect(
        program.split('\n').filter((line) => line.includes('system('))
      ).toHaveLength(1)
    })
  })

  describe('SAS', () => {
    it('masks the value the way the Viya compute server does', async () => {
      const program = await createSASProgram(
        '/* stored program */',
        preProgramVariables,
        { userparam: "x; proc sql; quit; %put 'a & b' o'brien" },
        session,
        path.join(workDir, 'webout.json'),
        path.join(workDir, 'headers.json'),
        path.join(workDir, 'token.json')
      )

      // Semicolons cannot survive to close the %let; macro triggers and
      // quotes are masked so they stay inside the value.
      expect(program).toContain(
        "%let userparam=%nrstr(x  proc sql  quit  %%put %'a & b%' o%'brien);"
      )

      // The process-mode marker is set under both names, so core releases
      // either side of the _SASJS_ rename detect a SASjs server.
      expect(program).toContain('%let _sasjs_processmode=Stored Program;')
      expect(program).toContain('%let sasjsprocessmode=Stored Program;')
    })
  })

  describe('Viya SAS', () => {
    it('sets the process-mode marker under both names', async () => {
      const program = await createViyaSASProgram(
        '/* stored program */',
        preProgramVariables,
        { userparam: 'simple' }
      )

      expect(program).toContain('%let _sasjs_processmode=Stored Program;')
      expect(program).toContain('%let sasjsprocessmode=Stored Program;')
    })
  })

  describe('webout()', () => {
    const weboutFilePath = () => path.join(workDir, 'webout.txt')
    const headersFilePath = () => path.join(workDir, 'headers.txt')

    /**
     * Generates the program the server would run, writes the header file the
     * way a session seeds it, then RUNS it - so the assertions below are about
     * the file the response is built from, not about the generated source.
     */
    const runProgram = async (source: string) => {
      const program = await createJSProgram(
        source,
        preProgramVariables,
        { _program: '/Public/demo' },
        session,
        weboutFilePath(),
        headersFilePath(),
        path.join(workDir, 'token.json')
      )

      const file = path.join(workDir, 'webout-program.js')
      writeFileSync(file, program)
      // The JS session seeds this with no trailing newline (Session.ts).
      writeFileSync(headersFilePath(), 'content-type: text/html; charset=utf-8')

      try {
        const stdout = execFileSync(process.execPath, [file], {
          cwd: workDir
        }).toString()

        return {
          stdout,
          stderr: '',
          failed: false,
          body: readFileSync(weboutFilePath(), 'utf-8'),
          headers: readFileSync(headersFilePath(), 'utf-8')
        }
      } catch (err: any) {
        return {
          stdout: (err.stdout ?? '').toString(),
          stderr: (err.stderr ?? err.message ?? '').toString(),
          failed: true,
          body: existsSync(weboutFilePath())
            ? readFileSync(weboutFilePath(), 'utf-8')
            : '',
          headers: readFileSync(headersFilePath(), 'utf-8')
        }
      }
    }

    it('streams one JSON object, with the content type set', async () => {
      const { body, headers, failed } = await runProgram(`
webout('OPEN')
webout('OBJ', 'users', [{ name: 'a' }, { name: 'b' }])
webout('ARR', 'pairs', [[1, 2], [3, 4]])
webout('CLOSE')
`)

      expect(failed).toEqual(false)

      // The line the header file already held must stay readable on its own -
      // the helper appends, and the seed has no trailing newline.
      expect(headers.split('\n')[0]).toEqual(
        'content-type: text/html; charset=utf-8'
      )
      expect(headers).toContain('content-type: application/json')

      const parsed = JSON.parse(body)

      expect(parsed.users).toEqual([{ name: 'a' }, { name: 'b' }])
      expect(parsed.pairs).toEqual([
        [1, 2],
        [3, 4]
      ])

      // The fields %ms_webout(CLOSE) adds, in the SAS formats a consumer reads.
      expect(parsed.SYSDATE).toMatch(/^\d{2}[A-Z]{3}\d{4}$/)
      expect(parsed.SYSTIME).toMatch(/^\d{2}:\d{2}:\d{2}$/)
      expect(parsed.MF_GETUSER).toEqual('testsuser')
      expect(parsed.SYSUSERID).toEqual('507f1f77bcf86cd799439011')
      expect(parsed._PROGRAM).toEqual('/Public/demo')
      expect(parsed.SYSPROCESSMODE).toEqual('Stored Program')
      expect(parsed.SYSTCPIPHOSTNAME).toEqual('http://localhost:5000')
      expect(parsed.SYSCC).toEqual(0)
      expect(parsed.END_DTTM).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('accepts the actions in any case', async () => {
      const { body, failed } = await runProgram(`
webout('open')
webout('obj', 'rows', [{ a: 1 }])
webout('close')
`)

      expect(failed).toEqual(false)
      expect(JSON.parse(body).rows).toEqual([{ a: 1 }])
    })

    it('refuses a table before OPEN, and an unknown action', async () => {
      const beforeOpen = await runProgram(`webout('OBJ', 'rows', [])`)

      expect(beforeOpen.failed).toEqual(true)
      expect(beforeOpen.stderr).toContain("requires webout('OPEN') first")

      const unknown = await runProgram(`webout('SEND', 'rows', [])`)

      expect(unknown.failed).toEqual(true)
      expect(unknown.stderr).toContain('use OPEN, ARR, OBJ or CLOSE')
    })

    it('refuses rows of the wrong shape for the action', async () => {
      const arr = await runProgram(`
webout('OPEN')
webout('ARR', 'rows', [{ a: 1 }])
`)

      expect(arr.failed).toEqual(true)
      expect(arr.stderr).toContain("webout('ARR') takes positional rows")

      const obj = await runProgram(`
webout('OPEN')
webout('OBJ', 'rows', [[1, 2]])
`)

      expect(obj.failed).toEqual(true)
      expect(obj.stderr).toContain("webout('OBJ') takes rows keyed by column")
    })

    it('names a duplicate CLOSE, and refuses OPEN after CLOSE', async () => {
      const duplicate = await runProgram(`
webout('OPEN')
webout('CLOSE')
webout('CLOSE')
`)

      expect(duplicate.failed).toEqual(true)
      expect(duplicate.stderr).toContain(
        "webout('CLOSE') has already been called"
      )

      // A second OPEN must not truncate a body that is already complete.
      const reopen = await runProgram(`
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])
webout('CLOSE')
webout('OPEN')
`)

      expect(reopen.failed).toEqual(true)
      expect(reopen.stderr).toContain("cannot follow webout('CLOSE')")
      expect(JSON.parse(reopen.body).rows).toEqual([{ a: 1 }])
    })

    it('writes an undefined config value as null, not as broken JSON', async () => {
      // The generated program passes literals, so asLiteral already turns a
      // missing value into ''; a caller that requires the helper itself can
      // pass anything, and one undefined field would otherwise make the whole
      // envelope unparseable.
      await generate('js', 'value') // writes sasjs-webout.js into the session folder

      const weboutUndefinedPath = path.join(workDir, 'webout-undefined.txt')
      const headersUndefinedPath = path.join(workDir, 'headers-undefined.txt')
      const scriptPath = path.join(workDir, 'undefined-config.js')

      writeFileSync(headersUndefinedPath, 'content-type: text/html')
      writeFileSync(
        scriptPath,
        [
          "const webout = require('./sasjs-webout.js')({",
          `  weboutPath: ${JSON.stringify(weboutUndefinedPath)},`,
          `  headersPath: ${JSON.stringify(headersUndefinedPath)},`,
          '  program: undefined,',
          '  debug: undefined,',
          '  username: undefined,',
          '  userId: undefined,',
          '  apiServerUrl: undefined',
          '})',
          "webout('OPEN')",
          "webout('CLOSE')"
        ].join('\n')
      )

      execFileSync(process.execPath, [scriptPath], { cwd: workDir })

      const parsed = JSON.parse(readFileSync(weboutUndefinedPath, 'utf-8'))

      expect(parsed.SYSTCPIPHOSTNAME).toBeNull()
      expect(parsed.MF_GETUSER).toBeNull()
      expect(parsed._PROGRAM).toBeNull()
    })

    it('lets the program override the content type after OPEN', async () => {
      const { body, headers, failed } = await runProgram(`
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])
fs.appendFileSync(_SASJS_WEBOUT_HEADERS, '\\ncontent-type: text/csv\\n')
webout('CLOSE')
`)

      expect(failed).toEqual(false)
      expect(JSON.parse(body).rows).toEqual([{ a: 1 }])

      // Execution builds the response headers through extractHeaders, which
      // takes the LAST record it sees for a key. Asserting precedence here is
      // what stops a change in that rule from serving every JSON body as
      // text/html without a failing test.
      expect(extractHeaders(headers)['content-type']).toEqual('text/csv')
    })

    it('reports a missing CLOSE without repairing it', async () => {
      const { body, stdout, failed } = await runProgram(`
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])
`)

      expect(failed).toEqual(false)
      expect(stdout).toContain("webout('CLOSE') was not")

      // The program owns the close - the body is what it wrote, and it is not
      // valid JSON, exactly as a SAS program that omits %ms_webout(CLOSE).
      expect(() => JSON.parse(body)).toThrow()
    })

    it('keeps the streamed body when _webout is also assigned', async () => {
      const { body, stdout, failed } = await runProgram(`
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])
webout('CLOSE')
_webout = 'assigned too'
`)

      expect(failed).toEqual(false)
      expect(JSON.parse(body).rows).toEqual([{ a: 1 }])
      expect(stdout).toContain('the assignment is ignored')
    })

    it('still writes a program that only assigns _webout', async () => {
      const { body, headers, failed } = await runProgram(
        `_webout = '<h1>raw</h1>'`
      )

      expect(failed).toEqual(false)
      expect(body).toEqual('<h1>raw</h1>')
      // A raw assignment owns its own content type.
      expect(headers).toEqual('content-type: text/html; charset=utf-8')
    })

    it('lets the program require fs itself', async () => {
      const { body, failed, stderr } = await runProgram(`
const fs = require('fs')
fs.writeFileSync(weboutPath, 'from the program')
`)

      // Before the runtime assigned fs as a global, this failed to parse with
      // "Identifier 'fs' has already been declared" and returned no body.
      expect(stderr).not.toContain('already been declared')
      expect(failed).toEqual(false)
      expect(body).toEqual('from the program')
    })
  })

  describe('parameter names', () => {
    it('emits only v7 SAS names, and reports the rest', async () => {
      const warn = jest.fn()
      const logger = (process as any).logger
      ;(process as any).logger = { ...logger, warn }

      const program = await generate('js', 'value')
      const programWithBadNames = await createJSProgram(
        '/* stored program */',
        preProgramVariables,
        { '1invalid': 'a', 'has-dash': 'b', 'has space': 'c', ok_name: 'd' },
        session,
        path.join(workDir, 'webout.json'),
        path.join(workDir, 'headers.json'),
        path.join(workDir, 'token.json')
      )

      expect(programWithBadNames).toContain('const ok_name =')
      expect(programWithBadNames).not.toContain('1invalid')
      expect(programWithBadNames).not.toContain('has-dash')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('1invalid'))
      expect(program).toContain('const userparam =')

      ;(process as any).logger = logger
    })
  })

  describe('display name', () => {
    it('is emitted as a literal, so a hostile name cannot break out', async () => {
      const program = await createJSProgram(
        '/* stored program */',
        {
          ...preProgramVariables,
          displayName: "'; require('child_process').execSync('id'); //"
        },
        {},
        session,
        path.join(workDir, 'webout.json'),
        path.join(workDir, 'headers.json'),
        path.join(workDir, 'token.json')
      )

      expect(program).toContain(
        "const _SASJS_DISPLAYNAME = \"'; require('child_process').execSync('id'); //\";"
      )
    })
  })
})
