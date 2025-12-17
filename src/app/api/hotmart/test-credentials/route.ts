/**
 * Endpoint de teste para verificar se as credenciais estão sendo lidas corretamente
 * 
 * GET /api/hotmart/test-credentials
 * 
 * Retorna informações sobre as credenciais (parcialmente mascaradas) sem tentar autenticar
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const CLIENT_ID = process.env.HOTMART_CLIENT_ID
  const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET
  const WEBHOOK_SECRET = process.env.HOTMART_WEBHOOK_SECRET

  // Informações sobre as credenciais (sem expor valores completos)
  const info = {
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    hasWebhookSecret: !!WEBHOOK_SECRET,
    clientIdLength: CLIENT_ID?.length || 0,
    clientSecretLength: CLIENT_SECRET?.length || 0,
    webhookSecretLength: WEBHOOK_SECRET?.length || 0,
    clientIdPreview: CLIENT_ID 
      ? `${CLIENT_ID.substring(0, 4)}...${CLIENT_ID.substring(CLIENT_ID.length - 4)}`
      : null,
    clientIdHasHyphens: CLIENT_ID?.includes('-') || false,
    clientSecretHasHyphens: CLIENT_SECRET?.includes('-') || false,
    webhookSecretHasHyphens: WEBHOOK_SECRET?.includes('-') || false,
    clientIdHasSpaces: CLIENT_ID?.includes(' ') || false,
    clientSecretHasSpaces: CLIENT_SECRET?.includes(' ') || false,
    clientIdHasQuotes: CLIENT_ID?.startsWith('"') || CLIENT_ID?.startsWith("'") || false,
    clientSecretHasQuotes: CLIENT_SECRET?.startsWith('"') || CLIENT_SECRET?.startsWith("'") || false,
    clientIdIsPlaceholder: CLIENT_ID?.includes('seu_') || false,
    clientSecretIsPlaceholder: CLIENT_SECRET?.includes('seu_') || false,
  }

  // Verificar se está tudo configurado
  const allConfigured = info.hasClientId && info.hasClientSecret && info.hasWebhookSecret
  const isValid = allConfigured && 
                  !info.clientIdIsPlaceholder && 
                  !info.clientSecretIsPlaceholder &&
                  !info.clientIdHasQuotes &&
                  !info.clientSecretHasQuotes

  return NextResponse.json({
    configured: allConfigured,
    valid: isValid,
    info,
    message: isValid
      ? '✅ Credenciais configuradas corretamente. Hífens são válidos!'
      : allConfigured
      ? '⚠️ Credenciais configuradas mas podem ter problemas de formato'
      : '❌ Credenciais não configuradas',
    tips: [
      info.clientIdHasHyphens && '✅ Client ID tem hífens (normal e válido)',
      info.clientSecretHasHyphens && '✅ Client Secret tem hífens (normal e válido)',
      info.webhookSecretHasHyphens && '✅ Webhook Secret tem hífens (normal e válido)',
      info.clientIdHasSpaces && '⚠️ Client ID tem espaços (pode causar problemas)',
      info.clientSecretHasSpaces && '⚠️ Client Secret tem espaços (pode causar problemas)',
      info.clientIdHasQuotes && '❌ Client ID tem aspas (remova as aspas!)',
      info.clientSecretHasQuotes && '❌ Client Secret tem aspas (remova as aspas!)',
      info.clientIdIsPlaceholder && '❌ Client ID ainda é placeholder',
      info.clientSecretIsPlaceholder && '❌ Client Secret ainda é placeholder',
    ].filter(Boolean),
  })
}


