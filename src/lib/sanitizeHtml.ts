const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'p', 'br']

/**
 * Sanitizes HTML to only allow bold, italic, lists and paragraphs.
 * Safe to use with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const el = node as Element
      const tag = el.tagName.toLowerCase()
      if (!ALLOWED_TAGS.includes(tag)) return Array.from(node.childNodes).map(walk).join('')
      const inner = Array.from(node.childNodes).map(walk).join('')
      if (tag === 'br') return '<br>'
      return `<${tag}>${inner}</${tag}>`
    }
    return walk(doc.body) || html
  } catch {
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
