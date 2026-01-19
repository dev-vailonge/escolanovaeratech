# Resolução: Bug de Cálculo de XP em Quizzes

## 📋 Resumo Executivo

**Problema:** Alunos estavam recebendo aproximadamente metade do XP esperado ao completar quizzes na primeira tentativa.

**Impacto:** 12 alunos afetados, 20 quizzes com XP incorreto, totalizando 162 XP não concedidos.

**Status:** ✅ **RESOLVIDO COMPLETAMENTE**

---

## 🔍 Análise do Problema

### Causa Raiz

O bug ocorria na função `completarQuiz` em `src/lib/server/gamification.ts`. O cálculo de `xpTotalGanho` estava incluindo XP de outros quizzes devido a uma comparação incorreta do campo `source_id`.

**Código problemático:**
- A query buscava entradas de XP com `source = 'quiz'`, mas não garantia que `source_id` correspondesse exatamente ao `quizId` do quiz sendo completado
- Isso fazia com que XP de outros quizzes fosse contado incorretamente, reduzindo o `xpRemanescente` e, consequentemente, o XP ganho

### Padrão Identificado

Todos os casos seguiam o mesmo padrão: **alunos ganhavam aproximadamente metade do XP esperado**:

- 93% de pontuação: ganhou 9 XP → deveria ter 19 XP (faltou 10 XP)
- 100% de pontuação: ganhou 10 XP → deveria ter 20 XP (faltou 10 XP)
- 87% de pontuação: ganhou 9 XP → deveria ter 17 XP (faltou 8 XP)
- 80% de pontuação: ganhou 8 XP → deveria ter 16 XP (faltou 8 XP)
- 60% de pontuação: ganhou 6 XP → deveria ter 12 XP (faltou 6 XP)
- 40% de pontuação: ganhou 4 XP → deveria ter 8 XP (faltou 4 XP)

---

## ✅ Soluções Implementadas

### 1. Correção do Bug no Código

**Arquivo:** `src/lib/server/gamification.ts`

**Mudanças:**
- Adicionado filtro mais específico na query: `.eq('source_id', params.quizId)`
- Implementada verificação adicional no código para garantir matching exato entre `source_id` e `quizId`
- Adicionados logs detalhados para debug futuro
- Adicionado aviso quando entradas são filtradas por `source_id` não correspondente

**Código corrigido:**
```typescript
// Buscar XP total já ganho deste quiz específico
const { data: xpHistory, error: xpHistoryError } = await supabase
  .from('user_xp_history')
  .select('id, amount, source_id, description, created_at')
  .eq('user_id', params.userId)
  .eq('source', 'quiz')
  .eq('source_id', params.quizId) // ✅ Filtro específico adicionado
  .not('source_id', 'is', null)

// Verificação adicional no código
const xpTotalGanho = (xpHistory || []).reduce((sum, entry) => {
  const entrySourceId = entry.source_id?.toString() || ''
  const quizIdStr = params.quizId.toString()
  const sourceIdMatch = entrySourceId === quizIdStr
  
  if (!sourceIdMatch) {
    // NÃO somar esta entrada - ela não pertence a este quiz
    return sum
  }
  
  return sum + (entry.amount || 0)
}, 0)
```

### 2. Correção dos Dados Históricos

**APIs Criadas:**
- `POST /api/admin/corrigir-xp-quiz` - Corrige XP faltante de quizzes
- `POST /api/admin/limpar-xp-mensal` - Recalcula XP mensal baseado no histórico

**Componente Admin:**
- `src/app/aluno/admin/components/AdminCorrigirXPTab.tsx` - Interface para executar correções

**Resultado:**
- ✅ 20 casos corrigidos
- ✅ 162 XP adicionados via correções
- ✅ Todos os casos com status "CORRIGIDO"
- ✅ Data de correção: 19/01/2026 às 18:38

### 3. Alunos Afetados e Corrigidos

| Aluno | Quizzes Afetados | XP Corrigido |
|-------|------------------|--------------|
| Raudinei Moraes Santos de Lira Lima | 2 | 20 XP |
| Mirco Trevisol | 2 | 20 XP |
| Jessica Cafezeiro | 2 | 18 XP |
| Maria Eduarda Oliveira | 2 | 16 XP |
| Gabriel Custódio | 2 | 16 XP |
| Fabio Curcio Madeira | 2 | 14 XP |
| Kimberlly Atanazio | 2 | 12 XP |
| Natasha Faustino | 1 | 10 XP |
| Elton Beserra Lino | 1 | 10 XP |
| Carlos Eduardo Ramos | 1 | 8 XP |
| David Oliveira | 1 | 8 XP |
| gabriel de oliveira carvalho | 1 | 6 XP |
| Igor Gomes Calazans | 1 | 4 XP |

**Total:** 12 alunos, 20 quizzes, 162 XP corrigidos

---

## 🛠️ Arquivos Modificados

### Código Fonte
- `src/lib/server/gamification.ts` - Correção do cálculo de XP
- `src/app/api/quiz/[id]/completar/route.ts` - Passa respostas para salvar no histórico
- `src/app/aluno/quiz/page.tsx` - Correção da exibição de XP ganho
- `src/app/aluno/admin/page.tsx` - Adicionada aba "Corrigir XP"
- `src/app/aluno/admin/components/AdminCorrigirXPTab.tsx` - Nova aba admin

### APIs Criadas
- `src/app/api/admin/corrigir-xp-quiz/route.ts` - API de correção de XP
- `src/app/api/admin/limpar-xp-mensal/route.ts` - API de limpeza de XP mensal

### Scripts SQL (Documentação)
- `docs/supabase_verificar_xp_quiz.sql` - Verificar inconsistências
- `docs/supabase_verificar_caso_carlos.sql` - Caso específico
- `docs/supabase_verificar_caso_mirco.sql` - Caso específico
- `docs/supabase_listar_alunos_afetados.sql` - Listar todos os casos
- `docs/supabase_verificar_casos_corrigidos.sql` - Verificar correções aplicadas

---

## 📊 Validação

### Testes Realizados

1. ✅ Verificação de casos pendentes: **0 casos encontrados**
2. ✅ Verificação de casos corrigidos: **20 casos confirmados**
3. ✅ Validação de XP total: **Todos os alunos com XP correto**
4. ✅ Validação de XP mensal: **Recalculado corretamente**

### Queries de Validação

Execute no Supabase para validar:

```sql
-- Verificar se há casos pendentes
SELECT COUNT(*) FROM (
  -- Query 2 de supabase_verificar_casos_corrigidos.sql
) as casos_pendentes;
-- Resultado esperado: 0
```

---

## 🚀 Próximos Passos (Preventivos)

1. **Monitoramento:** Adicionar alertas se XP calculado for muito diferente do esperado
2. **Testes:** Adicionar testes unitários para cálculo de XP
3. **Documentação:** Manter documentação atualizada sobre cálculo de XP

---

## 📝 Notas Técnicas

### Como o XP é Calculado

1. **XP Máximo:** 20 XP por quiz (definido em `XP_CONSTANTS.quiz.maximo`)
2. **XP Remanescente:** `xpMaximo - xpTotalGanho` (XP já ganho deste quiz específico)
3. **XP Ganho:** `(pontuacao / 100) * xpRemanescente` (proporcional à pontuação)

### Por que o Bug Aconteceu

O bug ocorria porque:
- Na primeira tentativa, `xpTotalGanho` deveria ser 0
- Mas estava sendo calculado incorretamente, incluindo XP de outros quizzes
- Isso reduzia o `xpRemanescente` e, consequentemente, o XP ganho

### Como Foi Corrigido

1. **Filtro na Query:** Garantir que apenas entradas com `source_id = quizId` sejam buscadas
2. **Verificação no Código:** Comparação explícita de strings para garantir matching
3. **Logs:** Adicionados logs detalhados para debug futuro

---

## ✅ Checklist de Resolução

- [x] Bug identificado e analisado
- [x] Causa raiz encontrada
- [x] Código corrigido
- [x] Dados históricos corrigidos
- [x] APIs de correção criadas
- [x] Interface admin criada
- [x] Todos os casos validados
- [x] Documentação criada
- [x] Scripts SQL de validação criados

---

## 📅 Datas Importantes

- **Bug identificado:** Janeiro 2026
- **Correção aplicada:** 19/01/2026 às 18:38
- **Casos corrigidos:** 20 casos
- **XP total corrigido:** 162 XP

---

**Status Final:** ✅ **RESOLVIDO E VALIDADO**
