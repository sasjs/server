# SASjs Server

SASjs Server is an open-source Node.js wrapper that gives you a REST API, a
filesystem (SASjs Drive) for storing programs, execution of Stored Programs
from a URL, and web-app streaming - the same role SAS 9 Stored Processes and
Viya Jobs play.

This package runs it in **server mode**: multi-user, with Cloudron single
sign-on, and a MongoDB store.

## Runtimes: JavaScript and Python

`RUN_TIMES` defaults to `js,py`, so stored programs are JavaScript or Python.
Node and Python 3 are both in the image, which makes this package
self-contained - **no SAS binary is required**.

SAS and R can be enabled by adding them to `RUN_TIMES`, but each needs an
executable supplied from outside the image: SAS is proprietary and licensed
and cannot be redistributed, and R is not installed here.

## Addons used

- **MongoDB** - the server-mode database (users, groups, tokens, sessions).
- **OIDC** - Cloudron single sign-on. Users sign in with their Cloudron
  account, so access follows Cloudron users, groups and MFA without
  maintaining a second account list.
- **Local storage** - `/app/data`, which holds the SASjs Drive, logs, uploads
  and the initial admin password.

## Authentication

The app authenticates users itself, through Cloudron single sign-on (OIDC), so
access follows Cloudron users, groups and MFA without maintaining a second
account list. There is no platform login wall in front of it: the app's own
sign-in screen is what a visitor meets.

Sign-in requires group membership, by fixed name. Create both groups under
**Users > Groups** and assign people to them:

- `sasjs-users` - everyone who should use the app; members are ordinary users.
- `sasjs-admins` - its administrators.

A user in neither group is refused at sign-in. Membership of `sasjs-admins` is
what makes a SASjs administrator - nobody becomes one simply by signing in
first. Set `AUTH_PROVIDERS` to an empty value to skip SSO and authenticate
against the local database only.

Password sign-in for local accounts is closed by default while single sign-on
is configured: no local account exists unless one is seeded, and an exposed
password form is the one credential an anonymous caller can guess. To seed a
break-glass local `admin` account, put `ADMIN_PASSWORD_INITIAL=<a strong
password>` in `/app/data/config.env` and restart the app - seeding one keeps
password sign-in open, which is the point of a break-glass account. Set
`LOCAL_LOGIN_ENABLED` explicitly to override either default.

## Access control

Restrict the app to the users and groups who should reach it, before anyone
signs in: open the app's **Settings > Access control** and choose "Only allow
the following users and groups". A Cloudron install is unrestricted by default,
which here means every Cloudron user can reach the sign-in screen and try -
and the `js` and `py` runtimes execute whatever is uploaded to SASjs Drive, so
the app itself is a privilege boundary worth closing.

## Configuration

Settings live in `/app/data/config.env` (visible in the File Manager; `.env` in
the same directory still works, and `config.env` wins where both set a key).
The effective configuration - runtimes, ports, which auth providers are on,
whether the admin password is set - is written to `/app/data/config.txt` on
every start, so it can be read without opening a terminal.

## A note on what these runtimes do

The `js` and `py` runtimes execute the program files stored on SASjs Drive,
server-side. That is the point of the application - and it is a privilege
boundary. Anyone who can write to the Drive can run code in this container.

Keep the app behind Cloudron access control, and grant Drive write access only
to trusted authors.

## Backups

Cloudron backs up `/app/data` and the MongoDB addon, so the SASjs Drive, logs
and uploaded content are all covered. Backups are taken automatically before
every app update.
