#!/usr/bin/env bash
#
# Exercises .github/scripts/base-image-bump.mjs against a fixture Dockerfile and
# a stubbed Docker Hub, so the --write path is proven without the network and
# without waiting for a scheduled run to open the pull request.
#
# The script resolves the repository root from its own location, so each case
# copies it into a throwaway tree alongside a fixture container/Dockerfile.
set -uo pipefail

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCRIPT="$REPO_ROOT/.github/scripts/base-image-bump.mjs"
STUB="$REPO_ROOT/container/tests/base-image-bump/stub-fetch.mjs"

FAIL=0

check() {
  local label=$1 expected=$2 actual=$3
  if [[ "$actual" == *"$expected"* ]]; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    echo "      expected to contain: $expected"
    echo "      got: $actual"
    FAIL=1
  fi
}

check_absent() {
  local label=$1 unexpected=$2 actual=$3
  if [[ "$actual" != *"$unexpected"* ]]; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    echo "      expected NOT to contain: $unexpected"
    FAIL=1
  fi
}

# A tree with the script where it expects to be, and a fixture Dockerfile below
# the FROM line that the write path must not disturb.
make_tree() {
  local dir=$1
  mkdir -p "$dir/.github/scripts" "$dir/container"
  cp "$SCRIPT" "$dir/.github/scripts/base-image-bump.mjs"
  cat > "$dir/container/Dockerfile" <<'EOF'
# a comment above the pin

FROM cloudron/node-base:24-20260920@sha256:d984683ec59bf2379130bf41cf3c2b6bc0453f327297d7183525cb05424e7b34

# Node ships with this base image (the 'js' runtime). Python does not, so add
# it for the 'py' runtime.
RUN echo keep-me
EOF
}

run() {
  local dir=$1 fixture=$2
  shift 2
  FIXTURE_TAGS="$fixture" node --import "$STUB" "$dir/.github/scripts/base-image-bump.mjs" "$@" 2>&1
}

# --- case 1: a newer tag, written ------------------------------------------
DIR="$T/write"
make_tree "$DIR"
cat > "$T/tags-newer.json" <<'EOF'
[
  { "name": "24-20261026", "images": [ { "architecture": "amd64", "digest": "sha256:1111111111111111111111111111111111111111111111111111111111111111" } ] },
  { "name": "24-20260920", "images": [ { "architecture": "amd64", "digest": "sha256:d984683ec59bf2379130bf41cf3c2b6bc0453f327297d7183525cb05424e7b34" } ] }
]
EOF

OUT=$(run "$DIR" "$T/tags-newer.json" --write)
check "reports the pin"            "pinned:  24-20260920" "$OUT"
check "reports the newest tag"     "newest:  24-20261026" "$OUT"

DOCKERFILE=$(cat "$DIR/container/Dockerfile")
check "rewrites the FROM line"     "FROM cloudron/node-base:24-20261026@sha256:111111" "$DOCKERFILE"
check "keeps the comment above"    "# a comment above the pin" "$DOCKERFILE"
check "keeps the blank line"       $'24-20261026@sha256:1111111111111111111111111111111111111111111111111111111111111111\n\n# Node ships' "$DOCKERFILE"
check "keeps the comment below"    "# Node ships with this base image" "$DOCKERFILE"
check "keeps the line after"       "RUN echo keep-me" "$DOCKERFILE"

# --- case 2: the newest tag carries no amd64 digest -------------------------
DIR="$T/nodigest"
make_tree "$DIR"
cat > "$T/tags-nodigest.json" <<'EOF'
[
  { "name": "24-20261027", "images": [ { "architecture": "arm64", "digest": "sha256:2222222222222222222222222222222222222222222222222222222222222222" } ] }
]
EOF

OUT=$(run "$DIR" "$T/tags-nodigest.json" --write); CODE=$?
check "fails closed"               "carries no amd64 digest" "$OUT"
check "exit code is non-zero"      "1" "$CODE"

DOCKERFILE=$(cat "$DIR/container/Dockerfile")
check_absent "leaves the pin alone" "24-20261027" "$DOCKERFILE"

# --- case 3: nothing newer --------------------------------------------------
DIR="$T/current"
make_tree "$DIR"
cat > "$T/tags-same.json" <<'EOF'
[
  { "name": "24-20260920", "images": [ { "architecture": "amd64", "digest": "sha256:d984683ec59bf2379130bf41cf3c2b6bc0453f327297d7183525cb05424e7b34" } ] }
]
EOF

OUT=$(run "$DIR" "$T/tags-same.json" --write)
check "reports no change"          "stale:   false" "$OUT"

# --- case 4: the invocation the scheduled job makes, --write --tag ----------
DIR="$T/write-tag"
make_tree "$DIR"
cat > "$T/tags-pinned.json" <<'EOF'
[
  { "name": "24-20261028", "images": [ { "architecture": "amd64", "digest": "sha256:3333333333333333333333333333333333333333333333333333333333333333" } ] },
  { "name": "24-20261026", "images": [ { "architecture": "amd64", "digest": "sha256:4444444444444444444444444444444444444444444444444444444444444444" } ] }
]
EOF

OUT=$(run "$DIR" "$T/tags-pinned.json" --write --tag 24-20261026)
check "--tag writes the named tag"  "FROM cloudron/node-base:24-20261026@sha256:444444" "$(cat "$DIR/container/Dockerfile")"
check "--tag does not take the newest" "0" "$(grep -c 24-20261028 "$DIR/container/Dockerfile" || true)"

# --- case 5: a Dockerfile whose pin cannot be read --------------------------
DIR="$T/unparseable"
mkdir -p "$DIR/.github/scripts" "$DIR/container"
cp "$SCRIPT" "$DIR/.github/scripts/base-image-bump.mjs"
printf 'FROM scratch\n' > "$DIR/container/Dockerfile"

OUT=$(run "$DIR" "$T/tags-newer.json"); CODE=$?
check "refuses an unreadable pin" "could not read the base image pin" "$OUT"
check "unreadable pin exits non-zero" "1" "$CODE"

# --- case 6: the tag is current but the digest moved ------------------------
DIR="$T/digest-only"
make_tree "$DIR"
cat > "$T/tags-digest.json" <<'EOF'
[
  { "name": "24-20260920", "images": [ { "architecture": "amd64", "digest": "sha256:5555555555555555555555555555555555555555555555555555555555555555" } ] }
]
EOF

OUT=$(run "$DIR" "$T/tags-digest.json" --write)
check "reports the digest move"     "stale:   true" "$OUT"
check "rewrites the digest in place" "FROM cloudron/node-base:24-20260920@sha256:555555" "$(cat "$DIR/container/Dockerfile")"

# --- case 7: the newest tag is on a later page ------------------------------
# fetchTags walks `next` until it is null; a single-page fixture never exercises
# that loop, and it decides which tags the scheduled run ever sees
DIR="$T/paged"
make_tree "$DIR"
cat > "$T/tags-paged.json" <<'EOF'
{
  "pages": [
    [
      { "name": "24-20260901", "images": [ { "architecture": "amd64", "digest": "sha256:6666666666666666666666666666666666666666666666666666666666666666" } ] }
    ],
    [
      { "name": "24-20261029", "images": [ { "architecture": "amd64", "digest": "sha256:7777777777777777777777777777777777777777777777777777777777777777" } ] }
    ]
  ]
}
EOF

OUT=$(run "$DIR" "$T/tags-paged.json" --write)
check "reads past the first page"   "newest:  24-20261029" "$OUT"
check "writes the later-page tag"   "FROM cloudron/node-base:24-20261029@sha256:777777" "$(cat "$DIR/container/Dockerfile")"

# --- case 8: --tag may not move the pin backwards ---------------------------
DIR="$T/backwards"
make_tree "$DIR"
cat > "$T/tags-older.json" <<'EOF'
[
  { "name": "24-20260901", "images": [ { "architecture": "amd64", "digest": "sha256:8888888888888888888888888888888888888888888888888888888888888888" } ] },
  { "name": "24-20260920", "images": [ { "architecture": "amd64", "digest": "sha256:d984683ec59bf2379130bf41cf3c2b6bc0453f327297d7183525cb05424e7b34" } ] }
]
EOF

OUT=$(run "$DIR" "$T/tags-older.json" --write --tag 24-20260901); CODE=$?
check "refuses to move the pin backwards" "older than the pinned" "$OUT"
check "backwards bump exits non-zero"     "1" "$CODE"
check_absent "backwards pin not written"  "24-20260901" "$(cat "$DIR/container/Dockerfile")"

# --- case 9: a comment after the FROM line ----------------------------------
DIR="$T/commented"
make_tree "$DIR"
sed -i 's|^FROM cloudron/node-base:24-20260920@sha256:d984683ec59bf2379130bf41cf3c2b6bc0453f327297d7183525cb05424e7b34$|& # keep an eye on this|' "$DIR/container/Dockerfile"

OUT=$(run "$DIR" "$T/tags-newer.json" --write)
check "reads a pin with a trailing comment" "newest:  24-20261026" "$OUT"
check "rewrites it anyway"                  "FROM cloudron/node-base:24-20261026@sha256:111111" "$(cat "$DIR/container/Dockerfile")"

echo
if [[ $FAIL -ne 0 ]]; then
  echo "SOME TESTS FAILED"
  exit 1
fi

echo "ALL TESTS PASSED"
