// The attribute set VA itself uses. Kept in the markup as the default so the
// page works with no query parameters at all.
var VA_SANDBOX = document.getElementById('frame').getAttribute('sandbox')

var frame = document.getElementById('frame')
var logEl = document.getElementById('log')
var frameLoaded = false

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
  if (sandbox) frame.setAttribute('sandbox', sandbox)
  else frame.removeAttribute('sandbox')

  log('mounting ' + url)
  log('sandbox: ' + (sandbox || '(none)'))
  frame.setAttribute('src', url)
}

function post() {
  var raw = document.getElementById('message').value.trim()
  if (!raw) {
    log('message is empty, nothing to post')
    return
  }

  var payload
  try {
    payload = JSON.parse(raw)
  } catch (err) {
    log('message is not valid JSON: ' + err.message)
    return
  }

  if (!frameLoaded) {
    log('frame has not loaded yet, message will not be delivered')
    return
  }

  // Same delivery VA uses: postMessage to the frame window, target origin '*'
  // because the app lives on a different origin from this page.
  frame.contentWindow.postMessage(payload, '*')
  log('posted: ' + JSON.stringify(payload).slice(0, 200))
}

frame.addEventListener('load', function () {
  frameLoaded = true
  log('frame loaded')
  // Post once on load only when a message was supplied in the query string;
  // otherwise wait for the button so the page state stays predictable.
  if (params().get('message')) post()
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
