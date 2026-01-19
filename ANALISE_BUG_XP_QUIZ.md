# 🔍 Análise do Bug de XP em Quizzes

## 📋 Problemas Relatados

### Caso 1: Usuário de teste
- **Pontuação:** 40% de um quiz de 20 XP
- **XP Esperado:** 8 XP (40% de 20)
- **XP Recebido:** 4 XP
- **Diferença:** -4 XP

### Caso 2: Aluno em produção
- **Situação:** Errou 1 questão de 15 perguntas (14/15 = 93.33%)
- **XP Mostrado na Tela:** 19 XP
- **XP Contabilizado:** 9 XP
- **Diferença:** -10 XP

---

## 🔎 Análise Técnica

### Lógica Atual de Cálculo (Backend)

**Arquivo:** `src/lib/server/gamification.ts` (linha 324-354)

```typescript
// 1. Busca XP total já ganho deste quiz
const xpTotalGanho = (xpHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)

// 2. Calcula XP remanescente (limite máximo - já ganho)
const xpRemanescente = Math.max(0, xpMaximoQuiz - xpTotalGanho)

// 3. Calcula XP ganho proporcional à pontuação SOBRE O REMANESCENTE
const xpGanho = Math.round((params.pontuacao / 100) * xpRemanescente)
```

**Comportamento:**
- O sistema calcula XP baseado no **XP remanescente**, não no máximo total
- Isso permite ganhar XP incrementalmente até atingir 20 XP total
- Exemplo: Se já ganhou 10 XP, o remanescente é 10 XP. Se fizer 50%, ganha 5 XP (50% de 10), totalizando 15 XP.

### Problema na Exibição (Frontend)

**Arquivo:** `src/app/aluno/quiz/page.tsx` (linha 1074-1076)

```typescript
XP ganho: {quiz.melhorPontuacao 
  ? Math.round((quiz.melhorPontuacao / 100) * quiz.xpGanho) 
  : 0}/{quiz.xpGanho} XP
```

**Problema:**
- A exibição calcula XP como se fosse a **primeira tentativa**
- Usa `(melhorPontuacao / 100) * quiz.xpGanho` onde `quiz.xpGanho = 20` (máximo)
- **NÃO** usa o `xpTotalGanho` real que já está sendo buscado do banco

**Exemplo do Caso 2:**
- Melhor pontuação: 93.33%
- Cálculo exibido: `(93.33 / 100) * 20 = 18.66 ≈ 19 XP` ❌ (ERRADO)
- XP real ganho: 9 XP (provavelmente já tinha ganho ~10 XP antes)
- Cálculo correto: `(93.33 / 100) * 10 remanescente = 9.33 ≈ 9 XP` ✅

---

## 🐛 Causa Raiz

1. **Exibição Incorreta:** A UI mostra XP baseado no máximo (20), não no real ganho
2. **Possível Bug no Cálculo:** No Caso 1, se o usuário deveria ganhar 8 XP mas ganhou 4 XP, pode indicar:
   - Já tinha ganho 10 XP antes (remanescente = 10, então 40% de 10 = 4 XP) ✅
   - OU há um bug no cálculo do remanescente

---

## ✅ Solução

### 1. Corrigir Exibição na UI

**Mudança necessária:**
- Usar `quiz.xpTotalGanho` (já está sendo buscado) ao invés de calcular
- Exibir: `{quiz.xpTotalGanho || 0}/{quiz.xpGanho} XP`

### 2. Verificar Cálculo do Remanescente

**Verificação necessária:**
- Confirmar que `xpTotalGanho` está sendo calculado corretamente
- Garantir que todas as tentativas anteriores estão sendo somadas

### 3. Melhorar Feedback ao Usuário

**Sugestão:**
- Mostrar claramente: "XP ganho nesta tentativa: X XP"
- Mostrar: "XP total ganho neste quiz: Y/20 XP"
- Mostrar: "XP restante disponível: Z XP"

---

## 📊 Exemplo de Cálculo Correto

### Cenário: Quiz de 20 XP, múltiplas tentativas

**Tentativa 1:**
- Pontuação: 50%
- XP remanescente: 20 (primeira vez)
- XP ganho: `(50/100) * 20 = 10 XP`
- XP total: 10/20 XP

**Tentativa 2:**
- Pontuação: 40%
- XP remanescente: 10 (20 - 10 já ganho)
- XP ganho: `(40/100) * 10 = 4 XP`
- XP total: 14/20 XP

**Tentativa 3:**
- Pontuação: 100%
- XP remanescente: 6 (20 - 14 já ganho)
- XP ganho: `(100/100) * 6 = 6 XP`
- XP total: 20/20 XP ✅ (limite atingido)

---

## 🔧 Correções Implementadas

### ✅ 1. Corrigida Exibição na UI

**Arquivo:** `src/app/aluno/quiz/page.tsx` (linha 1074-1076)

**Antes:**
```typescript
{quiz.melhorPontuacao 
  ? Math.round((quiz.melhorPontuacao / 100) * quiz.xpGanho) 
  : 0}/{quiz.xpGanho} XP
```

**Depois:**
```typescript
{quiz.xpTotalGanho || 0}/{quiz.xpGanho} XP
```

**Resultado:** Agora exibe o XP real ganho (soma de todas as tentativas) ao invés de calcular baseado na melhor pontuação.

### ✅ 2. Adicionados Logs Detalhados

**Arquivo:** `src/lib/server/gamification.ts` (linha 340-365)

Logs adicionados para debug:
- XP máximo do quiz
- Histórico de XP ganho
- XP total ganho
- XP remanescente
- Cálculo detalhado do XP ganho na tentativa atual

**Exemplo de log:**
```
📊 [completarQuiz] Cálculo de XP: {
  userId: "...",
  quizId: "...",
  pontuacao: 40,
  xpMaximoQuiz: 20,
  xpHistoryEntries: 1,
  xpTotalGanho: 10,
  xpRemanescente: 10,
  historicoDetalhado: [10]
}
✅ [completarQuiz] XP calculado: {
  xpGanho: 4,
  calculo: "(40% / 100) * 10 = 4",
  novoXpTotal: 14
}
```

### ✅ 3. Script SQL de Verificação

**Arquivo:** `docs/supabase_verificar_xp_quiz.sql`

Scripts SQL criados para:
- Verificar quizzes com XP total maior que o máximo (20 XP)
- Verificar progresso sem histórico de XP correspondente
- Identificar possíveis duplicações de XP
- Resumo por aluno: XP ganho vs XP esperado
- Detalhamento de um aluno específico

---

## 📊 Próximos Passos

1. ⏳ Executar script SQL em produção para identificar dados inconsistentes
2. ⏳ Testar correções com dados reais
3. ⏳ Monitorar logs em produção para validar cálculos
4. ⏳ Considerar melhorar feedback ao usuário (mostrar XP ganho na tentativa atual)
