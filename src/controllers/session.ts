import { Session } from '../types'
import { getTmpSessionsFolderPath, generateUniqueFileName } from '../utils'
import { createFolder, createFile, generateTimestamp } from '@sasjs/utils'
import path from 'path'
import { ExecutionController } from './executor'

// /opt/sas/sas9/SASHome/SASFoundation/9.4/sasexe/sas
// -LOG /tmp/mydir/demo.log
// -SYSIN /tmp/mydir/code.sas
// -AUTOEXEC /tmp/mydir/autoexec.sas
// -WORK /tmp/mydir

// 1. req (_program) for execution
// 2. check available session
// 2.3 spawn one more session
// 2.3.1 create folder
// 2.3.2 create autoexec
// 2.3.3 create _program.sas (empty)
// 2.3.4 /opt/sas/sas9/SASHome/SASFoundation/9.4/sasexe/sas -LOG /tmp/sessionFolder/demo.log  -SYSIN /tmp/sessionFolder/_program.sas -AUTOEXEC /tmp/sessionFolder/autoexec.sas -WORK /tmp/sessionFolder
// 2.3.5 wait for _program.sas to be deleted
// 2.3.6 add session to the session array
// ---
// 3.0 wait for session
// 3.1 create _program.sas in sessionFolder
// 3.2 poll session array

export class SessionController {
  private sessions: Session[] = []
  private executionController: ExecutionController

  constructor() {
    this.executionController = new ExecutionController()
  }

  public async getSession() {
    if (this.sessions.length) {
      const session: Session = this.sessions[0]

      // TODO: check if session is not expired

      return session
    }

    return await this.createSession()
  }

  private async createSession() {
    if (!this.sessions.length) {
      const sessionId = generateUniqueFileName(generateTimestamp())

      const sessionFolder = path.join(
        await getTmpSessionsFolderPath(),
        sessionId
      )

      const autoExecContent = `data _null_;
  /* remove the dummy SYSIN */
  length fname $8;
  rc=filename(fname,getoption('SYSIN') );
  if rc = 0 and fexist(fname) then rc=fdelete(fname);
  rc=filename(fname);
  /* now wait for the real SYSIN */
  slept=0;
  do until ( fileexist(getoption('SYSIN')) or slept>(60*15) );
    slept=slept+sleep(0.1,1);
  end;
run;
EOL`

      const autoExec = path.join(sessionFolder, 'autoexec.sas')

      await createFile(autoExec, autoExecContent)

      console.log(`[SessionController about to create first session]`)

      this.executionController.execute('', autoExec)

      const creationTimeStamp = sessionId.split('-').pop() as string

      const session: Session = {
        id: sessionId,
        available: true,
        creationTimeStamp: creationTimeStamp,
        deathTimeStamp: (
          parseInt(creationTimeStamp) +
          15 * 60 * 1000 -
          1000
        ).toString(),
        path: sessionFolder
      }

      console.log(`[SessionController]session: `, session)

      this.sessions.push(session)

      return session
    } else {
      return this.sessions[0]
    }
  }
}

export const getSessionController = () => {
  if (process.sessionController) return process.sessionController

  process.sessionController = new SessionController()

  return process.sessionController
}
