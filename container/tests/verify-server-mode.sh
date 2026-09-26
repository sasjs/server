#!/bin/bash
# Boot SASjs Server in SERVER mode against a real MongoDB and exercise the
# health check plus both runtimes.
#
# Server mode (unlike desktop mode) puts the Drive and Stored Program routes
# behind a token, so this drives the real auth flow:
#   POST /SASLogon/login      -> session cookie
#   POST /SASLogon/authorize  -> single-use auth code
#   POST /SASjsApi/auth/token -> access token
#
# Requires a built SASjs Server and a MongoDB listening on $MONGO_URL
# (default mongodb://127.0.0.1:27017), plus jq. This mirrors what the CI smoke
# job does inside a container.
#
#   API_BIN  the command that starts the server. Default is
#            container/entrypoint.sh; override it (with NODE_BIN / SERVER_JS /
#            DATA_DIR) to run against a source build without Docker.
#
# Usage: tests/verify-server-mode.sh
set -eu

PKG=$(cd "$(dirname "$0")/.." && pwd)
API_BIN=${API_BIN:-"$(cd "$(dirname "$0")/../.." && pwd)/container/entrypoint.sh"}
PORT=${PORT:-5098}
# A fresh database per run: the server only logs its seed lines the first time
# it creates the admin account, so reusing a database makes the seed assertion
# flaky.
DB=${DB:-sasjs_test_$$_$RANDOM}
MONGO_URL=${MONGO_URL:-mongodb://127.0.0.1:27017/$DB}
ADMIN_USER=admin
ADMIN_PASS=initial-test-password
CLIENT_ID=clientID1
T=$(mktemp -d)
SERVER_PID=""
cleanup() { [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null || true; rm -rf "$T"; }
trap cleanup EXIT

# json <field> : read a field out of stdin (jq if present, else python3)
json() {
  if command -v jq >/dev/null 2>&1; then jq -r "$1"
  else python3 -c "
import json,sys
d=json.load(sys.stdin)
for k in sys.argv[1].lstrip('.').split('.'):
    d=d[k]
print(d)
" "$1"
  fi
}

echo "--- checking the binary and the port"
if [[ ! -x "$API_BIN" ]]; then
  echo "SKIP: no executable at API_BIN=$API_BIN"
  exit 0
fi
# Refuse to run against a stale process: one left listening on PORT from an
# earlier run makes every assertion describe that process, not the one under
# test.
if (exec 3<>/dev/tcp/127.0.0.1/"$PORT") 2>/dev/null; then
  echo "FAIL: something is already listening on 127.0.0.1:$PORT - kill it and re-run"
  exit 1
fi

echo
echo "--- boot in SERVER mode (AUTH_PROVIDERS empty: local accounts only)"
mkdir -p "$T/root"
MODE=server \
  PORT="$PORT" \
  PROTOCOL=http \
  DB_CONNECT="$MONGO_URL" \
  DB_TYPE=mongodb \
  AUTH_PROVIDERS= \
  RUN_TIMES=js,py \
  NODE_PATH="$(command -v node)" \
  PYTHON_PATH="$(command -v python3)" \
  SASJS_ROOT="$T/root" \
  DRIVE_LOCATION="$T/root/drive" \
  LOG_LOCATION="$T/root/logs" \
  ADMIN_USERNAME="$ADMIN_USER" \
  ADMIN_PASSWORD_INITIAL="$ADMIN_PASS" \
  NODE_OPTIONS= \
  "$API_BIN" > "$T/server.log" 2>&1 &
SERVER_PID=$!

API="http://127.0.0.1:$PORT"
UP=0
for _ in $(seq 1 90); do
  if curl -sf -m 3 "$API/SASjsApi/info" > /dev/null 2>&1; then UP=1; break; fi
  sleep 1
done
if [[ "$UP" -ne 1 ]]; then
  echo "FAIL  server never became healthy"
  echo "--- log ---"; cat "$T/server.log"; exit 1
fi
INFO=$(curl -s -m 5 "$API/SASjsApi/info")
echo "info: $INFO"

echo
echo "--- authenticate (GET / for the CSRF cookie value, then login -> authorize -> token)"
# The web routes are CSRF-protected. The token is injected into index.html as
# a document.cookie assignment, so it can be scraped from GET / and replayed
# in the x-xsrf-token header.
CSRF=$(curl -sf -m 20 "$API/" | grep -o "XSRF-TOKEN=[^;']*" | cut -d= -f2)
echo "csrf:     ${CSRF:0:12}..."

curl -sf -m 20 -c "$T/cookies" -X POST "$API/SASLogon/login" \
  -H "x-xsrf-token: $CSRF" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}" > "$T/login.json"
echo "login:    $(cat "$T/login.json")"

CODE=$(curl -sf -m 20 -b "$T/cookies" -c "$T/cookies" -X POST "$API/SASLogon/authorize" \
  -H "x-xsrf-token: $CSRF" -H 'Content-Type: application/json' \
  -d "{\"clientId\":\"$CLIENT_ID\"}" | json '.code')
echo "authcode: ${CODE:0:12}..."

TOKEN=$(curl -sf -m 20 -X POST "$API/SASjsApi/auth/token" \
  -H 'Content-Type: application/json' \
  -d "{\"clientId\":\"$CLIENT_ID\",\"code\":\"$CODE\"}" | json '.accessToken')
echo "token:    ${TOKEN:0:12}..."

echo
echo "--- DB seed evidence"
grep -E 'DB Seed' "$T/server.log" | sed 's/^/  /' || echo "  (no seed lines)"

echo
echo "--- upload and execute a JavaScript stored program"
printf '%s\n' \
  "console.log('js program ran')" \
  "_webout = JSON.stringify({from:'js',marker:'js-ok'})" > "$T/hello.js"
curl -sf -m 20 -X POST "$API/SASjsApi/drive/file?_filePath=/Public/hello.js" \
  -H "Authorization: Bearer $TOKEN" -F "file=@$T/hello.js" > /dev/null
JS=$(curl -s -m 60 "$API/SASjsApi/stp/execute?_program=/Public/hello.js" \
  -H "Authorization: Bearer $TOKEN")
echo "hello.js -> $JS"

echo
echo "--- upload and execute a Python stored program"
printf '%s\n' \
  "import json" \
  "print('py program ran')" \
  "with open(_WEBOUT,'w') as f: f.write(json.dumps({'from':'py','marker':'py-ok'}))" > "$T/hello.py"
curl -sf -m 20 -X POST "$API/SASjsApi/drive/file?_filePath=/Public/hello.py" \
  -H "Authorization: Bearer $TOKEN" -F "file=@$T/hello.py" > /dev/null
PY=$(curl -s -m 60 "$API/SASjsApi/stp/execute?_program=/Public/hello.py" \
  -H "Authorization: Bearer $TOKEN")
echo "hello.py -> $PY"

echo
FAIL=0
check() {
  if [[ "$3" == *"$2"* ]]; then echo "PASS  $1"; else
    echo "FAIL  $1 (expected: $2 / got: $3)"; FAIL=1; fi
}
# Compare the marker values as parsed JSON rather than substring-matching the
# raw body: the two runtimes serialise differently (JS has no space after the
# colon, Python's json.dumps does).
JS_MARKER=$(printf '%s' "$JS" | json '.marker')
PY_MARKER=$(printf '%s' "$PY" | json '.marker')

check "reports server mode"            '"mode":"server"'       "$INFO"
check "reports runTimes js,py"         '"runTimes":["js","py"]' "$INFO"
check "CORS disabled in server mode"   '"cors":"disable"'      "$INFO"
check "login succeeded"                '"loggedIn":true'       "$(cat "$T/login.json")"
check "auth code issued"               "eyJ"                   "$CODE"
check "access token issued"            "eyJ"                   "$TOKEN"
check "DB seeded (admin account)"      "admin account created" "$(cat "$T/server.log")"
check "JS program executed"            "js-ok"                 "$JS_MARKER"
check "Python program executed"        "py-ok"                 "$PY_MARKER"

echo
if [[ "$FAIL" -eq 0 ]]; then echo "ALL TESTS PASSED"; else
  echo "SOME TESTS FAILED"; echo "--- log ---"; cat "$T/server.log"; exit 1; fi
