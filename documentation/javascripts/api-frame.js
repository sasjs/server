/*
 * Sizes the Swagger UI frame on the API page to its content.
 *
 * mkdocs-swagger-ui-tag puts the rendered specification in an iframe whose
 * document is `overflow: hidden`, and gives the frame no height of its own. A
 * frame left to the theme's CSS shows the first few hundred pixels and silently
 * clips the rest - there is no scrollbar inside the frame to reveal it - so the
 * reference looks short and complete when most of it is unreachable.
 *
 * The frame is same-origin, so its content height can be read and the frame
 * sized to it. Expanding an operation changes that height, which is why a
 * ResizeObserver and a MutationObserver keep it in step rather than measuring
 * once on load.
 */
;(function () {
  'use strict'

  var MIN_HEIGHT = 600

  function fit(frame) {
    var doc = frame.contentDocument
    if (!doc || !doc.documentElement) return

    var height = Math.max(
      doc.documentElement.scrollHeight,
      doc.body ? doc.body.scrollHeight : 0,
      MIN_HEIGHT
    )

    // Only touch the style when it would change: writing on every observed
    // mutation would fire the observer again and loop.
    if (Math.abs(parseFloat(frame.style.height || '0') - height) > 4) {
      frame.style.height = height + 'px'
    }
  }

  function watch(frame) {
    var doc = frame.contentDocument
    if (!doc || !doc.body) {
      // The frame has not loaded yet - fit it when it does.
      frame.addEventListener('load', function () {
        watch(frame)
      })
      return
    }

    fit(frame)

    if (frame.dataset.sizedFromContent === 'true') return
    frame.dataset.sizedFromContent = 'true'

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () {
        fit(frame)
      }).observe(doc.body)
    }

    new MutationObserver(function () {
      fit(frame)
    }).observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'open']
    })
  }

  function sizeAll() {
    var frames = document.querySelectorAll('iframe.swagger-ui-iframe')
    for (var i = 0; i < frames.length; i++) {
      watch(frames[i])
    }
  }

  if (window.document$ && typeof window.document$.subscribe === 'function') {
    // Material's instant loading: the page body is replaced on navigation.
    window.document$.subscribe(sizeAll)
  } else {
    document.addEventListener('DOMContentLoaded', sizeAll)
  }
})()
