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

The app sits behind Cloudron's own authentication wall, so an unauthenticated
visitor gets a Cloudron login screen rather than the application. Set this up
at install time - the `proxyAuth` addon cannot be added to an app afterwards.

Inside that wall, day-to-day logins go through Cloudron single sign-on (OIDC),
so access follows Cloudron users, groups and MFA. Set `AUTH_PROVIDERS` to an
empty value to skip SSO and authenticate against the local database only.

There is no pre-created admin account. The FIRST user to sign in becomes the
administrator; every user after that is a normal user, so grant the others what
they need under Settings > Permissions once you are in.

A break-glass local `admin` account is optional. To seed one, put
`ADMIN_PASSWORD_INITIAL=<a strong password>` in `/app/data/.env` (File Manager,
or this app's Terminal) and restart the app. Note that a seeded admin counts as
an existing administrator, so the first SSO user would then be a normal user -
set it before anyone signs in only if that is the arrangement you want.

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
