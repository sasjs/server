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
          ? `<a href="${href}" target="_blank" rel="noreferrer noopener">${label}</a>`
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

      html.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`)
      continue
    }

    if (line.trim() === '') {
      closeParagraph()
      closeList()
      continue
    }

    const heading = /^\s*(#{1,6})\s+(.*)$/.exec(line)

    if (heading) {
      closeParagraph()
      closeList()

      const level = heading[1].length
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`)
      continue
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      closeParagraph()
      closeList()
      html.push('<hr />')
      continue
    }

    const quote = /^\s*>\s?(.*)$/.exec(line)

    if (quote) {
      closeParagraph()
      closeList()
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      continue
    }

    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line)
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line)
    const item = unordered?.[1] ?? ordered?.[1]

    if (item !== undefined) {
      closeParagraph()

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
      paragraph.push(line.trim())
    }
  }

  closeParagraph()
  closeList()

  return html.join('\n')
}
