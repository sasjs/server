"""Post-build HTML fixes for Material for MkDocs.

Five things the theme and plugin do not give us, all patched across the built
site (including 404.html, which MkDocs writes outside the normal page flow):

  * the search panel is <div class="md-search" role="dialog"> with no accessible
    name, which fails `aria-dialog-name`;
  * the header logo <img> carries no width/height and an uninformative alt of
    "logo", which fails `unsized-images` and tells a screen reader nothing;
  * there is no repository link in the header. Material only offers one through
    `repo_url`, and setting that makes its bundle call api.github.com for the
    star count on every page load - unauthenticated, rate limited, and a console
    error when it 403s. This adds a plain link instead: icon, title, href;
  * a link written in a page to another site carries no `target`, so it opens
    wherever it was clicked. The interface frames these pages, so clicking
    github.com navigated the FRAME - and GitHub answers `X-Frame-Options: DENY`,
    so the reader's docs were replaced by a refusal and the page they were
    reading was gone. Every absolute link to another origin is given
    `target="_blank"` (and `rel="noopener"`), so it opens as a page of its own;
  * the Swagger UI frame on the API page has no title, which fails
    `frame-title`.

Every patch is counted and checked afterwards, so a Material or plugin upgrade
that changes this markup fails the build here rather than quietly regressing.
"""

import pathlib
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit


# <div class="md-search" data-md-component="search" role="dialog">
SEARCH_DIALOG = re.compile(r'<div class="md-search"([^>]*?)role="dialog"')

# <img alt="logo" src="img/logo/favicon/32.svg"/>  (src is relative per page, and
# the attribute order differs between the header and the drawer)
LOGO_IMG = re.compile(r'<img (?P<attrs>[^>]*\bsrc="[^"]*img/logo/[^"]*"[^>]*)>')


def _size_logo(match):
    """Drop the uninformative alt and give the image its true size."""
    attrs = match.group("attrs").rstrip().rstrip("/").rstrip()
    if 'alt="logo"' not in attrs:
        return match.group(0)

    attrs = attrs.replace('alt="logo"', 'alt=""')
    if "width=" not in attrs:
        attrs = f'{attrs} width="32" height="32"'

    return f"<img {attrs}/>"

# The header search is the anchor point for the repository link: Material puts
# its own source link in the same slot.
SEARCH_FORM = re.compile(r'<div class="md-search"')

# The Swagger UI frame from mkdocs-swagger-ui-tag carries no accessible name,
# which fails `frame-title`. Material's own iframes are not patched - only the
# one this site generates.
SWAGGER_IFRAME = re.compile(r'<iframe class="swagger-ui-iframe"(?![^>]*\btitle=)')

# <a href="https://github.com/sasjs/server" ...> - one tag. The quoted-attribute
# alternative is what lets a tag be read whole when one of its values contains a
# `>` (a title, say); a plain `[^>]*` stops at that character and the match then
# has no attribute to act on. Single quotes are matched as well, because a page's
# own raw HTML is written by a person and not always by Material.
ANCHOR = re.compile(r"<a\s(?:[^>\"']|\"[^\"]*\"|'[^']*')*>", re.IGNORECASE)

# A name at the start of a tag's attribute list, or after whitespace.
ATTRIBUTE_NAME = re.compile(r"[a-zA-Z_:][-a-zA-Z0-9_:.]*")
WHITESPACE = " \t\r\n\f"


def _attributes(tag):
    """The attributes of a start tag, and where each one sits in the text.

    Reading attributes with a regex over the raw tag cannot tell an attribute
    from the same word inside another attribute's value: `title='see
    target="_blank"'` reads as a target and the link is left as it was. So the
    tag is walked once, left to right, stepping over quoted values whole - the
    same reading a browser does - and each attribute keeps its span, which is
    what lets the rewrite splice one in place.

    Every HTML value form is accepted - double-quoted, single-quoted and bare
    (`rel=nofollow`) - because a page's own raw HTML is written by a person:
    a form that goes unread is an attribute the pass then writes twice, and two
    `rel` attributes on one tag is markup where the browser honours the first.
    """
    attributes = []
    position = len("<a")
    end = len(tag)
    match_name = ATTRIBUTE_NAME.match

    while position < end:
        while position < end and tag[position] in WHITESPACE + "/":
            position += 1
        if position >= end or tag[position] == ">":
            break

        start = position
        matched = match_name(tag, position)
        if not matched:
            # not a name: step over whatever is here rather than looping
            position += 1
            continue
        position = matched.end()
        attribute = matched.group(0).lower()

        value = None
        quote = None

        while position < end and tag[position] in WHITESPACE:
            position += 1
        if position < end and tag[position] == "=":
            position += 1
            while position < end and tag[position] in WHITESPACE:
                position += 1
            if position < end and tag[position] in "\"'":
                quote = tag[position]
                close = tag.find(quote, position + 1)
                if close == -1:
                    close = end - 1
                value = tag[position + 1 : close]
                position = close + 1
            else:
                value_start = position
                while position < end and tag[position] not in WHITESPACE + ">":
                    position += 1
                value = tag[value_start:position]

        attributes.append(
            {
                "name": attribute,
                "value": value,
                "quote": quote,
                "start": start,
                "end": position,
            }
        )

    return attributes


class _Anchors(HTMLParser):
    """Every anchor on a page, as a browser reads it.

    The rewrite works on the page's text: it can only act on an anchor it can
    read, and a guard that reused the same reading would keep quiet about exactly
    the markup the rewrite had missed. This uses the standard parser instead, so
    a shape the rewrite cannot handle is a shape the check reports.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.anchors = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.anchors.append({name: value or "" for name, value in attrs})


# An absolute URL - any scheme (`https://`, `ftp://`) or the protocol-relative
# `//host/...` form. The check reads it the same way: a rewrite narrower than the
# check fails the build over a link it could in fact have rewritten.
ABSOLUTE = re.compile(r"^(?:[a-z][a-z0-9+.-]*:)?//", re.IGNORECASE)

# The check's own reading of "a link to somewhere else", deliberately not the
# rule above restated: a guard that reuses the expression it is guarding cannot
# fail when that expression is what broke.
GUARD_ABSOLUTE = re.compile(r"^\s*(?:[a-z][a-z0-9+.-]*:)?//", re.IGNORECASE)


def _host(url):
    """The host of an absolute URL, lower-cased - '' if it has none.

    urlsplit reads `//host/path` as a netloc with no scheme, so the
    protocol-relative form needs no handling of its own.
    """
    try:
        return (urlsplit(url).hostname or "").lower()
    except ValueError:
        return ""


def _target_external(match, internal_hosts):
    """Give an anchor to another origin `target="_blank"`.

    A link to this site is left alone: it is a page of the documentation, and
    the frame follows it (the interface watches the frame's location). A link
    to any other origin is navigation away from the docs, and inside a frame it
    is navigation to a page that may refuse to be framed at all.
    """
    tag = match.group(0)

    found = {}
    for attribute in _attributes(tag):
        # first occurrence wins, as it does in a browser
        found.setdefault(attribute["name"], attribute)

    href = found.get("href")
    if not href or href["value"] is None:
        return tag

    url = href["value"]
    if not ABSOLUTE.match(url):
        return tag

    host = _host(url)
    if not host or host in internal_hosts:
        return tag

    # One requirement, so there is nothing for a page to state differently: a
    # link to another site opens a page of its own. An author who wrote
    # `{target=_self}` (or `_parent`, or a window name) asked for the frame to be
    # replaced - which is the failure this hook exists to prevent - so the target
    # is rewritten rather than honoured. The relation is checked even when the
    # target was already `_blank`, so a page cannot end up with a new window and
    # no noopener.
    #
    # Material's own choice of relation for a link it opens in a new tab, so a
    # link this hook rewrites is indistinguishable from one it wrote. A relation
    # the page states is kept - `rel="nofollow"` is the author's decision - and
    # noopener is added to it. The rewritten value is always quoted: a bare
    # `rel=nofollow` cannot take a second token, and quoting reads the same
    # whichever way the original was written.
    edits = []
    insert = ""

    target = found.get("target")
    if target is None:
        insert += ' target="_blank"'
    elif (target["value"] or "").lower() != "_blank":
        edits.append((target["start"], target["end"], 'target="_blank"'))

    relation = found.get("rel")
    if relation is None:
        insert += ' rel="noopener"'
    else:
        stated = (relation["value"] or "").strip()
        if "noopener" not in stated.split():
            replacement = f'rel="{stated} noopener"' if stated else 'rel="noopener"'
            edits.append((relation["start"], relation["end"], replacement))

    # right to left, so an earlier span's offsets still hold
    for start, end, replacement in sorted(edits, reverse=True):
        tag = tag[:start] + replacement + tag[end:]

    if insert:
        # before the closing `>`, and before a trailing solidus if the tag has
        # one: `<a href="x" />` + " target=..." after the slash is markup no
        # browser reads as the attribute it was meant to be
        closing = tag.rindex(">")
        body = tag[:closing].rstrip()
        solidus = body.endswith("/")
        if solidus:
            body = body[:-1].rstrip()
        tag = body + insert + (" /" if solidus else "") + tag[closing:]

    return tag



REPO_URL = "https://github.com/sasjs/server"
REPO_LABEL = "sasjs/server on GitHub"

# GitHub mark, 24x24, drawn with the header's own foreground colour.
REPO_LINK = (
    f'<a href="{REPO_URL}" title="{REPO_LABEL}" aria-label="{REPO_LABEL}"'
    ' class="md-header__button md-icon md-header__repo">'
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">'
    '<path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6'
    '-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3'
    ' 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5'
    '.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9'
    '.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7'
    '.8.6A12 12 0 0 0 12 .3"/></svg></a>'
)


def on_post_build(config):
    site_dir = pathlib.Path(config["site_dir"])
    pages = sorted(site_dir.rglob("*.html"))
    if not pages:
        raise RuntimeError("hooks/html_fixes.py: no HTML in the site dir - nothing to patch")

    # This site's own host, from site_url rather than a second setting: an
    # absolute link back into the docs must stay in the frame, and it is the
    # canonical URL that says which host that is. Without it every rule here
    # would treat the site as another origin, so a link between two pages of the
    # documentation would open as a page of its own and the frame would stay
    # where it was - a wrong build, not a degraded one.
    own_host = _host(config.get("site_url") or "")
    if not own_host:
        raise RuntimeError(
            "hooks/html_fixes.py: site_url names no host "
            f"({config.get('site_url')!r}), so a link between documentation pages "
            "cannot be told from a link to another site - set site_url in "
            "docs/mkdocs.yml"
        )
    internal_hosts = {own_host}

    labelled = 0
    dialogs = 0
    logos = 0
    repos = 0
    headers = 0
    frames = 0
    titled = 0
    linked = 0
    untargeted = []

    for page in pages:
        text = page.read_text(encoding="utf-8")
        # The Swagger UI page the plugin writes is a bare frame, not a Material
        # page, so it is not expected to carry the header or the logo.
        has_header = 'class="md-header__inner' in text
        headers += has_header

        text, patched = SEARCH_DIALOG.subn(
            r'<div class="md-search"\1role="dialog" aria-label="Search"', text
        )
        dialogs += text.count('role="dialog"')
        labelled += patched

        text, fixed = LOGO_IMG.subn(_size_logo, text)
        logos += fixed

        if has_header and "md-header__repo" not in text:
            text, added = SEARCH_FORM.subn(REPO_LINK + r'\g<0>', text, count=1)
            repos += added

        # After the repository link, so the header link this build writes is
        # held to the same rule as one a page writes.
        def target_link(match):
            nonlocal linked
            rewritten = _target_external(match, internal_hosts)
            if rewritten != match.group(0):
                linked += 1
            return rewritten

        text = ANCHOR.sub(target_link, text)

        # The written page, read the way a browser reads it, and not with the
        # expressions the rewrite used: every external anchor has to carry a
        # target now - whether this pass added it, Material did, or the author
        # wrote it in markdown - and an anchor the substitution could not see is
        # exactly what this check exists to report.
        anchors = _Anchors()
        anchors.feed(text)
        anchors.close()
        for anchor in anchors.anchors:
            # the value, not the presence of the attribute: `target="_self"` is
            # the failure, and an anchor carrying one must be reported
            if anchor.get("target", "").lower() == "_blank":
                continue
            href = anchor.get("href", "")
            if not GUARD_ABSOLUTE.match(href):
                continue
            if _host(href) in internal_hosts:
                continue
            untargeted.append(f"{page.name}: <a href={href[:80]!r}>")

        frames += text.count('<iframe class="swagger-ui-iframe"')
        text, added = SWAGGER_IFRAME.subn(
            '<iframe class="swagger-ui-iframe" title="API reference"', text
        )
        titled += added

        page.write_text(text, encoding="utf-8")

    if dialogs and labelled != dialogs:
        raise RuntimeError(
            f"hooks/html_fixes.py: {dialogs} dialogs, {labelled} labelled - "
            "the search markup changed, update SEARCH_DIALOG"
        )
    if dialogs == 0:
        raise RuntimeError(
            "hooks/html_fixes.py: no search dialog found - update SEARCH_DIALOG"
        )
    if logos == 0:
        raise RuntimeError(
            "hooks/html_fixes.py: no logo image found - update LOGO_IMG"
        )
    if titled != frames:
        raise RuntimeError(
            f"hooks/html_fixes.py: {frames} Swagger UI frames, {titled} titled - "
            "the iframe markup changed, update SWAGGER_IFRAME"
        )
    if repos != headers:
        raise RuntimeError(
            f"hooks/html_fixes.py: repository link on {repos} of {headers} pages with a "
            "header - the header markup changed, update SEARCH_FORM"
        )
    if untargeted:
        raise RuntimeError(
            f"hooks/html_fixes.py: {len(untargeted)} link(s) to another origin still "
            "open in the frame - a click would navigate the docs away to a page that "
            "may refuse to be framed:\n  "
            + "\n  ".join(untargeted[:10])
            + f"\n({linked} anchor(s) rewritten)"
        )
