window.onload = function () {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/)
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1])
  } else {
    url = window.location.origin
  }
  var options = {
    customOptions: {
      url: '/swagger.yaml',
      requestInterceptor: function (request) {
        request.credentials = 'include'
        var cookie = document.cookie
        var startIndex = cookie.indexOf('XSRF-TOKEN')
        var csrf = cookie.slice(startIndex + 11).split('; ')[0]
        request.headers['X-XSRF-TOKEN'] = csrf
        return request
      }
    }
  }
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout'
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname]
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
