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
  width: 100px;
  margin: 10px;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
  text-align: center;
}
</style>`

const defaultAppLogo = '/sasjs-logo.svg'

const singleAppStreamHtml = (streamServiceName: string, logo?: string) =>
  ` <a class="app" href="${streamServiceName}">
      <img src="${logo ?? defaultAppLogo}" />
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
      ${Object.entries(appStreamConfig).map(([streamServiceName, entry]) =>
        singleAppStreamHtml(streamServiceName, entry.logo)
      )}
      <a class="app" href="#"><img src="/sasjs-logo.svg" />App Name here</a>
      <a class="app" href="#"><img src="/sasjs-logo.svg" />App Name here</a>
      <a class="app" href="#"><img src="/sasjs-logo.svg" />App Name here</a>
    </div>
  </body>
</html>`
