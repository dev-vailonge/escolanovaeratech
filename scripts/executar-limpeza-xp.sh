#!/bin/bash

# Script para executar limpeza de XP mensal
# 
# Uso:
# ./scripts/executar-limpeza-xp.sh <email> <mes> <ano> <token> [dryRun]
#
# Exemplo:
# ./scripts/executar-limpeza-xp.sh carlosimlau@gmail.com 1 2025 SEU_TOKEN false

EMAIL=$1
MES=${2:-1}
ANO=${3:-2025}
TOKEN=$4
DRY_RUN=${5:-true}

if [ -z "$EMAIL" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erro: Email e token são obrigatórios"
  echo ""
  echo "Uso: ./scripts/executar-limpeza-xp.sh <email> <mes> <ano> <token> [dryRun]"
  echo ""
  echo "Exemplo:"
  echo "  ./scripts/executar-limpeza-xp.sh carlosimlau@gmail.com 1 2025 SEU_TOKEN false"
  echo ""
  echo "Para obter o token:"
  echo "  1. Faça login como admin no portal"
  echo "  2. Abra o DevTools (F12)"
  echo "  3. Console > localStorage.getItem('sb-<projeto>-auth-token')"
  echo "  4. Copie o access_token do JSON retornado"
  exit 1
fi

# URL da API (ajuste se necessário)
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/admin/limpar-xp-mensal"

echo "🔍 Executando limpeza de XP mensal..."
echo "   Email: $EMAIL"
echo "   Mês: $MES/$ANO"
echo "   Dry Run: $DRY_RUN"
echo "   Endpoint: $ENDPOINT"
echo ""

# Executar requisição
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"email\": \"$EMAIL\",
    \"mes\": $MES,
    \"ano\": $ANO,
    \"dryRun\": $DRY_RUN
  }")

# Verificar se houve erro
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Erro na API:"
  echo "$RESPONSE" | jq -r '.error // .message // .' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

# Mostrar resultado formatado
echo "✅ Resultado:"
echo "$RESPONSE" | jq -r '
  "   XP Mensal Anterior: \(.xpMensalAnterior // 0)",
  "   XP Mensal Novo: \(.xpMensalNovo // 0)",
  "   Diferença: \(.diferenca // 0)",
  "   Total de Entradas: \(.totalEntradas // 0)",
  "",
  .message // "Operação concluída"
' 2>/dev/null || echo "$RESPONSE"

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  echo "⚠️  Este foi um dry run. Para aplicar a correção, execute novamente com dryRun=false"
fi
