-- Políticas RLS para o bucket de avatares (avatars)
-- Permite que usuários autenticados façam upload de seus próprios avatares

-- IMPORTANTE: Estas políticas devem ser configuradas no Supabase Storage
-- Via SQL Editor ou via Dashboard > Storage > avatars > Policies

-- Política para INSERT (upload): Usuários podem fazer upload no seu próprio diretório
CREATE POLICY "Usuários podem fazer upload de avatares próprios"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para UPDATE (upsert): Usuários podem atualizar seus próprios avatares
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
);

-- Política para DELETE: Usuários podem deletar seus próprios avatares
CREATE POLICY "Usuários podem deletar avatares próprios"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para SELECT (download): Público pode ler avatares (para exibição)
CREATE POLICY "Avatares são públicos para leitura"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Comentários explicativos
COMMENT ON POLICY "Usuários podem fazer upload de avatares próprios" ON storage.objects IS 
'Permite que usuários autenticados façam upload de avatares apenas no diretório com seu próprio user_id (avatars/{user_id}/*)';

COMMENT ON POLICY "Usuários podem atualizar avatares próprios" ON storage.objects IS 
'Permite que usuários autenticados atualizem seus próprios avatares';

COMMENT ON POLICY "Usuários podem deletar avatares próprios" ON storage.objects IS 
'Permite que usuários autenticados deletem seus próprios avatares';

COMMENT ON POLICY "Avatares são públicos para leitura" ON storage.objects IS 
'Permite que qualquer pessoa (incluindo não autenticados) leia avatares para exibição';

