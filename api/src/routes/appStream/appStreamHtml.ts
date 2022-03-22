import { AppStreamConfig } from '../../types'

const style = `<style>
* {
  font-family: 'Roboto', sans-serif;
}
.app-container {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
}
.app-container .app {
  width: 150px;
  margin: 10px;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
  text-align: center;
}
.app-container .app img{
  width: 100%;
  margin-bottom: 10px;
}
</style>`

const defaultAppLogo = '/sasjs-logo.svg'

const singleAppStreamHtml = (
  streamServiceName: string,
  appLoc: string,
  logo?: string
) =>
  ` <a class="app" href="${streamServiceName}" title="${appLoc}">
      <img src="${logo ? streamServiceName + '/' + logo : defaultAppLogo}" />
      ${streamServiceName}
    </a>`

export const appStreamHtml = (appStreamConfig: AppStreamConfig) => `
<html>
  <head>
    <base href="/AppStream/">
    ${style}
  </head>
  <body>
    <h1>App Stream</h1>
    <div class="app-container">
      ${Object.entries(appStreamConfig)
        .map(([streamServiceName, entry]) =>
          singleAppStreamHtml(streamServiceName, entry.appLoc, entry.streamLogo)
        )
        .join('')}
    </div>
  </body>
</html>`
