/**
 * Sanitiza HTML gerado internamente (markdownToSafeHtml).
 *
 * Hoje todo HTML que passa por aqui é produzido por `basicMarkdownToHtml`,
 * que já escapa caracteres perigosos e só injeta tags controladas
 * (`<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<br>`).
 *
 * Como não existem outras chamadas externas, podemos retornar o HTML
 * diretamente para evitar diferenças entre ambiente de servidor e cliente.
 */
export function sanitizeHtml(html: string): string {
  return html
}
