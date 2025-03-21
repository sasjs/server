import path from 'path'
import { Session, SessionState } from '../../types'
import { promisify } from 'util'
import { execFile } from 'child_process'
import {
  getPackagesFolder,
  getSessionsFolder,
  generateUniqueFileName,
  sysInitCompiledPath,
  RunTimeType
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
  protected sessions: Session[] = []

  protected getReadySessions = (): Session[] =>
    this.sessions.filter(
      (session: Session) => session.state === SessionState.pending
    )

  protected async createSession(): Promise<Session> {
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
      state: SessionState.pending,
      creationTimeStamp,
      deathTimeStamp,
      path: sessionFolder
    }

    const headersPath = path.join(session.path, 'stpsrv_header.txt')

    await createFile(headersPath, 'content-type: text/html; charset=utf-8')

    this.sessions.push(session)

    return session
  }

  public async getSession() {
    const readySessions = this.getReadySessions()

    const session = readySessions.length
      ? readySessions[0]
      : await this.createSession()

    if (readySessions.length < 3) this.createSession()

    return session
  }

  public getSessionById(id: string) {
    return this.sessions.find((session) => session.id === id)
  }
}

export class SASSessionController extends SessionController {
  protected async createSession(): Promise<Session> {
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
      state: SessionState.initialising,
      creationTimeStamp,
      deathTimeStamp,
      path: sessionFolder
    }

    const headersPath = path.join(session.path, 'stpsrv_header.txt')
    await createFile(headersPath, 'content-type: text/html; charset=utf-8\n')

    // we do not want to leave sessions running forever
    // we clean them up after a predefined period, if unused
    this.scheduleSessionDestroy(session)

    // Place compiled system init code to autoexec
    const compiledSystemInitContent = await readFile(sysInitCompiledPath)

    // the autoexec file is executed on SAS startup
    const autoExecPath = path.join(sessionFolder, 'autoexec.sas')
    const contentForAutoExec = `filename packages "${getPackagesFolder()}";
/* compiled systemInit */
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

    // Additional windows specific options to avoid the desktop popups.

    execFilePromise(process.sasLoc!, [
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
      process.sasLoc!.endsWith('sas.exe') ? '-nologo' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-nosplash' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-icon' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-nodms' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-noterminal' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-nostatuswin' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-NOPRNGETLIST' : '',
      process.sasLoc!.endsWith('sas.exe') ? '-SASINITIALFOLDER' : '',
      process.sasLoc!.endsWith('sas.exe') ? session.path : ''
    ])
      .then(() => {
        session.state = SessionState.completed

        process.logger.info('session completed', session)
      })
      .catch((err) => {
        session.state = SessionState.failed

        session.failureReason = err.toString()

        process.logger.error(
          'session crashed',
          session.id,
          session.failureReason
        )
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
    while (
      (await fileExists(codeFilePath)) &&
      session.state !== SessionState.failed
    ) {}

    if (session.state === SessionState.failed) {
      process.logger.error(
        'session crashed! while waiting to be ready',
        session.failureReason
      )
    } else {
      session.state = SessionState.pending
    }
  }

  private async deleteSession(session: Session) {
    // remove the temporary files, to avoid buildup
    await deleteFolder(session.path)

    // remove the session from the session array
    this.sessions = this.sessions.filter(
      (sess: Session) => sess.id !== session.id
    )
  }

  private scheduleSessionDestroy(session: Session) {
    setTimeout(
      async () => {
        if (session.state === SessionState.running) {
          // adding 10 more minutes
          const newDeathTimeStamp =
            parseInt(session.deathTimeStamp) + 10 * 60 * 1000
          session.deathTimeStamp = newDeathTimeStamp.toString()

          this.scheduleSessionDestroy(session)
        } else {
          const { expiresAfterMins } = session

          // delay session destroy if expiresAfterMins present
          if (expiresAfterMins && session.state !== SessionState.completed) {
            // calculate session death time using expiresAfterMins
            const newDeathTimeStamp =
              parseInt(session.deathTimeStamp) +
              expiresAfterMins.mins * 60 * 1000
            session.deathTimeStamp = newDeathTimeStamp.toString()

            // set expiresAfterMins to true to avoid using it again
            session.expiresAfterMins!.used = true

            this.scheduleSessionDestroy(session)
          } else {
            await this.deleteSession(session)
          }
        }
      },
      parseInt(session.deathTimeStamp) - new Date().getTime() - 100
    )
  }
}

export const getSessionController = (
  runTime: RunTimeType
): SessionController => {
  if (runTime === RunTimeType.SAS) {
    process.sasSessionController =
      process.sasSessionController || new SASSessionController()

    return process.sasSessionController
  }

  process.sessionController =
    process.sessionController || new SessionController()

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
  /* now wait for the real SYSIN (location of code.sas) */
  slept=0;fname='';
  do until (slept>(60*15));
    rc=filename(fname,getoption('SYSIN'));
    if rc = 0 and fexist(fname) then do;
      putlog fname=;
      rc=filename(fname);
      rc=sleep(0.01,1); /* wait just a little more */
      stop;
    end;
    slept=slept+sleep(0.01,1);
  end;
  stop;
run;
`
