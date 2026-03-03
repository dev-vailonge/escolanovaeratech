import { sanitizeHtml } from './sanitizeHtml'

function basicMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const htmlParts: string[] = []
  let inUl = false
  let inOl = false

  const closeLists = () => {
    if (inUl) {
      htmlParts.push('</ul>')
      inUl = false
    }
    if (inOl) {
      htmlParts.push('</ol>')
      inOl = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line.trim()) {
      closeLists()
      continue
    }

    // Headings: #, ##, ### ...
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      closeLists()
      const level = headingMatch[1].length
      const content = headingMatch[2]
      // Mapear para tamanhos intermediários para não brigar com o título do card
      let tag = 'h3'
      if (level === 1) tag = 'h2'
      else if (level === 2) tag = 'h3'
      else tag = 'h4'
      htmlParts.push(`<${tag}>${inlineFormat(content)}</${tag}>`)
      continue
    }

    // Horizontal rule: ---
    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeLists()
      htmlParts.push('<hr />')
      continue
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.+)/)
    const orderedMatch = line.match(/^\d+\.\s+(.+)/)

    if (unorderedMatch) {
      if (!inUl) {
        closeLists()
        inUl = true
        htmlParts.push('<ul>')
      }
      htmlParts.push(`<li>${inlineFormat(unorderedMatch[1])}</li>`)
      continue
    }

    if (orderedMatch) {
      if (!inOl) {
        closeLists()
        inOl = true
        htmlParts.push('<ol>')
      }
      htmlParts.push(`<li>${inlineFormat(orderedMatch[1])}</li>`)
      continue
    }

    closeLists()
    htmlParts.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeLists()
  if (htmlParts.length === 0) return ''
  return htmlParts.join('\n')
}

function inlineFormat(text: string): string {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold: **text**
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic: *text* ou _text_ (evitar conflitar com bold)
  escaped = escaped.replace(/(^|[\s(])\*(?!\s)([^*]+?)\*(?=[\s).]|$)/g, '$1<em>$2</em>')
  escaped = escaped.replace(/(^|[\s(])_(?!\s)([^_]+?)_(?=[\s).]|$)/g, '$1<em>$2</em>')

  return escaped.replace(/\n/g, '<br>')
}

export function markdownToSafeHtml(markdown: string): string {
  const html = basicMarkdownToHtml(markdown)
  return sanitizeHtml(html)
}

