### SASjs Server is running

**This app is behind Cloudron's login.** Anyone visiting it gets a Cloudron
login screen first; access follows Cloudron users, groups and MFA.

**Get your initial admin password.** A local admin account is seeded on first
start. Open this app's Terminal (the `>_` button) and run:

```
cat /app/data/.initial-admin-password
```

Log in as `admin` with that password, change it, then delete the file.
<sso>Day-to-day logins go through Cloudron SSO, so that account is only a
break-glass one.</sso>

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
