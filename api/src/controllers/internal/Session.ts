import path from 'path'
import { readFileSync } from 'fs'
import { Session, SessionState } from '../../types'
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
  createFolder,
  fileExists,
  generateTimestamp,
  moveFile,
  readFile
} from '@sasjs/utils'

/**
 * Runs the session's process and records its pid on the session.
 *
 * promisify(execFile) discards the ChildProcess, and a caller polling a
 * triggered program has no other way to name the process it started - the
 * pid is what makes the session identifiable outside the API
 * (sasjs/server#380).
 */
const runSessionProcess = (
  session: Session,
  file: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = execFile(file, args, (err, stdout, stderr) => {
      if (err) {
        // promisify(execFile) rejected with these attached. Nothing in the
        // tree reads them today - the failure path uses err.toString() and the
        // log file - so this is parity with the rejection shape this code
        // replaced, kept so a future diagnosis finds the output where node
        // would have put it.
        err.stdout = stdout
        err.stderr = stderr

        return reject(err)
      }

      resolve({ stdout, stderr })
    })

    if (child.pid) {
      session.pid = child.pid
      session.pidStartedAt = readProcessStartTime(child.pid)
    }
  })

/**
 * How often a live process is re-checked while it is being waited for.
 */
const EXIT_POLL_MS = 50

/**
 * How long a session gets to finish by itself when the server is shutting down.
 *
 * The whole stop is bounded by three budgets: this one, the two below, and the
 * listener close in `listen.ts` (5s) - 9 seconds in the worst case. That is
 * deliberately under the 10 second timeout the deployment docs tell a supervisor
 * to allow, because a supervisor's SIGKILL cannot be caught: hitting it would
 * orphan the very processes this is here to end.
 *
 * The three are summed, not nested: each phase gets its own slice, so a session
 * that ignores SIGTERM cannot borrow the time reserved for confirming the SIGKILL.
 */
export interface DrainBudget {
  /** Time the session gets to finish on its own. */
  graceMs: number
  /** Time it gets after SIGTERM. */
  sigtermMs: number
  /** Time it gets after SIGKILL, which is also the longest the process can take
   * to be reaped and so the only way to know the folder is safe to remove. */
  sigkillMs: number
}

/** 2000 + 1000 + 1000: the 4 second drain half of the 9 second stop budget. */
export const DEFAULT_DRAIN_BUDGET: DrainBudget = {
  graceMs: 2000,
  sigtermMs: 1000,
  sigkillMs: 1000
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Whether an OS process is still running.
 *
 * Signal 0 is the probe: it runs the existence and permission checks without
 * delivering anything. `ESRCH` is the only answer that means "gone" - `EPERM`
 * means the process is there and belongs to somebody else, so it counts as
 * alive. `pid` is optional because `sasviya` sessions never have one.
 */
export const isProcessAlive = (pid?: number): boolean => {
  if (!pid) return false

  try {
    process.kill(pid, 0)

    return true
  } catch (error: any) {
    return error?.code !== 'ESRCH'
  }
}

/**
 * The time a process started, as the OS reports it, or `undefined` where the
 * platform does not expose it.
 *
 * A pid alone cannot tell a live session's process from an unrelated one that
 * reused the number, and both `process.kill(pid, 0)` and a real signal act on
 * whatever holds the pid now. The start time (field 22 of `/proc/<pid>/stat`,
 * clock ticks since boot) never repeats for a given pid, so recording it when the
 * process is spawned makes the pair an identity.
 *
 * Read from `/proc`, which exists on Linux and not on macOS or Windows - there
 * `undefined` means "no identity to compare", and the caller falls back to the
 * pid, which is what it had before.
 */
export const readProcessStartTime = (pid?: number): string | undefined => {
  if (!pid) return undefined

  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')

    // field 2 (`comm`) is parenthesised and may itself contain spaces or
    // parentheses, so the fields after it are counted from the last ')'
    const fields = stat
      .slice(stat.lastIndexOf(')') + 2)
      .trim()
      .split(' ')

    // the slice starts at field 3, so starttime - field 22 - is index 19
    return fields[19]
  } catch {
    return undefined
  }
}

export class SessionController {
  protected sessions: Session[] = []

  /**
   * Whether anything is still using this session.
   *
   * `state` on its own is not enough to decide that a session's folder can be
   * removed. The destroy timer can fire in the window between a process being
   * spawned and its state moving off `pending`, and deleting the folder in that
   * window is what produced the `Failed to open .../code.sas` crash reported in
   * sasjs/server#162: the process was still running, and its SYSIN had been
   * taken away underneath it.
   *
   * The process is the fact; the state is bookkeeping. So a live pid keeps the
   * session alive whatever the state says.
   */
  protected isSessionActive = (session: Session): boolean =>
    session.state === SessionState.running || isProcessAlive(session.pid)

  protected getReadySessions = (): Session[] =>
    this.sessions.filter(
      (session: Session) => session.state === SessionState.pending
    )

  protected async createSession(username: string): Promise<Session> {
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
      path: sessionFolder,
      owner: username
    }

    const headersPath = path.join(session.path, 'stpsrv_header.txt')

    await createFile(headersPath, 'content-type: text/html; charset=utf-8')

    // we do not want to leave sessions running forever
    // we clean them up after a predefined period, if unused
    this.scheduleSessionDestroy(session)

    this.sessions.push(session)

    return session
  }

  public async getSession(username: string) {
    const readySessions = this.getReadySessions()

    const session = readySessions.length
      ? readySessions[0]
      : await this.createSession(username)

    // a pending session has never run anything, so handing it to this caller
    // makes this caller its owner; the pool is a warm start, not a transfer of
    // one user's session to another
    session.owner = username

    if (readySessions.length < 3) this.createSession(username)

    return session
  }

  public getSessionById(id: string) {
    return this.sessions.find((session) => session.id === id)
  }

  protected async deleteSession(session: Session) {
    // remove the temporary files, to avoid buildup
    await deleteFolder(session.path)

    // remove the session from the session array
    this.sessions = this.sessions.filter(
      (sess: Session) => sess.id !== session.id
    )
  }

  /**
   * Removes the session once it is no longer needed, so a deployment does not
   * accumulate session folders. A session still in use when its death time
   * arrives - running, or with a process that is still alive whatever the state
   * says - is given another 10 minutes; `expiresAfterMins`, when the caller set
   * it, delays the destroy that many minutes past completion.
   *
   * Every runtime schedules this, not just the local SAS one - a triggered
   * program on any runtime would otherwise leave its folder behind forever and
   * `expiresAfterMins` would be silently ignored.
   */
  protected scheduleSessionDestroy(session: Session) {
    // Unref'd, because this timer outlives the work that armed it: it is due at
    // the session's death time, a quarter of an hour away, and nothing else in
    // the process is waiting for it. A server holds listening sockets, so the
    // loop is alive when it fires; a test run - or anything that triggers a
    // session and then finishes - is not, and without this it sat there with an
    // open handle until it was killed (sasjs/server#577).
    setTimeout(
      async () => {
        if (this.isSessionActive(session)) {
          // adding 10 more minutes
          const newDeathTimeStamp =
            parseInt(session.deathTimeStamp) + 10 * 60 * 1000
          session.deathTimeStamp = newDeathTimeStamp.toString()

          this.scheduleSessionDestroy(session)
        } else {
          const { expiresAfterMins } = session

          // Delay the destroy when the caller asked for a retention window.
          //
          // The window is documented as counting from completion, so a
          // *completed* session has to honour it - excluding that state, as an
          // earlier version did, meant the request could never take effect: a
          // finished session was deleted at creation + 15 minutes however long
          // the caller asked to keep it, and a poller that followed a triggered
          // program lost the log and the output
          if (expiresAfterMins && !expiresAfterMins.used) {
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
    ).unref()
  }

  /**
   * Ends the sessions this controller owns.
   *
   * A session *is* an OS process: for the local `sas` runtime it is a pooled SAS
   * process parked in its autoexec loop waiting for a SYSIN, and for every other
   * runtime it is the interpreter running the program. Until this existed,
   * nothing in the tree stopped one, so exiting the server orphaned them: a SAS
   * process kept running - and kept a licence seat - until its own 15 minute idle
   * ceiling expired, once per pooled session per restart.
   *
   * Each session gets `graceMs` to finish by itself, is signalled if it does not,
   * and is killed if it ignores the signal. Its folder is removed only once its
   * process is gone, so a shutdown cannot reproduce the `Failed to open
   * .../code.sas` crash of sasjs/server#162.
   *
   * Sessions are drained in parallel: a pool of three would otherwise take three
   * graces in a row, which no supervisor's kill timeout is sized for.
   */
  public async drain(
    budget: DrainBudget = DEFAULT_DRAIN_BUDGET
  ): Promise<void> {
    if (!this.sessions.length) return

    process.logger?.info(
      `[server] ending ${this.sessions.length} session(s)`,
      this.sessions.map((session) => session.id).join(', ')
    )

    await Promise.all(
      this.sessions.map((session) => this.drainSession(session, budget))
    )
  }

  protected async drainSession(
    session: Session,
    budget: DrainBudget
  ): Promise<void> {
    if (!(await this.waitForProcessExit(session, budget.graceMs))) {
      const gone = await this.terminate(session, budget)

      // A process that survived SIGTERM *and* SIGKILL is stuck in uninterruptible
      // I/O. Its folder is where it is still writing, so removing it would
      // recreate the `Failed to open .../code.sas` failure this change exists to
      // prevent - on a rarer path, but for the same reason. Leave it: the operator
      // clears it once the process is gone.
      if (!gone)
        return process.logger?.error(
          'session did not stop, so its folder was left in place',
          session.id,
          session.pid
        )
    }

    // The process is gone, so the folder can go too. Leaving it would leak one
    // directory per session per restart - the destroy timer that would have
    // removed it lives in the process that is exiting.
    try {
      await this.deleteSession(session)
    } catch (error: any) {
      process.logger?.error(
        'session folder could not be removed on shutdown',
        session.id,
        error?.message ?? error
      )
    }
  }

  /**
   * Whether the process this session recorded is still the one running.
   *
   * A pid is only unique while its process lives. After it exits the number is
   * free for reuse, and `process.kill(pid, 0)` - or a signal - cannot tell the
   * difference, so a drain that trusted it could wait for, and then kill, an
   * unrelated process: another session's interpreter, or whatever the supervisor
   * started. The process start time does not repeat, so it is recorded when the
   * process is spawned and compared here.
   *
   * Where the platform does not expose it, `pidStartedAt` is unset and the pid is
   * the best identity available - the pre-existing behaviour, not a new hole.
   */
  protected isSessionProcess(session: Session): boolean {
    if (!isProcessAlive(session.pid)) return false

    const startedAt = readProcessStartTime(session.pid)

    if (!startedAt || !session.pidStartedAt) return true

    return startedAt === session.pidStartedAt
  }

  /**
   * Resolves true once the session's process has gone, false if it is still
   * running when the deadline passes.
   *
   * Polled on the pid rather than awaited on the process: `execFile`'s child
   * lives inside `runSessionProcess`'s closure, and `session.pid` is the only
   * handle on it that the rest of the controller shares. A session without a pid
   * (`sasviya`, or one that never spawned) has no local process to wait for.
   */
  protected async waitForProcessExit(
    session: Session,
    timeoutMs: number
  ): Promise<boolean> {
    if (!session.pid) return true

    const deadline = new Date().getTime() + timeoutMs

    while (this.isSessionProcess(session)) {
      if (new Date().getTime() >= deadline) return false

      await delay(EXIT_POLL_MS)
    }

    return true
  }

  /**
   * Signals a session that did not finish in time, escalating to SIGKILL, and
   * reports whether the process is gone.
   *
   * SIGTERM comes first because it is the only signal a process can act on: a
   * SAS session mid-program still runs its termination phase and closes its log,
   * where SIGKILL leaves a truncated one. It is not a guarantee - a runaway DATA
   * step can sit in a tight loop for a long time - so the escalation exists
   * rather than hoping. On Windows both signals end the process, which is what
   * the fallback would do anyway.
   */
  protected async terminate(
    session: Session,
    budget: DrainBudget
  ): Promise<boolean> {
    const { pid } = session

    if (!pid) return true

    // the pid is re-checked here: between the wait above and this line the
    // process can exit and the number be handed to something else
    if (!this.isSessionProcess(session)) return true

    session.terminatedByShutdown = true

    process.logger?.warn(
      'session did not finish before shutdown, terminating',
      session.id,
      pid
    )

    this.signal(pid, 'SIGTERM')

    if (await this.waitForProcessExit(session, budget.sigtermMs)) return true

    process.logger?.warn('session ignored SIGTERM, killing', session.id, pid)

    this.signal(pid, 'SIGKILL')

    return this.waitForProcessExit(session, budget.sigkillMs)
  }

  private signal(pid: number, signal: NodeJS.Signals) {
    try {
      process.kill(pid, signal)
    } catch (error: any) {
      // ESRCH means it exited between the probe and the signal, which is the
      // outcome this is trying to produce; anything else is worth a line
      if (error?.code !== 'ESRCH')
        process.logger?.error(
          `could not send ${signal} to the session process`,
          pid,
          error?.message ?? error
        )
    }
  }
}

export class SASSessionController extends SessionController {
  protected async createSession(username: string): Promise<Session> {
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
      path: sessionFolder,
      owner: username
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

    // Each session gets its own SASUSER. SAS copies the SASUSER profile into WORK
    // at startup, and a shared, unwritable one makes that copy fail or race -
    // which is the "Unable to copy SASUSER registry to WORK registry" warning.
    // A writable folder per session lets the copy succeed, so the warning never
    // appears, and it keeps the writes a program legitimately makes to SASUSER
    // (proc template without STORE=, options sasmstore=sasuser, proc format
    // library=sasuser) working. Those writes stay inside this session: the folder
    // is deleted with the rest of it.
    const sasuserPath = path.join(session.path, 'sasuser')
    await createFolder(sasuserPath)

    // create empty code.sas as SAS will not start without a SYSIN
    const codePath = path.join(session.path, 'code.sas')
    await createFile(codePath, '')

    // trigger SAS but don't wait for completion - we need to
    // update the session array to say that it is currently running
    // however we also need a promise so that we can update the
    // session array to say that it has (eventually) finished.

    // Additional windows specific options to avoid the desktop popups.

    runSessionProcess(
      session,
      process.sasLoc!,
      buildSessionArgs(process.sasLoc!, session, autoExecPath)
    )
      .then(() => {
        session.state = SessionState.completed
        // the process is gone and its pid can be recycled
        session.pid = undefined
        session.pidStartedAt = undefined

        process.logger.info('session completed', session)
      })
      .catch((err) => {
        session.state = SessionState.failed
        session.pid = undefined
        session.pidStartedAt = undefined

        session.failureReason = err.toString()

        // A session the shutdown signalled is not a crash (sasjs/server#162)
        if (session.terminatedByShutdown)
          return process.logger.info('session ended by shutdown', session.id)

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

  /**
   * Ends a waiting SAS session by handing it the program it is waiting for.
   *
   * A pending session is not idle: it is a SAS process parked in the autoexec
   * loop, polling for a SYSIN to appear. Killing it leaves whatever SAS had
   * buffered in the log and no termination, so the shutdown writes the file it is
   * watching instead and lets SAS end the run itself - the same mechanism
   * `processProgram` uses to start a program, which is what makes this the
   * graceful path rather than a trick.
   *
   * Only `pending` is woken. An `initialising` session still has the dummy SYSIN
   * in place, and the autoexec deletes that file before it starts watching, so a
   * program written now would be thrown away; those fall through to the signal.
   */
  protected async drainSession(
    session: Session,
    budget: DrainBudget
  ): Promise<void> {
    if (session.state === SessionState.pending && session.pid)
      await this.requestSessionEnd(session)

    await super.drainSession(session, budget)
  }

  /**
   * Writes an `endsas;` program into the session's SYSIN.
   *
   * Create-then-rename, exactly as a real program is written: SAS stops waiting
   * the moment the file exists and starts reading it, so a partly written file
   * would be executed as a partly written program.
   *
   * `endsas;` rather than the `%put` in sasjs/server#162: SYSIN is a file, so
   * reaching EOF would end the session too, but `endsas;` does not depend on that
   * and terminates at a statement boundary. The `%put` is kept as a marker so the
   * session's log says why it ended.
   */
  private async requestSessionEnd(session: Session) {
    const codePath = path.join(session.path, 'code.sas')

    try {
      await createFile(`${codePath}.shutdown`, shutdownProgram)
      await moveFile(`${codePath}.shutdown`, codePath)
    } catch (error: any) {
      // the folder can already be gone if a destroy raced the shutdown; there is
      // nothing to wake in that case, and the signal below still applies
      process.logger?.warn(
        'could not ask the session to end, terminating it instead',
        session.id,
        error?.message ?? error
      )
    }
  }
}

/**
 * The command line one SAS session is started with.
 *
 * Split out of the launch so the flags can be asserted without spawning
 * anything: they are not cosmetic. Besides the dialogs a desktop SAS would open,
 * `-SASUSER` points SASUSER at the session's own folder. SAS copies the SASUSER
 * profile into WORK at startup; with one shared SASUSER the copy fails or races
 * once several sessions are pooled, and the log opens with
 *
 *   WARNING: Unable to copy SASUSER registry to WORK registry.
 *
 * A writable folder per session makes the copy succeed and keeps the writes a
 * program makes to SASUSER working - `-RSASUSER` would silence the warning by
 * making those writes fail, which is the worse trade. The folder is deleted with
 * the session, so customisations do not survive it.
 *
 * Not a Windows concern: the warning is reported on Linux too, where a read-only
 * home or a shared SASUSER produces it. Only the dialog-suppressing options are
 * gated on `sas.exe`.
 */
export const buildSessionArgs = (
  sasLoc: string,
  session: Session,
  autoExecPath: string
): string[] => {
  const isWindows = sasLoc.endsWith('sas.exe')

  return [
    '-SYSIN',
    path.join(session.path, 'code.sas'),
    '-LOG',
    path.join(session.path, 'log.log'),
    '-PRINT',
    path.join(session.path, 'output.lst'),
    '-WORK',
    session.path,
    '-AUTOEXEC',
    autoExecPath,
    isWindows ? '-nologo' : '',
    isWindows ? '-nosplash' : '',
    isWindows ? '-icon' : '',
    isWindows ? '-nodms' : '',
    isWindows ? '-noterminal' : '',
    isWindows ? '-nostatuswin' : '',
    isWindows ? '-NOPRNGETLIST' : '',
    '-SASUSER',
    path.join(session.path, 'sasuser'),
    isWindows ? '-SASINITIALFOLDER' : '',
    isWindows ? session.path : ''
  ]
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

/**
 * The program a waiting session is handed when the server is shutting down.
 *
 * It runs as ordinary SYSIN, so it appears in the session's log like any other
 * program - which is the point: the log says the session ended because the server
 * did, rather than stopping mid-step.
 */
const shutdownProgram = `/* SASjs Server is shutting down */
%put NOTE: SASjs Server is shutting down - ending this session;
endsas;
`

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
