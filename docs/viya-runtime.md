# The `sasviya` runtime

Status: implemented and verified against a live Viya estate (2026-10-02).

## Why

SASjs Server runs uploaded programs against a local `sas` binary, a shared filesystem, and a session folder per run. A SASjs project can already target Viya directly from the browser through `@sasjs/adapter`, but that path bypasses everything the server provides.

The reason to add a `sasviya` runtime is a concrete, present need: on an estate where Viya accepts connections only from the server's IP, the server is the only host with a network path to Viya. Putting the runtime behind the server turns it into the single egress point, so browsers and CI pipelines need only a server token - no direct Viya network access and no Viya credentials in a pipeline. Everything the server already does then applies unchanged to Viya execution: bearer-token auth, the group and permission model, the SASjs Drive as the code store, `POST /SASjsApi/stp/execute` and `/trigger` with session-state polling, streaming, and the webout/headers contract.

## What it does

`RUN_TIMES=sasviya` adds a runtime that:

1. Mints a Viya access token from `VIYA_USER` / `VIYA_PASSWORD` using the OAuth2 password grant against the built-in, secret-less `sas.cli` public client - the same mechanism `sasjs auth login` uses. No admin-registered OAuth client is required.
2. Submits the program to a compute session on `VIYA_CONTEXT`.
3. Relays the session log and the program's `_webout` content back into the server's session folder, so `ExecutionController` and the STP response contract are unchanged.

The transport is `@sasjs/adapter/node`, not a hand-rolled Viya client. The adapter already implements the hot-session pool, code submission, log relay and `_webout` retrieval - the same "create a session, inject the code, relay the log back" pattern the local `sas` runtime implements with a binary and a shared filesystem.

## Configuration

| Variable        | Required | Purpose                                                                                             |
| --------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `VIYA_URL`      | yes      | Base URL of the Viya environment, e.g. `https://viya.example.com`. Must be an absolute http(s) URL. |
| `VIYA_USER`     | yes      | Service account used for every run.                                                                 |
| `VIYA_PASSWORD` | yes      | Password for that account.                                                                          |
| `VIYA_CONTEXT`  | no       | Compute context name. Defaults to `Compute Reusable`.                                               |

All four are validated at startup in `verifyEnvVariables`, so a typo fails the boot rather than every request.

## Round 1 scope: one service account

Every run executes on Viya as `VIYA_USER`. That is simple and, because the estate is already gated to the server's IP, it does not widen who can reach Viya - but it does mean every server user runs with that account's authority on Viya. The server's Drive write access is therefore the Viya privilege boundary in this release, and the deployment guidance should say so.

Per-user Viya identities are deliberately out of scope. They need a token per user (the adapter accepts a per-request `authConfig` and reports rotated tokens through `onTokensRefreshed`), but a hot session cannot be shared across identities, which changes the session-pool design.

## How a program responds

The program writes its response with `%mv_webout`, the Viya-native macro from `@sasjs/core`:

```sas
%mv_webout(OPEN)
data work.result; x = 42; run;
%mv_webout(OBJ, work.result)
%mv_webout(CLOSE)
```

`%mv_webout` must exist on the Viya estate - it is not in the base product. It arrives with a SASjs deployment (`sasjs deploy` / `cbd`), so an estate that has never hosted a SASjs app needs the macros deployed once before the runtime can be used. The server does not inject them.

## Runtime selection

`getRunTimeAndFilePath` picks the runtime from the file extension. A program with no extension is resolved against `RUN_TIMES` in enum order (`sas`, `js`, `py`, `r`, `sasviya`), so `.sas` still means the local runtime. To run on Viya, the program must be stored with the `.sasviya` extension.

## Triggering a long-running job

`POST /SASjsApi/stp/trigger` and `POST /SASjsApi/code/trigger` return as soon as the session exists - the response carries the `sessionId`, and the program keeps running. Poll `GET /SASjsApi/session/{sessionId}/state` until it reads `completed` or `failed`, then read the session's `webout.txt` and `log.log` from the session folder.

That is the shape a long Viya job needs: measured on a 12-second program on the `js` runtime, the trigger call returned in 64 ms and the state moved `running` to `completed` at 13 seconds. A synchronous call to the same program waited the full 3.1 seconds.

`expiresAfterMins` applies to every runtime. The session lifecycle lives on the base session controller, so a triggered program on any runtime is destroyed when its death time arrives rather than leaving its folder behind - before this, only the local `sas` runtime scheduled that cleanup, and a triggered job on the other runtimes leaked its folder permanently.

## Known limits

- **File uploads are not relayed.** Upload staging points at local server paths, which the compute server cannot read. A program that expects uploaded files will not find them.
- **No print output.** `includePrintOutput` is SAS-only; the Viya response carries the webout and the log.
- **The webout content type varies.** The compute session serves `_webout` as text or as `application/json` depending on the content, so the client accepts both a string and a parsed object and re-serialises the object.
- **The adapter is reached through a private member.** The public `SASjs.executeScript` submits code but does not return the `_webout` fileref, so the runtime calls `sasViyaApiClient.executeScript` directly. A public option on `SASjs.executeScript` is the clean upstream fix and a candidate follow-up in `sasjs/adapter`.
- **Sessions are not pooled across requests.** The adapter's compute path clears the session after a webout-producing run. The performance win comes from the context (`reuseServerProcesses`), which keeps the SAS process alive, not from holding the session.

## Dependency

The runtime adds `@sasjs/adapter` to `api/package.json`. It is CommonJS with a Node entry point and drags in `axios`, `form-data`, `tough-cookie` and `axios-cookiejar-support`. `axios` is preferred over a global `fetch` for the API calls, but the token mint uses `fetch` because Node 18+ provides it and the `pkg` targets are node24.

## Verification

Unit: `api/src/controllers/internal/spec/viyaRuntime.spec.ts` and the Viya cases in `api/src/utils/specs/verifyEnvVariables.spec.ts`.

End to end, against a live estate (2026-10-02):

1. `sasjs compile -t viya` - a project with a `SASVIYA` target and a `SASJS` (server) target compiled for Viya.
2. `sasjs build` and `sasjs deploy -t server` - the service pack deployed to a local server running with `RUN_TIMES=js,sasviya`.
3. `GET /SASjsApi/stp/execute?_program=/Public/viya-e2e/services/common/hello.sasviya` returned `200` and `{"hello":[{"SOURCE":"viya","STATUS":"e2e-ok"}]}`, with the Viya session log available through `_debug`.
