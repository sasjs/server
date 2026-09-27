# CONTRIBUTING

Contributions are very welcome!  Feel free to raise an issue or start a discussion, for help in getting started.

The app can be deployed using Docker or NodeJS.

## Git hooks

The repo ships its own git hooks in [`.git-hooks/`](../.git-hooks):

- `pre-commit` - scans staged changes for secrets with gitleaks, and blocks a commit that would add 2MB or more of new blobs
- `commit-msg` - verifies the commit message follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) standard

The repo `.npmrc` sets `ignore-scripts=true`, so the `prepare` script that would normally set `core.hooksPath` during `npm i` never runs. After cloning (or if your commits are not being checked), activate the hooks with a one-time command, run from the repo root:

```bash
git config core.hooksPath ./.git-hooks
```

The pre-commit hook runs the gitleaks binary provided by the root `@nogoo9/gitleaks` devDependency, so make sure `npm i` has run in the repo root - not just in `api/` or `web/` - before your first commit.

## Configuration

Configuration is made using `.env` files (per [README.md](https://github.com/sasjs/server#env-var-configuration) settings), _except_ for one case, when running in NodeJS in production - in which case the path to the SAS executable is made in the `configuration` section of `package.json`.

The `.env` file should be created in the location(s) below.  Each folder contains a `.env.example` file that may be adjusted and renamed.

* `api/.env` - this is the primary file used in NodeJS deploys
* `web/.env` - this file is only necessary in NodeJS when running `web` and `api` seperately (on different ports).

A container is configured by environment variables rather than by a file on disk. The ones it reads are listed in [container/README.md](../container/README.md).


## Using Docker

The supported Docker deployment is the container image, which builds the web bundle and the API from this repository's own source and serves both from one process. Its contract - the environment variables, the port, the one writable path - is documented in [container/README.md](../container/README.md).

A minimal stack, that image plus a MongoDB for server mode, is in [`container/docker-compose.yml`](../container/docker-compose.yml):

```
docker compose -f container/docker-compose.yml up -d
```

The file carries a commented `build:` block, which builds `container/Dockerfile` from a local checkout instead of pulling the published image. It is the build CI runs, with the repository root as the context.

For single-user work with no database, run the image with `MODE=desktop`.

## Using NodeJS:

Be sure to use v16 or above, and to set your environment variables in the relevant `.env` file(s) - else defaults will be used.

### NodeJS Development Mode

SASjs Server is split between an API server (serving REST requests) and a WEB Server (everything else).  These can be run together, or on seperate ports.

### NodeJS Dev - Single Port

Here the environment variables should be configured under `api.env`.  Then:

```
cd ./web && npm i && npm build
cd ../api && npm i && npm start
```

### NodeJS Dev - Seperate Ports

Set the backend variables in `api/.env` and the frontend variables in `web/.env`. Then:

#### API server
```
cd api
npm install
npm start
```

#### Web Server 

```
cd web
npm install
npm start
```

#### NodeJS Production Mode

Update the `.env` file in the *api* folder.  Then:

```
npm run server
```

This will install/build `web` and install `api`, then start prod server.


## Executables

In order to generate the final executables:

```
cd ./web && npm i && npm build && cd ../
cd ./api && npm i && npm run exe
```

This will install/build web app and install/create executables of sasjs server at root `./executables`

## Releases

To cut a release, run `npm run release` on the main branch, then push the tags (per the console log link)
