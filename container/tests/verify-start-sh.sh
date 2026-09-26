#!/bin/bash
# Verify the bespoke logic in container/entrypoint.sh without a Docker daemon.
#
# The entrypoint hardcodes container paths (/app/data, /usr/server,
# /usr/local/bin/gosu) which do not exist outside the container, so the script
# is copied with those paths substituted and the app binary replaced by a stub
# that dumps the environment it was handed.
#
# Both modes are exercised: the generic container (no CLOUDRON_* variables) and
# the Cloudron app (addon variables present, DATA_DIR=/app/data).
#
# Usage: container/tests/verify-start-sh.sh
set -eu

PKG=$(cd "$(dirname "$0")/../.." && pwd)
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

NODE=$(command -v node || echo /nonexistent)
PY=$(command -v python3 || echo /nonexistent)
echo "using NODE=$NODE PY=$PY"
echo "testing $PKG/container/entrypoint.sh"

# Deliberately do NOT create $T/data: in the container DATA_DIR is created by
# the platform (or the mount), and the entrypoint must cope when it is absent
# (a plain docker run, or CI). Pre-creating it here hid exactly that bug once.
mkdir -p "$T/code" "$T/bin"

# stub gosu: drop the "user:group" argument and run the command
cat > "$T/bin/gosu" <<'EOF'
#!/bin/bash
shift
exec "$@"
EOF
chmod +x "$T/bin/gosu"

# stub app: print the environment the entrypoint produced. It runs as
# `node <path>`, so the stub has to be valid JavaScript.
mkdir -p "$T/code/api/build/src"
cat > "$T/code/api/build/src/server.js" <<'EOF'
const vars = [
  'MODE', 'PORT', 'PROTOCOL', 'CORS', 'DB_CONNECT', 'DB_TYPE', 'AUTH_PROVIDERS',
  'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'OIDC_DISCOVERY_URL', 'OIDC_ISSUER_URL',
  'OIDC_PROVIDER_NAME', 'OIDC_SIGNING_ALG', 'OIDC_REDIRECT_URI',
  'OIDC_POST_LOGOUT_REDIRECT_URI', 'OIDC_SCOPE', 'OIDC_USERNAME_CLAIM',
  'SASJS_ROOT', 'DRIVE_LOCATION', 'LOG_LOCATION',
  'RUN_TIMES', 'NODE_PATH', 'PYTHON_PATH', 'SAS_PATH', 'ADMIN_USERNAME',
  'ADMIN_PASSWORD_INITIAL', 'ADMIN_PASSWORD_RESET', 'NODE_OPTIONS'
]
console.log('CWD=' + process.cwd())
console.log('HOME=' + process.env.HOME)
for (const v of vars) console.log(v + '=' + (process.env[v] ?? '<unset>'))
EOF

# The node that runs the server (NODE_BIN) and the server it starts
# (SERVER_JS) are substituted with host paths; the container defaults of
# NODE_PATH / PYTHON_PATH are overridden by the caller's environment. The
# DATA_DIR default is left alone - TEST 1d asserts the plain-docker-run
# behaviour and the tests below pass DATA_DIR explicitly.
sed -e "s#NODE_BIN=\"\${NODE_BIN:-/usr/local/node/bin/node}\"#NODE_BIN=\"\${NODE_BIN:-$NODE}\"#g" \
    -e "s#SERVER_JS=\"\${SERVER_JS:-/usr/server/api/build/src/server.js}\"#SERVER_JS=\"\${SERVER_JS:-$T/code/api/build/src/server.js}\"#g" \
    -e "s#/app/data#$T/app-data#g" \
    -e "s#/usr/local/bin/gosu#$T/bin/gosu#g" \
    -e "s#cloudron:cloudron#$(id -un):$(id -gn)#g" \
    "$PKG/container/entrypoint.sh" > "$T/start-under-test.sh"
chmod +x "$T/start-under-test.sh"

# MongoDB stays FIRST: TEST 4 slices it off with ${ADDONS[@]:1}.
ADDONS=(
  CLOUDRON_MONGODB_URL='mongodb://sasjs:***@mongodb:27017/sasjs'
  CLOUDRON_APP_ORIGIN='https://sasjs.example.com'
  CLOUDRON_OIDC_CLIENT_ID='sasjs-client-id'
  CLOUDRON_OIDC_CLIENT_SECRET='oidc-secret'
  CLOUDRON_OIDC_DISCOVERY_URL='https://my.example.com/openid/.well-known/openid-configuration'
  CLOUDRON_OIDC_ISSUER='https://my.example.com/openid'
  CLOUDRON_OIDC_PROVIDER_NAME='Cloudron'
)

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

echo
echo "--- TEST 1: Cloudron mode, default RUN_TIMES=js,py"
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH="$NODE" PYTHON_PATH="$PY" "${ADDONS[@]}" \
  bash "$T/start-under-test.sh")
check "RUN_TIMES defaults to js,py"        "RUN_TIMES=js,py"                    "$OUT"
check "MODE=server"                        "MODE=server"                        "$OUT"
check "PROTOCOL=http (proxy does TLS)"     "PROTOCOL=http"                      "$OUT"
check "MongoDB URL mapped to DB_CONNECT"   "DB_CONNECT=mongodb://sasjs"         "$OUT"
check "AUTH_PROVIDERS defaults to oidc"    "AUTH_PROVIDERS=oidc"                 "$OUT"
check "OIDC client id mapped"              "OIDC_CLIENT_ID=sasjs-client-id"     "$OUT"
check "OIDC client secret mapped"          "OIDC_CLIENT_SECRET=oidc-secret"      "$OUT"
check "OIDC discovery URL mapped"          "OIDC_DISCOVERY_URL=https://my.example.com/openid/.well-known/openid-configuration" "$OUT"
check "OIDC issuer mapped"                 "OIDC_ISSUER_URL=https://my.example.com/openid" "$OUT"
check "OIDC provider name mapped"          "OIDC_PROVIDER_NAME=Cloudron"         "$OUT"
check "signing alg is RS256"               "OIDC_SIGNING_ALG=RS256"              "$OUT"
# The app requires an absolute redirect URI; the manifest's loginRedirectUri is
# a path that Cloudron prefixes with the app domain, so the entrypoint builds it.
check "redirect URI is absolute"           "OIDC_REDIRECT_URI=https://sasjs.example.com/SASLogon/openid/callback" "$OUT"
check "post-logout URI is absolute"        "OIDC_POST_LOGOUT_REDIRECT_URI=https://sasjs.example.com/" "$OUT"
check "HOME moved to the data dir"         "HOME=$T/app-data"                   "$OUT"
check "cwd is the data dir"                "CWD=$T/app-data"                    "$OUT"
check "SAS_PATH not required"              "SAS_PATH=<unset>"                   "$OUT"
check "NODE_OPTIONS cleared"               "NODE_OPTIONS=<unset>"               "$OUT"
check "code-execution notice printed"      "execute code uploaded to SASjs Drive" "$OUT"

echo
echo "--- TEST 1b: generic container (no CLOUDRON_* variables)"
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH="$NODE" PYTHON_PATH="$PY" \
  DATA_DIR="$T/data" \
  DB_CONNECT='mongodb://127.0.0.1:27017/sasjs' DB_TYPE=mongodb \
  bash "$T/start-under-test.sh")
check "MODE defaults to server"            "MODE=server"                          "$OUT"
check "DB_CONNECT passed through"         "DB_CONNECT=mongodb://127.0.0.1:27017/sasjs" "$OUT"
check "HOME is the data dir"               "HOME=$T/data"                         "$OUT"
check "cwd is the data dir"                "CWD=$T/data"                          "$OUT"
check "no local admin without a password"  "no local admin will be seeded"       "$OUT"
check "ADMIN_PASSWORD_INITIAL left unset"  "ADMIN_PASSWORD_INITIAL=<unset>"      "$OUT"
check "first-user-admin note printed"      "the first user to sign in becomes the administrator" "$OUT"
check "starts the app"                     "Starting SASjs Server"                "$OUT"

echo
echo "--- TEST 1c: generic container, MODE=desktop needs no database"
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH="$NODE" PYTHON_PATH="$PY" \
  DATA_DIR="$T/data" MODE=desktop \
  bash "$T/start-under-test.sh")
check "MODE=desktop honoured"             "MODE=desktop"                         "$OUT"
check "HOME is the data dir"              "HOME=$T/data"                         "$OUT"
check "starts the app"                    "Starting SASjs Server"                "$OUT"
# The default DATA_DIR is asserted statically: the generic path in the
# entrypoint defaults it to /usr/server/data, which the harness redirects to
# $T/data only via an explicit environment variable (never by editing).
check "default DATA_DIR is /usr/server/data" 'DATA_DIR="${DATA_DIR:-/usr/server/data}"' "$(grep -F 'DATA_DIR="${DATA_DIR:-/usr/server/data}"' "$PKG/container/entrypoint.sh")"

echo
echo "--- TEST 1d: generic container, server mode without DB_CONNECT fails loudly"
set +e
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH="$NODE" PYTHON_PATH="$PY" \
  bash "$T/start-under-test.sh" 2>&1)
RC=$?
set -e
check "non-zero exit"                     "1"                                    "$RC"
check "names the missing variable"        "set DB_CONNECT"                       "$OUT"

echo
echo "--- TEST 2: default executables are the container paths"
OUT=$(env -i PATH=/usr/bin:/bin "${ADDONS[@]}" bash "$T/start-under-test.sh" 2>&1)
check "NODE_PATH default"    "NODE_PATH=/usr/local/node/bin/node" "$OUT"
check "PYTHON_PATH default"  "PYTHON_PATH=/usr/bin/python3"       "$OUT"

echo
echo "--- TEST 3: missing runtime executable warns but still starts"
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH=/nope/node PYTHON_PATH=/nope/python3 \
  "${ADDONS[@]}" bash "$T/start-under-test.sh" 2>&1 || true)
check "warning names both runtimes" "no executable: js (NODE_PATH=/nope/node) py (PYTHON_PATH=/nope/python3)" "$OUT"
check "still reaches the app"       "Starting SASjs Server" "$OUT"

echo
echo "--- TEST 4: mongodb addon missing is a hard failure"
set +e
OUT=$(env -i PATH=/usr/bin:/bin "${ADDONS[@]:1}" bash "$T/start-under-test.sh" 2>&1)
RC=$?
set -e
check "non-zero exit"        "1" "$RC"
check "names the addon"      "mongodb addon missing" "$OUT"

echo
echo "--- TEST 5: oidc addon missing is a hard failure"
set +e
OUT=$(env -i PATH=/usr/bin:/bin CLOUDRON_MONGODB_URL='mongodb://x' \
  bash "$T/start-under-test.sh" 2>&1)
RC=$?
set -e
check "non-zero exit"   "1" "$RC"
check "names the addon" "oidc addon missing" "$OUT"

echo
echo "--- TEST 5b: AUTH_PROVIDERS override skips OIDC entirely"
OUT=$(env -i PATH=/usr/bin:/bin CLOUDRON_MONGODB_URL='mongodb://x' AUTH_PROVIDERS= \
  bash "$T/start-under-test.sh" 2>&1)
check "starts without any OIDC vars"  "Starting SASjs Server" "$OUT"
check "says SSO is disabled"          "Cloudron SSO is disabled" "$OUT"
check "AUTH_PROVIDERS passed through" "AUTH_PROVIDERS=" "$OUT"

echo
echo "--- TEST 5c: entrypoint and the manifest agree on the OIDC contract"
# If these diverge, the platform registers one redirect URI and the app sends
# another, and sign-in fails at the provider with a redirect_uri mismatch.
python3 - "$PKG" <<'PY' > "$T/oidc-contract.txt" 2>&1
import json, re, sys, os
pkg = sys.argv[1]
manifest = json.load(open(os.path.join(pkg, "container/cloudron/CloudronManifest.json")))
start = open(os.path.join(pkg, "container/entrypoint.sh")).read()
oidc = manifest.get("addons", {}).get("oidc", {})
alg = re.search(r'export OIDC_SIGNING_ALG=(\S+)', start)
redir = re.search(r'export OIDC_REDIRECT_URI="\$\{CLOUDRON_APP_ORIGIN:\?[^}]*\}([^"]*)"', start)
print(f"manifest.tokenSignatureAlgorithm={oidc.get('tokenSignatureAlgorithm')}")
print(f"start.OIDC_SIGNING_ALG={alg.group(1) if alg else '<missing>'}")
print(f"manifest.loginRedirectUri={oidc.get('loginRedirectUri')}")
print(f"start.redirectPath={redir.group(1) if redir else '<missing>'}")
PY
OUT=$(cat "$T/oidc-contract.txt")
check "signing algorithms agree" "manifest.tokenSignatureAlgorithm=RS256
start.OIDC_SIGNING_ALG=RS256" "$OUT"
check "redirect paths agree"     "manifest.loginRedirectUri=/SASLogon/openid/callback
start.redirectPath=/SASLogon/openid/callback" "$OUT"
# Counts, so they need an exact assertion rather than the substring helper.
LDAP_IN_START=$(grep -c -i ldap "$PKG/container/entrypoint.sh" || true)
LDAP_IN_MANIFEST=$(grep -c -i '"ldap"' "$PKG/container/cloudron/CloudronManifest.json" || true)
check "no LDAP left in the entrypoint"      "0" "$LDAP_IN_START"
check "no ldap addon in the manifest"       "0" "$LDAP_IN_MANIFEST"

echo
echo "--- TEST 6: no admin password file, and DATA_DIR/.env is read"
# The entrypoint no longer generates an admin password: an admin exists only
# when ADMIN_PASSWORD_INITIAL is set, so that a fresh install is usable via
# the first user to sign in rather than a credential nobody can read.
if [[ -f "$T/app-data/.initial-admin-password" ]]; then
  echo "FAIL  no .initial-admin-password is written when ADMIN_PASSWORD_INITIAL is unset"
  FAIL=1
else
  echo "PASS  no .initial-admin-password is written when ADMIN_PASSWORD_INITIAL is unset"
fi

# The operator's config file: sourced by the entrypoint, and read by the app
# itself (it runs with DATA_DIR as its working directory and calls dotenv).
mkdir -p "$T/app-data"
printf 'ADMIN_USERNAME=fromenvfile\n' > "$T/app-data/.env"
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH="$NODE" PYTHON_PATH="$PY" "${ADDONS[@]}" \
  bash "$T/start-under-test.sh")
check "config file is sourced"        "loaded configuration from"   "$OUT"
check "config file value reaches the app" "ADMIN_USERNAME=fromenvfile" "$OUT"
rm -f "$T/app-data/.env"

echo
echo "--- TEST 6b: an explicit ADMIN_PASSWORD_INITIAL is honoured"
OUT=$(env -i PATH=/usr/bin:/bin NODE_PATH="$NODE" PYTHON_PATH="$PY" \
  ADMIN_PASSWORD_INITIAL=chosen-password "${ADDONS[@]}" \
  bash "$T/start-under-test.sh")
check "explicit password passed through" "ADMIN_PASSWORD_INITIAL=chosen-password" "$OUT"
if grep -q "no local admin will be seeded" <<< "$OUT"; then
  echo "FAIL  the no-admin note is printed even though ADMIN_PASSWORD_INITIAL is set"
  FAIL=1
else
  echo "PASS  the no-admin note is not printed when a password is set"
fi

echo
echo "--- TEST 7: writable dirs prepared under the data root"
OUT=$(find "$T/app-data" -maxdepth 2 -type d | sort)
check "sasjs_root"  "$T/app-data/sasjs_root"         "$OUT"
check "drive"       "$T/app-data/sasjs_root/drive"   "$OUT"
check "logs"        "$T/app-data/sasjs_root/logs"    "$OUT"
check "mocks (cwd)" "$T/app-data/mocks"              "$OUT"

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "ALL TESTS PASSED"
else
  echo "SOME TESTS FAILED"
  exit 1
fi
