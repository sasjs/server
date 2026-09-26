### SASjs Server is running

**This app is behind Cloudron's login.** Anyone visiting it gets a Cloudron
login screen first; access follows Cloudron users, groups and MFA.

**Sign in and become the administrator.** There is no pre-created admin
account: the FIRST user to sign in becomes the administrator, and every user
after that is a normal user. Sign in now, then grant the others what they need
under Settings > Permissions.

**Break-glass local account (optional).** To seed a local `admin` account
instead, add `ADMIN_PASSWORD_INITIAL=<a strong password>` to
`/app/data/.env` (File Manager, or this app's Terminal) and restart the app.
<sso>Note that a seeded admin counts as an existing administrator, so the first
SSO user would then be a normal user - set it before anyone signs in only if
that is what you want.</sso>

**Stored programs execute real code.** The `js` and `py` runtimes run whatever
is uploaded to SASjs Drive, server-side. Grant Drive write access only to
trusted authors, and keep this app behind Cloudron access control.

**Check it is up.**

```
curl $CLOUDRON-APP-ORIGIN/SASjsApi/info
```

**No SAS binary is required.** JavaScript and Python are built into the image.
SAS and R are available if you add them to `RUN_TIMES` and point `SAS_PATH` or
`R_PATH` at an executable you supply - SAS is licensed and is not
redistributed here.

Full notes, including the CI pipeline and what was verified, are in the
repository README.
