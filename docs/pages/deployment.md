# Deployment

SASjs Server runs in the foreground: it starts, binds its listeners and stays up until it receives SIGINT or SIGTERM. It does not daemonise, detach or write a pid file, so keeping it up is the job of whatever supervises the process. This page lists the options, what each one survives, and what a restart costs.

## Choosing a supervisor

| Method | Survives closing the terminal | Restarts after a crash | Starts at boot | Platforms |
|---|---|---|---|---|
| systemd | yes | yes | yes | Linux |
| launchd | yes | yes | at login | macOS |
| Task Scheduler | yes | yes, once configured | at logon | Windows |
| WinSW, NSSM | yes | yes | yes | Windows |
| pm2 | yes | yes | yes | Linux, macOS; Windows via pm2-installer |
| `nohup` | yes | no | no | Linux, macOS |
| foreground, `npx` | no | no | no | all |

The recipes below assume the npm install (`npm install -g @sasjs/server`), so the command is `sasjs-server`. With the [standalone executable](installation.md#standalone-executable), use its path instead: `api-linux`, `api-macos` or `api-win.exe`.

Do not run it as root. The server refuses to start as root unless [`RUN_AS`](settings.md#run_as) is set to `root` deliberately.

## The working directory matters

`.env` is read from the working directory, and `sasjs_root` - SAS WORK, the drive, the package cache and the logs - is created there. Every recipe below sets a working directory, and it should be a location that persists across restarts rather than, say, a user's home directory on a machine that is rebuilt.

## Linux: systemd

Write `/etc/systemd/system/sasjs-server.service`:

```ini
[Unit]
Description=SASjs Server
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=sasjs
WorkingDirectory=/srv/sasjs
Environment=SAS_PATH=/opt/sas/sas.sh
EnvironmentFile=-/srv/sasjs/sasjs.env
ExecStart=/usr/local/bin/sasjs-server
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then enable it and follow its log. The account and the directory must exist first, or the unit fails on start:

```bash
sudo useradd --system --home /srv/sasjs --shell /usr/sbin/nologin sasjs
sudo install -d -o sasjs -g sasjs /srv/sasjs
sudo systemctl daemon-reload
sudo systemctl enable --now sasjs-server
journalctl -u sasjs-server -f
```

- `Restart=on-failure` restarts a crashed process and leaves a deliberate `systemctl stop` alone, because the server exits 0 when it handles SIGTERM.
- `StartLimitIntervalSec` and `StartLimitBurst` decide how many restarts systemd allows before it gives up. systemd's own default is five restarts in ten seconds; the values above allow five in a minute, so a transient failure still recovers while a wrong `SAS_PATH` - which exits with code 1 immediately - stops the unit instead of looping.
- `Environment=` and `EnvironmentFile=` both win over an `.env` line with the same name, because `dotenv` does not overwrite variables that are already set.

## macOS: launchd

Write `~/Library/LaunchAgents/io.sasjs.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>io.sasjs.server</string>
  <key>ProgramArguments</key>
  <array><string>/usr/local/bin/sasjs-server</string></array>
  <key>WorkingDirectory</key><string>/Users/sasjs/server</string>
  <key>EnvironmentVariables</key>
  <dict><key>SAS_PATH</key><string>/opt/sas/sas.sh</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/Users/sasjs/server/logs/server.out</string>
  <key>StandardErrorPath</key><string>/Users/sasjs/server/logs/server.err</string>
</dict>
</plist>
```

Then load it:

```bash
mkdir -p /Users/sasjs/server/logs
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/io.sasjs.server.plist
```

`launchctl bootout gui/$UID/io.sasjs.server` removes it again; `launchctl load -w` works but is deprecated.

A LaunchAgent starts when that user logs in, and runs as that user. For a start before anyone logs in, install the same plist as a LaunchDaemon in `/Library/LaunchDaemons` (root-owned, and it needs a `UserName` key), which also means the server keeps running with nobody logged in.

## Windows: Task Scheduler

`schtasks` starts a task at logon, and that is all the command below configures: restart-on-failure is a task setting rather than a `schtasks` flag, so add it in the task's XML (`<RestartOnFailure>`) or in the Task Scheduler GUI under "If the task fails, restart every". Set the working directory explicitly, because a task's default working directory is `C:\Windows\System32`, which is where `sasjs_root` would otherwise be created:

```bat
schtasks /create /tn "SASjs Server" /sc onlogon /tr "cmd /c cd /d C:\sasjs && api-win.exe"
```

For a real Windows service - one that starts before anybody logs on - wrap the executable with [WinSW](https://github.com/winsw/winsw) or [NSSM](https://nssm.cc/). With NSSM:

```bat
nssm install SASjsServer C:\sasjs\api-win.exe
nssm set SASjsServer AppDirectory C:\sasjs
nssm set SASjsServer AppStdout C:\sasjs\logs\server.out
nssm set SASjsServer AppStderr C:\sasjs\logs\server.err
nssm start SASjsServer
```

## pm2

pm2 is a process manager rather than an init system: it restarts what it manages, and hands the boot-time start to the platform.

```bash
pm2 start /usr/local/bin/sasjs-server --name sasjs-server
pm2 startup     # prints a command; run that command once
pm2 save        # records the current process list for the startup script
```

`pm2 startup` supports systemd, upstart and launchd. It does nothing on Windows, where the boot-time start needs [pm2-installer](https://github.com/jessety/pm2-installer), or Task Scheduler or a WinSW service. `pm2 save` is what makes the restart survive a reboot - without it the startup script starts an empty process list.

pm2 stops a process with SIGINT, which the server drains the same way as SIGTERM. `pm2 logs --lines 200` shows the stderr that explains a crash.

## Foreground and nohup

```bash
nohup ./api-linux > server.log 2>&1 & disown
```

This survives closing the terminal, and nothing else: no restart after a crash, no start at boot, and the log is a file that nothing rotates.

## npx is a launcher, not a supervisor

`npx @sasjs/server` fetches the package and runs it in the foreground. When the terminal closes the process goes with it. Two things to know before using it:

- A tag decides the version. Untagged, `npx` re-resolves `latest` on every start, so a restart silently changes version; pin the release you have tested in the install command.
- The working directory still owns `.env` and `sasjs_root`, but the package itself lives in an evictable `~/.npm/_npx/<hash>` cache, so an `.env` written next to the package would be lost.

For anything that has to stay up, install globally and give `sasjs-server` to the supervisor.

## Checking that it is up

`GET /SASjsApi/info` is public by design - the login screen needs the mode, the runtimes and the configured authentication providers before anyone has signed in - and it costs nothing:

```bash
curl -fsS http://localhost:5000/SASjsApi/info
```

A 200 with `mode`, `httpPort`/`httpsPort` and `runTimes` means the process is up and its listeners are bound. Use it as the probe in a monitoring script; systemd and Task Scheduler have no health check of their own.

## Why the process can stop

There are five ways out, and each has a distinct cause:

| Situation | Exit code |
|---|---|
| Invalid environment at boot | 1 |
| No usable listener configuration | 1 |
| A listener cannot bind its port | 1 |
| SIGINT or SIGTERM | 0 |
| Unhandled promise rejection or uncaught exception | 1 (the Node default) |

The first three are configuration, and the log names the setting. The last one is the case where the stack trace is the diagnosis, so run the server where stderr is captured - the journal, `pm2 logs`, the task's output file - rather than in a console window that closes with the crash. Nothing in the server stops it because it has been idle.

## What a restart costs

- Sessions live in the server's memory, so a restart drops every session, ready or running. There is no session store to recover from.
- A session is destroyed about 15 minutes after it is created, and a running one gets ten more minutes. Its folder is removed at that point.
- SIGTERM and SIGINT drain in-flight HTTP requests for up to five seconds before the sockets are closed. A SAS process that is already running is a child of the server and is killed with it, so its log stops mid-program and the client sees the connection reset.
- `.env` and the rest of the configuration are read at boot, so an edit takes effect on the next restart.

For work that runs longer than a request, submit a triggered program and poll it, so that the client is not holding a request open when the server restarts. Both routes require a bearer token outside desktop mode, which has no authentication at all:

```bash
# 1. Submit the program - the response carries the session id
SESSION_ID=$(curl -fsS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "http://localhost:5000/SASjsApi/stp/trigger?_program=/Public/app/run.sas" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['sessionId'])")

# 2. Poll that id until the program finishes
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "http://localhost:5000/SASjsApi/session/$SESSION_ID/state"
# -> {"state":"completed"}

# 3. Read what it produced, while the session is still alive
curl -fsS -H "Authorization: Bearer ***" \
  "http://localhost:5000/SASjsApi/session/$SESSION_ID/log"
```

The state is an object, and the log and the output exist only for as long as the session does: see [Sessions](sessions.md) for the endpoints, the ownership rule and the retention window.
