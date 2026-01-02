DROP POLICY IF EXISTS "Permitir upload para usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update para criador" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete para criador" ON storage.objects;

CREATE POLICY "Permitir upload para usuarios autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comunidade-imagens');

CREATE POLICY "Permitir leitura publica"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'comunidade-imagens');

CREATE POLICY "Permitir update para criador"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'comunidade-imagens');

CREATE POLICY "Permitir delete para criador"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'comunidade-imagens');

