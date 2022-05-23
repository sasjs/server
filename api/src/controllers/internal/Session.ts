import path from 'path'
import { Session } from '../../types'
import { promisify } from 'util'
import { execFile } from 'child_process'
import {
  getSessionsFolder,
  generateUniqueFileName,
  sysInitCompiledPath
} from '../../utils'
import {
  deleteFolder,
  createFile,
  fileExists,
  generateTimestamp,
  readFile
} from '@sasjs/utils'

const execFilePromise = promisify(execFile)

export class SessionController {
  private sessions: Session[] = []

  private getReadySessions = (): Session[] =>
    this.sessions.filter((sess: Session) => sess.ready && !sess.consumed)

  public async getSession() {
    const readySessions = this.getReadySessions()

    const session = readySessions.length
      ? readySessions[0]
      : await this.createSession()

    if (readySessions.length < 3) this.createSession()

    return session
  }

  private async createSession(): Promise<Session> {
    const sessionId = generateUniqueFileName(generateTimestamp())
    const sessionFolder = path.join(getSessionsFolder(), sessionId)

    const creationTimeStamp = sessionId.split('-').pop() as string
    // death time of session is 15 mins from creation
    const deathTimeStamp = (
      parseInt(creationTimeStamp) +
      15 * 60 * 1000 -
      1000
    ).toString()

    const session: Session = {
      id: sessionId,
      ready: false,
      inUse: false,
      consumed: false,
      completed: false,
      creationTimeStamp,
      deathTimeStamp,
      path: sessionFolder
    }

    // we do not want to leave sessions running forever
    // we clean them up after a predefined period, if unused
    this.scheduleSessionDestroy(session)

    // Place compiled system init code to autoexec
    const compiledSystemInitContent = await readFile(sysInitCompiledPath)

    // the autoexec file is executed on SAS startup
    const autoExecPath = path.join(sessionFolder, 'autoexec.sas')
    const contentForAutoExec = `/* compiled systemInit */
${compiledSystemInitContent}
/* autoexec */
${autoExecContent}`
    await createFile(autoExecPath, contentForAutoExec)

    // create empty code.sas as SAS will not start without a SYSIN
    const codePath = path.join(session.path, 'code.sas')
    await createFile(codePath, '')

    // trigger SAS but don't wait for completion - we need to
    // update the session array to say that it is currently running
    // however we also need a promise so that we can update the
    // session array to say that it has (eventually) finished.

    execFilePromise(process.sasLoc, [
      '-SYSIN',
      codePath,
      '-LOG',
      path.join(session.path, 'log.log'),
      '-PRINT',
      path.join(session.path, 'output.lst'),
      '-WORK',
      session.path,
      '-AUTOEXEC',
      autoExecPath,
      process.platform === 'win32' ? '-nosplash' : ''
    ])
      .then(() => {
        session.completed = true
        console.log('session completed', session)
      })
      .catch((err) => {
        session.completed = true
        session.crashed = err.toString()
        console.log('session crashed', session.id, session.crashed)
      })

    // we have a triggered session - add to array
    this.sessions.push(session)

    // SAS has been triggered but we can't use it until
    // the autoexec deletes the code.sas file
    await this.waitForSession(session)

    return session
  }

  private async waitForSession(session: Session) {
    const codeFilePath = path.join(session.path, 'code.sas')

    // TODO: don't wait forever
    while ((await fileExists(codeFilePath)) && !session.crashed) {}

    if (session.crashed)
      console.log('session crashed! while waiting to be ready', session.crashed)

    session.ready = true
  }

  public async deleteSession(session: Session) {
    // remove the temporary files, to avoid buildup
    await deleteFolder(session.path)

    // remove the session from the session array
    this.sessions = this.sessions.filter(
      (sess: Session) => sess.id !== session.id
    )
  }

  private scheduleSessionDestroy(session: Session) {
    setTimeout(async () => {
      if (session.inUse) {
        // adding 10 more minutes
        const newDeathTimeStamp = parseInt(session.deathTimeStamp) + 10 * 1000
        session.deathTimeStamp = newDeathTimeStamp.toString()

        this.scheduleSessionDestroy(session)
      } else {
        await this.deleteSession(session)
      }
    }, parseInt(session.deathTimeStamp) - new Date().getTime() - 100)
  }
}

export const getSessionController = (): SessionController => {
  if (process.sessionController) return process.sessionController

  process.sessionController = new SessionController()

  return process.sessionController
}

const autoExecContent = `
data _null_;
  /* remove the dummy SYSIN */
  length fname $8;
  call missing(fname);
  rc=filename(fname,getoption('SYSIN') );
  if rc = 0 and fexist(fname) then rc=fdelete(fname);
  rc=filename(fname);
  /* now wait for the real SYSIN */
  slept=0;
  do until ( fileexist(getoption('SYSIN')) or slept>(60*15) );
    slept=slept+sleep(0.01,1);
  end;
  stop;
run;
`
