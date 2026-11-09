# SASjs Server

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/sasjs/server/badge)](https://scorecard.dev/viewer/?uri=github.com/sasjs/server) [![All Contributors](https://img.shields.io/badge/all_contributors-7-orange.svg?style=flat-square)](#contributors-)

SASjs Server provides a NodeJS wrapper for calling the SAS binary executable. It can be installed on an actual SAS server, or locally on your desktop. It provides:

- Virtual filesystem for storing SAS programs and other content
- Ability to execute Stored Programs from a URL
- Ability to create web apps using simple Desktop SAS
- REST API with Swagger Docs

One major benefit of using SASjs Server alongside other components of the SASjs framework such as the [CLI](https://cli.sasjs.io), [Adapter](https://adapter.sasjs.io) and [Core](https://core.sasjs.io) library, is that the projects you create can be very easily ported to SAS 9 (Stored Process server) or Viya (Job Execution server).

SASjs Server is available in two modes - Desktop (without authentication) and Server (with authentication, and a database)

## Installation

Two channels - the npm package and the standalone executable. Both read the same environment variables and serve the same API.

### npm

Run the latest release without installing it:

```bash
npx @sasjs/server
```

Or install it once and run `sasjs-server` from then on:

```bash
npm install -g @sasjs/server
sasjs-server
```

Requires Node 22 or later. Useful where Node is already managed by the platform,
and the only channel that runs on arm64 (Apple Silicon, Graviton, a Pi), because
the standalone executables are built for x64 only.

Three things to know before choosing it:

- **Pin the version for a deployment.** The command above resolves `latest` on
  every run, so a restart becomes a silent upgrade. Install a specific release
  instead - they are listed on
  [the npm page](https://www.npmjs.com/package/@sasjs/server) - so the release
  you tested is the one that runs.
- **`.env` is read from the working directory.** `dotenv.config()` is relative to
  where the process starts, so run it from the project directory you want the
  server to own (that directory also gets the `./sasjs_root`). Under `npx` the
  package itself lives in an evictable `~/.npm/_npx/<hash>` cache, so an `.env`
  placed there would be lost - it belongs beside the command, not the code.
- **It starts in desktop mode**, the single-user mode. The `RUN_AS` check still
  refuses to run as root, so install it under the account that should own the SAS
  sessions rather than starting it with `sudo`.

Installing the package runs no install script, so it makes no network call of its
own.

### Standalone executable

Download the relevant package from the [releases](https://github.com/sasjs/server/releases)
page, or fetch it programmatically (linux):

```bash
curl -L https://github.com/sasjs/server/releases/latest/download/linux.zip > linux.zip
unzip linux.zip
```

Then launch `./api-linux` (on windows, double click `api-win.exe` - no
administrative privileges are needed) and answer the two prompts, unless the ENV
vars are set:

- Location of your `sas.exe` / `sas.sh` executable
- Path to a filesystem location for Stored Programs and temporary files

## Deployment options

- **Embedded** - the server's pieces are also used inside other SASjs tooling,
  such as the VS Code extension, and the mock backend runs in the browser for
  front-end development without a server at all.

There is no container image. The previous `ghcr.io/sasjs/server` image could not
carry SAS - the licence does not permit redistribution - so it could only serve
the `js` and `py` runtimes, and it needed a SAS installation mounted from the
host to do the work the server exists for. It has been withdrawn along with the
Cloudron packaging built on it.

That also withdraws the OS-layer scan the image pipeline ran: nothing in the
remaining pipeline looks for CVEs in a bundled runtime, because there is no
bundled runtime. The js and py interpreters a deployment uses are the ones on its
own host, and patching them is part of that host's maintenance.

## Configuration

Every setting is an environment variable, read at startup from the environment or from the `.env` file beside the executable. The full reference - core settings, listener configuration, analytics run times, the SAS options, the server-mode settings, and the LDAP and OIDC providers - lives with the rest of the documentation:

**<https://server.sasjs.io/docs/settings/>**

That page is built from `docs/` in this repository and is served by the build itself at `/docs`, so the reference and the binary that reads the settings cannot drift apart.

## Persisting the Session

The server runs in the foreground and never detaches, so it lives exactly as long as whatever started it - a terminal, a task, a unit. Give it a supervisor for anything other than a workstation session. The full recipes (systemd, launchd, Windows Task Scheduler, WinSW/NSSM, pm2, nohup) are in [the deployment docs](https://server.sasjs.io/docs/deployment/).

The short version:

- **Linux and macOS**: a systemd unit with `Restart=on-failure`, or a launchd plist with `KeepAlive`. Set the working directory, because `.env` and `sasjs_root` resolve against it.
- **Windows**: Task Scheduler at logon, or a WinSW/NSSM service. Set the working directory explicitly - a task's default is `C:\Windows\System32`.
- **pm2**: `pm2 start sasjs-server --name sasjs-server`, then `pm2 startup` (which prints a command to run once) and `pm2 save`. Without those two a reboot starts nothing, and `pm2 startup` does nothing on Windows - use pm2-installer, Task Scheduler or a service wrapper there.
- **`nohup ./api-linux > server.log 2>&1 &` plus `disown`**: survives the terminal and nothing else.
- **`npx`**: a launcher, not a supervisor. It exits with the terminal, so for anything supervised install globally and hand `sasjs-server` to the supervisor.

Whichever you pick, capture stderr. The process exits 1 on a configuration error and on an unhandled rejection, and that line is the diagnosis; a console window that closes takes it with it.

### Stopping the server

`SIGTERM` and `SIGINT` stop the server in two stages.
Listeners stop accepting first, and in-flight requests get up to 5 seconds to finish.
Then every session the server is holding is ended: a SAS session waiting for work is handed an `endsas;` program so SAS terminates itself, and a session that is still running gets 2 seconds to finish, then SIGTERM with 1 second, then SIGKILL with 1 second.
The three phases are added, not nested, so no phase can borrow another's time.
A session's folder is removed only after its process has gone - if a process survives both signals (uninterruptible I/O), the folder is left in place and an error is logged, because that folder is where the process is still writing.

The worst case is therefore 9 seconds - 5 for the listener close plus 4 for the drain - so give a supervisor **10 seconds** before it escalates.
That gap is deliberate: a supervisor's `SIGKILL` cannot be caught, so a shutdown cut short at that point would orphan the very processes this ends, and a SAS session left behind keeps a licence seat busy until its own 15 minute idle ceiling expires.
A stop with nothing in flight is far quicker than the ceiling; measure one before raising the value:

- **pm2** waits 1600ms by default, which is shorter than the listener close alone: set `kill_timeout: 10000` in the ecosystem file, or start with `--kill-timeout 10000`.
- **docker** waits 10 seconds by default, which is already the right value: `--stop-timeout 10` (or `stop_grace_period: 10s` in a compose file) makes it explicit.
- **systemd** waits 90 seconds by default, so a unit needs no change; `TimeoutStopSec=10` is still worth setting explicitly.

`GET /SASjsApi/info` answers without authentication and is the probe to use.

## Server Version

`GET /SASjsApi/info` reports the release that produced the running build in `version`, as `v3.2.2 (4a26a3d)` - the tag and the commit - and the interface stamps that value in the corner of every screen, the login screen included, so a screenshot names the build it came from.
The value comes from `buildInfo.generated.ts`, which the build writes from the release tag (`SASJS_SERVER_VERSION` when the release workflow sets it) or from `git describe`; a build made by hand reports `dev`.

## The demonstration site

`npm run mock:build` builds the same interface as a **static site** - no server, no SAS binary - and writes it to `sasjsbuild/mock`. A service worker answers `/SASjsApi` from `@sasjs/api`, the package this server answers with, over a drive that ships with the site (`mock/drive.json`). It is published to <https://server.sasjs.io> by `.github/workflows/mock-site.yml`, from this repository, on a release or by hand.

- `sasjs/sasjsconfig.json` is the `mock` target the CLI builds against; `mock/build.mjs` runs the docs, the web bundle and the CLI in order and writes the `404.html` and `.nojekyll` a static host needs.
- `npm run mock:serve` serves the built site the way GitHub Pages does, including the fallback that makes a reload on `/SASjsStudio` work.
- What runs is JavaScript. Run on a SAS program reports that SAS needs a server - a demo that pretended otherwise would be teaching the wrong thing.
- The site is a browser host: no accounts, no private data, and the seeded identity is the package's demo admin. Nothing here is a security boundary, which is why a demo is all it should ever serve.

## Documentation

The documentation site - the pages published at <https://server.sasjs.io/docs/> - lives in `docs/` in this repository and is built with MkDocs Material:

- `docs/pages/` holds the pages, and `docs/mkdocs.yml` the navigation, theme and plugins.
- `docs/requirements.txt` pins the toolchain. It is Python, so it is installed separately from the interface's dependencies.
- The build copies the site into the web build, at `web/build/docs`, which the server serves at `/docs` and the interface's **Docs** tab frames. The copy therefore describes the build that carries it - the pages and the interface are never a release apart.
- `npm run docs:build` builds the site, `npm run docs:serve` serves it with live reload at <http://127.0.0.1:8000>, and `npm run docs:check` runs the two content checks. The scripts use `.venv-docs/bin/python` when that venv exists and the ambient `python3` otherwise, so activating it is optional.

A development build does not need any of that: the Docs tab says the build carries no documentation and links to the published site. To see the pages while working on them, install the toolchain once (`python3 -m venv .venv-docs && .venv-docs/bin/pip install -r docs/requirements.txt`) and run `npm run docs:serve` - the script picks up that venv by itself.

Two checks run in CI, both against this checkout rather than a clone:

- `docs/scripts/check-server-docs.mjs` fails when a page is missing from the nav, an endpoint or setting it names is not in the code, or `docs/pages/swagger.yaml` differs from `api/public/swagger.yaml`.
- `docs/scripts/check-external-calls.mjs` fails when the built site fetches anything from another origin - the pages are read offline and on air-gapped hosts.

A change that touches only `docs/` publishes the site and does not cut a release.

## Initial Credentials

The following credentials can be used for the initial connection to SASjs/server. It is highly recommended to change these on first use.

- CLIENTID: `clientID1`
- USERNAME: `secretuser`
- PASSWORD: `secretpassword`

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/saadjutt01"><img src="https://avatars.githubusercontent.com/u/8914650?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Saad Jutt</b></sub></a><br /><a href="https://github.com/sasjs/server/commits?author=saadjutt01" title="Code">💻</a> <a href="https://github.com/sasjs/server/commits?author=saadjutt01" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/sabhas"><img src="https://avatars.githubusercontent.com/u/82647447?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sabir Hassan</b></sub></a><br /><a href="https://github.com/sasjs/server/commits?author=sabhas" title="Code">💻</a> <a href="https://github.com/sasjs/server/commits?author=sabhas" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://www.erudicat.com/"><img src="https://avatars.githubusercontent.com/u/25773492?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Yury Shkoda</b></sub></a><br /><a href="https://github.com/sasjs/server/commits?author=YuryShkoda" title="Code">💻</a> <a href="https://github.com/sasjs/server/commits?author=YuryShkoda" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/medjedovicm"><img src="https://avatars.githubusercontent.com/u/18329105?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mihajlo Medjedovic</b></sub></a><br /><a href="https://github.com/sasjs/server/commits?author=medjedovicm" title="Code">💻</a> <a href="https://github.com/sasjs/server/commits?author=medjedovicm" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://4gl.io/"><img src="https://avatars.githubusercontent.com/u/4420615?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Allan Bowe</b></sub></a><br /><a href="https://github.com/sasjs/server/commits?author=allanbowe" title="Code">💻</a> <a href="https://github.com/sasjs/server/commits?author=allanbowe" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/VladislavParhomchik"><img src="https://avatars.githubusercontent.com/u/83717836?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vladislav Parhomchik</b></sub></a><br /><a href="https://github.com/sasjs/server/commits?author=VladislavParhomchik" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/kknapen"><img src="https://avatars.githubusercontent.com/u/78609432?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Koen Knapen</b></sub></a><br /><a href="#userTesting-kknapen" title="User Testing">📓</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
