import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createJSProgram } from '../createJSProgram'
import { normalizeTierQuery } from '../../../utils/tierQuery'

test('normalized tier inputs preserve JS locals and exact-case body bindings', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sasjs-tier-case-'))
  try {
    for (const name of ['count', 'COUNT', 'CoUnT']) {
      const query = `/?_PROGRAM=/example&${name}=99`
      const vars = Object.fromEntries(
        new URLSearchParams(normalizeTierQuery(query).search)
      )
      const output = path.join(dir, 'result.json')
      const generated = await createJSProgram(
        `var Count = 5; Count++;
        function strictLocal() { 'use strict'; let Count = 7; return Count; }
        fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify({ Count, count, BodyField, _program, strict: strictLocal() }))`,
        {} as any,
        { ...vars, BodyField: 'body' },
        { path: dir } as any,
        path.join(dir, 'webout'),
        path.join(dir, 'headers'),
        path.join(dir, 'token')
      )
      const script = path.join(dir, 'job.js')
      writeFileSync(script, generated)
      execFileSync(process.execPath, [script])
      expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual({
        Count: 6,
        count: '99',
        BodyField: 'body',
        _program: '/example',
        strict: 7
      })
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
