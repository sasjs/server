#!/bin/bash
set -eu

# ---------------------------------------------------------------------------
# SASjs Server container entrypoint.
#
# The image is platform-neutral: it is configured entirely through the
# environment variables SASjs Server itself reads (see container/README.md).
#
# When the container runs as a Cloudron app - detected by the platform's
# CLOUDRON_* addon variables - those are mapped onto the application's own
# names first. That is the only Cloudron-aware block; everything below it is
# platform-neutral. The Cloudron app package that consumes this image lives
# in container/cloudron/.
# ---------------------------------------------------------------------------

CLOUDRON_MARKER="${CLOUDRON_MONGODB_URL:-}${CLOUDRON_APP_ORIGIN:-}${CLOUDRON_OIDC_CLIENT_ID:-}${CLOUDRON_OIDC_CLIENT_SECRET:-}${CLOUDRON_OIDC_DISCOVERY_URL:-}${CLOUDRON_OIDC_ISSUER:-}${CLOUDRON_OIDC_PROVIDER_NAME:-}"

if [[ -n "$CLOUDRON_MARKER" ]]; then
  # --- Cloudron addon wiring ----------------------------------------------
  # The platform exports addon credentials as CLOUDRON_* variables and may
  # change them on any restart (server reboot, backup restore, addon
  # re-provision), so they are read and mapped here at every start - never
  # cached into a config file.
  export MODE=server
  export DB_CONNECT="${CLOUDRON_MONGODB_URL:?mongodb addon missing: CLOUDRON_MONGODB_URL is unset}"
  export DB_TYPE=mongodb

  # AUTH_PROVIDERS is a comma-separated list - set it to an empty value to
  # skip SSO entirely and authenticate against the local database only. Note
  # the single-dash default: `:-` would treat an explicitly empty value as
  # unset and re-enable OIDC, making "AUTH_PROVIDERS=" impossible to express.
  export AUTH_PROVIDERS="${AUTH_PROVIDERS-oidc}"
  if [[ ",${AUTH_PROVIDERS}," == *",oidc,"* ]]; then
    export OIDC_CLIENT_ID="${CLOUDRON_OIDC_CLIENT_ID:?oidc addon missing: CLOUDRON_OIDC_CLIENT_ID is unset}"
    export OIDC_CLIENT_SECRET="${CLOUDRON_OIDC_CLIENT_SECRET:?CLOUDRON_OIDC_CLIENT_SECRET is unset}"
    export OIDC_DISCOVERY_URL="${CLOUDRON_OIDC_DISCOVERY_URL:?oidc addon missing: CLOUDRON_OIDC_DISCOVERY_URL is unset}"
    export OIDC_ISSUER_URL="${CLOUDRON_OIDC_ISSUER:-}"
    export OIDC_PROVIDER_NAME="${CLOUDRON_OIDC_PROVIDER_NAME:-Cloudron}"
    # Must match the package manifest's oidc.tokenSignatureAlgorithm.
    export OIDC_SIGNING_ALG=RS256
    # The app requires an ABSOLUTE redirect URI; the manifest's
    # loginRedirectUri is a path, which Cloudron prefixes with the app domain.
    export OIDC_REDIRECT_URI="${CLOUDRON_APP_ORIGIN:?CLOUDRON_APP_ORIGIN is unset}/SASLogon/openid/callback"
    export OIDC_POST_LOGOUT_REDIRECT_URI="${CLOUDRON_APP_ORIGIN}/"
  else
    echo "NOTE: AUTH_PROVIDERS=${AUTH_PROVIDERS} - Cloudron SSO is disabled, only local accounts can log in."
  fi

  # /app/data is the only path that is both writable and persistent inside a
  # Cloudron app, and the manifest's httpPort is 5000.
  export DATA_DIR=/app/data
  export PORT=5000
  export PROTOCOL=http
  export CORS="${CORS:-disable}"
else
  # --- generic container ----------------------------------------------------
  export MODE="${MODE:-server}"
  export DATA_DIR="${DATA_DIR:-/usr/server/data}"
  if [[ "${MODE}" == "server" && -z "${DB_CONNECT:-}" ]]; then
    echo "ERROR: MODE=${MODE} needs a database - set DB_CONNECT (and DB_TYPE)," >&2
    echo "       or start a single-user instance with MODE=desktop." >&2
    exit 1
  fi
  export DB_TYPE="${DB_TYPE:-mongodb}"
  export PORT="${PORT:-5000}"
  export PROTOCOL="${PROTOCOL:-http}"
  export CORS="${CORS:-disable}"
fi

# --- writable state ---------------------------------------------------------
# DATA_DIR is the only path this entrypoint assumes is writable, and the only
# one that needs to persist - mount it. HOME must move too: the server writes
# $HOME/.sasjs-server.
export HOME="${DATA_DIR}"
export SASJS_ROOT="${SASJS_ROOT:-${DATA_DIR}/sasjs_root}"
export DRIVE_LOCATION="${DRIVE_LOCATION:-${SASJS_ROOT}/drive}"
export LOG_LOCATION="${LOG_LOCATION:-${SASJS_ROOT}/logs}"

# Create the whole tree up front, before anything writes into it. This also
# lets the image boot outside any platform (a plain docker run, CI).
mkdir -p "${SASJS_ROOT}" "${DRIVE_LOCATION}" "${LOG_LOCATION}" "${DATA_DIR}/mocks"

# --- execution runtimes -----------------------------------------------------
# JavaScript and Python stored programs; neither needs SAS, so the image is
# self-contained. 'sas' and 'r' are opt-in and need an executable supplied from
# outside the image (SAS_PATH / R_PATH).
#
# NODE_BIN is the node that runs the server itself (the image ships it at
# /usr/local/node/bin/node); override it to run the entrypoint against a
# source checkout outside the container. SERVER_JS is the built server it
# starts, overridable for the same reason.
export RUN_TIMES="${RUN_TIMES:-js,py}"
export NODE_PATH="${NODE_PATH:-/usr/local/node/bin/node}"
export PYTHON_PATH="${PYTHON_PATH:-/usr/bin/python3}"
NODE_BIN="${NODE_BIN:-/usr/local/node/bin/node}"
SERVER_JS="${SERVER_JS:-/usr/server/api/build/src/server.js}"

# --- admin account ----------------------------------------------------------
# In server mode the seeded admin is a local break-glass account; day-to-day
# logins go through SSO where it is enabled. Set ADMIN_PASSWORD_INITIAL to
# choose the password yourself; leave it unset and one is generated on first
# boot and kept in DATA_DIR, so it survives restarts and is included in
# backups.
export ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
export ADMIN_PASSWORD_RESET=NO
ADMIN_PW_FILE="${DATA_DIR}/.initial-admin-password"
if [[ -z "${ADMIN_PASSWORD_INITIAL-}" ]]; then
  if [[ ! -f "$ADMIN_PW_FILE" ]]; then
    umask 077
    if command -v openssl >/dev/null 2>&1; then
      ADMIN_PW="$(openssl rand -hex 12)"
    else
      ADMIN_PW="$(head -c 18 /dev/urandom | base64 | tr -d '\n/+=')"
    fi
    printf '%s' "$ADMIN_PW" > "$ADMIN_PW_FILE"
  fi
  export ADMIN_PASSWORD_INITIAL="$(cat "$ADMIN_PW_FILE")"
fi

# --- permissions ------------------------------------------------------------
# A backup, restore or migration can reset ownership of the data dir, so it
# is re-taken on every start. Inside the published image the server always
# runs as the non-root 'cloudron' user (uid 1000) via gosu. Outside the image
# - running the entrypoint against a source checkout, in development or CI -
# there is no 'cloudron' user and no gosu, and the entrypoint then runs the
# server as the current user instead.
if id cloudron >/dev/null 2>&1 && [[ -x /usr/local/bin/gosu ]]; then
  chown -R cloudron:cloudron "${DATA_DIR}"
  RUN_AS=(/usr/local/bin/gosu cloudron:cloudron)
  echo "NOTE: running the server as the 'cloudron' user (uid 1000)."
else
  echo "NOTE: no 'cloudron' user or gosu in this environment - running as $(id -un)."
  RUN_AS=()
fi
[[ -f "$ADMIN_PW_FILE" ]] && chmod 600 "$ADMIN_PW_FILE"

# --- warnings ----------------------------------------------------------------
# The server starts and passes its health check even when a configured runtime
# has no executable; only stored programs for that runtime fail.
missing=""
if [[ ",${RUN_TIMES}," == *",sas,"* ]] && [[ ! -x "${SAS_PATH:-}" ]]; then
  missing="${missing} sas (SAS_PATH=${SAS_PATH:-unset})"
fi
if [[ ",${RUN_TIMES}," == *",js,"* ]] && [[ ! -x "${NODE_PATH:-}" ]]; then
  missing="${missing} js (NODE_PATH=${NODE_PATH:-unset})"
fi
if [[ ",${RUN_TIMES}," == *",py,"* ]] && [[ ! -x "${PYTHON_PATH:-}" ]]; then
  missing="${missing} py (PYTHON_PATH=${PYTHON_PATH:-unset})"
fi
if [[ -n "$missing" ]]; then
  echo "WARNING: RUN_TIMES=${RUN_TIMES} but these runtimes have no executable:${missing}" >&2
  echo "WARNING: stored programs for those runtimes will fail until they are provided." >&2
fi

if [[ ",${RUN_TIMES}," == *",js,"* ]] || [[ ",${RUN_TIMES}," == *",py,"* ]]; then
  echo "NOTE: the js and py runtimes execute code uploaded to SASjs Drive."
  echo "NOTE: grant Drive write access only to trusted authors, and keep this instance behind an authentication wall."
fi

# NODE_OPTIONS is cleared so a globally exported value cannot leak into the
# node processes this server spawns for stored programs.
unset NODE_OPTIONS 2>/dev/null || true

# The working directory must be writable: the server creates ./mocks relative
# to it (STATIC_MOCK_LOCATION defaults to 'mocks').
cd "${DATA_DIR}"

echo "=> Starting SASjs Server (MODE=${MODE}, PORT=${PORT}, RUN_TIMES=${RUN_TIMES}, NODE_PATH=${NODE_PATH}, PYTHON_PATH=${PYTHON_PATH})"
exec "${RUN_AS[@]}" \
  "${NODE_BIN}" "${SERVER_JS}"
