"""Post-build HTML fixes for Material for MkDocs.

Four things the theme and plugin do not give us, all patched across the built
site (including 404.html, which MkDocs writes outside the normal page flow):

  * the search panel is <div class="md-search" role="dialog"> with no accessible
    name, which fails `aria-dialog-name`;
  * the header logo <img> carries no width/height and an uninformative alt of
    "logo", which fails `unsized-images` and tells a screen reader nothing;
  * there is no repository link in the header. Material only offers one through
    `repo_url`, and setting that makes its bundle call api.github.com for the
    star count on every page load - unauthenticated, rate limited, and a console
    error when it 403s. This adds a plain link instead: icon, title, href;
  * the Swagger UI frame on the API page has no title, which fails
    `frame-title`.

Every patch is counted and checked afterwards, so a Material or plugin upgrade
that changes this markup fails the build here rather than quietly regressing.
"""

import pathlib
import re

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

    labelled = 0
    dialogs = 0
    logos = 0
    repos = 0
    headers = 0
    frames = 0
    titled = 0

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
