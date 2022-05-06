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
# options: [desktop|server] default: `desktop`
MODE=

# options: [disable|enable] default: `disable` for `server` & `enable` for `desktop`
# If enabled, be sure to also configure the WHITELIST of third party servers.
CORS=

# options: <http://localhost:3000 https://abc.com ...> space separated urls
WHITELIST=

# options: [http|https] default: http
PROTOCOL=

# default: 5000
PORT=

# optional
# for MODE: `desktop`, prompts user
# for MODE: `server` gets value from api/package.json `configuration.sasPath`
SAS_PATH=/path/to/sas/executable.exe

# optional HELMET config
# crossOriginEmbedderPolicy flag that will be passed in HELMET config
# https://helmetjs.github.io/
HELMET_COEP=

# optional HELMET config
# path to json file that will include HELMET `contentSecurityPolicy` directives
# https://helmetjs.github.io/
HELMET_CSP_CONFIG_PATH=./csp.config.json

# optional
# for MODE: `desktop`, prompts user
# for MODE: `server` defaults to /tmp
DRIVE_PATH=/tmp

# ENV variables required for PROTOCOL: `https`
PRIVATE_KEY=privkey.pem
FULL_CHAIN=fullchain.pem

# ENV variables required for MODE: `server`
ACCESS_TOKEN_SECRET=<secret>
REFRESH_TOKEN_SECRET=<secret>
AUTH_CODE_SECRET=<secret>
SESSION_SECRET=<secret>
DB_CONNECT=mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER>/<DB_NAME>?retryWrites=true&w=majority

# SAS Options
# On windows use SAS_OPTIONS and on unix use SASV9_OPTIONS
# Any options set here are automatically applied in the SAS session
# See: https://documentation.sas.com/doc/en/pgmsascdc/9.4_3.5/hostunx/p0wrdmqp8k0oyyn1xbx3bp3qy2wl.htm
# And: https://documentation.sas.com/doc/en/pgmsascdc/9.4_3.5/hostwin/p0drw76qo0gig2n1kcoliekh605k.htm#p09y7hx0grw1gin1giuvrjyx61m6
SAS_OPTIONS= -NOXCMD
SASV9_OPTIONS= -NOXCMD

```

## Persisting the Session

Normally the server process will stop when your terminal dies. To keep it going you can use the following suggested approaches:

1. Linux Background Job
2. NPM package `pm2`

### Background Job

Trigger the command using NOHUP, redirecting the output commands, eg `nohup ./api-linux > server.log 2>&1 &`.

You can now see the job running using the `jobs` command. To ensure that it will still run when your terminal is closed, execute the `disown` command. To kill it later, use the `kill -9 <pid>` command. You can see your sessions using `top -u <userid>`. Type `c` to see the commands being run against each pid.

### PM2

Install the npm package [pm2](https://www.npmjs.com/package/pm2) (`npm install pm2@latest -g`) and execute, eg as follows:

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

The following credentials can be used for the initial connection to SASjs/server. It is highly recommended to change these on first use.

- CLIENTID: `clientID1`
- USERNAME: `secretuser`
- PASSWORD: `secretpassword`
