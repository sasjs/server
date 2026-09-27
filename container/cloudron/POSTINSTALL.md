### SASjs Server is running

**Create the groups before anyone signs in.** Sign-in depends on group
membership: under **Users > Groups** create `sasjs-users` for everyone who
should use the app and `sasjs-admins` for its administrators, then assign people
to them. A user in neither group is refused at sign-in, and membership of
`sasjs-admins` is what makes a SASjs administrator - nobody becomes one by
signing in first. Both groups appear inside the app as well, so permissions can
be granted to the group instead of user by user; membership is taken from
Cloudron at each sign-in, and cannot be edited in the app.

**Restrict access as well.** Open the app's **Settings > Access control** and
choose "Only allow the following users and groups". The app authenticates users
itself through Cloudron single sign-on, so this is what decides who can even
attempt to sign in.

**Sign in with Cloudron.** The app shows its own sign-in screen; use "Sign in
with Cloudron". Once you are in, grant other users what they need under
Settings > Permissions.

**Break-glass local account (optional).** To seed a local `admin` account, add
`ADMIN_PASSWORD_INITIAL=<a strong password>` to `/app/data/config.env` (File
Manager, or this app's Terminal) and restart the app. Seeding one keeps password
sign-in open, which is the point of a break-glass account; password sign-in is
otherwise closed while single sign-on is configured.

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
