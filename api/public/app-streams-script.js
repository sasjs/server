/**
 * The App Stream landing page's only script: a logo that fails to load falls
 * back to the default, wired here rather than with an inline `onerror`
 * attribute, which the default Content-Security-Policy refuses.
 *
 * The "Upload New App" control that used to live here moved to the
 * Administration screen of the web interface, where publishing an app sits with
 * the rest of the administrative actions. This page is still the path apps are
 * served from.
 */
// A stream logo that fails to load falls back to the default logo. Wired here
// rather than with an inline `onerror` attribute, which the default
// Content-Security-Policy refuses. `once` keeps a failing fallback from
// retrying itself.
document.querySelectorAll('img[data-fallback]').forEach(function (image) {
  image.addEventListener(
    'error',
    function () {
      this.src = this.dataset.fallback
    },
    { once: true }
  )
})
