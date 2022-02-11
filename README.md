# SASjs Server

SASjs Server provides a NodeJS wrapper for calling the SAS binary executable. It can be installed on an actual SAS server, or it could even run locally on your desktop. It provides the following functionality:

- Virtual filesystem for storing SAS programs and other content
- Ability to execute Stored Programs from a URL
- Ability to create web apps using simple Desktop SAS

One major benefit of using SASjs Server (alongside other components of the SASjs framework such as the [CLI](https://cli.sasjs.io), [Adapter](https://adapter.sasjs.io) and [Core](https://core.sasjs.io) library) is that the projects you create can be very easily ported to SAS 9 (Stored Process server) or Viya (Job Execution server).

## Installation

First, download the relevant package from the [releases](https://github.com/sasjs/server/releases) page - either manually, or with commandline, eg as follow:

```bash
curl -L https://github.com/sasjs/server/releases/latest/download/linux.zip > linux.zip
unzip linux.zip
./api-linux
```

Second, trigger by double clicking (windows) or executing from commandline.

You are presented with two prompts:

* Location of your `sas.exe` / `sas.sh` executable
* Path to a filesystem location for Stored Programs and temporary files

## Configuration

Configuration is made in the `configuration` section of `package.json`:

- Provide path to SAS9 executable.

### Using dockers:

There is `.env.example` file present at root of the project. [for Production]

There is `.env.example` file present at `./api` of the project. [for Development]

There is `.env.example` file present at `./web` of the project. [for Development]

Remember to provide enviornment variables.

#### Development

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

#### Production

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

### Using node:

#### Development (running api and web seperately):

##### API

Navigate to `./api`
There is `.env.example` file present at `./api` directory. Remember to provide enviornment variables else default values will be used mentioned in `.env.example` files
Command to install and run api server.

```
npm install
npm start
```

##### Web

Navigate to `./web`
There is `.env.example` file present at `./web` directory. Remember to provide enviornment variables else default values will be used mentioned in `.env.example` files
Command to install and run api server.

```
npm install
npm start
```

#### Development (running only api server and have web build served):

##### API server also serving Web build files

There is `.env.example` file present at `./api` directory. Remember to provide enviornment variables else default values will be used mentioned in `.env.example` files
Command to install and run api server.

```
cd ./web && npm i && npm build && cd ../
cd ./api && npm i && npm start
```

#### Production

##### API & WEB

```
npm run server
```

This will install/build `web` and install `api`, then start prod server.

Normally the server process will stop when your terminal dies. To keep it going you can use the npm package [forever](https://www.npmjs.com/package/forever) as follows:

```bash
npm i -g forever
forever start -c "npm run server:start" ./
```

To get the log files:
```bash
forever list
# grap log file link
tail -f LOGFILE
```

To stop:

```
forever stop <pid>
```

## Executables

Command to generate executables

```
cd ./web && npm i && npm build && cd ../
cd ./api && npm i && npm run exe
```

This will install/build web app and install/create executables of sasjs server at root `./executables`
