# Session lifecycle (`SessionState`)

Enum defined in `api/src/types/Session.ts`. A `Session` is `{ id, state,
path, creationTimeStamp, deathTimeStamp, expiresAfterMins?, failureReason? }`.
Sessions live in an in-memory array on a per-runtime singleton controller
(`process.sasSessionController` for SAS, `process.sessionController` shared
by JS/PY/R — see `getSessionController()` in `Session.ts:239-253`).

```mermaid
stateDiagram-v2
    [*] --> initialising: SAS runtime<br/>SASSessionController.createSession()<br/>Session.ts:77-95
    [*] --> pending: JS/PY/R runtime, no process yet<br/>SessionController.createSession()<br/>Session.ts:30-57

    initialising --> pending: dummy SYSIN file deleted<br/>by SAS's autoexec<br/>waitForSession(), Session.ts:175-192
    initialising --> failed: spawned SAS process exits<br/>before handshake completes<br/>Session.ts:153-163, 184-188

    pending --> running: session picked for a request<br/>executeProgram(), Execution.ts:94-96

    running --> completed: process exits 0<br/>SAS: Session.ts:148-152 (original process)<br/>JS/PY/R: processProgram.ts:116-120 (fresh process)
    running --> failed: process exits non-zero<br/>SAS: Session.ts:153-163<br/>JS/PY/R: processProgram.ts:121-131<br/>failureReason = err.toString()

    completed --> [*]: deleteSession()<br/>scheduleSessionDestroy(), Session.ts:194-236
    failed --> [*]: deleteSession()<br/>scheduleSessionDestroy()

    note right of initialising
        SAS only. The real sas
        executable is already
        running, spin-waiting
        inside its AUTOEXEC for
        real code to arrive.
        See sas-execution-handshake.md
    end note

    note right of pending
        Session sits in the pool,
        reusable. Pre-warmed up to
        3 pending sessions per
        runtime (getSession(),
        Session.ts:59-69)
    end note

    note right of running
        SAS: no new process spawned
        here, request just feeds
        code to the already-running
        process.
        JS/PY/R: a brand new
        interpreter process is
        spawned right now.
    end note
```

## Consumers of `state`

| Reader | Location | Watches for |
|---|---|---|
| `waitForSession` | `Session.ts:175-192` | `failed` (breaks early) or the dummy SYSIN file disappearing (implies session survived init) |
| `processProgram` (SAS branch poll loop) | `processProgram.ts:52-58` | `completed` (success exit) or `failed` (throws, carrying `session.failureReason`) |
| `scheduleSessionDestroy` | `Session.ts:204-236` | `running` (extends death timer instead of destroying) |

## Asymmetry between runtimes

- **SAS**: one OS process per session, spawned once at `createSession()`
  time and reused for exactly one job (see `sas-execution-handshake.md`).
  `running`/`completed`/`failed` are all driven by that *same* process's
  eventual exit.
- **JS/PY/R**: a session is cheap (folder + id, no process). The interpreter
  process is spawned fresh, per request, inside `processProgram.ts:115` and
  its exit drives `completed`/`failed` directly in the same function - there
  is no separate poll loop for these runtimes.
