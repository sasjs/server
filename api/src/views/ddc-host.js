// The attribute set VA itself uses. Kept in the markup as the default so the
// page works with no query parameters at all.
var VA_SANDBOX = document.getElementById('frame').getAttribute('sandbox')

var frame = document.getElementById('frame')
var logEl = document.getElementById('log')
var frameLoaded = false
var earlyTimer = null

function log(message) {
  var time = new Date().toISOString().slice(11, 23)
  logEl.textContent += '[' + time + '] ' + message + '\n'
  logEl.scrollTop = logEl.scrollHeight
}

function params() {
  return new URLSearchParams(window.location.search)
}

function applyParams() {
  var p = params()
  if (p.get('url')) document.getElementById('url').value = p.get('url')
  if (p.get('sandbox'))
    document.getElementById('sandbox').value = p.get('sandbox')
  else document.getElementById('sandbox').value = VA_SANDBOX
  if (p.get('height')) document.getElementById('height').value = p.get('height')
  if (p.get('title')) document.getElementById('title').value = p.get('title')
  if (p.get('message'))
    document.getElementById('message').value = p.get('message')
  document.getElementById('heading').textContent =
    document.getElementById('title').value
  frame.style.height =
    (parseInt(document.getElementById('height').value, 10) || 600) + 'px'
}

function mount() {
  var url = document.getElementById('url').value.trim()
  var sandbox = document.getElementById('sandbox').value.trim()
  var title = document.getElementById('title').value.trim()

  document.getElementById('heading').textContent =
    title || 'Data-driven content host'
  document.title = title || 'Data-driven content host'
  frame.style.height =
    (parseInt(document.getElementById('height').value, 10) || 600) + 'px'

  if (!url) {
    log('no application URL given')
    return
  }

  frameLoaded = false
  stopEarlyReplay()
  if (sandbox) frame.setAttribute('sandbox', sandbox)
  else frame.removeAttribute('sandbox')

  log('mounting ' + url)
  log('sandbox: ' + (sandbox || '(none)'))
  frame.setAttribute('src', url)

  var mode = timing()
  if (mode === 'early' || mode === 'both') {
    log('timing: ' + mode)
    var payload = readPayload()
    if (payload) startEarlyReplay(payload)
  }
}

function readPayload() {
  var raw = document.getElementById('message').value.trim()
  if (!raw) {
    log('message is empty, nothing to post')
    return null
  }

  try {
    return JSON.parse(raw)
  } catch (err) {
    log('message is not valid JSON: ' + err.message)
    return null
  }
}

// Same delivery VA uses: postMessage to the frame window, target origin '*'
// because the app lives on a different origin from this page.
function postToFrame(payload) {
  frame.contentWindow.postMessage(payload, '*')
}

/**
 * True once the embedded app has published what its earliest listener
 * captured. Only readable same-origin, so for a cross-origin app this answers
 * false for the whole load and the replay below runs until the frame loads.
 */
function frameBuffered() {
  try {
    return !!(frame.contentWindow && frame.contentWindow.__vaLastMessage)
  } catch (err) {
    return false
  }
}

/**
 * Deliver a message the way VA does for a report with a stored parameter:
 * repeatedly, from the moment the frame is created, so at least one copy lands
 * after the app's earliest listener exists and before the app itself
 * bootstraps. That is the window a report refresh exercises, and a single post
 * on load cannot reach it - by then the app has booted and reads the message
 * on its ordinary path.
 *
 * Stops as soon as the app reports a capture (same-origin only), on load, or
 * after 30 seconds - a frame that never loads must not leave a timer running.
 */
function startEarlyReplay(payload) {
  var interval = parseInt(params().get('interval'), 10) || 50
  var deadline = Date.now() + 30000
  var attempts = 0

  log(
    'early replay: posting every ' + interval + 'ms until the app captures it'
  )
  earlyTimer = setInterval(function () {
    if (!frame.contentWindow) return
    attempts++
    postToFrame(payload)
    if (frameBuffered()) {
      log(
        'early replay: the app captured the message after ' +
          attempts +
          ' post(s)'
      )
      stopEarlyReplay()
    } else if (Date.now() > deadline) {
      log(
        'early replay: gave up after ' +
          attempts +
          ' post(s) in 30s, no capture seen'
      )
      stopEarlyReplay()
    }
  }, interval)
}

function stopEarlyReplay() {
  if (earlyTimer === null) return
  clearInterval(earlyTimer)
  earlyTimer = null
}

/** The delivery timing a mount asks for: load (default), early, or both. */
function timing() {
  var value = (params().get('timing') || 'load').trim().toLowerCase()
  return ['early', 'both', 'load'].indexOf(value) >= 0 ? value : 'load'
}

function post() {
  var payload = readPayload()
  if (!payload) return

  if (!frameLoaded) {
    log('frame has not loaded yet, message will not be delivered')
    return
  }

  postToFrame(payload)
  log('posted: ' + JSON.stringify(payload).slice(0, 200))
}

frame.addEventListener('load', function () {
  frameLoaded = true
  var mode = timing()
  stopEarlyReplay()
  log('frame loaded')
  // Post once on load only when a message was supplied in the query string;
  // otherwise wait for the button so the page state stays predictable.
  if (!params().get('message')) return
  if (mode === 'early') {
    log('timing=early: no further post on load')
    return
  }
  post()
})

window.addEventListener('message', function (event) {
  var fromFrame = event.source === frame.contentWindow
  log(
    (fromFrame ? 'from frame: ' : 'from page: ') +
      (typeof event.data === 'object'
        ? JSON.stringify(event.data)
        : String(event.data)
      ).slice(0, 300)
  )
})

document.getElementById('mount').addEventListener('click', mount)
document.getElementById('post').addEventListener('click', post)
document.getElementById('clear').addEventListener('click', function () {
  logEl.textContent = ''
})

applyParams()
if (params().get('url')) mount()
else log('waiting for an application URL')
