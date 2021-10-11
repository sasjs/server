# SASjs Server

SASjs Server provides a NodeJS wrapper for calling the SAS binary executable.  It can be installed on an actual SAS server, or it could even run locally on your desktop.  It provides the following functionality:

* Virtual filesystem for storing SAS programs and other content
* Ability to execute Stored Programs from a URL
* Ability to create web apps using simple Desktop SAS 

One major benefit of using SASjs Server (alongside other components of the SASjs framework such as the [CLI](https://cli.sasjs.io), [Adapter](https://adapter.sasjs.io) and [Core](https://core.sasjs.io) library) is that the projects you create can be very easily ported to SAS 9 (Stored Process server) or Viya (Job Execution server).

## Configuration

Configuration is made in the `configuration` section of `package.json`:

- Provide path to SAS9 executable.
- Provide `SASjsServer` hostname and port (eg `localhost:5000`).
