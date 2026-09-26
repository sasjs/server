#!/usr/bin/env python3
"""Verify, anonymously, that a Cloudron box can resolve and pull this package.

Everything here uses unauthenticated requests, because that is exactly what a
Cloudron dashboard does when it reads a community-app catalogue: it fetches the
catalogue over plain HTTPS and pulls the recorded image with no credentials.
If any step needs a credential, the package is not actually installable and
this script fails.

Checks:
  1. the published catalogue is fetchable and well formed;
  2. the image it records is pullable anonymously, and the registry serves the
     digest the catalogue names (not merely some image with the right tag);
  3. the human tags resolve to that same digest;
  4. every URL the dashboard and store fetch - iconUrl, mediaLinks, website,
     documentationUrl - returns 200.

Run it after a release, or after changing repository or package visibility:

    python3 scripts/verify-installable.py

Exits non-zero if anything is unreachable, so it can gate a release.
"""

import json
import re
import sys
import urllib.error
import urllib.request

REPO = "sasjs/server"
BRANCH = "main"
CATALOGUE = f"https://raw.githubusercontent.com/{REPO}/{BRANCH}/container/cloudron/CloudronVersions.json"

# Registries disagree on the casing of this header, and a plain dict is
# case-sensitive, so header names are lower-cased on the way in.
MANIFEST_ACCEPT = ",".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])

DIGEST_RE = re.compile(r"^(?P<repo>[^@]+)@(?P<digest>sha256:[0-9a-f]{64})$")


def get(url, headers=None):
    req = urllib.request.Request(
        url, headers=headers or {"User-Agent": "cloudron-installable-check"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, resp.read(), {k.lower(): v for k, v in resp.headers.items()}


def main():
    failures = []

    print("1. fetch the published catalogue anonymously")
    try:
        status, body, _ = get(CATALOGUE)
    except urllib.error.HTTPError as e:
        print(f"   FAIL: HTTP {e.code} - the catalogue is not publicly fetchable")
        print(f"   {CATALOGUE}")
        return 1
    catalogue = json.loads(body)
    print(f"   HTTP {status}, {len(body)} bytes, stable={catalogue.get('stable')}, "
          f"versions={list(catalogue.get('versions', {}))}")
    if not catalogue.get("versions"):
        failures.append("the catalogue lists no versions")

    # `latest` can only point at one version, so only the newest entry is
    # checked against it. Asserting it for every version passes while there is
    # a single version and fails the moment a second one is published.
    versions = catalogue.get("versions", {})
    newest = max(
        versions,
        key=lambda v: tuple(int(p) for p in v.split("-")[0].split(".")),
    ) if versions else None

    for version, entry in sorted(versions.items()):
        manifest = entry["manifest"]
        image = manifest.get("dockerImage", "")
        print(f"\n2. version {version} - {manifest.get('title')} "
              f"(publishState={entry.get('publishState')})")
        print(f"   minBoxVersion={manifest.get('minBoxVersion')} "
              f"targetBoxVersion={manifest.get('targetBoxVersion')} "
              f"httpPort={manifest.get('httpPort')}")

        m = DIGEST_RE.match(image)
        if not m:
            failures.append(f"{version}: dockerImage is not pinned by digest: {image!r}")
            print(f"   FAIL: not pinned by digest: {image!r}")
            continue
        repo, digest = m.group("repo"), m.group("digest")
        registry, path = repo.split("/", 1)
        print(f"   dockerImage={image}")

        print(f"\n3. pull {path} anonymously from {registry}")
        try:
            _, body, _ = get(f"https://{registry}/token?service={registry}"
                             f"&scope=repository:{path}:pull")
            token = json.loads(body)["token"]
        except (urllib.error.HTTPError, KeyError) as e:
            failures.append(f"{version}: no anonymous pull token ({e})")
            print(f"   FAIL: no anonymous pull token ({e})")
            continue

        hdrs = {"Authorization": f"Bearer {token}",
                "Accept": MANIFEST_ACCEPT,
                "User-Agent": "cloudron-installable-check"}
        try:
            status, body, headers = get(
                f"https://{registry}/v2/{path}/manifests/{digest}", hdrs)
        except urllib.error.HTTPError as e:
            failures.append(f"{version}: manifest fetch failed with HTTP {e.code}")
            print(f"   FAIL: manifest fetch HTTP {e.code}")
            continue

        doc = json.loads(body)
        served = headers.get("docker-content-digest")
        print(f"   manifest HTTP {status} mediaType={doc.get('mediaType')}")
        print(f"   served digest {served}")
        if served == digest:
            print("   MATCHES the digest recorded in the catalogue")
        else:
            failures.append(f"{version}: registry served {served}, catalogue says {digest}")
            print("   FAIL: digest mismatch")

        # The version tag must resolve; `latest` only for the newest entry.
        for tag in [version] + (["latest"] if version == newest else []):
            try:
                _, _, h2 = get(f"https://{registry}/v2/{path}/manifests/{tag}", hdrs)
                d2 = h2.get("docker-content-digest")
                if d2 == digest:
                    print(f"   tag {tag} resolves to the same digest")
                else:
                    failures.append(f"{version}: tag {tag} is {d2}, not {digest}")
                    print(f"   FAIL: tag {tag} is {d2}")
            except urllib.error.HTTPError as e:
                failures.append(f"{version}: tag {tag} is not pullable (HTTP {e.code})")
                print(f"   FAIL: tag {tag} HTTP {e.code}")

        print("\n4. URLs the dashboard and store fetch")
        urls = [("iconUrl", manifest.get("iconUrl")),
                ("website", manifest.get("website")),
                ("documentationUrl", manifest.get("documentationUrl"))]
        urls += [("mediaLinks", u) for u in (manifest.get("mediaLinks") or [])]
        for label, url in urls:
            if not url:
                continue
            try:
                st, b, _ = get(url)
                print(f"   {label:16s} HTTP {st}  {len(b):>7}B  {url}")
            except urllib.error.HTTPError as e:
                failures.append(f"{label} is unreachable (HTTP {e.code}): {url}")
                print(f"   {label:16s} HTTP {e.code}  {url}")

    print()
    if failures:
        print("NOT installable:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("RESULT: a Cloudron box can resolve and pull this package anonymously.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
