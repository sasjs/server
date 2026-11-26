import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { SASSessionController } from '../Session'
import { Session, SessionState } from '../../../types'

class InspectableSASController extends SASSessionController {
  get allSessions(): Session[] {
    return this.sessions
  }
}

describe('failed SAS startup', () => {
  it('does not reserve a failed process as running', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'sas-startup-failure-'))
    const previousRoot = process.sasjsRoot
    const previousSasLoc = process.sasLoc
    const previousDrive = process.driveLoc
    const previousLogger = process.logger
    process.logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any
    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
    process.sasLoc = '/usr/bin/false'
    const controller = new InspectableSASController()
    try {
      await expect(controller.getSession('test')).rejects.toThrow()
      expect(controller.allSessions).toHaveLength(1)
      expect(controller.allSessions[0].state).toBe(SessionState.failed)
      expect(controller.allSessions[0].pid).toBeUndefined()
      expect(controller.allSessions[0].failureReason).toBeTruthy()
    } finally {
      process.sasjsRoot = previousRoot
      process.sasLoc = previousSasLoc
      process.driveLoc = previousDrive
      process.logger = previousLogger
      await rm(root, { recursive: true, force: true })
    }
  })
})
