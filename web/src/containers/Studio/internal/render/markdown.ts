/**
 * A small Markdown renderer, for the Studio's preview pane.
 *
 * Small on purpose: the Studio shows the notes and READMEs that live on a drive,
 * and the alternative - a full CommonMark implementation from npm - is a renderer
 * (and a sanitiser) with more surface than the screen it is drawn on. What is
 * here is the subset those files actually use: headings, fenced code, inline code,
 * emphasis, links, lists, blockquotes and rules.
 *
 * Everything from the file is HTML-ESCAPED before any markup is produced, and the
 * tags in the output are the ones this function writes. A link whose target is not
 * http(s), mailto, an anchor or a relative path is rendered as plain text, so a
 * `javascript:` URL in a README cannot run in the admin interface.
 *
 * Not supported, and left as text: tables, images, HTML blocks, footnotes. A
 * README that uses them still reads; it just does not get the dressing.
 */

/** The characters that would otherwise be markup, escaped for the output. */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * A link target this renderer will make clickable.
 *
 * Anything else - notably `javascript:` and `data:` - is refused, and the caller
 * falls back to the link's text.
 */
export const isSafeHref = (href: string): boolean =>
  /^(https?:\/\/|mailto:|#|\/|\.{0,2}\/)/i.test(href.trim()) &&
  !/^\s*javascript:/i.test(href)

/**
 * The id a URL fragment names, or `''` when it names nothing usable.
 *
 * `decodeURIComponent` throws on a malformed escape, and a fragment is user
 * input: a shared link pasted as `notes.md#100%` carries a lone `%`, and a
 * document can write one into its own link. A fragment that cannot be decoded
 * is not a section, so it is ignored rather than allowed to throw inside the
 * effect that lands the reader.
 */
export const fragmentOf = (hash: string): string => {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''))
  } catch {
    return ''
  }
}

/**
 * The anchor a heading carries: `## Help <a name="helpinfo"></a>`.
 *
 * Files like the SAS Packages framework's markdown use an inline HTML anchor to
 * give a section a stable name, and the renderer shows that HTML as text - so
 * the anchor is lifted out of the heading and emitted as a target of its own,
 * which is what a link to `#helpinfo` needs. The heading keeps its slug, so a
 * link to `#help` lands too: a heading with an anchor used to take the anchor's
 * name as its id, which left the slug matching nothing.
 */
const INLINE_ANCHOR = /<a\s+(?:name|id)\s*=\s*"([^"]+)"\s*>\s*<\/a>/gi

/** The id a heading gets when it carries no anchor of its own. */
export const slugifyHeading = (text: string): string =>
  text
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

/**
 * A heading's id, the anchors written inside it, and the text to render.
 *
 * Every anchor is returned, not just the first: two names on one heading are two
 * links someone may follow, and one of them silently winning is a link that lands
 * nowhere.
 */
export const headingAnchor = (
  text: string
): { id: string; anchors: string[]; text: string } => {
  const anchors = Array.from(text.matchAll(INLINE_ANCHOR), (match) => match[1])
  const visible = text.replace(INLINE_ANCHOR, '').trim()

  return { id: slugifyHeading(visible), anchors, text: visible }
}

/** A line that is nothing but an anchor: it names the section that follows it. */
const ANCHOR_ONLY_LINE = /^\s*<a\s+(?:name|id)\s*=\s*"([^"]+)"\s*>\s*<\/a>\s*$/i

/** Inline markup: code spans first, so their contents are not re-read. */
const inline = (text: string): string => {
  const code: string[] = []
  const images: string[] = []

  // Images are not rendered, and their markdown is left as the text it was: the
  // link rule below would otherwise turn `![alt](src)` into a stray `!` and a
  // live link, which is neither what the file says nor what the header promises.
  let out = escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (whole) => {
      images.push(whole)

      return `\u0001${images.length - 1}\u0001`
    })
    .replace(/`([^`]+)`/g, (_, span: string) => {
      code.push(span)

      return `\u0000${code.length - 1}\u0000`
    })

  out = out
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (whole, label: string, href: string) =>
        // An unsafe target keeps its markdown as it was written: dropping the
        // target would leave half a link on the page, and a reader seeing the
        // brackets is a reader who can see the file said something odd.
        isSafeHref(href) && !href.includes('\u0000')
          ? href.startsWith('#')
            ? `<a href="${href}" data-anchor="1">${label}</a>`
            : `<a href="${href}" target="_blank" rel="noreferrer noopener">${label}</a>`
          : whole
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')

  out = out.replace(/\u0000(\d+)\u0000/g, (_, index: string) => {
    return `<code>${code[Number(index)]}</code>`
  })

  return out.replace(/\u0001(\d+)\u0001/g, (_, index: string) => {
    return images[Number(index)]
  })
}

/** Whether a line continues the paragraph above it rather than starting one. */
const isParagraphLine = (line: string): boolean =>
  line.trim() !== '' &&
  !/^\s*(#{1,6})\s+/.test(line) &&
  !/^\s*```/.test(line) &&
  !/^\s*([-*+]|\d+\.)\s+/.test(line) &&
  !/^\s*>/.test(line) &&
  !/^\s*(-{3,}|\*{3,})\s*$/.test(line)

/**
 * The rendered HTML for a Markdown document.
 *
 * Consecutive plain lines become one paragraph, as Markdown does; a blank line
 * ends it. Lists and blockquotes are rendered one item per line, which is enough
 * for the notes this is for and keeps the state machine here readable.
 */
export const markdownToHtml = (markdown: string): string => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []

  let paragraph: string[] = []
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null
  /** Anchors set aside for the block below them, until it arrives. */
  let pendingAnchors: string[] = []
  /** Ids already used, so a repeated heading does not repeat an id. */
  const usedIds = new Map<string, number>()

  const uniqueId = (id: string) => {
    const seen = usedIds.get(id) ?? 0
    usedIds.set(id, seen + 1)

    return seen === 0 ? id : `${id}-${seen}`
  }

  const closeParagraph = () => {
    if (!paragraph.length) return

    html.push(`<p>${inline(paragraph.join(' '))}</p>`)
    paragraph = []
  }

  const closeList = () => {
    if (!list) return

    const items = list.items.map((item) => `<li>${inline(item)}</li>`).join('')
    html.push(`<${list.tag}>${items}</${list.tag}>`)
    list = null
  }

  /**
   * Places the anchors held for the block below, so a link to one lands where the
   * anchor is written rather than at the end of the document.
   */
  const flushAnchors = () => {
    for (const name of pendingAnchors)
      html.push(`<a id="${escapeHtml(uniqueId(name))}"></a>`)

    pendingAnchors = []
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    // A fence runs to its closing fence, or to the end of the document: an
    // unterminated block is shown rather than swallowed.
    if (/^\s*```/.test(line)) {
      closeParagraph()
      closeList()

      const body: string[] = []
      index++

      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        body.push(lines[index])
        index++
      }

      flushAnchors()
      html.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`)
      continue
    }

    if (line.trim() === '') {
      closeParagraph()
      closeList()
      continue
    }

    const anchorOnly = ANCHOR_ONLY_LINE.exec(line)

    if (anchorOnly) {
      // Not rendered as text: it is the section's name, and it belongs on the
      // block underneath - which is why the anchor is held until one arrives.
      // Held as a list: two names in a row are two targets, and dropping the
      // first would leave a link to it with nowhere to land.
      closeParagraph()
      closeList()
      pendingAnchors.push(anchorOnly[1])
      continue
    }

    const heading = /^\s*(#{1,6})\s+(.*)$/.exec(line)

    if (heading) {
      closeParagraph()
      closeList()

      const level = heading[1].length
      const anchor = headingAnchor(heading[2].trim())
      // The heading keeps its own slug; the anchors written into it become
      // targets just above it, so both `#help` and `#helpinfo` land. An anchor
      // that names the slug itself is left to the heading, which avoids two
      // elements claiming one id.
      const names = [...pendingAnchors, ...anchor.anchors].filter(
        (name) => name !== anchor.id
      )
      pendingAnchors = []

      for (const name of names)
        html.push(`<a id="${escapeHtml(uniqueId(name))}"></a>`)

      // An id on every heading: `#anything` in a README is a link someone may
      // arrive on, and an id is what the pane scrolls to.
      html.push(
        anchor.id
          ? `<h${level} id="${escapeHtml(uniqueId(anchor.id))}">${inline(
              anchor.text
            )}</h${level}>`
          : `<h${level}>${inline(anchor.text)}</h${level}>`
      )
      continue
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      closeParagraph()
      closeList()
      flushAnchors()
      html.push('<hr />')
      continue
    }

    const quote = /^\s*>\s?(.*)$/.exec(line)

    if (quote) {
      closeParagraph()
      closeList()
      flushAnchors()
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      continue
    }

    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line)
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line)
    const item = unordered?.[1] ?? ordered?.[1]

    if (item !== undefined) {
      closeParagraph()
      flushAnchors()

      const tag = unordered ? 'ul' : 'ol'

      if (!list || list.tag !== tag) {
        closeList()
        list = { tag, items: [] }
      }

      // `closeList` nulls the variable through a closure, so the narrowed type is
      // not what TypeScript can keep here.
      const current = list as { tag: 'ul' | 'ol'; items: string[] }
      current.items.push(item)
      continue
    }

    if (isParagraphLine(line)) {
      closeList()
      flushAnchors()
      paragraph.push(line.trim())
    }
  }

  closeParagraph()
  closeList()

  // An anchor that named no block still has to exist: a link to it is a link
  // someone may follow.
  flushAnchors()

  return html.join('\n')
}
