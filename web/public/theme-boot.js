/**
 * Paints the colour scheme before the bundle has loaded.
 *
 * The app is a single-page bundle, so the first paint happens before the theme
 * provider exists: a reader who chose dark saw white until React mounted. This
 * runs in the page head, before anything else, and is a file rather than an
 * inline script on purpose - the app is served under `script-src 'self'`, and an
 * inline block would need a hash threaded through env-driven CSP directives.
 *
 * The key is MUI's own: `ThemeProvider` persists the chosen colour scheme under
 * `mui-mode`, with `system` meaning "follow the operating system". Reading the
 * same key means this cannot disagree with the provider that takes over.
 *
 * Nothing here is required for the app to work - if the store is blocked or the
 * value unexpected, the provider still applies the scheme a moment later, which
 * is the behaviour this exists to improve on rather than replace.
 */
;(function () {
  var BACKGROUND = { light: '#ffffff', dark: '#121212' }

  try {
    var stored = window.localStorage.getItem('mui-mode')
    var prefersDark = window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false

    var dark =
      stored === 'dark' ||
      ((stored === 'system' || stored === null || stored === '') && prefersDark)

    var scheme = dark ? 'dark' : 'light'
    var html = document.documentElement

    // `color-scheme` also tells the browser to paint form controls, scrollbars
    // and the canvas dark, so the parts the bundle does not draw match.
    html.style.colorScheme = scheme
    html.style.backgroundColor = BACKGROUND[scheme]
    html.setAttribute('data-color-scheme', scheme)
  } catch (error) {
    /* a blocked store only costs one white flash, not a broken page */
  }
})()
