# SASjs Server

SASjs Server provides a NodeJS wrapper for calling the SAS binary executable. It can be installed on an actual SAS server, or it could even run locally on your desktop. It provides the following functionality:

- Virtual filesystem for storing SAS programs and other content
- Ability to execute Stored Programs from a URL
- Ability to create web apps using simple Desktop SAS

One major benefit of using SASjs Server (alongside other components of the SASjs framework such as the [CLI](https://cli.sasjs.io), [Adapter](https://adapter.sasjs.io) and [Core](https://core.sasjs.io) library) is that the projects you create can be very easily ported to SAS 9 (Stored Process server) or Viya (Job Execution server).

SASjs Server is available in two modes - Desktop (without authentication) and Server (with authentiation, and a database)

## Desktop Version

### Manual Installation

Download the relevant package from the [releases](https://github.com/sasjs/server/releases) page

Next, trigger by double clicking (windows) or executing from commandline.

You are presented with two prompts:

- Location of your `sas.exe` / `sas.sh` executable
- Path to a filesystem location for Stored Programs and temporary files

## Programmatic Installation

Fetch the relevant package from github using `curl`, eg as follows (for linux):

```bash
curl -L https://github.com/sasjs/server/releases/latest/download/linux.zip > linux.zip
unzip linux.zip
```

The app can then be launched with `./api-linux` and prompts followed.

When launching the app, it will make use of specific environment variables. These can be set in the following places:

- Configured globally in /etc/environment file
- Export in terminal or shell script (`export VAR=VALUE`)
- Prepend in command
- Enter in the `.env` file alongside the executable

Example variables:

```
PORT=5004
SAS_PATH=/path/to/sas/executable.exe
DRIVE_PATH=./tmp
```

Setting these prompts variables will avoid the need for prompts.

Normally the server process will stop when your terminal dies. To keep it going you can use the npm package [pm2](https://www.npmjs.com/package/pm2) (`npm install pm2@latest -g`) as follows:

```bash
export SAS_PATH=/opt/sas9/SASHome/SASFoundation/9.4/sasexe/sas
export PORT=5001
export DRIVE_PATH=./tmp

pm2 start api-linux
```

To get the logs (and some usefull commands):

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
