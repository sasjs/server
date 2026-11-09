---
layout: article
title: Testing VA embedding
description: Serves an application the way SAS Visual Analytics serves data-driven content, so the sandboxed frame and the message that arrives before the app bootstraps can be exercised without a Viya estate.
---

# Testing VA embedding

An application embedded in a SAS Visual Analytics report as a data-driven content (DDC) object is not loaded like a page, and the difference is more than cosmetics. Two things change, and both change what the application sees:

* The frame carries VA's sandbox attribute set, so anything the app claims from the browser (popups, downloads, same-origin access, storage) is decided against that policy.
* VA posts its data message to the object as the document appears, which is before the application has bootstrapped. An app that only registers its `message` listener once it is running misses that first message entirely.

The second point is the one that produces defects nobody can reproduce outside a report. On a report refresh VA replays the report's stored parameters in that first message, so the app has to act on it without having fetched any metadata; a selection the user makes later produces a second message while the app is running, and takes a different path through the same code. A page that works when a message is posted into it can still fail on refresh.

`/ddc-host` supplies the hosting side of that contract: the sandbox attribute set, and a message delivered on a timing of your choosing.

## Enable it

The page is off by default. Set [DDC_HOST_ENABLED](settings.md#ddc_host_enabled) on a development server:

```
DDC_HOST_ENABLED=YES
```

Both the page and its script answer 404 while the setting is off. It frames whatever URL it is given, which is useful in development and is why it does not belong on a server a browser user can reach.

## The page

`GET /ddc-host` takes its configuration from the query string, so a whole scenario is one URL:

| Parameter | Meaning |
| --- | --- |
| `url` | Application URL to embed. The page mounts it as soon as the page loads. |
| `message` | JSON posted into the frame. Empty or absent posts nothing. |
| `timing` | `load`, `early` or `both`. Default `load`. |
| `interval` | Milliseconds between posts in the early replay. Default 50. |
| `sandbox` | Overrides the sandbox attribute set. Defaults to VA's: `allow-forms allow-presentation allow-same-origin allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox`. |
| `height` | Iframe height in pixels. Default 600. |
| `title` | Heading and page title. |

The script is a separate file at `/ddc-host.js`, behind the same setting, because the server's default policy allows scripts from its own origin only: an inline script on the page is refused by the browser, and the failure looks like an app that does not work rather than a blocked page.

## Timings

The timing is what makes the difference between the two paths above.

| `timing` | Delivery | Reproduces |
| --- | --- | --- |
| `load` | One post when the frame fires its `load` event. | A user interaction: the app is running, has its data, and receives a message. |
| `early` | Posted repeatedly from the moment the frame is created, until the app captures one, the frame loads, or 30 seconds pass. | A report refresh: the message lands while the document is still parsing, so the app has to answer it without metadata. |
| `both` | The early replay, then one more post on load. | The two messages a refresh can produce in sequence. |

`early` stops on evidence rather than on a timer where it can: a same-origin application that captures the message at parse time publishes what it captured, and the page reads that value to decide it has landed. A cross-origin application cannot be read, so the replay simply runs until the frame loads, which covers the same window.

Because the replay posts the same message more than once, an application under test has to treat a repeated identical message as one action. An app that applies every message it receives will apply the same filter several times.

## Worked example: Data Controller

Data Controller is the reference implementation - its `?embed=va` mode is documented in the [Data Controller docs](https://docs.datacontroller.io/visual-analytics/) - and its Cypress suite drives this page.

Build the app, deploy it with its services to a local server, then frame it on a filtered route:

```bash
# from the application repo, with its mock target pointing at this server
npm run build
cd sas/mocks/sasjs
sasjs cbd -t server-ci          # streams the build to /app/<service name>
sasjs request services/admin/makedata -t server-ci -d deploy/makedata.json
```

A deploy replaces the destination folder, so seed any data the deploy does not carry after every deploy, not once at the start.

The message is the VA one, with `parameters` carrying the filter the report holds:

```json
{
  "version": "1",
  "resultName": "dd1",
  "rowCount": 0,
  "availableRowCount": 0,
  "data": [],
  "columns": [],
  "parameters": [
    { "name": "pr1", "label": "SOME_DATE", "dataType": "string", "value": "August 02, 1971" }
  ]
}
```

Encode that as the `message` parameter, and the app URL as `url`:

```
http://localhost:5000/ddc-host?url=<encoded app url>&message=<encoded json>&timing=early
```

The app URL points at the route the report object opens, including whatever query string the app needs to recognise the embed, for example `http://localhost:5000/app/clickme/#/editor/DC_JSLIB.MPE_X_TEST?embed=va`.

## Reading the result

Three places to look, in increasing order of trustworthiness:

1. **The page's own log**, at the bottom of `/ddc-host`. It records the mount, the sandbox set, each capture attempt, when the frame loaded, and every message that arrives from the frame. This is the only signal available for a cross-origin application.
2. **The frame's state**, for a same-origin application: the page reads the app's earliest captured message to stop the replay, so `document.getElementById('frame').contentWindow` exposes it, together with the frame's current route.
3. **What the application did with the message.** This is the assertion worth keeping: the harness only shows that a message arrived, while the app's own effect - a stored filter, a changed route, a service call - is what a user would see. In Data Controller's case the mock `public/validatefilter` stores the clause it is sent, so the clause can be read back from the drive afterwards.

A capture in the page's log before the frame's `load` line is what distinguishes the early path from the loaded one. That ordering, not the app's own output, is the fact that makes the case meaningful: the same value can be formatted correctly on both paths, so an assertion on the outcome alone cannot tell you which path produced it.

## What it is not

* Not a VA emulator. There is no report, no data and no rendering: the page is the host side of the contract only, and it sends what you give it.
* Not a test runner. It gives a browser a scenario; the assertions belong to the app's own suite.
* Not a proxy for the app's back-channel. Messages the app posts to `window.parent` appear in the page log, which is enough to see that they happened and what they carried, but the page does not act on them.
