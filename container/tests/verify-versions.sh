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
# The changelog is mutated by the --notes cases below, so it is backed up too.
C_BACKUP=$(mktemp)
cp CHANGELOG "$C_BACKUP"

pass=0; fail=0
check() { # check <label> <expected-rc> <actual-rc>
  if [ "$2" = "$3" ]; then echo "PASS  $1"; pass=$((pass+1));
  else echo "FAIL  $1 (expected rc=$2, got rc=$3)"; fail=$((fail+1)); fi
}
restore() {
  cp "$M_BACKUP" CloudronManifest.json
  cp "$C_BACKUP" CHANGELOG
  if [ "$HAD_CV" = 1 ]; then cp "$CV_BACKUP" CloudronVersions.json
  else rm -f CloudronVersions.json; fi
  rm -f "$M_BACKUP" "$CV_BACKUP" "$C_BACKUP"
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
# A negative test has to fail for the reason it names. The changelog guard
# sits after the semver rule, so a lower version is refused for being lower
# rather than for having no notes section.
case "$OUT" in
  *"lower than published"*) echo "PASS  the refusal names the ordering"; pass=$((pass+1));;
  *) echo "FAIL  the refusal does not name the ordering"; fail=$((fail+1));;
esac
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
echo "--- 9. a version with no CHANGELOG section must be refused"
# The catalogue embeds the changelog as the release notes an operator reads in
# the dashboard, so recording a version without its section publishes the
# previous release's notes - which is what every entry from 1.3.5 to 1.8.0 did.
python3 - <<'PY'
import json
m = json.load(open('CloudronManifest.json'))
m['version'] = '9.9.9'          # deliberately absent from CHANGELOG
json.dump(m, open('CloudronManifest.json','w'), indent=2)
PY
rm -f CloudronVersions.json
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "refuse a version with no changelog section" 1 $RC
echo "      $OUT"
case "$OUT" in
  *"has no '## 9.9.9' section"*) echo "PASS  the refusal names the missing section"; pass=$((pass+1));;
  *) echo "FAIL  the refusal does not name the missing section"; fail=$((fail+1));;
esac

echo
echo "--- 9b. --check reports the same gap"
OUT=$(python3 scripts/update-versions.py --check 2>&1); RC=$?
check "--check fails without the section" 1 $RC
echo "      $OUT"
case "$OUT" in
  *"no '## 9.9.9' section"*) echo "PASS  --check names it"; pass=$((pass+1));;
  *) echo "FAIL  --check does not name it"; fail=$((fail+1));;
esac

echo
echo "--- 9c. --notes adds the section from the release body"
# The release body opens with its own version heading; the section heading is
# written by the script, so a copied-in second one would read as a duplicate.
cat > /tmp/notes-9.9.9.md <<'NOTES'
## [9.9.9](https://example.invalid/9.9.9) (2026-01-01)

### Features

* a thing that shipped
NOTES
OUT=$(python3 scripts/update-versions.py --notes /tmp/notes-9.9.9.md 2>&1); RC=$?
check "--notes adds the section" 0 $RC
echo "      $OUT"
if grep -q '^## 9.9.9$' CHANGELOG; then
  echo "PASS  the section is in CHANGELOG"; pass=$((pass+1))
else
  echo "FAIL  no section written"; fail=$((fail+1))
fi
if grep -q 'example.invalid' CHANGELOG; then
  echo "FAIL  the release heading was copied into the section"; fail=$((fail+1))
else
  echo "PASS  the release heading was dropped"; pass=$((pass+1))
fi

echo
echo "--- 9d. --notes is idempotent, and the version then records"
OUT=$(python3 scripts/update-versions.py --notes /tmp/notes-9.9.9.md 2>&1); RC=$?
check "second --notes is a no-op" 0 $RC
echo "      $OUT"
case "$OUT" in
  *"already has"*) echo "PASS  reported as already present"; pass=$((pass+1));;
  *) echo "FAIL  not reported as already present"; fail=$((fail+1));;
esac
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "record after --notes" 0 $RC
echo "      $OUT"
cp "$M_BACKUP" CloudronManifest.json
rm -f /tmp/notes-9.9.9.md

echo
echo "--- 10. the recorded notes are this version's own"
# The dashboard renders the embedded changelog as the release notes for the
# version being installed, so an entry carrying the whole file reads as the
# app's entire history - which is what every entry published before this did.
# The catalogue holds only 9.9.9 at this point, so start clean and record the
# manifest version: that is the entry an operator would be reading.
rm -f CloudronVersions.json
OUT=$(python3 scripts/update-versions.py --image "$IMG_A" 2>&1); RC=$?
check "record the manifest version" 0 $RC
echo "      $OUT"
python3 - <<'PY'
import json, re, sys
v = json.load(open('CloudronManifest.json'))['version']
notes = json.load(open('CloudronVersions.json'))['versions'][v]['manifest']['changelog']
text = open('CHANGELOG').read()
headings = re.findall(r'^##\s+v?(\d+\.\d+\.\d+)\s*$', text, re.M)
problems = []
# The premise: an older release's notes must exist for the leak to be possible.
if len(headings) < 2:
    problems.append('CHANGELOG carries fewer than two sections, so this proves nothing')
# Shape, independent of how the section is extracted: a version heading in the
# notes means the file went in whole.
if re.search(r'^##\s+v?\d+\.\d+\.\d+\s*$', notes, re.M):
    problems.append('the notes carry a version heading, so the whole file is embedded')
# And the notes must BE this version's section, heading dropped. An extraction
# that stopped at the next `##` of any kind would truncate at the release
# notes' own `## Verifying the download` subsection, which this catches.
parts = re.split(r'^##\s+v?(\d+\.\d+\.\d+)\s*$', text, flags=re.M)
want = next((parts[i + 1].strip() for i in range(1, len(parts), 2)
             if parts[i] == v), None)
if want is None:
    problems.append(f'CHANGELOG has no section for {v}, so the fixture is wrong')
elif notes != want:
    problems.append('the notes are not the section for this version')
print(f"      {len(notes)} bytes of notes for {v}; {len(headings)} sections in CHANGELOG")
for p in problems:
    print("      -", p)
sys.exit(1 if problems else 0)
PY
check "the notes are this version's section" 0 $?

echo
echo "--- 10b. a whole-file entry is caught by --check"
# Negative self-test: stage the defect the guard exists for and watch it fire.
python3 - <<'PY'
import json
v = json.load(open('CloudronManifest.json'))['version']
c = json.load(open('CloudronVersions.json'))
c['versions'][v]['manifest']['changelog'] = open('CHANGELOG').read()
json.dump(c, open('CloudronVersions.json', 'w'), indent=2)
PY
OUT=$(python3 scripts/update-versions.py --check 2>&1); RC=$?
check "--check refuses a whole-file entry" 1 $RC
echo "      $OUT"
case "$OUT" in
  *"run --refresh-notes"*) echo "PASS  the refusal names the repair"; pass=$((pass+1));;
  *) echo "FAIL  the refusal does not name the repair"; fail=$((fail+1));;
esac

echo
echo "--- 10c. --refresh-notes repairs it without moving the artifact"
python3 - <<'PY' > /tmp/entry-before.txt
import json
v = json.load(open('CloudronManifest.json'))['version']
e = json.load(open('CloudronVersions.json'))['versions'][v]
print(e['manifest']['dockerImage'])
print(json.dumps({k: e[k] for k in ('creationDate', 'ts', 'publishState')}, sort_keys=True))
PY
OUT=$(python3 scripts/update-versions.py --refresh-notes 2>&1); RC=$?
check "--refresh-notes" 0 $RC
echo "      $OUT"
case "$OUT" in
  *"re-scoped"*) echo "PASS  the rewrite is announced"; pass=$((pass+1));;
  *) echo "FAIL  the rewrite was not announced"; fail=$((fail+1));;
esac
python3 - <<'PY' > /tmp/entry-after.txt
import json
v = json.load(open('CloudronManifest.json'))['version']
e = json.load(open('CloudronVersions.json'))['versions'][v]
print(e['manifest']['dockerImage'])
print(json.dumps({k: e[k] for k in ('creationDate', 'ts', 'publishState')}, sort_keys=True))
PY
if diff -q /tmp/entry-before.txt /tmp/entry-after.txt > /dev/null; then
  echo "PASS  the image and the dates are untouched"; pass=$((pass+1))
else
  echo "FAIL  --refresh-notes moved the artifact"; fail=$((fail+1))
  diff /tmp/entry-before.txt /tmp/entry-after.txt
fi
python3 scripts/update-versions.py --check > /dev/null 2>&1
check "--check after --refresh-notes" 0 $?

echo
echo "--- 10d. --refresh-notes is idempotent"
OUT=$(python3 scripts/update-versions.py --refresh-notes 2>&1); RC=$?
check "second --refresh-notes" 0 $RC
echo "      $OUT"
case "$OUT" in
  *"nothing to do"*) echo "PASS  reported as a no-op"; pass=$((pass+1));;
  *) echo "FAIL  not reported as a no-op"; fail=$((fail+1));;
esac

echo
echo "--- 10e. --refresh-notes refuses a recorded version with no section"
# 1.14.0 was recorded by scenario 10; its section is then removed, so the
# premise (recorded version, no section) is asserted before the refusal.
python3 - <<'PY'
import json, re, sys
v = json.load(open('CloudronManifest.json'))['version']
parts = re.split(r'(^##\s+v?\d+\.\d+\.\d+\s*$)', open('CHANGELOG').read(), flags=re.M)
for i, part in enumerate(parts):
    if part.strip() == f'## {v}':
        parts[i] = ''
        parts[i + 1] = ''
open('CHANGELOG', 'w').write(''.join(parts))
recorded = v in json.load(open('CloudronVersions.json'))['versions']
stripped = not re.search(rf'^##\s+v?{re.escape(v)}\s*$', open('CHANGELOG').read(), re.M)
sys.exit(0 if (recorded and stripped) else 1)
PY
check "the premise: the version is recorded, its section gone" 0 $?
OUT=$(python3 scripts/update-versions.py --refresh-notes 2>&1); RC=$?
check "--refresh-notes refuses it" 1 $RC
echo "      $OUT"
V=$(python3 -c 'import json; print(json.load(open("CloudronManifest.json"))["version"])')
case "$OUT" in
  *"no section for $V"*) echo "PASS  the refusal names the version"; pass=$((pass+1));;
  *) echo "FAIL  the refusal does not name the version"; fail=$((fail+1));;
esac

echo
echo "PASSED: $pass   FAILED: $fail"
[ "$fail" -eq 0 ]
