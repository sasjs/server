# Installation

There are two channels: the npm package and the standalone executable. Both read
the same [settings](settings.md) and serve the same API. Neither channel keeps the
process running on its own: see [Deployment](deployment.md) for the ways to do that.

## npm

```bash
npx @sasjs/server
```

Or install it once and run `sasjs-server` from then on:

```bash
npm install -g @sasjs/server
sasjs-server
```

Requires Node 22 or later, and is the only channel that runs on arm64 (Apple
Silicon, Graviton, a Pi) - the standalone executables are built for x64 only.
Installing the package runs no install script, so it makes no network call of its
own.

Run it from the directory the server should own: `.env` is read from the working
directory, and that directory also gets `./sasjs_root`. Without a tag, `npx` takes the latest release; for a deployment, pin the version in the install command to a release you have tested - they are listed on [the npm page](https://www.npmjs.com/package/@sasjs/server) - because an untagged `npx @sasjs/server` re-resolves `latest` on every run, so a restart becomes a silent upgrade.

## Standalone executable

The latest version can be downloaded from the Releases page:  [https://github.com/sasjs/server/releases](https://github.com/sasjs/server/releases)

On Linux it takes two lines:

```bash
curl -L https://github.com/sasjs/server/releases/latest/download/linux.zip > linux.zip
unzip linux.zip
```

macOS is the same package name changed: download `macos.zip`, and the executable inside is `api-macos`.

On Windows, download `windows.zip` and launch `api-win.exe`. You can ignore or cancel the popup; the app does not require administrative privileges.

The executables are built for x64 only. On arm64 - Apple Silicon, Graviton, a Raspberry Pi - use the [npm package](#npm).

The executable unpacks the assets it serves into a `tmp` folder inside `SASJS_ROOT`, and removes it when the process exits, so nothing accumulates in the service account's home directory. See [`SASJS_ROOT`](settings.md#sasjs_root) to choose the location.

## Configuration

After installation, there is only one mandatory input:

* `SAS_PATH` -> the full path to the **SAS executable** (eg `/path/to/sas.exe|sh`) in your environment.

At least one listener must also be enabled, with `HTTP_PORT`, `HTTPS_PORT` or both. An environment that enables neither is refused at startup, with a message naming both variables.

There are many additional [settings](settings.md). They go in a file called `.env` in the directory the server runs from - for the executable, the folder holding `api-linux` / `api-macos` / `api-win.exe`:

```bash
SAS_PATH=/path/to/your/sas.sh
# This part enables multi-user SAS (optional)
MODE=server
DB_CONNECT=mongodb+srv://admin:***@cluster.mongodb.net/mydb?retryWrites=true&w=majority
# A plain HTTP listener, and a TLS listener beside it
HTTP_PORT=5000
HTTPS_PORT=8443
CERT_CHAIN=/opt/certificates/fullchain.pem
PRIVATE_KEY=/opt/certificates/privkey.pem
```

Ports below 1024 need the capability described under [`HTTP_PORT`](settings.md#http_port), which is why the sample uses 8443 for TLS; a deployment on 443 grants that capability to the executable instead.

Plain HTTP binds the loopback interface unless `HTTP_BIND_ADDRESS` names another one, and a non-loopback address is refused unless `HTTP_ALLOW_REMOTE=true` is set, because plain HTTP sends credentials in clear text.

Upgrading from a release that used the old listener settings takes one of two forms:

- An install that set neither `PROTOCOL` nor `PORT` relied on the old default of plain HTTP on port 5000. It now enables no listener, so the server refuses to start and names both variables. Set `HTTP_PORT=5000` before upgrading, or `HTTPS_PORT` with the certificate settings.
- An install that ran with `PROTOCOL=http` and no `HTTP_BIND_ADDRESS` accepted connections on every interface. It now listens on `127.0.0.1` only, so a remote client gets connection refused until `HTTP_BIND_ADDRESS` names the interface you serve on and `HTTP_ALLOW_REMOTE=true` is set.

A `PORT` that is still in the file is translated into the matching listener for one release, with a warning, so an install that sets `PORT` alone keeps serving.

Then launch the executable (eg `./api-linux`, or double click `api-win.exe`). The startup log states each listener as it binds - for example `http on 127.0.0.1:5000` - and that address is the one to open.

There is also a [guide to deploying SASjs Server on an Ubuntu VPS](https://sasapps.io/sasjs-server-on-vps).

The server runs in the foreground. [Deployment](deployment.md) covers keeping it up with systemd, launchd, Task Scheduler or pm2.


## SSL Certificates

To run over `https`, SASjs server needs a copy of your certificates.  The path to these certificates should be provided in the [`PRIVATE_KEY`](settings.md#private_key) and [`CERT_CHAIN`](settings.md#cert_chain) settings.  If you are using self-signed certificates, then the [`CA_ROOT`](settings.md#ca_root) file should also be provided.

Example config:

```
HTTPS_PORT=443
CERT_CHAIN=/opt/certificates/fullchain.pem
PRIVATE_KEY=/opt/certificates/privkey.pem
```

Suggested instructions for obtaining certificates on a linux environment are provided below.

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
# provide domain to prompt below WITHOUT https prefix, eg your.domain.com
sudo certbot certonly --standalone
# check for certificates
sudo ls /etc/letsencrypt/live/your.domain.com
```

For debugging certificate issues, the following link is useful:  [https://certbot.eff.org/instructions?ws=other&os=ubuntufocal](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal)
