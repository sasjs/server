#!/bin/bash
# Guard the guard: scripts/check-manifest.py must pass on the real manifest and
# must actually reject the cross-field violation Cloudron's loader reports.
#
# Cloudron's JSON schema accepts packageUrl at any minBoxVersion, so a
# schema-only check would pass a manifest that the dashboard then refuses to
# load with "manifest.packageUrl requires minBoxVersion of atleast 10.0.0".
#
# Usage: tests/verify-manifest.sh
set -u
cd "$(dirname "$0")/../cloudron" || exit 1

BACKUP=$(mktemp)
cp CloudronManifest.json "$BACKUP"
restore() { cp "$BACKUP" CloudronManifest.json; rm -f "$BACKUP"; }
trap restore EXIT
# The backup must exist and be non-empty before anything mutates the
# manifest, else the trap would restore a zero-byte file over it.
[[ -s "$BACKUP" ]] || { echo "FAIL: could not back up CloudronManifest.json" >&2; exit 1; }

pass=0; fail=0
check() {
  if [ "$2" = "$3" ]; then echo "PASS  $1"; pass=$((pass+1));
  else echo "FAIL  $1 (expected rc=$2, got rc=$3)"; fail=$((fail+1)); fi
}

SCHEMA_ARG=""
if [ -f /tmp/cloudron-manifest.schema.json ]; then
  SCHEMA_ARG="--schema /tmp/cloudron-manifest.schema.json"
fi

echo "--- 1. the committed manifest is loadable"
OUT=$(python3 scripts/check-manifest.py $SCHEMA_ARG 2>&1); RC=$?
check "committed manifest passes" 0 $RC
echo "      $OUT"

echo
echo "--- 2. a minBoxVersion below a gated field's requirement is rejected"
# packageUrl requires >= 10.0.0. Reproduce exactly what the dashboard refused.
python3 - <<'PY'
import json
m = json.load(open('CloudronManifest.json'))
m['minBoxVersion'] = '9.1.0'
json.dump(m, open('CloudronManifest.json', 'w'), indent=2)
PY
OUT=$(python3 scripts/check-manifest.py $SCHEMA_ARG 2>&1); RC=$?
check "low minBoxVersion is rejected" 1 $RC
echo "      $OUT"
case "$OUT" in
  *"packageUrl requires minBoxVersion >= 10.0.0"*)
    echo "PASS  names packageUrl and the required version"; pass=$((pass+1));;
  *) echo "FAIL  did not name the packageUrl requirement"; fail=$((fail+1));;
esac
cp "$BACKUP" CloudronManifest.json

echo
echo "--- 3. targetBoxVersion must exceed minBoxVersion"
python3 - <<'PY'
import json
m = json.load(open('CloudronManifest.json'))
m['targetBoxVersion'] = m['minBoxVersion']
json.dump(m, open('CloudronManifest.json', 'w'), indent=2)
PY
OUT=$(python3 scripts/check-manifest.py $SCHEMA_ARG 2>&1); RC=$?
check "targetBoxVersion == minBoxVersion is rejected" 1 $RC
echo "      $OUT"
cp "$BACKUP" CloudronManifest.json

echo
echo "--- 4. the manifest is restored"
python3 scripts/check-manifest.py $SCHEMA_ARG > /dev/null 2>&1
check "manifest restored and passing" 0 $?

echo
echo "PASSED: $pass   FAILED: $fail"
[ "$fail" -eq 0 ]
