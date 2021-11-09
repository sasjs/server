import { Session } from '../types'
import { getTmpSessionsFolderPath, generateUniqueFileName } from '../utils'
import {
  deleteFolder,
  createFile,
  fileExists,
  deleteFile,
  generateTimestamp
} from '@sasjs/utils'
import path from 'path'
import { ExecutionController } from './Execution'

export class SessionController {
  private sessions: Session[] = []
  private executionController: ExecutionController

  constructor() {
    this.executionController = new ExecutionController()
  }

  public async getSession() {
    const readySessions = this.sessions.filter((sess: Session) => sess.ready)

    const session = readySessions.length
      ? readySessions[0]
      : await this.createSession()

    if (readySessions.length < 2) this.createSession()

    return session
  }

  private async createSession() {
    const sessionId = generateUniqueFileName(generateTimestamp())
    const sessionFolder = path.join(await getTmpSessionsFolderPath(), sessionId)

    const autoExecContent = `data _null_;
    /* remove the dummy SYSIN */
    length fname $8;
    rc=filename(fname,getoption('SYSIN') );
    if rc = 0 and fexist(fname) then rc=fdelete(fname);
    rc=filename(fname);
    /* now wait for the real SYSIN */
    slept=0;
    do until ( fileexist(getoption('SYSIN')) or slept>(60*15) );
      slept=slept+sleep(0.01,1);
    end;
  run;
  EOL`

    const autoExec = path.join(sessionFolder, 'autoexec.sas')
    await createFile(autoExec, autoExecContent)

    await createFile(path.join(sessionFolder, 'code.sas'), '')

    const creationTimeStamp = sessionId.split('-').pop() as string

    const session: Session = {
      id: sessionId,
      ready: false,
      creationTimeStamp: creationTimeStamp,
      deathTimeStamp: (
        parseInt(creationTimeStamp) +
        15 * 60 * 1000 -
        1000
      ).toString(),
      path: sessionFolder,
      inUse: false
    }

    this.scheduleSessionDestroy(session)

    this.executionController.execute('', autoExec, session).catch(() => {})

    this.sessions.push(session)

    await this.waitForSession(session)

    return session
  }

  public async waitForSession(session: Session) {
    if (await fileExists(path.join(session.path, 'code.sas'))) {
      while (await fileExists(path.join(session.path, 'code.sas'))) {}

      await deleteFile(path.join(session.path, 'log.log'))

      session.ready = true

      return Promise.resolve(session)
    } else {
      session.ready = true

      return Promise.resolve(session)
    }
  }

  public async deleteSession(session: Session) {
    await deleteFolder(session.path)

    if (session.ready) {
      this.sessions = this.sessions.filter(
        (sess: Session) => sess.id !== session.id
      )
    }
  }

  private scheduleSessionDestroy(session: Session) {
    setTimeout(async () => {
      if (session.inUse) {
        session.deathTimeStamp = session.deathTimeStamp + 1000 * 10

        this.scheduleSessionDestroy(session)
      } else {
        await this.deleteSession(session)
      }
    }, parseInt(session.deathTimeStamp) - new Date().getTime() - 100)
  }
}

export const getSessionController = () => {
  if (process.sessionController) return process.sessionController

  process.sessionController = new SessionController()

  return process.sessionController
}
