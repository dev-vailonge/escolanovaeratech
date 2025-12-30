# 🔍 Análise: Problema de Login em Produção

## 📊 Situação Atual

- ✅ **Desenvolvimento**: Login funciona perfeitamente
- ❌ **Produção**: Erro "Invalid login credentials" após tentar fazer login
- 🔄 **Comportamento**: Página recarrega e volta para formulário de login

## 🐛 Erro Observado

```
AuthApiError: Invalid login credentials
```

## 🔬 Hipóteses de Causa

### 1. ⚙️ Variáveis de Ambiente Não Configuradas na Vercel
**Probabilidade: ALTA**

- Se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem configuradas na Vercel
- O código cria um cliente Supabase com placeholder que sempre falha
- **Verificação**: Verificar no dashboard da Vercel se as variáveis estão configuradas

### 2. 🔑 Variáveis de Ambiente Incorretas na Vercel
**Probabilidade: ALTA**

- URL ou KEY do Supabase podem estar incorretas
- Pode estar apontando para projeto Supabase diferente
- **Verificação**: Comparar variáveis do `.env.local` com as da Vercel

### 3. 👤 Usuário Não Existe no Supabase de Produção
**Probabilidade: MÉDIA**

- O usuário pode existir apenas no Supabase de desenvolvimento
- Produção pode usar um projeto Supabase diferente
- **Verificação**: Verificar se o email existe no Supabase de produção

### 4. 🔐 Senha Diferente Entre Ambientes
**Probabilidade: BAIXA**

- Usuário pode ter senha diferente em produção
- **Verificação**: Tentar resetar senha em produção

### 5. 🌐 Configuração de Domínio/CORS no Supabase
**Probabilidade: MÉDIA**

- Domínio de produção pode não estar autorizado no Supabase
- CORS pode estar bloqueando requisições
- **Verificação**: Verificar configurações de URL autorizadas no Supabase

## ✅ Checklist de Verificação

### 1. Verificar Variáveis de Ambiente na Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em: Projeto → Settings → Environment Variables
3. Verifique se existem:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Compare os valores com o `.env.local` local

### 2. Verificar Logs no Console do Navegador

Após o deploy com logs, verificar no console:
- `Supabase client initialization` - verifica se URL e KEY estão presentes
- `Login attempt starting` - verifica email e configuração
- `signInWithPassword result` - verifica resultado do login
- `Login error details` - verifica código e mensagem do erro

### 3. Verificar Usuário no Supabase

1. Acesse o dashboard do Supabase de produção
2. Vá em: Authentication → Users
3. Verifique se o email do usuário existe
4. Se não existir, criar usuário ou fazer signup em produção

### 4. Verificar Configurações do Supabase

1. Acesse: Settings → API
2. Verifique a URL do projeto
3. Verifique a anon/public key
4. Compare com as variáveis na Vercel

### 5. Verificar URL Autorizadas

1. Acesse: Authentication → URL Configuration
2. Verifique se `https://www.escolanovaeratech.com.br` está na lista
3. Adicione se necessário

## 🔧 Soluções Possíveis

### Solução 1: Configurar Variáveis na Vercel
```bash
# No dashboard da Vercel, adicionar:
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### Solução 2: Criar Usuário em Produção
- Fazer signup em produção primeiro
- Ou criar usuário manualmente no dashboard do Supabase

### Solução 3: Sincronizar Usuários
- Criar script para migrar usuários de dev para produção
- Ou usar mesmo projeto Supabase para ambos ambientes

## 📝 Próximos Passos

1. ✅ Deploy com logs de debug (já feito)
2. ⏳ Testar login em produção e verificar logs no console
3. ⏳ Analisar logs para identificar causa raiz
4. ⏳ Aplicar correção baseada nos logs
5. ⏳ Remover logs após correção confirmada

## 🔗 Links Úteis

- Dashboard Vercel: https://vercel.com/dashboard
- Dashboard Supabase: https://app.supabase.com
- Documentação Supabase Auth: https://supabase.com/docs/guides/auth

