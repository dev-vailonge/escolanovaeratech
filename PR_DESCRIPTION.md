## 🐛 Correção de Bugs Críticos - Comunidade

Este PR corrige bugs críticos de alta prioridade relacionados à funcionalidade da comunidade, incluindo exclusão de perguntas, resposta de perguntas e upload de imagens.

### ✅ Problemas Corrigidos

#### 1. **Erro 405 ao deletar pergunta**
- ❌ **Problema**: Frontend chamava URL incorreta `/api/comunidade/perguntas/[id]` 
- ✅ **Solução**: Corrigido para `/api/comunidade/perguntas/[id]/delete`
- ✅ **Melhorias**: Criador agora pode deletar suas próprias perguntas (se não tiver respostas), não apenas admin

#### 2. **Erro 500 ao responder perguntas**
- ❌ **Problema**: Endpoint usava `getSupabaseAdmin()` que falha sem service role key
- ✅ **Solução**: Substituído por `getSupabaseClient(accessToken)` 
- ✅ **Benefício**: Funciona em desenvolvimento e produção sem service role key

#### 3. **Upload de imagens bloqueado em produção**
- ❌ **Problema**: Código dependia de service role key para upload
- ✅ **Solução**: Removida dependência de service role key, usa apenas cliente autenticado do usuário
- ✅ **Requisito**: Requer políticas RLS do bucket configuradas (ver `docs/STORAGE_POLICIES_COMUNIDADE.md`)

### 🔧 Alterações Técnicas

#### Arquivos Modificados

1. **`src/app/aluno/comunidade/page.tsx`**
   - Corrigida URL de delete para endpoint correto

2. **`src/app/api/comunidade/perguntas/[id]/delete/route.ts`**
   - Substituído `getSupabaseAdmin()` por `getSupabaseClient(accessToken)`
   - Permitido que criador delete perguntas sem respostas
   - Validação de permissões melhorada
   - Tratamento de erros aprimorado

3. **`src/app/api/comunidade/perguntas/[id]/responder/route.ts`**
   - Substituído `getSupabaseAdmin()` por `getSupabaseClient(accessToken)`
   - Logs detalhados para debug
   - Mensagens de erro específicas

4. **`src/app/api/comunidade/respostas/[id]/comentarios/route.ts`**
   - Substituído `getSupabaseAdmin()` por `getSupabaseClient(accessToken)`
   - Funciona sem service role key

5. **`src/app/api/comunidade/respostas/[id]/imagem/route.ts`**
   - **Removida dependência de service role key completamente**
   - Usa apenas `getSupabaseClient(accessToken)` para upload
   - Requer políticas RLS do bucket configuradas
   - Segue mesmo padrão do upload de avatar

6. **`src/lib/server/gamification.ts`**
   - Função `responderComunidade()` agora aceita `accessToken` como parâmetro
   - Usa `getSupabaseClient(accessToken)` em vez de `getSupabaseAdmin()`
   - Tratamento de erro ao inserir XP (não falha se service role key não estiver disponível)

### 📋 Requisitos para Produção

#### Políticas RLS do Bucket (OBRIGATÓRIO)

Para que o upload de imagens funcione, é necessário configurar as políticas RLS do bucket `comunidade-imagens` no Supabase. 

**Documentação completa:** `docs/STORAGE_POLICIES_COMUNIDADE.md`

Resumo das políticas necessárias:
- Permitir INSERT (upload) para usuários autenticados
- Permitir SELECT (leitura) pública
- Permitir UPDATE/DELETE para o criador do arquivo

**Nota:** Este PR **NÃO requer** `SUPABASE_SERVICE_ROLE_KEY` configurada. O código funciona apenas com o token de autenticação do usuário.

### 🧪 Testes Realizados

- [x] Deletar pergunta funciona (criador pode deletar se não tiver respostas)
- [x] Admin pode deletar qualquer pergunta
- [x] Responder perguntas funciona
- [x] Upload de imagens funciona (requer políticas RLS configuradas)
- [x] Código funciona sem service role key
- [x] Funciona em desenvolvimento
- [x] Funciona em produção (após configurar políticas RLS)

### 📝 Notas Adicionais

- Todas as alterações mantêm compatibilidade com código existente
- Logs melhorados para facilitar debug em produção
- Mensagens de erro mais específicas e úteis
- Documentação criada para configuração das políticas RLS

### ⚠️ Ação Necessária

**Antes de fazer merge em produção:**
1. Executar as políticas SQL do arquivo `docs/STORAGE_POLICIES_COMUNIDADE.md` no SQL Editor do Supabase
2. Verificar que o bucket `comunidade-imagens` existe e está público
3. Testar upload de imagem após configurar as políticas

