# SASjs Server - container image

A container image for SASjs Server, built from this repository's own source
and published as `ghcr.io/sasjs/server`. It is platform-neutral: run it
anywhere Docker runs. It is also the image the [Cloudron app package](cloudron/)
installs - on that platform the entrypoint detects the `CLOUDRON_*` addon
variables and wires them up automatically.

## Quick start

```bash
docker run -d --name sasjs \
  -p 5000:5000 \
  -v sasjs_data:/usr/server/data \
  -e DB_CONNECT=mongodb://mongo:27017/sasjs \
  ghcr.io/sasjs/server
```

Server mode (the default) is multi-user and needs a MongoDB reachable at
`DB_CONNECT`. For a single-user instance with no database, set `MODE=desktop`.

Health check: `GET /SASjsApi/info` (no auth required).

## Configuration

Everything is environment variables - the same ones SASjs Server reads
everywhere (see the `.env.example` files in `api/` and `web/`). The ones that
matter most in a container:

| Variable | Default | Purpose |
|---|---|---|
| `MODE` | `server` | `server` (multi-user, needs DB) or `desktop` (single-user) |
| `DB_CONNECT` / `DB_TYPE` | - | MongoDB connection string / `mongodb` |
| `DATA_DIR` | `/usr/server/data` | The only writable path - mount it to persist state |
| `PORT` / `PROTOCOL` | `5000` / `http` | Listen settings; terminate TLS in front of the container |
| `RUN_TIMES` | `js,py` | Comma-separated: `sas`, `js`, `py`, `r` |
| `NODE_PATH` / `PYTHON_PATH` | in-image | Runtime executables |
| `SAS_PATH` / `R_PATH` | - | Required if `sas`/`r` are in `RUN_TIMES` (SAS is licensed and not bundled) |
| `AUTH_PROVIDERS` | - | e.g. `oidc` or empty for local accounts only |
| `ADMIN_PASSWORD_INITIAL` | unset | Seeded break-glass admin password. Unset means NO local admin is created, and the first user to sign in through the configured auth provider becomes the administrator |

Every one of these can also be put in a `.env` file in `DATA_DIR`, read on
every start. That file is the only configuration surface a Cloudron app has -
the platform's File Manager can edit it, while the dashboard has no per-app
environment UI. The entrypoint sources it before applying its own defaults,
and the server loads it itself, because it runs with `DATA_DIR` as its working
directory.

Two consequences worth knowing:

- A seeded admin (`ADMIN_PASSWORD_INITIAL` set) counts as an existing
  administrator, which suppresses the first-user bootstrap - the first person
  to sign in is then a normal user. Set it only if that is what you want.
- Changing the password of an admin that already exists needs
  `ADMIN_PASSWORD_RESET=YES`, because the seed only creates the account when
  it is absent.

A complete compose example is in [docker-compose.yml](docker-compose.yml).

## What the image does

- Builds `web/` then `api/` from this repository's source - the same order the
  api build itself requires, because it copies the built frontend into its
  own tree.
- Speaks plain HTTP on port 5000: terminate TLS at whatever sits in front of
  it (a reverse proxy, a platform's router).
- Runs the application as the non-root user (uid 1000); the entrypoint starts
  as root only to fix data-directory ownership, then drops privileges.
- Stores everything under `DATA_DIR` - the SASjs Drive, logs, uploads and the
  generated admin password - so backing up that one volume backs up the app.

**The `js` and `py` runtimes execute code uploaded to SASjs Drive,
server-side.** That is the application's purpose and it is a privilege
boundary: anyone who can write to the Drive can run code in this container.
Grant Drive write access only to trusted authors, and keep the instance
behind an authentication wall.

## Cloudron

On [Cloudron](https://cloudron.io) you do not run the image directly: the app
package in [cloudron/](cloudron/) installs `ghcr.io/sasjs/server` with the
platform's MongoDB, single sign-on (OIDC), access control and backups wired
up. The entrypoint detects the platform's addon variables automatically; the
two sides are kept in sync by `cloudron/tests/verify-start-sh.sh`.

## Verification

The harnesses in [tests/](tests/) need no Docker daemon:

```bash
tests/verify-start-sh.sh      # entrypoint behaviour: 50+ assertions
tests/verify-manifest.sh      # Cloudron manifest rules the schema misses
tests/verify-versions.sh      # catalogue generator, failure paths included
```

CI builds the image, scans it, and boots it against a real MongoDB to drive
the login flow and execute a JavaScript and a Python stored program - then
boots it again with OIDC configured and asserts the sign-in redirect.

**Not verified here:** a pull of `ghcr.io/sasjs/server` - the first image is
published by the release workflow, and anonymous pullability is checked by
`cloudron/scripts/verify-installable.py` after that release exists.

## Licence

MIT, like the rest of this repository. SAS itself is commercial and licensed
separately by SAS Institute.
