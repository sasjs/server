# SASjs Server Documentation

SASjs Server provides a visual interface and REST API for executing programs directly against the SAS executable (`sas.exe`/`sas.sh`).  The executable could be on a desktop, or an actual SAS server.  It works in a broadly similar way to the SAS® Stored Process server, or the Viya Job Execution Service - if you have either of these, then it is likely you do not need SASjs Server.

SASjs Server is FAST - responsiveness (for SAS Stored Programs) is around 200 milliseconds.  The following features are provided out of the box:

* SASjs Studio - for running SAS code and examining webout content
* REST API - documentation which can also used to make actual API calls
* AppStream - a portal for home-grown or third-party SAS-Powered Web Applications

If you are running older versions of SAS, or SAS on a desktop, then this product will enable you to:

* Install third party apps (such as [Data Controller for SAS](https://datacontroller.io))
* Run [tests](https://cli.sasjs.io/test) on your SAS Jobs, Services and Macros 
* Execute SAS code from a browser
* Execute JS code from SAS
* Build applications on SAS 

SASjs Server is MIT open source and the repository is available here:  [https://github.com/sasjs/server](https://github.com/sasjs/server).

## URLs

Everything the interface links to is at a top-level path:

| Path | What it is |
|---|---|
| `/` | The interface: the dashboard, the Apps screen, Studio |
| `/studio` | SASjs Studio, running ad hoc code |
| `/apps` | The apps the signed-in caller may open |
| `/docs` | This documentation, inside the interface (the pages themselves are at `/documentation`) |
| `/api` | The REST API's reference, inside the interface (the Swagger page is at `/api-assets/`); the API answers `/api/info`, `/api/stp/execute`, ... |
| `/app/<name>` | A published App Stream application |

The paths the interface used before these were introduced - `/SASjsStudio`, `/SASjsApps`, `/SASjsDocs`, `/SASjsSettings`, `/SASjsLogon`, `/AppStream` - redirect to them.

<!-- server-docs-ignore: /SASjsApiDocs -->

`/SASjsApiDocs` redirects to `/api-assets/`. It is a redirect rule rather than a mounted router, so the endpoint checker - which reads registered routes - does not see it.

The API also answers on `/SASjsApi`, the spelling `@sasjs/adapter` uses and the one the specification below documents. The two are aliases of the same routes, so a client may use either.  Likewise `/AppStream` keeps serving published apps.

