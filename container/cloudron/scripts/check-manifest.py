#!/usr/bin/env python3
"""Validate CloudronManifest.json beyond what the JSON schema's structure covers.

Cloudron's published JSON schema checks the manifest's shape, not the
cross-field rules its loader enforces at install time. `packageUrl` is the one
that bit us: schema-valid at any minBoxVersion, but the loader rejects the
manifest with

    Invalid manifest: manifest.packageUrl requires minBoxVersion of atleast 10.0.0

Those rules are stated in the schema's own field descriptions
("Requires minBoxVersion >= X"), which is the authoritative source, so they are
parsed from the schema when one is supplied. A small built-in table covers the
fields we know about when running offline.

Usage:
    check-manifest.py [--schema PATH]     # PATH fetched from Cloudron's docs
"""

import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "CloudronManifest.json")

# Fallback for when no schema is available. Kept in sync with the schema's
# descriptions; the schema wins when both are present.
FALLBACK_REQUIREMENTS = {
    "backupCommand": "9.1.0",
    "iconUrl": "9.1.0",
    "packageUrl": "10.0.0",
    "packagerName": "9.1.0",
    "packagerUrl": "9.1.0",
    "persistentDirs": "9.1.0",
    "restoreCommand": "9.1.0",
}

REQUIREMENT_RE = re.compile(r"Requires minBoxVersion\s*>=\s*([0-9]+\.[0-9]+\.[0-9]+)")


def semver(v):
    return tuple(int(p) for p in v.split("-")[0].split("."))


def requirements_from_schema(schema):
    """Pull "Requires minBoxVersion >= X" out of each property's description."""
    found = {}
    for field, spec in (schema.get("properties") or {}).items():
        desc = spec.get("description") or ""
        m = REQUIREMENT_RE.search(desc)
        if m:
            found[field] = m.group(1)
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--schema", help="Cloudron JSON schema to validate against")
    args = ap.parse_args()

    with open(MANIFEST) as f:
        manifest = json.load(f)

    problems = []
    requirements = dict(FALLBACK_REQUIREMENTS)
    source = "built-in table"

    if args.schema:
        if not os.path.exists(args.schema):
            problems.append(f"schema file {args.schema} not found")
        else:
            try:
                import jsonschema
            except ImportError:
                # Not fatal: the cross-field rules below are the part Cloudron's
                # loader enforces and the schema does not express, and they need
                # no third-party package. CI installs jsonschema first.
                print("warning: jsonschema is not installed; skipping the "
                      "structural schema check", file=sys.stderr)
                jsonschema = None
            schema = json.load(open(args.schema))
            from_schema = requirements_from_schema(schema)
            if from_schema:
                requirements = from_schema
                source = "the Cloudron schema's own descriptions"
            if jsonschema is not None:
                try:
                    jsonschema.validate(manifest, schema)
                except jsonschema.ValidationError as e:
                    problems.append(f"schema validation failed: {e.message}")

    # Documented default when unset, so the rules still apply.
    min_box = manifest.get("minBoxVersion") or "0.0.1"

    # A field's requirement applies when the field is present.
    for field, required in sorted(requirements.items()):
        if field in manifest and semver(min_box) < semver(required):
            problems.append(
                f"{field} requires minBoxVersion >= {required}, "
                f"but minBoxVersion is {min_box}"
            )

    # The docs: targetBoxVersion "has to be greater than the minBoxVersion".
    target = manifest.get("targetBoxVersion")
    if target and semver(target) <= semver(min_box):
        problems.append(
            f"targetBoxVersion ({target}) must be greater than "
            f"minBoxVersion ({min_box})"
        )

    if problems:
        print("CloudronManifest.json would not load:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    gated = sorted(f for f in requirements if f in manifest)
    print(f"CloudronManifest.json is loadable: minBoxVersion {min_box} satisfies "
          f"{len(gated)} gated field(s) present ({', '.join(gated) or 'none'}); "
          f"requirements read from {source}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
