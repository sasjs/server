# SAS session execution handshake

How one long-lived `sas` process is turned into a single-use execution slot
via a SYSIN file-swap trick. This is the mechanism specific to
`RunTimeType.SAS`; JS/PY/R sessions spawn a fresh interpreter process per
request instead (see `request-execution-flow.md`).

```mermaid
sequenceDiagram
    participant Client as HTTP client
    participant Ctrl as Controller<br/>(code.ts / stp.ts)
    participant Exec as ExecutionController<br/>(Execution.ts)
    participant Pool as SASSessionController<br/>(Session.ts)
    participant FS as Filesystem<br/>(session.path)
    participant SAS as spawned "sas" process

    Note over Pool,SAS: SESSION CREATION - happens ahead of any request,<br/>pool pre-warms up to 3 sessions (Session.ts:59-69)
    Pool->>FS: createFile(code.sas, "") - empty dummy SYSIN (Session.ts:117-118)
    Pool->>FS: createFile(autoexec.sas, autoExecContent) (Session.ts:108-114)
    Pool->>SAS: execFile(sasLoc, -SYSIN code.sas -AUTOEXEC autoexec.sas -LOG log.log ...) (Session.ts:127-147)
    activate SAS
    Note right of SAS: process stays active (this box)<br/>from spawn until it finally exits below
    SAS->>FS: autoexec step 1: delete code.sas, the dummy SYSIN (Session.ts:257-261)
    Pool->>FS: waitForSession() polls fileExists(code.sas) (Session.ts:175-192)
    FS-->>Pool: code.sas no longer exists
    Pool->>Pool: session.state = pending (Session.ts:190)
    SAS->>SAS: autoexec step 2: busy-wait for code.sas to reappear,<br/>up to 15 minutes (Session.ts:263-274)
    Note over SAS: process is now idle, parked mid-autoexec,<br/>waiting on the filesystem.<br/>Counts as "pending" in the pool.

    Note over Client,SAS: REQUEST ARRIVES - reuses the parked process above
    Client->>Ctrl: POST .../execute { code, runTime: sas }
    Ctrl->>Exec: executeProgram({ program, runTime: SAS, ... })
    Exec->>Pool: getSession() returns the pending session (Session.ts:59-69)
    Exec->>Exec: session.state = running (Execution.ts:96)
    Exec->>FS: createFile(webout.txt, "") and createFile(reqHeaders.txt, ...) (Execution.ts:103-107)
    Exec->>Pool: processProgram(program, session, ...) (Execution.ts:110-121)
    Pool->>FS: createSASProgram() wraps user code with macro vars,<br/>_webout filename, autoexec injection (createSASProgram.ts)
    Pool->>FS: write code.sas.bkp, then rename to code.sas (processProgram.ts:48-49)
    Note over FS: write-then-rename, not a direct write,<br/>so SAS never reads a partial file

    FS-->>SAS: code.sas exists again
    SAS->>SAS: autoexec step 2 loop exits, sleeps 0.01s, autoexec ends (Session.ts:267-271)
    Note over SAS: -SYSIN has pointed at code.sas from the start,<br/>so SAS now executes ITS CONTENT as the main job
    SAS->>FS: writes log.log, output.lst, webout.txt while running

    Pool->>Pool: processProgram poll loop:<br/>while session.state !== completed (processProgram.ts:52-58)

    alt program reaches EOF normally
        SAS->>SAS: exits with code 0
        SAS-->>Pool: execFilePromise resolves - .then() (Session.ts:148-152)
        Pool->>Pool: session.state = completed
        Pool-->>Exec: processProgram() resolves
    else program aborts (fatal error, license failure, hard STOP)
        SAS->>SAS: exits with non-zero code
        SAS-->>Pool: execFilePromise rejects - .catch() (Session.ts:153-163)
        Pool->>Pool: session.state = failed<br/>session.failureReason = err.toString()
        Pool-->>Exec: processProgram() throws (processProgram.ts:53-55)
    end
    deactivate SAS

    Exec->>FS: read log.log, webout.txt, stpsrv_header.txt (Execution.ts:123, 128-131)
    Exec-->>Ctrl: { httpHeaders, result }<br/>or throws SessionExecutionError{ message, log } (Execution.ts:109-126)
    Ctrl-->>Client: 200 + result<br/>or 400 { status, message, error, log }
```

## Why this design

- SAS has meaningful startup cost (loading the engine, running system init
  macros). Spawning a fresh `sas` process per request would pay that cost
  every time. Instead, a process is spawned once and parked, ready to run
  exactly one job the moment code shows up at a path it's already watching.
- The pool (`SessionController.getSession`, `Session.ts:59-69`) keeps up to
  3 such parked processes ready, so most requests get an instant handoff
  instead of waiting through the ~15-minute autoexec spin-wait or a cold
  start.
- A session is single-use: once its process consumes the real SYSIN content
  and exits (success or failure), that process is gone. The session object
  itself is deleted later by `scheduleSessionDestroy` (`Session.ts:204-236`),
  not reused for a second job.
