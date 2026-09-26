#!/bin/bash
# Exercise scripts/update-versions.py end to end, including the failure paths.
#
# The tests mutate CloudronManifest.json and CloudronVersions.json, so both are
# backed up up front and restored on exit. Never `git checkout` them here: the
# working tree can hold uncommitted edits and checking out would discard them.
#
# Usage: tests/verify-versions.sh
set -u
cd "$(dirname "$0")/../cloudron" || exit 1

IMG_A="ghcr.io/sasjs/server@sha256:aaaa000000000000000000000000000000000000000000000000000000000001"
IMG_B="ghcr.io/sasjs/server@sha256:bbbb000000000000000000000000000000000000000000000000000000000002"

M_BACKUP=$(mktemp)
cp CloudronManifest.json "$M_BACKUP"
CV_BACKUP=$(mktemp)
HAD_CV=0
if [ -f CloudronVersions.json ]; then cp CloudronVersions.json "$CV_BACKUP"; HAD_CV=1; fi

pass=0; fail=0
check() { # check <label> <expected-rc> <actual-rc>
  if [ "$2" = "$3" ]; then echo "PASS  $1"; pass=$((pass+1));
  else echo "FAIL  $1 (expected rc=$2, got rc=$3)"; fail=$((fail+1)); fi
}
restore() {
  cp "$M_BACKUP" CloudronManifest.json
  if [ "$HAD_CV" = 1 ]; then cp "$CV_BACKUP" CloudronVersions.json
  else rm -f CloudronVersions.json; fi
  rm -f "$M_BACKUP" "$CV_BACKUP"
}
trap restore EXIT

echo "--- 1. no catalogue yet: --check should pass with a note"
rm -f CloudronVersions.json
OUT=$(python3 scripts/update-versions.py --check 2>&1); RC=$?
check "--check with no file" 0 $RC
echo "      $OUT"

echo
echo "--- 2. generate"
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "add version" 0 $RC
echo "      $OUT"

echo
echo "--- 3. --check after generating"
python3 scripts/update-versions.py --check > /dev/null 2>&1
check "--check after add" 0 $?

echo
echo "--- 4. idempotent: same image again"
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "re-add same image" 0 $RC
echo "      $OUT"

echo
echo "--- 5. replacing the image for a published version is allowed but announced"
OUT=$(python3 scripts/update-versions.py --image "$IMG_B" 2>&1); RC=$?
check "replace image" 0 $RC
echo "      $OUT"

echo
echo "--- 5b. a manifest-only change must reach the catalogue"
# The image is unchanged here, so a guard keyed on the image digest alone would
# skip the write and leave the catalogue serving a stale embedded manifest -
# which is exactly how a corrected minBoxVersion would fail to reach installs.
python3 - <<'PY'
import json
m = json.load(open('CloudronManifest.json'))
# Must differ from the committed value, or this tests nothing.
m['minBoxVersion'] = '10.1.0'
json.dump(m, open('CloudronManifest.json', 'w'), indent=2)
PY
OUT=$(python3 scripts/update-versions.py --image "$IMG_B" 2>&1); RC=$?
check "manifest-only change is written" 0 $RC
echo "      $OUT"
case "$OUT" in
  *refreshing*) echo "PASS  the change is announced"; pass=$((pass+1));;
  *) echo "FAIL  the change was not announced"; fail=$((fail+1));;
esac
OUT=$(python3 - <<'PY'
import json, sys
c = json.load(open('CloudronVersions.json'))
m = json.load(open('CloudronManifest.json'))
got = c['versions'][m['version']]['manifest'].get('minBoxVersion')
print(f"catalogue embeds minBoxVersion {got}")
sys.exit(0 if got == '10.1.0' else 1)
PY
); RC=$?
check "catalogue embeds the new minBoxVersion" 0 $RC
echo "      $OUT"

echo
echo "--- 5c. unchanged manifest and image is a genuine no-op"
OUT=$(python3 scripts/update-versions.py --image "$IMG_B" 2>&1); RC=$?
check "no-op re-add" 0 $RC
case "$OUT" in
  *"nothing to do"*) echo "PASS  reported as a no-op"; pass=$((pass+1));;
  *) echo "FAIL  not reported as a no-op"; fail=$((fail+1));;
esac
cp "$M_BACKUP" CloudronManifest.json

echo
echo "--- 6. a lower version must be refused"
python3 - <<'PY'
import json
m = json.load(open('CloudronManifest.json'))
m['version'] = '0.1.0'
json.dump(m, open('CloudronManifest.json','w'), indent=2)
PY
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "refuse lower version" 1 $RC
echo "      $OUT"
cp "$M_BACKUP" CloudronManifest.json

echo
echo "--- 7. a missing publish field must be refused"
python3 - <<'PY'
import json
m = json.load(open('CloudronManifest.json'))
m.pop('mediaLinks', None)
json.dump(m, open('CloudronManifest.json','w'), indent=2)
PY
rm -f CloudronVersions.json
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "refuse empty/missing mediaLinks" 1 $RC
echo "      $OUT"
cp "$M_BACKUP" CloudronManifest.json

echo
echo "--- 8. the committed catalogue (if any) is publishable and in sync"
if [ "$HAD_CV" = 1 ]; then
  cp "$CV_BACKUP" CloudronVersions.json
  OUT=$(python3 scripts/update-versions.py --check 2>&1); RC=$?
  check "committed catalogue is in sync" 0 $RC
  echo "      $OUT"
else
  rm -f CloudronVersions.json
  echo "      (no committed catalogue in this checkout; skipped)"
fi

echo
echo "PASSED: $pass   FAILED: $fail"
[ "$fail" -eq 0 ]
