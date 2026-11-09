---
description: Run SAS programs from a browser or over HTTP. SASjs Server wraps the SAS executable with an interface, a REST API, stored programs and app hosting.
hide:
  - navigation
---

<div class="home" markdown>
<div class="home-hero" markdown>
# SASjs Server

<p class="home-lead">Your SAS installation, on the web.</p>

Run SAS programs from a browser, call them over HTTP, and give analysts somewhere to try things out - on desktop SAS, on SAS 9, or on Viya.

SASjs Server is a small NodeJS service that sits beside your SAS executable and does one job: it takes a request, runs the program, and hands back the log and the result.

[Install SASjs Server](installation.md){ .md-button .md-button--primary }
[Explore the API](api.md){ .md-button }

Node 22 or later. MIT licence. Windows, macOS and Linux.
{ .home-facts }
</div>

## What it does

<div class="home-grid" markdown>
<div class="home-card" markdown>
### SASjs Studio

A code editor in the browser that runs against your real SAS installation. The log and the `webout` come back in the same window, and files save to the drive.

[About Studio](studio.md)
</div>

<div class="home-card" markdown>
### REST API

Every action is an HTTP call: run a stored program, read a folder, upload a file. The reference doubles as a console, so you can try a call before writing any code.

[Browse the API](api.md)
</div>

<div class="home-card" markdown>
### App Stream

Publish a SAS-backed web app to anyone who can sign in. Compile it with the SASjs CLI, upload the zip, and share the URL.

[About App Stream](apps.md)
</div>

<div class="home-card" markdown>
### Stored Programs

Keep SAS, JS, Python and R programs on the drive and run them by name, the way a Stored Process Server does.

[Stored Programs](storedprograms.md)
</div>
</div>

## What happens to a request

1. Something calls the API - this interface, a SASjs app, a script, a scheduled job. Every call is an ordinary HTTP request to a path such as `/SASjsApi/stp/execute`.
2. The server runs the program in a SAS session, choosing the runtime from the program's file extension.
3. The log and the returned data - the `webout` - come back in the response.

The API is the one [`@sasjs/adapter`](https://adapter.sasjs.io) already speaks, so a SASjs app points at SASjs Server without a code change. A stored program typically answers in around 200 milliseconds.

## When it is the right tool

### Reach for it when

* You have Base SAS, desktop SAS, or SAS 9 without a Stored Process Server.
* You want SAS behind a web app, a CI pipeline, or a chat bot.
* You want one place where analysts can run code, keep it, and share the result.
* You need to run [tests](https://cli.sasjs.io/test) against your SAS jobs, services and macros.
* You want to install a third-party app such as [Data Controller for SAS](https://datacontroller.io).

### You probably do not need it if

You run Viya's Job Execution Service or a SAS Stored Process Server. Those do this job, and SASjs Server overlaps with them rather than replacing them.

## Running it

```bash
npx @sasjs/server
```

The server reads `.env` from the directory it runs in. Two settings start it: [`SAS_PATH`](settings.md#sas_path), the full path to `sas.exe` or `sas.sh`, and [`HTTP_PORT`](settings.md#http_port) for the listener. [Installation](installation.md) covers the standalone executable, keeping the process running, and the first sign-in.

## Where everything lives

Everything the interface links to is at a top-level path:

| Path | What it is |
|---|---|
| `/` | The interface: the dashboard, the Apps screen, Studio |
| `/studio` | SASjs Studio, running ad hoc code |
| `/apps` | The apps the signed-in caller may open |
| `/docs` | This documentation, inside the interface (the pages themselves are at `/documentation`) |
| `/api` | The REST API's reference, inside the interface (the Swagger page is at `/api-assets/`); the API answers `/api/info`, `/api/stp/execute`, ... |
| `/app/<name>` | A published App Stream application |

The shorter paths - `/SASjsStudio`, `/SASjsApps`, `/SASjsDocs`, `/SASjsSettings`, `/SASjsLogon`, `/AppStream` - redirect to the ones above.

<!-- server-docs-ignore: /SASjsApiDocs -->

`/SASjsApiDocs` redirects to `/api-assets/`. It is a redirect rule rather than a mounted router, so the endpoint checker - which reads registered routes - does not see it.

The API also answers on `/SASjsApi`, the spelling `@sasjs/adapter` uses and the one the specification below documents. The two are aliases of the same routes, so a client may use either.  Likewise `/AppStream` keeps serving published apps.

SASjs Server is MIT open source. The repository is [sasjs/server on GitHub](https://github.com/sasjs/server).
</div>
