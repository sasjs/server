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

# DATA_DIR is resolved first, because the optional config file below lives in
# it. Inside a Cloudron app it is /app/data - the only path that is both
# writable and persistent - and the manifest's httpPort is 5000.
if [[ -n "$CLOUDRON_MARKER" ]]; then
  export DATA_DIR=/app/data
else
  export DATA_DIR="${DATA_DIR:-/usr/server/data}"
fi

# --- operator configuration --------------------------------------------------
# Two optional files in DATA_DIR, both editable from the platform's file
# manager: config.env (visible) and .env (a dotfile, still honoured for
# installs that already have one). config.env wins where both set the same key.
#
# They are READ, never sourced. This script runs as root and DATA_DIR is
# writable by the app user, so sourcing a file from there would let anyone who
# can write to the data directory execute shell as root on the next restart -
# and this application hands out code execution by design. Only KEY=VALUE lines
# are honoured; anything else is reported and ignored.
#
# Values set here win over this script's own defaults, so AUTH_PROVIDERS,
# RUN_TIMES, PORT and ADMIN_PASSWORD_INITIAL are all settable from the file.
# Cloudron's addon credentials are the exception: the platform can rotate them
# on any restart (reboot, backup restore, addon re-provision), so they are
# always read from the environment.
read_config_file() {
  local file="$1" line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "${line#"${line%%[![:space:]]*}"}" == '#'* ]] && continue
    if [[ "$line" != *=* ]]; then
      echo "WARNING: ignoring a line in $(basename "$file") that is not KEY=VALUE"
      continue
    fi
    key="${line%%=*}"
    value="${line#*=}"
    key="${key//[[:space:]]/}"
    if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      echo "WARNING: ignoring an invalid variable name in $(basename "$file")"
      continue
    fi
    # One layer of matching quotes, else an unquoted trailing comment - the same
    # reading dotenv applies in the server, so the two never disagree about what
    # a line means.
    value="$(printf '%s' "$value" | sed -E -e 's/^[[:space:]]+//')"
    if [[ "$value" == \"* ]]; then
      value="${value#\"}"
      value="${value%%\"*}"
    elif [[ "$value" == \'* ]]; then
      value="${value#\'}"
      value="${value%%\'*}"
    else
      value="$(printf '%s' "$value" | sed -E -e 's/[[:space:]]+#.*$//' -e 's/[[:space:]]+$//')"
    fi
    export "$key=$value"
  done < "$file"
}

# .env first, then config.env, so the visible file wins where both set a key.
CONFIG_FILES_READ=""
for config_file in "${DATA_DIR}/.env" "${DATA_DIR}/config.env"; do
  if [[ -f "$config_file" ]]; then
    read_config_file "$config_file"
    CONFIG_FILES_READ="${CONFIG_FILES_READ}${CONFIG_FILES_READ:+ }${config_file}"
    echo "NOTE: read configuration from ${config_file}"
  fi
done
if [[ -z "$CONFIG_FILES_READ" ]]; then
  echo "NOTE: no ${DATA_DIR}/config.env and no ${DATA_DIR}/.env - create either to configure this instance (both are read on every start)."
  echo "NOTE: the effective configuration is written to ${DATA_DIR}/config.txt on every start."
fi

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

  # Listen settings come from the manifest's httpPort; a value in .env or the
  # environment still wins, so an operator can change the port or protocol
  # without patching the package.
  export PORT="${PORT:-5000}"
  export PROTOCOL="${PROTOCOL:-http}"
  export CORS="${CORS:-disable}"

  # Cloudron terminates TLS, so the app itself receives plain HTTP and cannot
  # see the client's protocol or address without being told to believe the
  # proxy's X-Forwarded-* headers. One hop is the platform's own proxy (the
  # platform's proxy address is used instead when it exports one); the session
  # cookie is marked Secure off the back of it.
  export TRUST_PROXY="${TRUST_PROXY:-${CLOUDRON_PROXY_IP:-1}}"
else
  # --- generic container ----------------------------------------------------
  export MODE="${MODE:-server}"
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
# A local admin is seeded ONLY when ADMIN_PASSWORD_INITIAL is set - here, in
# the .env above, or in the environment. With no password configured no local
# admin is created at all, and the first user to sign in through the
# configured auth provider becomes the administrator. That is the intended
# state for a Cloudron install: a generated password would be a credential
# nobody can read, and an admin that exists suppresses the first-user
# bootstrap.
#
# Set ADMIN_PASSWORD_INITIAL to get a break-glass local account instead. Note
# that a seeded admin counts as an existing administrator, so the first user
# to sign in is then a normal user. Changing the password of an admin that
# already exists needs ADMIN_PASSWORD_RESET=YES.
export ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
export ADMIN_PASSWORD_RESET="${ADMIN_PASSWORD_RESET:-NO}"
if [[ -z "${ADMIN_PASSWORD_INITIAL-}" ]]; then
  echo "NOTE: ADMIN_PASSWORD_INITIAL is not set - no local admin will be seeded."
  echo "NOTE: the first user to sign in becomes the administrator."
  echo "NOTE: to seed a break-glass local admin instead, set ADMIN_PASSWORD_INITIAL in ${DATA_DIR}/config.env and restart."
fi

# --- effective configuration --------------------------------------------------
# A visible, generated summary of what this instance is actually running with,
# so the configuration can be read from the platform's file manager without
# shell access. It is rewritten on every start and never read back, so it cannot
# become a second source of truth. Credentials are reported as set/unset and
# never by value: DB_CONNECT carries the database password, and
# OIDC_CLIENT_SECRET and ADMIN_PASSWORD_INITIAL are credentials themselves.
CONFIG_SUMMARY="${DATA_DIR}/config.txt"
{
  echo "# SASjs Server - effective configuration"
  echo "# Generated by the container entrypoint on every start, and NOT read back:"
  echo "# edit config.env (or .env) in this directory to change anything below."
  echo "#"
  echo "generated_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "config_files_read=${CONFIG_FILES_READ:-none}"
  echo "cloudron_addons=${CLOUDRON_MARKER:+detected}"
  echo
  echo "# --- core ---"
  echo "MODE=${MODE}"
  echo "PORT=${PORT}"
  echo "PROTOCOL=${PROTOCOL}"
  echo "CORS=${CORS}"
  echo "TRUST_PROXY=${TRUST_PROXY:-none}"
  echo "DATA_DIR=${DATA_DIR}"
  echo "RUN_TIMES=${RUN_TIMES}"
  echo
  echo "# --- storage ---"
  echo "DB_TYPE=${DB_TYPE:-}"
  echo "DB_CONNECT=$([[ -n "${DB_CONNECT:-}" ]] && echo set || echo unset)"
  echo "SASJS_ROOT=${SASJS_ROOT}"
  echo "DRIVE_LOCATION=${DRIVE_LOCATION}"
  echo "LOG_LOCATION=${LOG_LOCATION}"
  echo
  echo "# --- authentication ---"
  echo "AUTH_PROVIDERS=${AUTH_PROVIDERS:-}"
  echo "OIDC_PROVIDER_NAME=${OIDC_PROVIDER_NAME:-}"
  echo "OIDC_ISSUER_URL=${OIDC_ISSUER_URL:-}"
  echo "OIDC_DISCOVERY_URL=${OIDC_DISCOVERY_URL:-}"
  echo "OIDC_REDIRECT_URI=${OIDC_REDIRECT_URI:-}"
  echo "OIDC_CLIENT_ID=${OIDC_CLIENT_ID:-}"
  echo "OIDC_CLIENT_SECRET=$([[ -n "${OIDC_CLIENT_SECRET:-}" ]] && echo set || echo unset)"
  echo "OIDC_JIT_PROVISION=${OIDC_JIT_PROVISION:-}"
  echo "ADMIN_USERNAME=${ADMIN_USERNAME:-}"
  echo "ADMIN_PASSWORD_INITIAL=$([[ -n "${ADMIN_PASSWORD_INITIAL:-}" ]] && echo set || echo unset)"
  echo
  echo "# --- runtimes ---"
  echo "NODE_PATH=${NODE_PATH:-}"
  echo "PYTHON_PATH=${PYTHON_PATH:-}"
  echo "SAS_PATH=${SAS_PATH:-}"
  echo "R_PATH=${R_PATH:-}"
} > "$CONFIG_SUMMARY" 2>/dev/null || echo "WARNING: could not write ${CONFIG_SUMMARY}" >&2
echo "NOTE: effective configuration written to ${CONFIG_SUMMARY}"

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
