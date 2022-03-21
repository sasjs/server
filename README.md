# SASjs Server

SASjs Server provides a NodeJS wrapper for calling the SAS binary executable. It can be installed on an actual SAS server, or locally on your desktop. It provides:

- Virtual filesystem for storing SAS programs and other content
- Ability to execute Stored Programs from a URL
- Ability to create web apps using simple Desktop SAS
- REST API with Swagger Docs

One major benefit of using SASjs Server alongside other components of the SASjs framework such as the [CLI](https://cli.sasjs.io), [Adapter](https://adapter.sasjs.io) and [Core](https://core.sasjs.io) library, is that the projects you create can be very easily ported to SAS 9 (Stored Process server) or Viya (Job Execution server).

SASjs Server is available in two modes - Desktop (without authentication) and Server (with authentication, and a database)

## Installation

Installation can be made programmatically using command line, or by manually downloading and running the executable.

### Programmatic

Fetch the relevant package from github using `curl`, eg as follows (for linux):

```bash
curl -L https://github.com/sasjs/server/releases/latest/download/linux.zip > linux.zip
unzip linux.zip
```

The app can then be launched with `./api-linux` and prompts followed (if ENV vars not set).

### Manual

1. Download the relevant package from the [releases](https://github.com/sasjs/server/releases) page
2. Trigger by double clicking (windows) or executing from commandline.

You are presented with two prompts (if not set as ENV vars):

- Location of your `sas.exe` / `sas.sh` executable
- Path to a filesystem location for Stored Programs and temporary files

## ENV Var configuration

When launching the app, it will make use of specific environment variables. These can be set in the following places:

- Configured globally in `/etc/environment` file
- Export in terminal or shell script (`export VAR=VALUE`)
- Prepended in the command
- Enter in the `.env` file alongside the executable

Example contents of a `.env` file:

```
MODE=desktop # options: [desktop|server] default: `desktop`
CORS=disable # options: [disable|enable] default: `disable` for `server` MODE and `enable` for `desktop` MODE
WHITELIST= # options: <http://localhost:3000 https://abc.com ...> space separated urls, each starting with protocol `http` or `https`
PROTOCOL=http # options: [http|https] default: http
PRIVATE_KEY=privkey.pem # only required for PROTOCOL `https`
FULL_CHAIN=fullchain.pem # only required for PROTOCOL `https`
PORT=5000 # default: 5000
ACCESS_TOKEN_SECRET=<secret> # only required for MODE `server`
REFRESH_TOKEN_SECRET=<secret> # only required for MODE `server`
AUTH_CODE_SECRET=<secret> # only required for MODE `server`
DB_CONNECT=mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER>/<DB_NAME>?retryWrites=true&w=majority # only required for MODE `server`

SAS_PATH=/path/to/sas/executable.exe
DRIVE_PATH=/tmp
```

## Persisting the Session

Normally the server process will stop when your terminal dies. To keep it going you can use the npm package [pm2](https://www.npmjs.com/package/pm2) (`npm install pm2@latest -g`) as follows:

```bash
export SAS_PATH=/opt/sas9/SASHome/SASFoundation/9.4/sasexe/sas
export PORT=5001
export DRIVE_PATH=./tmp

pm2 start api-linux
```

To get the logs (and some useful commands):

```bash
pm2 [list|ls|status]
pm2 logs
pm2 logs --lines 200
```

Managing processes:

```
pm2 restart app_name
pm2 reload app_name
pm2 stop app_name
pm2 delete app_name
```

Instead of `app_name` you can pass:

- `all` to act on all processes
- `id` to act on a specific process id

## Server Version

The following credentials can be used for the initial connection to SASjs/server. It is recommended to change these on first use.

- CLIENTID: `clientID1`
- USERNAME: `secretuser`
- PASSWORD: `secretpassword`
