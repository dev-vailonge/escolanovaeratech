# 🔍 Auditoria: Problema de Login em Produção - Rota /aluno

## 📊 Situação Atual

- ✅ `/signin` → `/dashboard` **FUNCIONA** em produção
- ❌ `/aluno/login` → `/aluno` **NÃO FUNCIONA** em produção
- ✅ `/aluno/login` → `/aluno` **FUNCIONA** em desenvolvimento

## 🔬 Diferença Crítica Identificada

### Por que `/signin` funciona?
- **NÃO passa pelo middleware** (não está na lista de rotas protegidas)
- Login direto no cliente com `supabase.auth.signInWithPassword()`
- Redireciona para `/dashboard` sem verificação de cookies
- Usa apenas localStorage do Supabase

### Por que `/aluno` não funciona?
- **PASSA pelo middleware** (está na lista de rotas protegidas)
- Middleware verifica cookies HTTP antes de permitir acesso
- Supabase client usa localStorage, mas middleware precisa de cookies HTTP
- Cookies não estão sendo criados/enviados corretamente

## 🔄 Fluxo Atual Implementado

1. **Login no Cliente** (`/aluno/login/page.tsx`)
   - Usuário faz login → `supabase.auth.signInWithPassword()`
   - Sessão criada no localStorage
   - Tokens obtidos: `access_token` e `refresh_token`

2. **Redirect para Auth-Callback** (`/api/aluno/auth-callback`)
   - Recebe tokens via query string (GET)
   - Cria cliente Supabase: `createRouteHandlerClient({ cookies })`
   - Define sessão: `supabase.auth.setSession()`
   - **Cria cookies HTTP automaticamente**
   - Redireciona para `/aluno` (com cookies já criados)

3. **Middleware Verifica** (`middleware.ts`)
   - Intercepta requisição para `/aluno`
   - Cria cliente: `createMiddlewareClient({ req, res })`
   - Verifica sessão: `supabase.auth.getSession()`
   - **Lê cookies criados pelo auth-callback**
   - Permite acesso se sessão válida

## 🐛 Problemas Potenciais

### 1. Cookies não sendo criados
- **Sintoma**: Middleware não encontra cookies
- **Causa possível**: `createRouteHandlerClient` não está criando cookies
- **Verificação**: Logs no auth-callback mostram cookies criados?

### 2. Cookies não sendo enviados
- **Sintoma**: Cookies criados mas não chegam ao navegador
- **Causa possível**: Redirect não está incluindo cookies na resposta
- **Verificação**: Verificar headers da resposta do auth-callback

### 3. Cookies no formato errado
- **Sintoma**: Cookies existem mas middleware não consegue ler
- **Causa possível**: Formato do cookie não é o esperado pelo `createMiddlewareClient`
- **Verificação**: Verificar nome e formato dos cookies criados

### 4. Timing/race condition
- **Sintoma**: Cookies criados mas middleware verifica antes
- **Causa possível**: Redirect muito rápido
- **Verificação**: Adicionar delay ou garantir ordem

## 📝 Logs Adicionados para Debug

### No Auth-Callback (`/api/aluno/auth-callback`)
```typescript
console.log('[auth-callback] Cookies criados:', {
  totalCookies: allCookies.length,
  supabaseCookies: supabaseCookies.length,
  cookieNames: supabaseCookies.map(c => c.name),
  hasSession: !!data?.session,
  userId: data?.user?.id
})
```

### No Middleware (`middleware.ts`)
```typescript
console.log('[Middleware] Cookie check:', {
  pathname,
  totalCookies: allCookies.length,
  supabaseCookies: supabaseCookies.length,
  cookieNames: supabaseCookies.map(c => c.name)
})

console.log('[Middleware] Session check:', { 
  hasSession: !!session, 
  hasUser: !!session?.user, 
  userId: session?.user?.id,
  error: error?.message
})
```

## ✅ Como Verificar em Produção

### 1. Verificar Logs do Servidor (Vercel)
- Acesse: https://vercel.com/dashboard
- Vá em: Projeto → Deployments → [último deploy] → Functions
- Procure por logs do auth-callback e middleware
- Verifique se cookies estão sendo criados

### 2. Verificar Cookies no Navegador
- Abra DevTools (F12)
- Vá em: Application → Cookies → `www.escolanovaeratech.com.br`
- Após fazer login, verifique se há cookies do Supabase:
  - `sb-{projectRef}-auth-token`
  - Ou outros cookies com `sb-` ou `supabase`

### 3. Verificar Network Tab
- Abra DevTools → Network
- Faça login
- Verifique requisição para `/api/aluno/auth-callback`
- Verifique se há cookies na resposta (Set-Cookie header)
- Verifique requisição para `/aluno`
- Verifique se cookies são enviados (Cookie header)

### 4. Verificar Console do Navegador
- Abra DevTools → Console
- Procure por logs:
  - `✅ Login bem-sucedido`
  - `🔄 Redirecionando para callback`
  - Erros relacionados a cookies ou sessão

## 🔧 Próximos Passos de Debug

1. **Após deploy, verificar logs do Vercel**
   - Ver se auth-callback está criando cookies
   - Ver se middleware está encontrando cookies

2. **Verificar cookies no navegador**
   - Ver se cookies estão sendo criados
   - Ver formato e nome dos cookies

3. **Comparar com signin**
   - Ver por que signin funciona sem cookies
   - Ver se podemos usar mesma abordagem

4. **Se cookies não estão sendo criados**
   - Verificar se `createRouteHandlerClient` está funcionando
   - Verificar se `setSession` está funcionando
   - Verificar configuração do Supabase

5. **Se cookies estão sendo criados mas não lidos**
   - Verificar formato dos cookies
   - Verificar se middleware está lendo corretamente
   - Verificar se há problema de timing

## 📋 Checklist de Verificação

- [ ] Logs do auth-callback mostram cookies sendo criados?
- [ ] Cookies aparecem no navegador após login?
- [ ] Cookies têm o formato correto?
- [ ] Middleware consegue ler os cookies?
- [ ] Sessão é validada corretamente?
- [ ] Redirect funciona após criação de cookies?

## 🔗 Arquivos Modificados

- `src/app/aluno/login/page.tsx` - Login e redirect para auth-callback
- `src/app/api/aluno/auth-callback/route.ts` - Cria cookies e redireciona
- `src/middleware.ts` - Verifica sessão e cookies
- `src/app/api/aluno/sync-session/route.ts` - Alternativa (não usada atualmente)

## 💡 Possíveis Soluções Alternativas

### Solução 1: Desabilitar Middleware para /aluno (temporário)
- Remover `/aluno` do matcher do middleware
- Usar apenas validação no layout (como signin)
- **Prós**: Funciona imediatamente
- **Contras**: Menos seguro, não protege rotas

### Solução 2: Usar mesma abordagem do signin
- Fazer login sem verificação de cookies no middleware
- Validar apenas no layout/client-side
- **Prós**: Funciona como signin
- **Contras**: Menos seguro em produção

### Solução 3: Corrigir criação de cookies (atual)
- Garantir que cookies sejam criados corretamente
- Garantir que middleware leia cookies corretamente
- **Prós**: Mais seguro, correto
- **Contras**: Mais complexo, requer debug

## 🎯 Objetivo Final

Fazer o login em `/aluno/login` funcionar em produção da mesma forma que funciona em desenvolvimento, mantendo a segurança do middleware.

