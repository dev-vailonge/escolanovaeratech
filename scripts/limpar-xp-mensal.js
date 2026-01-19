/**
 * Script para limpar e recalcular XP mensal
 * 
 * Uso:
 * node scripts/limpar-xp-mensal.js <email> <mes> <ano> [dryRun]
 * 
 * Exemplo:
 * node scripts/limpar-xp-mensal.js carlosimlau@gmail.com 1 2025 false
 */

const email = process.argv[2]
const mes = parseInt(process.argv[3]) || 1
const ano = parseInt(process.argv[4]) || 2025
const dryRun = process.argv[5] !== 'false'

if (!email) {
  console.error('❌ Erro: Email é obrigatório')
  console.log('Uso: node scripts/limpar-xp-mensal.js <email> <mes> <ano> [dryRun]')
  process.exit(1)
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const endpoint = `${API_URL}/api/admin/limpar-xp-mensal`

async function executarLimpeza() {
  try {
    console.log(`🔍 Executando limpeza de XP mensal...`)
    console.log(`   Email: ${email}`)
    console.log(`   Mês: ${mes}/${ano}`)
    console.log(`   Dry Run: ${dryRun}`)
    console.log(`   Endpoint: ${endpoint}`)
    console.log('')

    // IMPORTANTE: Você precisa fornecer o token de admin
    // Obtenha o token fazendo login como admin e copiando do localStorage ou cookie
    const token = process.env.ADMIN_TOKEN || process.argv[6]

    if (!token) {
      console.error('❌ Erro: Token de admin não fornecido')
      console.log('')
      console.log('Opções:')
      console.log('1. Defina a variável de ambiente: export ADMIN_TOKEN=seu_token')
      console.log('2. Passe como argumento: node scripts/limpar-xp-mensal.js <email> <mes> <ano> <dryRun> <token>')
      console.log('')
      console.log('Para obter o token:')
      console.log('1. Faça login como admin no portal')
      console.log('2. Abra o DevTools (F12)')
      console.log('3. Vá em Application > Local Storage')
      console.log('4. Procure por "sb-<projeto>-auth-token"')
      console.log('5. Copie o access_token')
      process.exit(1)
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        mes,
        ano,
        dryRun
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro na API:', data.error || data.message)
      process.exit(1)
    }

    console.log('✅ Resultado:')
    console.log(`   XP Mensal Anterior: ${data.xpMensalAnterior}`)
    console.log(`   XP Mensal Novo: ${data.xpMensalNovo}`)
    console.log(`   Diferença: ${data.diferenca > 0 ? '+' : ''}${data.diferenca}`)
    console.log(`   Total de Entradas: ${data.totalEntradas}`)
    console.log('')
    
    if (data.entradasContadas && data.entradasContadas.length > 0) {
      console.log('📋 Entradas contadas:')
      data.entradasContadas.forEach((entrada, idx) => {
        console.log(`   ${idx + 1}. ${entrada.source}: ${entrada.amount} XP - ${entrada.description || 'Sem descrição'}`)
      })
    } else {
      console.log('⚠️  Nenhuma entrada encontrada para este mês')
    }

    console.log('')
    console.log(`📝 ${data.message}`)

    if (dryRun) {
      console.log('')
      console.log('⚠️  Este foi um dry run. Para aplicar a correção, execute novamente com dryRun=false')
    }

  } catch (error) {
    console.error('❌ Erro ao executar limpeza:', error.message)
    process.exit(1)
  }
}

executarLimpeza()
