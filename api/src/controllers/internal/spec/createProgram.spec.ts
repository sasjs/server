import { execFileSync } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import {
  createJSProgram,
  createPythonProgram,
  createRProgram,
  createSASProgram
} from '..'
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
