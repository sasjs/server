# mongo-seed/users

This seeder used to import a pre-hashed `secretuser` / `secretpassword` admin
account straight into the database - a known credential baked into a public
repository, active and admin in every deployment built from
`docker-compose.prod.yml`.

It now seeds no users. The API's own `seedDB` runs at first boot and creates
the admin account from the `ADMIN_USERNAME` and `ADMIN_PASSWORD_INITIAL`
environment variables - which are REQUIRED in server mode precisely so no
default credential can exist. The account is created flagged
`needsToUpdatePassword`, and the server enforces that flag: until the
password is changed the account can do nothing but change it.

Set these before first start:

```yaml
environment:
  ADMIN_USERNAME: youradmin
  ADMIN_PASSWORD_INITIAL: a-long-random-value
```
