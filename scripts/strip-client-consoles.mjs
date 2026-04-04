/**
 * One-off helper: remove console.log/warn/error/debug/info calls (incl. multi-line).
 * Run: node scripts/strip-client-consoles.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const targets = [
  'src/lib/database.ts',
  'src/app/aluno/page.tsx',
  'src/components/aluno/AlunoSidebar.tsx',
  'src/components/aluno/AlunoHeader.tsx',
  'src/app/aluno/admin/components/AdminFormulariosTab.tsx',
  'src/app/aluno/admin/components/AdminDesafiosTab.tsx',
  'src/app/aluno/admin/components/CreateFormularioModal.tsx',
  'src/app/aluno/admin/components/CreateQuizModal.tsx',
  'src/components/comunidade/CommentThread.tsx',
  'src/components/ui/modern-animated-sign-in.tsx',
]

const re = /console\.(log|warn|error|debug|info)\s*\(/

function stripFile(rel) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) return
  const lines = fs.readFileSync(p, 'utf8').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!re.test(line)) {
      out.push(line)
      i += 1
      continue
    }
    let depth = 0
    while (i < lines.length) {
      const L = lines[i]
      for (const ch of L) {
        if (ch === '(') depth += 1
        else if (ch === ')') depth -= 1
      }
      i += 1
      if (depth <= 0) break
    }
  }
  fs.writeFileSync(p, out.join('\n'))
}

for (const t of targets) stripFile(t)
process.stdout.write(`Stripped consoles from ${targets.length} files\n`)
