#!/usr/bin/env python3
"""Create or update CloudronVersions.json for this package.

CloudronVersions.json is the version catalogue a Cloudron dashboard reads to
offer installs and updates for a community app. Each entry embeds the full
CloudronManifest.json for that release, with any `file://` references resolved
to inline content, plus the registry image that version was built into.

Cloudron's docs recommend generating this with `cloudron versions add`. That
needs the Cloudron CLI and a logged-in workstation, so the release pipeline
builds it here instead - deterministically, and validated against the
publishing requirements in the docs.

Usage:
    update-versions.py --image <registry-image>       # add/refresh a version
    update-versions.py --check                        # verify the file matches
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "CloudronManifest.json")
VERSIONS = os.path.join(ROOT, "CloudronVersions.json")

# Fields the docs require in the embedded manifest for publishing. `iconUrl`,
# `packagerName` and `packagerUrl` are not needed for a local install, which is
# why they are easy to forget until the store rejects the entry.
REQUIRED_PUBLISH_FIELDS = [
    "id", "title", "description", "tagline", "website", "tags", "changelog",
    "mediaLinks", "healthCheckPath", "iconUrl", "packagerName", "packagerUrl",
    "dockerImage",
]

FILE_REF = re.compile(r"^file://(.+)$")

# Only these carry text that gets inlined. `icon` is also a `file://`
# reference, but it is a binary asset that stays a reference in the published
# catalogue - Cloudron reads it from the package, alongside `iconUrl`.
INLINE_FIELDS = ("description", "changelog", "postInstallMessage")


def load_manifest():
    with open(MANIFEST) as f:
        return json.load(f)


def inline_file_refs(manifest):
    """Resolve `file://X` text fields to their contents, as `cloudron versions
    add` does - the published catalogue carries inline text, not references."""
    out = dict(manifest)
    for key in INLINE_FIELDS:
        value = out.get(key)
        if isinstance(value, str):
            m = FILE_REF.match(value)
            if m:
                path = os.path.join(ROOT, m.group(1))
                if not os.path.exists(path):
                    sys.exit(f"error: {key} references {m.group(1)}, which does not exist")
                with open(path) as f:
                    out[key] = f.read()
    return out


def semver(v):
    return tuple(int(p) for p in v.split("-")[0].split("."))


def validate_publishable(manifest):
    problems = []
    for field in REQUIRED_PUBLISH_FIELDS:
        if field not in manifest:
            problems.append(f"missing required publish field: {field}")
    if not manifest.get("mediaLinks"):
        problems.append("mediaLinks must be non-empty to publish")
    for field in ("description", "changelog", "postInstallMessage"):
        value = manifest.get(field)
        if isinstance(value, str) and FILE_REF.match(value):
            problems.append(f"{field} is still a file:// reference; it must be inlined")
    if not manifest.get("healthCheckPath"):
        problems.append("healthCheckPath is required")
    return problems


def load_versions():
    if os.path.exists(VERSIONS):
        with open(VERSIONS) as f:
            return json.load(f)
    return {"stable": True, "versions": {}}


def cmd_add(image):
    manifest = load_manifest()
    version = manifest.get("version")
    if not version:
        sys.exit("error: CloudronManifest.json has no version")

    embedded = inline_file_refs(manifest)
    embedded["dockerImage"] = image

    problems = validate_publishable(embedded)
    if problems:
        sys.exit("error: manifest is not publishable:\n  - " + "\n  - ".join(problems))

    catalog = load_versions()
    versions = catalog.setdefault("versions", {})

    # Semver must move forward: Cloudron decides whether an update exists by
    # comparing version strings, so re-using or lowering one strands installs.
    for existing in versions:
        if semver(version) < semver(existing):
            sys.exit(f"error: version {version} is lower than published {existing}")

    now = datetime.now(timezone.utc)
    stamp_ms = int(now.timestamp() * 1000)
    iso = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"

    if version in versions:
        # The entry is refreshed when anything differs, not just the image. A
        # manifest-only fix - a corrected minBoxVersion, say - leaves the image
        # digest unchanged, and if the guard keyed on the digest alone the
        # catalogue would keep serving the stale embedded manifest and installs
        # would keep failing on a manifest that no longer exists in the repo.
        previous = versions[version]
        if previous.get("manifest") == embedded:
            print(f"{version} is already recorded and unchanged; nothing to do")
            return
        print(f"note: refreshing the recorded entry for {version}")
        previous["manifest"] = embedded
        previous["ts"] = stamp_ms
    else:
        versions[version] = {
            "manifest": embedded,
            "creationDate": iso,
            "ts": stamp_ms,
            "publishState": "published",
        }

    catalog["stable"] = True
    with open(VERSIONS, "w") as f:
        json.dump(catalog, f, indent=2, sort_keys=True)
        f.write("\n")

    print(f"recorded {version} -> {image}")
    print(f"wrote {os.path.relpath(VERSIONS, ROOT)} "
          f"({len(versions)} version(s): {', '.join(sorted(versions))})")


def cmd_check():
    manifest = load_manifest()
    version = manifest.get("version")

    if not os.path.exists(VERSIONS):
        # Nothing is wrong: no release has been cut yet, so there is no
        # catalogue to be out of sync with. The release workflow creates it.
        print(f"no CloudronVersions.json yet (manifest version {version}); "
              "it is created by the release workflow")
        return 0

    catalog = load_versions()
    versions = catalog.get("versions") or {}

    problems = []
    if not versions:
        problems.append("CloudronVersions.json has no versions")

    # Every recorded entry must be publishable and self-consistent. Checked for
    # all of them, not just the current manifest version, so a hand-edited
    # historical entry cannot rot unnoticed.
    for key, entry in sorted(versions.items()):
        embedded = entry.get("manifest") or {}
        problems.extend(f"{key}: {p}" for p in validate_publishable(embedded))
        if embedded.get("version") != key:
            problems.append(
                f"{key}: embedded manifest version ({embedded.get('version')}) "
                "does not match its catalogue key"
            )
        for field in ("creationDate", "ts", "publishState"):
            if field not in entry:
                problems.append(f"{key}: version entry is missing {field}")

    # The manifest's version is only expected in the catalogue once it has been
    # released. Bumping the manifest is the first step of a release, and the
    # digest cannot be known until the image is built - which the release
    # workflow does, and which then writes the entry. Failing here would make
    # the release workflow's own pre-flight check impossible to satisfy.
    pending = version not in versions

    if problems:
        print("CloudronVersions.json is not in a publishable state:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    if pending:
        print(f"CloudronVersions.json is publishable; no entry for {version} yet, "
              f"which the release workflow adds (recorded: "
              f"{', '.join(sorted(versions)) or 'none'})")
    else:
        print(f"CloudronVersions.json is publishable and in sync with manifest {version}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--image", help="registry image reference for this version")
    ap.add_argument("--check", action="store_true",
                    help="verify CloudronVersions.json is publishable and in sync")
    args = ap.parse_args()

    if args.check:
        sys.exit(cmd_check())
    if not args.image:
        ap.error("--image is required unless --check is given")
    cmd_add(args.image)


if __name__ == "__main__":
    main()
