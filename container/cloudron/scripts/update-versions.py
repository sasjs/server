#!/usr/bin/env python3
"""Create or update CloudronVersions.json for this package.

CloudronVersions.json is the version catalogue a Cloudron dashboard reads to
offer installs and updates for a community app. Each entry embeds the full
CloudronManifest.json for that release, with any `file://` references resolved
to inline content - the changelog to the section for that version, the rest to
the whole file - plus the registry image that version was built into.

Cloudron's docs recommend generating this with `cloudron versions add`. That
needs the Cloudron CLI and a logged-in workstation, so the release pipeline
builds it here instead - deterministically, and validated against the
publishing requirements in the docs.

Usage:
    update-versions.py --image <registry-image>       # add/refresh a version
    update-versions.py --notes <file>                 # add the version's
                                                      # CHANGELOG section
    update-versions.py --refresh-notes                # re-scope every recorded
                                                      # entry's release notes
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
CHANGELOG = os.path.join(ROOT, "CHANGELOG")

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

# A CHANGELOG section heading. Anchored and strict on purpose: the release
# notes carry their own `## Verifying the download` subsection, so "the next
# `##`" is not where a version's section ends - only the next version heading
# is. A `v` prefix is tolerated (`## v1.4.0`) but not required.
VERSION_HEADING = re.compile(r"^##\s+v?(\d+\.\d+\.\d+)\s*$", re.M)


def load_manifest():
    with open(MANIFEST) as f:
        return json.load(f)


def inline_file_refs(manifest):
    """Resolve `file://X` text fields to their contents, as `cloudron versions
    add` does - the published catalogue carries inline text, not references.

    The changelog is resolved differently: the CLI extracts the section for the
    manifest's version instead of copying the whole file, and so does this. The
    dashboard shows the embedded string as the release notes in its update
    dialog, so embedding the file makes every entry read as the app's entire
    history - which is what every entry from 1.3.1 onwards did.
    """
    out = dict(manifest)
    version = out.get("version")
    for key in INLINE_FIELDS:
        value = out.get(key)
        if not isinstance(value, str):
            continue
        m = FILE_REF.match(value)
        if not m:
            continue
        path = os.path.join(ROOT, m.group(1))
        if not os.path.exists(path):
            sys.exit(f"error: {key} references {m.group(1)}, which does not exist")
        if key == "changelog":
            section = changelog_section(version, path)
            if section is None:
                sys.exit(
                    f"error: {os.path.relpath(path, ROOT)} has no '## {version}' "
                    f"section, so {version} has no release notes to publish.\n"
                    f"  The release workflow passes --notes with the release body, "
                    f"which adds it; a hand-run needs the section written first."
                )
            out[key] = section
        else:
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
    # An empty changelog publishes an entry with no release notes at all, which
    # is the same defect as notes for the wrong version: nothing describes what
    # the operator is about to install.
    if not manifest.get("changelog"):
        problems.append("changelog is empty; the entry would publish no release notes")
    if not manifest.get("healthCheckPath"):
        problems.append("healthCheckPath is required")
    return problems


def load_versions():
    if os.path.exists(VERSIONS):
        with open(VERSIONS) as f:
            return json.load(f)
    return {"stable": True, "versions": {}}


def changelog_sections():
    """The version numbers CHANGELOG carries a `## <version>` section for.

    A version recorded without its section publishes whatever the previous
    release wrote, which is how every entry from 1.3.5 to 1.8.0 came to show
    the 1.3.4 notes.
    """
    if not os.path.exists(CHANGELOG):
        return set()
    with open(CHANGELOG) as f:
        return {m.group(1) for m in VERSION_HEADING.finditer(f.read())}


def changelog_section(version, path=CHANGELOG):
    """The body of the `## <version>` section of `path`, or None if there is none.

    This is the release notes an operator reads in the dashboard's update
    dialog, so it must carry this release alone: the entry is embedded in the
    catalogue and the dialog renders it verbatim. The section ends at the next
    version heading - not at the next `##` of any kind, because the release
    notes carry their own `## Verifying the download` subsection. The heading
    itself is dropped, as `cloudron versions add` drops it.
    """
    if not os.path.exists(path):
        return None
    with open(path) as f:
        lines = f.read().splitlines()

    body = None
    for line in lines:
        m = VERSION_HEADING.match(line)
        if m:
            if body is not None:
                break
            if m.group(1) == version:
                body = []
            continue
        if body is not None:
            body.append(line)

    if body is None:
        return None
    return "\n".join(body).strip()


def prepend_changelog_entry(version, notes_path):
    """Put a `## <version>` section at the top of CHANGELOG, from `notes_path`.

    Idempotent: a version that already has a section is left alone, so the
    workflow can run this on every attempt. The release notes semantic-release
    publishes are used as the body - the maintainer cannot know the version in
    advance, so requiring a hand-written section would block the release.
    """
    if version in changelog_sections():
        print(f"{version} already has a CHANGELOG section; leaving it alone")
        return

    with open(notes_path) as f:
        notes = f.read().strip()

    lines = notes.splitlines()

    # The release body opens with its own heading naming the version and date
    # (`## [1.8.0](url) (2026-09-27)`). Drop it: the section heading below
    # carries the version, and a second one reads as a duplicated release.
    if lines and lines[0].lstrip().startswith("#"):
        lines = lines[1:]
        while lines and not lines[0].strip():
            lines.pop(0)

    body = "\n".join(lines).strip()
    if not body:
        sys.exit(f"error: the release notes for {version} are empty")

    existing = ""
    if os.path.exists(CHANGELOG):
        with open(CHANGELOG) as f:
            existing = f.read()

    with open(CHANGELOG, "w") as f:
        f.write(f"## {version}\n\n{body}\n\n{existing.lstrip()}")

    print(f"added a CHANGELOG section for {version} from {notes_path}")


def cmd_add(image):
    manifest = load_manifest()
    version = manifest.get("version")
    if not version:
        sys.exit("error: CloudronManifest.json has no version")

    catalog = load_versions()
    versions = catalog.setdefault("versions", {})

    # Semver must move forward: Cloudron decides whether an update exists by
    # comparing version strings, so re-using or lowering one strands installs.
    # Checked before the embedding, because embedding resolves the version's
    # CHANGELOG section - and a version that should never be recorded must be
    # refused for being lower, not for having no notes.
    for existing in versions:
        if semver(version) < semver(existing):
            sys.exit(f"error: version {version} is lower than published {existing}")

    # The catalogue embeds this version's changelog section, and the dashboard
    # shows it as the release notes for the version being installed. Recording
    # a version whose section is missing publishes the previous release's
    # notes, which is how entries 1.3.5 through 1.8.0 all came to read as
    # 1.3.4. inline_file_refs refuses it.
    embedded = inline_file_refs(manifest)
    embedded["dockerImage"] = image

    problems = validate_publishable(embedded)
    if problems:
        sys.exit("error: manifest is not publishable:\n  - " + "\n  - ".join(problems))

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
    print(f"recorded {version} -> {image}")
    write_catalog(catalog, versions)


def write_catalog(catalog, versions):
    catalog["stable"] = True
    with open(VERSIONS, "w") as f:
        json.dump(catalog, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"wrote {os.path.relpath(VERSIONS, ROOT)} "
          f"({len(versions)} version(s): {', '.join(sorted(versions))})")


def cmd_refresh_notes():
    """Re-scope every recorded entry's release notes to its own CHANGELOG section.

    A catalogue built while the whole file was embedded carries the app's
    entire history in every entry, so the dashboard's update dialog shows every
    previous release for whichever version is being installed. This rewrites
    the embedded changelog of each entry from the section for its version and
    leaves everything else - version, image, dates, publish state - untouched,
    so an install is never moved to a different artifact by it.
    """
    catalog = load_versions()
    versions = catalog.get("versions") or {}
    if not versions:
        sys.exit("error: CloudronVersions.json has no versions to refresh")

    missing = [key for key in versions if changelog_section(key) is None]
    if missing:
        sys.exit(
            f"error: {os.path.relpath(CHANGELOG, ROOT)} has no section for "
            f"{', '.join(sorted(missing))}, so their recorded notes cannot be "
            f"replaced. Write the sections first - the release workflow does it "
            f"with --notes."
        )

    changed = []
    for key, entry in versions.items():
        embedded = entry.get("manifest") or {}
        section = changelog_section(key)
        if embedded.get("changelog") == section:
            continue
        embedded["changelog"] = section
        entry["manifest"] = embedded
        changed.append(key)

    if not changed:
        print("every recorded entry already carries its own release notes; nothing to do")
        return

    write_catalog(catalog, versions)
    print(f"re-scoped the release notes for {len(changed)} version(s): "
          f"{', '.join(sorted(changed, key=semver))}")


def cmd_check():
    manifest = load_manifest()
    version = manifest.get("version")

    problems = []

    # The entry that is about to be written embeds the changelog as the release
    # notes an operator reads in the dashboard, so the section is required
    # whether or not a catalogue exists yet - the release workflow adds it from
    # the release body before this runs.
    if version and version not in changelog_sections():
        problems.append(
            f"CHANGELOG has no '## {version}' section, so {version} would be "
            "published with the previous release's notes"
        )

    if not os.path.exists(VERSIONS):
        # Otherwise nothing is wrong: no release has been cut yet, so there is
        # no catalogue to be out of sync with. The release workflow creates it.
        if problems:
            for p in problems:
                print(f"  - {p}", file=sys.stderr)
            return 1
        print(f"no CloudronVersions.json yet (manifest version {version}); "
              "it is created by the release workflow")
        return 0

    catalog = load_versions()
    versions = catalog.get("versions") or {}

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
        # The notes an operator reads must be this version's own. An entry that
        # carries the whole file reads as the app's entire history in the
        # dashboard's update dialog, which is what every entry published before
        # the notes were scoped does.
        section = changelog_section(key)
        if section is None:
            problems.append(
                f"{key}: CHANGELOG has no '## {key}' section, so the notes "
                "recorded for it cannot be checked against anything"
            )
        elif embedded.get("changelog") != section:
            problems.append(
                f"{key}: the recorded release notes are not the '## {key}' "
                "section - run --refresh-notes to rewrite them"
            )

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
    ap.add_argument("--notes", metavar="FILE",
                    help="release notes for the manifest version; adds its "
                         "CHANGELOG section if it has none")
    ap.add_argument("--refresh-notes", action="store_true",
                    help="rewrite every recorded entry's embedded changelog "
                         "from the CHANGELOG section for its version")
    ap.add_argument("--check", action="store_true",
                    help="verify CloudronVersions.json is publishable and in sync")
    args = ap.parse_args()

    if args.check:
        sys.exit(cmd_check())
    if args.refresh_notes:
        cmd_refresh_notes()
        return
    if args.notes:
        manifest = load_manifest()
        version = manifest.get("version")
        if not version:
            sys.exit("error: CloudronManifest.json has no version")
        prepend_changelog_entry(version, args.notes)
    if not args.image:
        if args.notes:
            sys.exit(0)
        ap.error("--image is required unless --check or --notes is given")
    cmd_add(args.image)


if __name__ == "__main__":
    main()
