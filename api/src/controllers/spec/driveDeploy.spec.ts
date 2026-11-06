process.env.NODE_ENV = 'test'

import path from 'path'
import fs from 'fs'
import os from 'os'
import { MemberType } from '@sasjs/utils'
import * as fileUtilModules from '../../utils/file'
import { DriveController } from '../drive'
import { DEPLOY_LIMITS } from '../../utils/deployLimits'

/**
 * The deploy cap at the controller, where the promise is made.
 *
 * `checkDeployTree` proves the measurement; this proves the wiring - that the
 * check runs BEFORE anything is written, so a refused deploy leaves the drive
 * exactly as it was - and that an ordinary tree still deploys, so the cap is not
 * a gate that refuses everything.
 *
 * The drive is a temp folder, as in the node-drive-store spec: this suite must
 * not write into the checkout's own drive.
 */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-cap-'))
const filesFolder = path.join(tmp, 'drive', 'files')

jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => filesFolder)

const tree = (members: any[]) => ({ members })

describe('deploy', () => {
  const appLoc = '/Public/deploy-cap-spec'
  const target = path.join(filesFolder, 'Public', 'deploy-cap-spec')

  beforeAll(() => {
    fs.mkdirSync(filesFolder, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  it('writes a tree that fits the cap', async () => {
    // the positive control: a cap that refuses everything would pass the
    // refusal case below and be worse than no cap at all
    const controller = new DriveController()

    await expect(
      controller.deploy({
        appLoc,
        fileTree: tree([
          {
            name: 'jobs',
            type: MemberType.folder,
            members: [
              {
                name: 'hello',
                type: MemberType.service,
                code: '%put NOTE: hello from the deploy spec;'
              }
            ]
          }
        ])
      } as any)
    ).resolves.toMatchObject({ status: 'success' })

    expect(fs.existsSync(path.join(target, 'jobs', 'hello.sas'))).toBe(true)
  })

  it('refuses a file past the per-file limit, and writes nothing at all', async () => {
    const controller = new DriveController()

    // one byte over the per-file limit: the smallest tree that must be refused,
    // and it names the file so the reader knows what to shrink
    const oversized = Buffer.alloc(DEPLOY_LIMITS.fileBytes + 1).toString(
      'base64'
    )

    await expect(
      controller.deploy({
        appLoc: '/Public/deploy-cap-spec-refused',
        fileTree: tree([
          { name: 'too-big.bin', type: MemberType.file, code: oversized }
        ])
      } as any)
    ).rejects.toMatchObject({
      code: 413,
      status: 'failure',
      message: expect.stringContaining(
        'too-big.bin is 20 MB (maximum 20 MB per file).'
      )
    })

    // the refusal is worth nothing if half the tree was written first
    expect(
      fs.existsSync(path.join(filesFolder, 'Public', 'deploy-cap-spec-refused'))
    ).toBe(false)
  }, 60000)
})
