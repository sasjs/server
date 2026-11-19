#!/usr/bin/env bash
#
# Append a "Bundled upstream" section to a GitHub release body: the @sasjs/core
# version and the SAS_PACKAGES release the macros came from.
#
# A release resolves both upstreams at build time rather than using the pins a
# pull request is tested against, so this section is what tells a reader (and a
# support ticket) what the published binary actually carries - including when a
# lookup failed and the pin was used instead.
#
# Run by .github/workflows/release.yml once the release has been published, so it
# is only ever called for a tag that exists. It is idempotent: the section is
# added once and skipped on any later run.
#
# Usage: add-upstream-section.sh <tag>
#
# Requires GITHUB_TOKEN, GITHUB_REPOSITORY (both provided by the workflow) and
# api/.sas-packages-resolved.json plus api/.upstream-core.json, which the build
# job writes. Either file being absent is not an error: the section then says the
# value was not recorded rather than guessing.

set -euo pipefail

TAG="${1:?usage: add-upstream-section.sh <tag>}"

: "${GITHUB_TOKEN:?GITHUB_TOKEN must be set}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

API_URL="${GITHUB_API_URL:-https://api.github.com}/repos/${GITHUB_REPOSITORY}"
AUTH_HEADER="Authorization: Bearer ${GITHUB_TOKEN}"

read_json() {
  # Every value is optional: a release that never ran the resolver still gets a
  # section, saying so, rather than a section that invents a version.
  if [[ -f "$1" ]]; then jq -r "$2 // empty" "$1"; fi
}

MACROS_TAG=$(read_json api/.sas-packages-resolved.json '.tag')
MACROS_SHA=$(read_json api/.sas-packages-resolved.json '.sha256')
MACROS_SOURCE=$(read_json api/.sas-packages-resolved.json '.source')
MACROS_FALLBACK=$(read_json api/.sas-packages-resolved.json '.fallback')

CORE_VERSION=$(read_json api/.upstream-core.json '.version')
CORE_SOURCE=$(read_json api/.upstream-core.json '.source')
CORE_FALLBACK=$(read_json api/.upstream-core.json '.fallback')

describe_source() {
  # A fallback message carries stderr, which is multi-line: a newline would end
  # the table row and a `|` would end the cell, so both are flattened.
  local why
  why=$(printf '%s' "${2:-}" | tr '\n\t' '  ' | tr -s ' ')
  why="${why//|/\\|}"
  case "${1:-}" in
    latest) echo 'the newest release at build time' ;;
    pinned-fallback) echo "the pinned release - the lookup failed: ${why:-not recorded}" ;;
    pinned) echo 'the pinned release' ;;
    *) echo 'not recorded' ;;
  esac
}

release_json=$(curl --fail-with-body -sS \
  -H "$AUTH_HEADER" \
  -H 'Accept: application/vnd.github+json' \
  "${API_URL}/releases/tags/${TAG}")

release_id=$(printf '%s' "$release_json" | jq -r '.id')
body=$(printf '%s' "$release_json" | jq -r '.body // ""')

if printf '%s' "$body" | grep -q '## Bundled upstream'; then
  echo "The upstream section is already on ${TAG} - nothing to do."
  exit 0
fi

section=$(cat <<EOF

## Bundled upstream

This release resolves its macros at build time instead of using the pins a pull
request is tested against, so it carries the newest of each when it was cut:

| Upstream | Version | Taken from |
| --- | --- | --- |
| \`@sasjs/core\` | ${CORE_VERSION:-not recorded} | $(describe_source "$CORE_SOURCE" "$CORE_FALLBACK") |
| SAS_PACKAGES | ${MACROS_TAG:-not recorded} | $(describe_source "$MACROS_SOURCE" "$MACROS_FALLBACK") |

$([[ -n "$MACROS_SHA" ]] && echo "SAS_PACKAGES archive SHA-256: \`${MACROS_SHA}\`. Run \`GET /SASjsApi/admin/diagnostics\` on a running server to read the same values out of the binary." || echo "Run \`GET /SASjsApi/admin/diagnostics\` on a running server to read these values out of the binary.")
EOF
)

jq -n --arg body "${body}${section}" '{body: $body}' \
  | curl --fail-with-body -sS -X PATCH \
      -H "$AUTH_HEADER" \
      -H 'Content-Type: application/json' \
      --data @- \
      "${API_URL}/releases/${release_id}" \
      > /dev/null

echo "Added the upstream section to ${TAG}."
