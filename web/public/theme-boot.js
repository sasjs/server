/**
 * Paints the colour scheme before the bundle loads.
 *
 * The interface is themed from a setting the application reads, so a script that
 * runs before it has to read the SAME setting or the two disagree and the page
 * flashes - or, worse, paints half of itself in one scheme and half in the other.
 *
 * That setting is `localStorage['studio-settings']`, a JSON object whose
 * `workbench.colorTheme` is `'light'`, `'dark'` or `'system'`. This script
 * previously read a key called `mui-mode`, which nothing in the application ever
 * wrote: it therefore always fell back to the operating system's preference, so a
 * user who had chosen dark on a light machine got a white shell around a dark
 * interface, and the mismatch was visible as a page that was dark in one half and
 * light in the other.
 *
 * `system` (and an absent or unreadable setting) follows the operating system,
 * which is what the application does with the same value.
 */
!(function () {
  try {
    var preference = 'system'

    var stored = window.localStorage.getItem('studio-settings')

    if (stored) {
      try {
        var settings = JSON.parse(stored)

        if (settings && typeof settings['workbench.colorTheme'] === 'string') {
          preference = settings['workbench.colorTheme']
        }
      } catch (error) {
        // unreadable settings are the application's problem to report, not a
        // reason to leave the page unpainted
      }
    }

    var osPrefersDark =
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches

    var mode =
      preference === 'dark' || preference === 'light'
        ? preference
        : osPrefersDark
          ? 'dark'
          : 'light'

    var element = document.documentElement

    element.style.colorScheme = mode
    element.style.backgroundColor = {
      light: '#ffffff',
      dark: '#121212'
    }[mode]
    element.setAttribute('data-color-scheme', mode)
  } catch (error) {
    // a page that cannot read its setting still has to render
  }
})()
