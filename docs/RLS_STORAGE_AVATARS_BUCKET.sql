-- ============================================================================
-- CONFIGURAÇÃO DE POLÍTICAS RLS PARA O BUCKET DE AVATARES (avatars)
-- ============================================================================
-- IMPORTANTE: Tente executar via SQL primeiro. Se der erro de permissão,
-- configure via Dashboard do Supabase (veja instruções no final do arquivo).
-- ============================================================================

-- Política 1: INSERT (Upload)
-- Permite que usuários autenticados façam upload de avatares no próprio diretório
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Usuários podem fazer upload de avatares próprios'
  ) THEN
    EXECUTE $$
    CREATE POLICY "Usuários podem fazer upload de avatares próprios"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    )$$;
  END IF;
END $$;

-- Política 2: UPDATE (Upsert)
-- Permite que usuários autenticados atualizem seus próprios avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Usuários podem atualizar avatares próprios'
  ) THEN
    EXECUTE $$
    CREATE POLICY "Usuários podem atualizar avatares próprios"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    )$$;
  END IF;
END $$;

-- Política 3: DELETE
-- Permite que usuários autenticados deletem seus próprios avatares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Usuários podem deletar avatares próprios'
  ) THEN
    EXECUTE $$
    CREATE POLICY "Usuários podem deletar avatares próprios"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    )$$;
  END IF;
END $$;

-- Política 4: SELECT (Download/Leitura)
-- Permite que qualquer pessoa leia avatares (para exibição)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Avatares são públicos para leitura'
  ) THEN
    EXECUTE $$
    CREATE POLICY "Avatares são públicos para leitura"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars')$$;
  END IF;
END $$;

-- ============================================================================
-- ALTERNATIVA: Se o SQL acima não funcionar, configure via Dashboard
-- ============================================================================
-- PASSO A PASSO:
-- 1. Acesse: Supabase Dashboard > Storage > avatars > Policies
-- 2. Clique em "New Policy" para cada política abaixo
-- ============================================================================

-- ============================================================================
-- EXPLICAÇÃO DAS POLÍTICAS
-- ============================================================================
--
-- INSERT/UPDATE/DELETE:
-- - Apenas usuários autenticados podem fazer essas operações
-- - Apenas no diretório próprio: avatars/{user_id}/*
-- - A função storage.foldername(name)[1] extrai o primeiro nível do caminho
--   (que deve ser o user_id)
-- - auth.uid()::text retorna o ID do usuário autenticado como texto
--
-- SELECT:
-- - Qualquer pessoa (incluindo não autenticados) pode ler avatares
-- - Necessário para exibir avatares nas páginas públicas
-- - Não há restrição de diretório (público pode ver todos os avatares)
--
-- ESTRUTURA DE PASTAS ESPERADA:
-- avatars/
--   └── {user_id}/
--       ├── 1234567890-abc123.jpg
--       ├── 1234567891-xyz789.png
--       └── ...
--
-- ============================================================================

