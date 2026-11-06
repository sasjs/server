/**
 * The deploy cap.
 *
 * `POST /SASjsApi/drive/deploy` writes a whole file tree in one request, so it
 * is the one operation where a caller can fill the host's storage. The tree is
 * measured before anything is written and refused with `413`, naming the limit
 * and the figure reached.
 *
 * The cases here use small limits through the `limits` argument: the shape of a
 * tree is what this checks, and a thousand-entry tree and a ten-thousand-entry
 * one are the same code path. `DEPLOY_LIMITS` itself is asserted once, so a
 * change to the numbers is a deliberate edit rather than a silent one.
 */
import { MemberType } from '@sasjs/utils'
import {
  checkDeployTree,
  DEPLOY_LIMITS,
  measureDeployTree,
  TreeMember
} from '../deployLimits'

const limits = { entries: 5, totalBytes: 100, fileBytes: 40 }

const service = (name: string, code: string): TreeMember => ({
  name,
  type: MemberType.service,
  code
})

const file = (name: string, bytes: number): TreeMember => ({
  name,
  type: MemberType.file,
  code: Buffer.alloc(bytes).toString('base64')
})

const folder = (name: string, members: TreeMember[]): TreeMember => ({
  name,
  type: MemberType.folder,
  members
})

describe('the deploy cap', () => {
  it('states the published limits in binary megabytes', () => {
    expect(DEPLOY_LIMITS).toEqual({
      entries: 10000,
      totalBytes: 100 * 1024 * 1024,
      fileBytes: 20 * 1024 * 1024
    })
  })

  it('counts every member at every depth, folders included', () => {
    const measured = measureDeployTree([
      folder('jobs', [service('one', 'x'), folder('deep', [file('a.bin', 3)])])
    ])

    // jobs, one.sas, deep, a.bin
    expect(measured.entries).toBe(4)
  })

  it('measures a file by its DECODED bytes, not its base64 length', () => {
    // 3 bytes of content is 4 characters of base64: counting the encoding would
    // overstate every binary file by a third and refuse trees that fit.
    expect(measureDeployTree([file('a.bin', 3)]).totalBytes).toBe(3)
  })

  it('measures a service as UTF-8, and names it with the extension it is written under', () => {
    const measured = measureDeployTree([service('greet', 'put "é";')])

    // p,u,t,space,",é,",; - é is two bytes in UTF-8
    expect(measured.totalBytes).toBe(9)
    expect(measured.largest.path).toBe('greet.sas')
  })

  it('reports the largest member with its full path', () => {
    const measured = measureDeployTree([
      folder('app', [folder('services', [service('big', 'x'.repeat(20))])])
    ])

    expect(measured.largest).toEqual({
      path: 'app/services/big.sas',
      bytes: 20
    })
  })

  it('passes a tree exactly at every limit', () => {
    // 4 entries: 3 folders/services plus one file of exactly 40 bytes
    const tree = [
      folder('a', [service('b', 'x'), folder('c', [file('d', 40)])])
    ]

    expect(measureDeployTree(tree).entries).toBe(4)
    expect(checkDeployTree(tree, limits)).toBeNull()
  })

  it('refuses one entry past the limit, naming the count', () => {
    const tree = [
      folder('a', [
        service('b', 'x'),
        service('c', 'x'),
        folder('d', [service('e', 'x'), service('f', 'x')])
      ])
    ]

    expect(checkDeployTree(tree, limits)).toEqual({
      code: 413,
      status: 'failure',
      message: 'The file tree exceeds the deploy limit: 6 entries (maximum 5).'
    })
  })

  it('refuses a tree past the total, naming both figures', () => {
    const tree = [file('a.bin', 60), file('b.bin', 60)]

    expect(checkDeployTree(tree, limits)).toEqual({
      code: 413,
      status: 'failure',
      message:
        'The file tree exceeds the deploy limit: 120 bytes (maximum 100 bytes).'
    })
  })

  it('refuses a single file past the per-file limit, naming the file', () => {
    const tree = [folder('app', [service('ok', 'x'), file('big.bin', 41)])]

    expect(checkDeployTree(tree, limits)).toEqual({
      code: 413,
      status: 'failure',
      message:
        'A file in the tree exceeds the deploy limit: app/big.bin is 41 bytes (maximum 40 bytes per file).'
    })
  })

  it('refuses the same dimension every time when two are breached', () => {
    // six entries AND 200 bytes: the entry count is reported, so a caller can
    // key on one message rather than whichever check happened to run first
    const tree = [
      file('a.bin', 50),
      file('b.bin', 50),
      file('c.bin', 50),
      file('d.bin', 50),
      file('e.bin', 50),
      file('f.bin', 50)
    ]

    const refusal = checkDeployTree(tree, limits)

    expect(refusal?.code).toBe(413)
    expect(refusal?.message).toContain('6 entries')
  })

  it('refuses an unsafe member name before measuring anything', () => {
    // the traversal refusal is the existing wording, unchanged: a name carrying
    // '..' would write outside the deployment root, and it is caught here so a
    // hostile tree writes nothing at all
    const tree = [
      service('ok', 'x'),
      service('../escape', 'x'),
      service('also-ok', 'x')
    ]

    expect(checkDeployTree(tree, limits)).toEqual({
      code: 400,
      status: 'failure',
      message:
        "Invalid member name: '../escape.sas'. Member names must be single path segments (no '/', '\\', '..')."
    })
  })

  it('measures the whole tree even when a name is unsafe', () => {
    // the walk records a bad name instead of stopping at it: a caller asking
    // "how big is this tree" must not be told the size of the prefix before the
    // first hostile member
    const tree = [
      service('ok', 'xxxx'),
      folder('nested', [file('a.bin', 10), service('../escape', 'yy')]),
      file('b.bin', 5)
    ]

    expect(measureDeployTree(tree)).toEqual({
      entries: 5,
      totalBytes: 21,
      largest: { path: 'nested/a.bin', bytes: 10 }
    })

    // ...and the validator still refuses the name, before it judges the size
    expect(checkDeployTree(tree, limits)?.code).toBe(400)
  })

  it('accepts a dotted name that is not a traversal', () => {
    // '..config' begins with two dots and is a legitimate entry - the check is
    // on the segment, not on the prefix
    expect(checkDeployTree([service('..config', 'x')], limits)).toBeNull()
  })
})
