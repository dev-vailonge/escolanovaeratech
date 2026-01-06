-- ============================================================
-- CONFIGURAÇÃO RLS PARA CRIAÇÃO AUTOMÁTICA DE USUÁRIOS
-- ============================================================
-- 
-- Execute este SQL no Supabase SQL Editor para permitir que
-- usuários autenticados criem seu próprio registro na tabela users
--
-- ============================================================

-- 1. Habilitar RLS na tabela users (se ainda não estiver habilitado)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Política para permitir que usuários autenticados LEIAM seu próprio registro
-- Só cria se não existir (mais seguro - não remove políticas existentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can read their own data'
  ) THEN
    CREATE POLICY "Users can read their own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

-- 3. Política para permitir que usuários autenticados CRIEM seu próprio registro
-- Esta é a política que permite criação automática no login
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert their own record'
  ) THEN
    CREATE POLICY "Users can insert their own record"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 4. Política para permitir que usuários autenticados ATUALIZEM seu próprio registro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update their own data'
  ) THEN
    CREATE POLICY "Users can update their own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 5. (Opcional) Política para admins lerem todos os usuários
-- Descomente se quiser que admins vejam todos os usuários
-- CREATE POLICY "Admins can read all users"
-- ON users
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE id = auth.uid() AND role = 'admin'
--   )
-- );

-- 6. Trigger para excluir usuário da tabela users quando for excluído do auth.users
-- Esta função será executada quando um usuário for excluído do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS trigger AS $$
BEGIN
  -- Excluir o usuário da tabela users quando for excluído do auth.users
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando usuário é excluído do auth.users
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deleted();

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- 
-- Para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
--
-- Para verificar se o trigger foi criado:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_deleted';
--
-- Para testar se funciona:
-- 1. Faça login como um usuário
-- 2. Tente inserir um registro na tabela users com o mesmo ID do auth.uid()
-- 3. Deve funcionar sem erro de permissão
--
-- Para testar o trigger de exclusão:
-- 1. Exclua um usuário do Supabase Auth (Authentication > Users > Delete)
-- 2. Verifique se o usuário também foi excluído da tabela users
--
-- ============================================================

