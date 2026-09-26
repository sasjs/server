#!/bin/bash
# Boot SASjs Server in server mode with Cloudron-shaped OIDC configuration and
# prove the sign-in route really redirects to the provider with the client id
# and redirect URI we configured.
#
# This is the test that catches a wrong environment mapping: the app validates
# OIDC_CLIENT_ID / OIDC_CLIENT_SECRET / OIDC_REDIRECT_URI / OIDC_ISSUER_URL at
# boot, and the provider rejects a redirect_uri that does not match what was
# registered - so a mapping typo is a hard failure either way.
#
# Needs a MongoDB and the upstream binary; skips (exit 0) if either is absent,
# so it is safe to run anywhere.
#
#   API_BIN   default container/entrypoint.sh (override NODE_BIN /
#             SERVER_JS / DATA_DIR for a source build)
#   MONGO_URL default mongodb://127.0.0.1:27017
#
# Usage: tests/verify-oidc.sh
set -eu

API_BIN=${API_BIN:-"$(cd "$(dirname "$0")/../.." && pwd)/container/entrypoint.sh"}
MONGO_URL=${MONGO_URL:-mongodb://127.0.0.1:27017}

if [[ ! -x "$API_BIN" ]]; then
  echo "SKIP: no executable at API_BIN=$API_BIN (set API_BIN to the upstream binary)"
  exit 0
fi

MONGO_HOSTPORT=$(printf '%s' "$MONGO_URL" | sed -E 's#^mongodb://##; s#/.*$##; s#^[^@]*@##')
MH=${MONGO_HOSTPORT%%:*}
MP=${MONGO_HOSTPORT##*:}
if ! (exec 3<>/dev/tcp/"$MH"/"$MP") 2>/dev/null; then
  echo "SKIP: no MongoDB at $MH:$MP (set MONGO_URL)"
  exit 0
fi

T=$(mktemp -d)
APP_PID=""
IDP_PID=""
APP_PORT=5099
IDP_PORT=8899
APP_ORIGIN="http://127.0.0.1:${APP_PORT}"
cleanup() {
  [[ -n "$APP_PID" ]] && kill "$APP_PID" 2>/dev/null || true
  [[ -n "$IDP_PID" ]] && kill "$IDP_PID" 2>/dev/null || true
  rm -rf "$T"
}
trap cleanup EXIT

# Refuse to run against a stale process. An app left listening on APP_PORT from
# an earlier run makes every assertion here describe the OLD binary - which is
# exactly how a confident but wrong diagnosis got made once.
for p in "$APP_PORT" "$IDP_PORT"; do
  if (exec 3<>/dev/tcp/127.0.0.1/"$p") 2>/dev/null; then
    echo "FAIL: something is already listening on 127.0.0.1:$p - kill it and re-run"
    echo "      (otherwise this test reports the behaviour of that process, not the binary under test)"
    exit 1
  fi
done

FAIL=0
check() { # check <label> <expected-substring> <actual>
  if [[ "$3" == *"$2"* ]]; then
    echo "PASS  $1"
  else
    echo "FAIL  $1"
    echo "      expected to contain: $2"
    echo "      got: $3"
    FAIL=1
  fi
}

# --- stub identity provider -------------------------------------------------
# Serves the discovery document the app fetches, and an authorization endpoint
# it redirects to. Shared with CI - see tests/stub-idp.py.
python3 "$(dirname "$0")/stub-idp.py" "$IDP_PORT" > "$T/idp.log" 2>&1 &
IDP_PID=$!

for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:${IDP_PORT}/.well-known/openid-configuration" >/dev/null 2>&1 && break
  sleep 0.25
done

CLIENT_ID="sasjs-cloudron-test"
CLIENT_SECRET="test-secret"
REDIRECT_URI="${APP_ORIGIN}/SASLogon/openid/callback"

export MODE=server
export PORT=$APP_PORT
export PROTOCOL=http
export DB_CONNECT="$MONGO_URL/sasjs_oidc_test"
export DB_TYPE=mongodb
export AUTH_PROVIDERS=oidc
export OIDC_CLIENT_ID="$CLIENT_ID"
export OIDC_CLIENT_SECRET="$CLIENT_SECRET"
export OIDC_DISCOVERY_URL="http://127.0.0.1:${IDP_PORT}/.well-known/openid-configuration"
export OIDC_ISSUER_URL="http://127.0.0.1:${IDP_PORT}"
export OIDC_PROVIDER_NAME="Cloudron"
export OIDC_SIGNING_ALG=RS256
export OIDC_REDIRECT_URI="$REDIRECT_URI"
export OIDC_POST_LOGOUT_REDIRECT_URI="${APP_ORIGIN}/"
export SASJS_ROOT="$T/root"
export DRIVE_LOCATION="$T/root/drive"
export LOG_LOCATION="$T/root/logs"
export HOME="$T"
export RUN_TIMES=js,py
export NODE_PATH="$(command -v node || echo /nonexistent)"
export PYTHON_PATH="$(command -v python3 || echo /nonexistent)"
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD_INITIAL=oidc-test-password

mkdir -p "$SASJS_ROOT" "$DRIVE_LOCATION" "$LOG_LOCATION" "$T/mocks"

echo "--- booting the app with Cloudron-shaped OIDC configuration"
# Launch without a subshell so APP_PID is the app itself. With
# `( cd ... && app ) &` the trap kills the subshell and the app survives,
# holding the port and silently poisoning the next run.
cd "$T"
"$API_BIN" > "$T/app.log" 2>&1 &
APP_PID=$!
cd - > /dev/null

UP=0
for _ in $(seq 1 80); do
  if curl -sf "http://127.0.0.1:${APP_PORT}/SASjsApi/info" >/dev/null 2>&1; then UP=1; break; fi
  kill -0 "$APP_PID" 2>/dev/null || break
  sleep 0.5
done

if [[ "$UP" -ne 1 ]]; then
  echo "FAIL  the app did not become healthy"
  echo "--- app log ---"
  tail -30 "$T/app.log"
  exit 1
fi
echo "PASS  app is healthy with OIDC configured"

echo
echo "--- health check reports server mode"
INFO=$(curl -sf "http://127.0.0.1:${APP_PORT}/SASjsApi/info" || true)
check "health check reports server mode" '"mode":"server"' "$(printf '%s' "$INFO" | tr -d ' ')"

echo
echo "--- the sign-in route redirects to the provider"
HDRS=$(curl -s -D - -o /dev/null "http://127.0.0.1:${APP_PORT}/SASLogon/openid" || true)
LOC=$(printf '%s' "$HDRS" | grep -i '^location:' | head -1 || true)
check "302 redirect"              "302" "$HDRS"
check "goes to the auth endpoint" "http://127.0.0.1:${IDP_PORT}/authorize" "$LOC"
check "carries our client id"     "client_id=${CLIENT_ID}" "$LOC"
# Percent-encode the whole URI, not just the slashes: the app encodes ':' too.
ENC_REDIRECT=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$REDIRECT_URI")
check "carries our redirect URI"  "redirect_uri=${ENC_REDIRECT}" "$LOC"
check "asks for openid scope"     "openid" "$LOC"
check "sends a state parameter"   "state=" "$LOC"

echo
echo "--- the provider's callback path is the one the manifest registers"
check "manifest loginRedirectUri matches the route" "/SASLogon/openid/callback" "$REDIRECT_URI"

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "ALL TESTS PASSED"
else
  echo "SOME TESTS FAILED"
  exit 1
fi
