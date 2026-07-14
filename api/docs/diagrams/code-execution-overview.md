# Code execution & session diagrams

Mermaid diagrams describing how `@sasjs/server` executes submitted code
(SAS/JS/PY/R) against pooled "sessions". Written for fast context-loading by
an AI coding agent: each diagram is self-contained, node/edge labels carry
the actual file:line references, and prose is kept to the minimum needed to
disambiguate the diagram.

| File | Covers |
|---|---|
| [session-lifecycle.md](session-lifecycle.md) | `SessionState` state machine; how it differs between the SAS runtime and the JS/PY/R runtimes |
| [sas-execution-handshake.md](sas-execution-handshake.md) | The SYSIN/AUTOEXEC file-swap mechanism a SAS session uses to turn one long-lived `sas` process into a single-use execution slot |
| [request-execution-flow.md](request-execution-flow.md) | End-to-end flowchart from HTTP request to response, covering session-pool acquisition and both runtime branches (SAS vs JS/PY/R) |

## Core concept

A "session" is not a request-scoped object. It is a pooled, reusable
execution slot with a filesystem folder (`session.path`) and a state
(`SessionState`). For the SAS runtime specifically, a session also owns one
real OS process, spawned at session-*creation* time and consumed by exactly
one code submission (see `sas-execution-handshake.md`). For JS/PY/R, a
session is just an ID + folder; the actual interpreter process is spawned
fresh per request inside `processProgram`.

## Key source files

- `api/src/controllers/internal/Session.ts` — session pool + lifecycle
  (`SessionController`, `SASSessionController`), `SessionState` transitions.
- `api/src/controllers/internal/processProgram.ts` — writes the submitted
  code into the session and drives it to completion/failure, per runtime.
- `api/src/controllers/internal/Execution.ts` — `ExecutionController`,
  the entry point controllers call; acquires a session, calls
  `processProgram`, reads back `log.log`/`webout.txt`/headers, builds the
  HTTP response (or a `SessionExecutionError` on failure).
- `api/src/controllers/internal/create{SAS,JS,Python,R}Program.ts` —
  per-runtime code templating (wraps the user's submitted code with
  boilerplate: variable injection, `_webout` redirection, etc).
- `api/src/types/Session.ts` — `SessionState` enum and `Session` interface.
