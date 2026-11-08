---
layout: article
title: Stored Programs
description: Stored Programs may be written in SAS, Python, R, or JavaScript.  They are saved to SASjs Drive and can be executed with a GET or POST request.
og_image: /img/stps.png
---

# Stored Programs

Stored Programs may be written in SAS, Python, R, or JavaScript and are saved to SASjs Drive.  When the `/SASjsApi/stp/execute` endpoint is called with a `_PROGRAM` URL parameter (pointing to the logical program location), a "Stored Program" is prepared and executed in a SAS/JS/PYTHON/R [session](sessions.md) according to the file extension.

For the usual case where the `_program` variable does NOT contain an extension (eg `/some/stored/program`) then by default, SASjs Server will attempt to find "program.sas" in the `/some/stored` folder.  To change this default, see the [RUN_TIMES](settings.md#run_times) settings.

When Stored Programs are executed, some pre-code is injected to make available various inputs, such as:

* Input Macro Variables
* Input Files
* Utility Macros / Functions

The implementation varies depending on whether it is running as a SAS, JS, Python or R session.

If you are calling your Stored Programs from a web application, it is recommended to review the [sasjs/adapter](https://github.com/sasjs/adapter) (designed to work with Stored Programs) and associated [seed apps](https://github.com/search?q=topic%3Asasjs-seed-app+org%3Asasjs+fork%3Atrue&type=repositories).  You might also want to review the [Data Controller source](https://git.datacontroller.io/dc/dc) as an example of a relatively large, commercial application built on SASjs.

## Special Variables

The following variables are "special":

### `_PROGRAM`
This is a required input, and will point to the Stored Program location in SASjs Drive.  The extension may be omitted, subject to the behaviour in the [RUN_TIMES](settings.md#run_times) setting.

### `_DEBUG`
Setting this to 131 or greater will result in the log being returned.  The log is framed by the following UUID:  `SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784`

The log can itself contain that UUID - a program's source is echoed into its log, so the literal appears wherever `ms_runstp` or `ms_testservice` is part of the submitted code, and a service that calls another puts the nested response in it.  The framing adds exactly two occurrences, one either side of the log: `webout` is everything before the first, the log everything between the first and the last, and the print output what follows the last.  That holds while `webout` and the print output carry no occurrence of their own - neither is anything the server adds, though a program that echoes another response into `_webout` can put one there.

Setting `_DEBUG` also results in the creation of a `Content-Type` header of `text/plain`.

## SAS Programs

### Input Variables

Any URL parameters (eg `&name1=value1&something=else`) are attached as macro variables eg as follows:

```sas
%let name1=value1;
%let something=else;
```

A number of "fixed" variables are also added at the start of the program - the code that generates them is in the repo, in [the program template in Execution.ts](https://github.com/sasjs/server/blob/main/api/src/controllers/internal/Execution.ts#L93).

If `_DEBUG` is set then `options mprint;` will also be automatically added to the start of the Stored Program.


### Input Files

Any files attached to a request will be saved in the [session folder](sessions.md) and the following variables will be dynamically added to the SAS program:

* `_WEBIN_FILE_COUNT` - contains an integer, from 0 to the number of files to being provided. This variable is always created.
* `_WEBIN_FILENAME1` - the value that was specified in the FILENAME attribute by the frontend
* `_WEBIN_FILEREF1` - An 8 letter code, starting with an underscore and finishing with 7 random alphanumeric characters
* `_WEBIN_NAME1` - the value that was specified in the NAME attribute by the frontend

We will also create the fileref(s) using the filename statement.

To illustrate with an example - we are uploading two files, F1 and F2. The following SAS code will be generated, and inserted at the beginning of the executed program:

```sas
/* request files */
filename _SJS0001 "/some/temp/location/file1";
filename _SJS0002 "/some/temp/location/file2";
%let _WEBIN_FILE_COUNT=2;
%let _WEBIN_FILENAME1=myfile.csv;
%let _WEBIN_FILENAME2=myotherfile.txt;
%let _WEBIN_FILEREF1=_SJS0001;
%let _WEBIN_FILEREF2=_SJS0002;
%let _WEBIN_NAME1=F1;
%let _WEBIN_NAME2=F2;
```

If there are no files uploaded, only the following code will be generated:

```sas
/* request files */
%let _WEBIN_FILE_COUNT=0;
```

### Output

Any response data should be written to the `_webout` fileref (which is pre-assigned in the session).  The corresponding header records (content type etc) can be written using the [mfs_httpheader](https://core.sasjs.io/mfs__httpheader_8sas.html) macro. Additional [SASjs Server specific macros](https://core.sasjs.io/dir_41e1742e44e2de38b3bc91f993fed282.html) are also available.

The response (content and header) will vary depending on the [`_debug`](#_debug) setting.

## JS Programs

The use of JS "programs" as your backend is highly beneficial for the following use cases:

* You would like to test your application in a non SAS environment (such as a CI/CD pipeline or developer machine)
* You would like to make use of JS packages in your backend SAS applications
* You would like to provide backup services in the case that SAS is down (eg licence expiry)

Any `console.log()` statements written by your JavaScript will be returned in the response "log" (identically to SAS). 

If your Job / Service / Test depends on any third party libraries / packages, then you need to bundle that service before deploying it to sasjs server. You can choose any bundler for this process. One possible option could be `webpack`. If you choose webpack then you can use it like this:

`npx webpack --mode none --target node --entry <path-of-file-to-bundle/build> --output-path <path-of-output-folder> --output-filename <name-of-output-file>`

For instance if you have a mock service at path `sasjs/services/common/appinit.js` and you want to build and make it ready for deployment, you can run the following in the terminal:

`npx webpack --mode none --target node --entry ./sasjs/services/common/appinit.js --output-path sasjsbuild/services/common --output-filename appinit.js`

Repeat this for any other JS Stored Programs as needed.

Finally, run `sasjs build` to create the deployment pack, and `sasjs deploy` to deploy.


### Input Variables

Any URL parameters (eg `&name1=value1&something=else`) are attached as JS variables eg as follows:

```js
const name1='value1'
const something='else'
```

A JS program is generated in six parts - the host's `fs`, your request parameters, the runtime variables, the `webout()` block, your program, and a closing statement. This is the shape, with the paths of one session:

```js
globalThis.fs = require('fs')

/* runtime vars */
const _program = '/Public/app/myprogram';
const _debug = '';

/* dynamic user-provided vars */
let _webout = '';
const weboutPath = '/home/sasjssrv/sasjs_root/sessions/20220808081136-29012-1659946296436/webout.txt';
const _SASJS_TOKENFILE = '/home/sasjssrv/sasjs_root/sessions/20220808081136-29012-1659946296436/reqHeaders.txt';
const _SASJS_WEBOUT_HEADERS = '/home/sasjssrv/sasjs_root/sessions/20220808081136-29012-1659946296436/stpsrv_header.txt';
const _SASJS_APISERVERURL = 'http://127.0.0.1:5000';
const _SASJS_USERNAME = 'allan';
const _SASJS_USERID = '6';
const _SASJS_DISPLAYNAME = 'Allan Bowe';
const _METAPERSON = _SASJS_DISPLAYNAME;
const _METAUSER = _SASJS_USERNAME;
const SASJSPROCESSMODE = 'Stored Program';

/* webout(): send data back, mirroring %ms_webout in @sasjs/core.
   webout('OPEN'); webout('OBJ', 'name', rows); webout('CLOSE')
   Generated by @sasjs/utils - change it there, not here. */
const _sasjs_webout_config = { ... }
/* ...and the rest of the block, see "Output" below */
globalThis.webout = _sasjs_webout;

/* actual job code */
// your program

/* the tail, which writes _webout if your program assigned it */
_sasjs_webout.finalise(_webout)
```

`fs` and `webout` are published as globals, so a program that declares its own `fs` or `webout` shadows it without clashing with the runtime's. The runtime keeps its own reference under the reserved `_sasjs_webout` name, which is also what writes `_webout` when the program assigns that variable instead of calling `webout()`.

`webout()` is generated into the program rather than imported, from the single copy of the block in [`@sasjs/utils`](https://github.com/sasjs/utils): the server and `sasjs mock` emit the same text, so a program behaves the same in both, and the session log shows exactly what ran. The block resolves its own `fs` (and `os`, when the host has one, falling back to what a browser can answer).


### Input Files

Any files attached to a request will be saved in the [session folder](sessions.md) and the following variables will be dynamically added to the JS program:

* `_WEBIN_FILE_COUNT` - contains an integer, from 0 to the number of files to being provided. This variable is always created.
* `_WEBIN_FILENAME1` - the value that was specified in the FILENAME attribute by the frontend
* `_WEBIN_FILEREF1` - This will contain the actual file object
* `_WEBIN_NAME1` - the value that was specified in the NAME attribute by the frontend

To illustrate with an example - we are uploading two files, F1 and F2. The following JS code will be generated, and inserted at the beginning of the executed program:

```js
const _WEBIN_FILEREF1 = fs.readFileSync('/path/to/file1')
const _WEBIN_FILEREF2 = fs.readFileSync('/path/to/file2')
const _WEBIN_FILENAME1 = 'F1'
const _WEBIN_FILENAME2 = 'F2'
const _WEBIN_NAME1 = 'FormRef1'
const _WEBIN_NAME2 = 'FormRef2'

const _WEBIN_FILE_COUNT = 2

```

If there are no files uploaded, only the following code will be generated:

```js
const _WEBIN_FILE_COUNT = 0
```

### Output

The recommended way to send data back is `webout()`, which mirrors the [`%ms_webout()`](https://core.sasjs.io/ms__webout_8sas.html) macro so that a JS program is laid out the way a SAS one is:

```sas
data work.users;
  set work.source;
run;

%ms_webout(OPEN)
%ms_webout(OBJ,users)
%ms_webout(CLOSE)
```

```js
const users = [{ name: 'ann' }, { name: 'bob' }]

webout('OPEN')
webout('OBJ', 'users', users)
webout('CLOSE')
```

| Action | What it does |
|---|---|
| `OPEN` | Truncates the response body, starts one JSON object, and appends `content-type: application/json` to the response headers. |
| `ARR` | Appends one member to that object: an array of rows, each row a positional array of values. |
| `OBJ` | Appends one member to that object: an array of rows, each row an object keyed by column name. |
| `CLOSE` | Appends the system block below, and closes the JSON object. |

The actions are case-insensitive, the member name is the key the frontend reads (`res.users`), and a table must come between `OPEN` and `CLOSE`.

`OPEN` writes `SYSDATE` and `SYSTIME` as the first two members, in the SAS `DATE9` and `TIME8` forms (`02NOV2026`, `11:45:32`). `CLOSE` adds the same system fields that `%ms_webout(CLOSE)` does, carrying the values a JavaScript runtime can answer:

| Field | Value in a JS program |
|---|---|
| `_DEBUG` | the `_debug` query parameter |
| `_PROGRAM` | the `_program` value |
| `AUTOEXEC` | empty - JS has no autoexec |
| `MF_GETUSER` | `_SASJS_USERNAME` |
| `SYSCC` | `0`, or `8` when the program logged an error - see the console mapping below |
| `SYSENCODING` | `utf-8` |
| `SYSERRORTEXT` | the last message the program sent to `console.error` |
| `SYSHOSTINFOLONG` | kernel type, release and architecture of the host (browser user agent in a mock build) |
| `SYSHOSTNAME` | host name (`location.hostname` in a mock build) |
| `SYSPROCESSID`, `SYSJOBID` | the interpreter's process id, which in a mock build is the constant `4242` the sandbox supplies - every mock run reports it, including two running at once |
| `SYSPROCESSMODE` | `Stored Program` |
| `SYSPROCESSNAME` | `NodeJS`, or `Browser` in a mock build |
| `SYSSCPL` | the platform, eg `linux`, or `browser` in a mock build |
| `SYSSITE` | empty |
| `SYSTCPIPHOSTNAME` | `_SASJS_APISERVERURL` - the address the program is running on |
| `SYSUSERID` | `_SASJS_USERID` |
| `SYSVLONG` | the Node version, or `browser` in a mock build |
| `SYSWARNINGTEXT` | the last message the program sent to `console.warn` |
| `END_DTTM` | ISO 8601 timestamp of the `CLOSE` |
| `MEMSIZE` | total memory of the host, in the `SIZEKMG` form (eg `15.6G`); `navigator.deviceMemory` in a mock build, and empty when the browser does not expose it |

Three behaviours worth knowing:

- **`CLOSE` is the program's job.** The server does not close the object for you, exactly as it does not for a SAS program that omits `%ms_webout(CLOSE)`. A program that stops after `OPEN` returns the truncated body it wrote, which is not valid JSON; the log carries a NOTE naming the missing call. A program that throws after `OPEN` behaves the way any runtime does on a failed run: the response carries the partial body, then the log separator and the program's log.
- **`SYSERRORTEXT` and `SYSWARNINGTEXT` come from the console.** SAS fills them from the last error and warning the engine recorded; a JS program has no engine, so the equivalent is the last message it sent to `console.error` / `console.warn`. Both calls are still forwarded to the console unchanged, so the session log looks exactly as it did, and `SYSCC` becomes `8` when an error was logged. Only the last message of each is kept, and only its final 2000 characters.
- **Do not mix `webout()` with `_webout`.** When `webout()` has streamed the body, an assignment to `_webout` is ignored and the log says so.
- **A table before `OPEN`, a second `OPEN`, a table after `CLOSE`, an unknown action, or rows of the wrong shape throws**, so the failure lands in the session log rather than in a malformed response. In a mock build the host facts come from the browser and there is no `os` module; the block asks for one and falls back when it is refused.

#### `_SASJS_WEBOUT_HEADERS`

This (string) variable points to the location of a text file where header records (such as `Content-type: application/zip`) can be written. The file starts with a `text/html` line, and `webout('OPEN')` appends a `content-type: application/json` record to it; a program that wants another content type appends its own record afterwards, and the server takes the last record in the file. Sample code:

```
fs.appendFileSync(_SASJS_WEBOUT_HEADERS, '\ncontent-type: application/zip\n')
```

Append, never overwrite. `fs.writeFileSync` truncates the file, so the seeded `text/html` line and the record `webout('OPEN')` wrote are both discarded - the content type becomes the one you wrote, and any header the server had already recorded is gone. The leading newline is there because the seeded line carries no trailing one: without it the two records run together on a single line and are read as one.


#### `_webout`

Any content added to this variable is returned to the browser by SASjs Server, and a program that assigns it owns its own content type - the default is `text/html`. The variable can hold binary or textual content, so this is the route for a response that is not JSON. To send JSON, or to get the system block for free, use `webout()` above.



## Python Programs

The use of Python "programs" as your backend is highly beneficial for the following use cases:

* You would like to test your application in a non SAS environment (such as a CI/CD pipeline or developer machine)
* You would like to make use of Python packages in your SAS applications
* You would like to provide backup services in case SAS is unavailable

Any content written to `sys.stdout` or `sys.stderr` will be returned in the response "log" (identically to SAS). 

### Input Variables

Any URL parameters (eg `&name1=value1&something=else`) are attached as Python variables in uppercase, eg as follows:

```python3
NAME1='value1'
SOMETHING='else'
```

A number of "fixed" variables are also added at the start of the program, eg as follows:

```python
_SASJS_TOKENFILE = '/home/sasjssrv/sasjs_root/sessions/20220808081136-29012-1659946296436/reqHeaders.txt';
_SASJS_USERNAME = 'allan';
_SASJS_USERID = '6';
_SASJS_DISPLAYNAME = 'Allan Bowe';
_METAPERSON = _SASJS_DISPLAYNAME;
_METAUSER = _SASJS_USERNAME;
SASJSPROCESSMODE = 'Stored Program';
```

### Input Files

Any files attached to a request will be saved in the [session folder](sessions.md).  The session folder (with the input files) will also be the current folder, eg `os.chdir("/path/to/session/folder")`. 

When input files exist, the following variables will also be dynamically added to the Python program:

* `_WEBIN_FILE_COUNT` - contains an integer, from 0 to the number of files to being provided. This variable is always created.
* `_WEBIN_FILENAME1` - the value that was specified in the FILENAME attribute by the frontend
* `_WEBIN_NAME1` - the value that was specified in the NAME attribute by the frontend

To illustrate with an example - we are uploading two files to a Python Stored Program, namely f1.txt and f2.xls. The following Python code will be generated, and inserted at the beginning of the executed program:

```python
_WEBIN_FILENAME1 = 'f1.txt'
_WEBIN_FILENAME2 = 'f2.xls'
_WEBIN_NAME1 = 'FormRef1'
_WEBIN_NAME2 = 'FormRef2'

_WEBIN_FILE_COUNT = 2
```

If there are no files uploaded, only the following code will be generated:

```python
_WEBIN_FILE_COUNT = 0
```

Note that there are no `_WEBIN_FILEREF` variables created - in Python it is necessary to know the type of file (eg binary / text) before it can be ingested with the `open()` function, eg `open(_WEBIN_FILENAME1,"rt")` or `open(_WEBIN_FILENAME2,"rb")`.  Therefore it is left as an exercise for the developer to ingest as appropriate.


### Output

The following variables are "special":

#### `_WEBOUT`
This variable points to a text file in the session folder (eg `_WEBOUT="/path/to/session/folder/webout.txt"`).  All content written to `_WEBOUT` is streamed in the STP API call result.

Example code:

```python
f = open(_WEBOUT, 'w')
f.write('{"hello":"world"}')
```

#### `HEADERSPATH`
This variable points to a text file where header records (such as `Content-type: application/zip`) can be written, eg `HEADERSPATH="/path/to/session/folder/headers.txt"`).

To return data to the client, just write it to the `_WEBOUT` file.  It will then be returned to the browser / client application.  Be sure to set the `Content-Type` in the `HEADERSPATH` file if it is anything other than JSON.

## R Programs

Stored Programs may also run using the language of R.  Any content written to `.ROut` will be returned in the response "log" (identically to SAS).  As R does not support the underscore (`_`) as the first character in a variable name, the automatic variables are preceded with a period (`.`) instead.

### Input Variables

Any URL parameters (eg `&name1=value1&something=else`) are attached as R variables in uppercase, eg as follows:

```r
NAME1 <- 'value1'
SOMETHING <- 'else'
```

A number of "fixed" variables are also added at the start of the program, eg as follows:

```r
._SASJS_TOKENFILE <- '/home/sasjssrv/sasjs_root/sessions/20220808081136-29012-1659946296436/reqHeaders.txt';
._SASJS_USERNAME <- 'allan';
._SASJS_USERID <- '6';
._SASJS_DISPLAYNAME <- 'Allan Bowe';
._METAPERSON <- ._SASJS_DISPLAYNAME;
._METAUSER <- ._SASJS_USERNAME;
SASJSPROCESSMODE <- 'Stored Program';
```

### Input Files

Any files attached to a request will be saved in the [session folder](sessions.md).  The session folder (with the input files) will also be the current folder, eg `setwd("/path/to/session/folder")`. 

When input files exist, the following variables will also be dynamically added to the R program:

* `._WEBIN_FILE_COUNT` - contains an integer, from 0 to the number of files to being provided. This variable is always created.
* `._WEBIN_FILENAME1` - the value that was specified in the FILENAME attribute by the frontend
* `._WEBIN_NAME1` - the value that was specified in the NAME attribute by the frontend

To illustrate with an example - we are uploading two files to an R Stored Program, namely f1.txt and f2.xls. The following R code will be generated, and inserted at the beginning of the executed program:

```r
._WEBIN_FILENAME1 <- 'f1.txt'
._WEBIN_FILENAME2 <- 'f2.xls'
._WEBIN_NAME1 <- 'FormRef1'
._WEBIN_NAME1 <- 'FormRef2'

._WEBIN_FILE_COUNT <- 2
```

If there are no files uploaded, only the following code will be generated:

```r
._WEBIN_FILE_COUNT <- 0
```

Note that there are no `._WEBIN_FILEREF` variables created - in R it is necessary to know the type of file (eg binary / text) before it can be ingested, eg `read.delim(._WEBIN_FILENAME1, header = FALSE)` or `read.delim2(._WEBIN_FILENAME2, header = FALSE)`.  Therefore it is left as an exercise for the developer to ingest as appropriate.


### Output

The following variables are "special":

#### `._WEBOUT`
This variable points to a text file in the session folder (eg `._WEBOUT <- "/path/to/session/folder/webout.txt"`).  All content written to `._WEBOUT` is streamed in the STP API call result.

Example code:

```r
cat('{"hello":"world"}',file=._WEBOUT)
```

#### `HEADERSPATH`
This variable points to a text file where header records (such as `Content-type: application/zip`) can be written, eg `HEADERSPATH <- "/path/to/session/folder/headers.txt"`).

To return data to the client, just write it to the `._WEBOUT` file.  It will then be returned to the browser / client application.  Be sure to set the `Content-Type` in the `HEADERSPATH` file if it is anything other than JSON.


