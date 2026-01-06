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
CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Política para permitir que usuários autenticados CRIEM seu próprio registro
-- Esta é a política que permite criação automática no login
CREATE POLICY "Users can insert their own record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Política para permitir que usuários autenticados ATUALIZEM seu próprio registro
CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- 
-- Para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
--
-- Para testar se funciona:
-- 1. Faça login como um usuário
-- 2. Tente inserir um registro na tabela users com o mesmo ID do auth.uid()
-- 3. Deve funcionar sem erro de permissão
--
-- ============================================================

