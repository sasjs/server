# CONTRIBUTING

Contributions are very welcome!  Feel free to raise an issue or start a discussion, for help in getting started.

The app can be deployed using Docker or NodeJS.

## Configuration

Configuration is made using `.env` files (per [README.md](https://github.com/sasjs/server#env-var-configuration) settings), _except_ for one case, when running in NodeJS in production - in which case the path to the SAS executable is made in the `configuration` section of `package.json`.

The `.env` file should be created in the location(s) below.  Each folder contains a `.env.example` file that may be adjusted and renamed.

* `.env` - the root .env file is used only for Docker deploys.
* `api/.env` - this is the primary file used in NodeJS deploys
* `web/.env` - this file is only necessary in NodeJS when running `web` and `api` seperately (on different ports).


## Using Docker

### Docker Development Mode

Command to run docker for development:

```
docker-compose up -d
```

It uses default docker compose file i.e. `docker-compose.yml` present at root.
It will build following images if running first time:

- `sasjs_server_api` - image for sasjs api server app based on _ExpressJS_
- `sasjs_server_web` - image for sasjs web component app based on _ReactJS_
- `mongodb` - image for mongo database
- `mongo-seed-users` - will be populating user data specified in _./mongo-seed/users/user.json_
- `mongo-seed-clients` - will be populating client data specified in _./mongo-seed/clients/client.json_


### Docker Production Mode

Command to run docker for production:

```
docker-compose -f docker-compose.prod.yml up -d
```

It uses specified docker compose file i.e. `docker-compose.prod.yml` present at root.
It will build following images if running first time:

- `sasjs_server_prod` - image for sasjs server app containing api and web component's build served at route `/`
- `mongodb` - image for mongo database
- `mongo-seed-users` - will be populating user data specified in _./mongo-seed/users/user.json_
- `mongo-seed-clients` - will be populating client data specified in _./mongo-seed/clients/client.json_

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
