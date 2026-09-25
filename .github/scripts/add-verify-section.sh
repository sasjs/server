#!/usr/bin/env bash
#
# Append a "Verifying the download" section to a GitHub release body.
#
# Run by .github/workflows/release.yml once semantic-release has published a
# release, so it is only ever called for a tag that exists. It is idempotent:
# the section is added once and skipped on any later run.
#
# Usage: add-verify-section.sh <tag>
#
# Requires GITHUB_TOKEN (a token with contents:write on the repository) and
# GITHUB_REPOSITORY (owner/repo), both of which the workflow provides.

set -euo pipefail

TAG="${1:?usage: add-verify-section.sh <tag>}"

: "${GITHUB_TOKEN:?GITHUB_TOKEN must be set}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

API_URL="${GITHUB_API_URL:-https://api.github.com}/repos/${GITHUB_REPOSITORY}"
AUTH_HEADER="Authorization: Bearer ${GITHUB_TOKEN}"

release_json=$(curl --fail-with-body -sS \
  -H "$AUTH_HEADER" \
  -H 'Accept: application/vnd.github+json' \
  "${API_URL}/releases/tags/${TAG}")

release_id=$(printf '%s' "$release_json" | jq -r '.id')
body=$(printf '%s' "$release_json" | jq -r '.body // ""')

if printf '%s' "$body" | grep -q '## Verifying the download'; then
  echo "The verification section is already on ${TAG} - nothing to do."
  exit 0
fi

section=$(cat <<'EOF'

## Verifying the download

`SHA256SUMS` contains the SHA256 checksum of every asset in this release.

    sha256sum --check SHA256SUMS              # Linux
    shasum --algorithm 256 --check SHA256SUMS # macOS

Download `SHA256SUMS` and the executable next to it, then run the command for
your platform from that directory. Each checked file should report `OK`.
EOF
)

jq -n --arg body "${body}${section}" '{body: $body}' \
  | curl --fail-with-body -sS -X PATCH \
      -H "$AUTH_HEADER" \
      -H 'Content-Type: application/json' \
      --data @- \
      "${API_URL}/releases/${release_id}" \
      > /dev/null

echo "Added the verification section to ${TAG}."
