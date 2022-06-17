import { AppStreamConfig } from '../../types'
import { style } from './style'

const defaultAppLogo = '/sasjs-logo.svg'

const singleAppStreamHtml = (
  streamServiceName: string,
  appLoc: string,
  logo?: string
) =>
  ` <a class="app" href="${streamServiceName}" title="${appLoc}">
      <img
        src="${logo ? streamServiceName + '/' + logo : defaultAppLogo}"
        onerror="this.src = '${defaultAppLogo}';"
      />
      ${streamServiceName}
    </a>`

export const appStreamHtml = (appStreamConfig: AppStreamConfig) => `
<html>
  <head>
    <base href="/AppStream/">
    ${style}
  </head>
  <body>
    <header>
      <a href="/"><img src="/logo.png" alt="logo" class="logo"></a>
      <h1>App Stream</h1>
    </header>
    <div class="app-container">
        ${Object.entries(appStreamConfig)
          .map(([streamServiceName, entry]) =>
            singleAppStreamHtml(
              streamServiceName,
              entry.appLoc,
              entry.streamLogo
            )
          )
          .join('')}

        <a class="app" title="Upload build.json">
          <input id="fileId" type="file" hidden />
          <button id="uploadButton" style="margin-bottom: 5px; cursor: pointer">
            <img src="/plus.png" />
          </button>
          <span id="uploadMessage">Upload New App</span>
        </a>
    </div>
    <script src="/axios.min.js"></script>
    <script src="/app-streams-script.js"></script>
  </body>
</html>`
