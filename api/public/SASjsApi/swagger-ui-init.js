// Starts the Swagger UI on the page served from this folder.
//
// A file of its own, never an inline script: the default Content-Security-Policy
// is `script-src 'self'`, which refuses an inline init.
window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/swagger.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout',
    // null, not the default: the online validator posts the spec URL to
    // validator.swagger.io, and nothing on this page talks to a third party.
    validatorUrl: null,
    // the API's own calls carry the session cookie and the CSRF header
    requestInterceptor: function (request) {
      request.credentials = 'include'

      const cookie = document.cookie
      const startIndex = cookie.indexOf('XSRF-TOKEN')
      const csrf = cookie.slice(startIndex + 11).split('; ')[0]
      request.headers['X-XSRF-TOKEN'] = csrf
      return request
    }
  })
}
