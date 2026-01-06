# Configuração RLS para Criação Automática de Usuários

## Problema

Quando um novo usuário se cadastra e faz login, o sistema tenta criar automaticamente um registro na tabela `users`, mas falha porque:

1. **Service Role Key não está configurada** - A API `/api/users/create` não consegue usar o Supabase Admin
2. **RLS está bloqueando** - As políticas de Row Level Security não permitem que usuários autenticados criem seu próprio registro

## Solução

Execute o SQL no arquivo `supabase_setup_users_rls.sql` no **Supabase SQL Editor** para configurar as políticas RLS necessárias.

### Passos:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase_setup_users_rls.sql`
4. Execute o SQL

### O que o SQL faz:

1. **Habilita RLS** na tabela `users` (se ainda não estiver habilitado)
2. **Cria política de SELECT** - Usuários podem ler seu próprio registro
3. **Cria política de INSERT** - Usuários podem criar seu próprio registro (esta é a principal!)
4. **Cria política de UPDATE** - Usuários podem atualizar seu próprio registro

### Após executar:

- Novos usuários serão criados automaticamente na tabela `users` quando fizerem login
- Não será mais necessário usar Service Role Key para criar usuários
- O sistema funcionará mesmo sem `SUPABASE_SERVICE_ROLE_KEY` configurada

## Alternativa: Trigger no Banco

Se preferir usar um trigger ao invés de RLS, você pode criar um trigger que cria o usuário automaticamente quando um novo usuário é criado no `auth.users`:

```sql
-- Trigger para criar usuário automaticamente quando novo usuário é criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, access_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email::text),
    'aluno',
    'full'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Nota:** Com o trigger, você não precisa das políticas RLS de INSERT, mas ainda precisa das de SELECT e UPDATE.

