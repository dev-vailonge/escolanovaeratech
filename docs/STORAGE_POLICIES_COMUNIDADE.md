# Políticas RLS do Storage - Bucket comunidade-imagens

Para que o upload de imagens funcione **sem service role key**, as políticas RLS do bucket `comunidade-imagens` devem permitir upload para usuários autenticados.

## Políticas Necessárias

Execute o arquivo SQL `STORAGE_POLICIES_COMUNIDADE.sql` no SQL Editor do Supabase, ou copie e cole o conteúdo abaixo:

```sql
-- Remover políticas existentes se necessário (opcional)
DROP POLICY IF EXISTS "Permitir upload para usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update para criador" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete para criador" ON storage.objects;

-- Permitir INSERT (upload) para usuários autenticados
CREATE POLICY "Permitir upload para usuarios autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comunidade-imagens');

-- Permitir SELECT (leitura) para todos (bucket é público)
CREATE POLICY "Permitir leitura publica"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'comunidade-imagens');

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir update para criador"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'comunidade-imagens');

-- Permitir DELETE para usuários autenticados
CREATE POLICY "Permitir delete para criador"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'comunidade-imagens');
```

**Arquivo SQL completo:** `docs/STORAGE_POLICIES_COMUNIDADE.sql`

## Nota

O código agora usa apenas `getSupabaseClient()` (cliente autenticado do usuário) e **não requer** `SUPABASE_SERVICE_ROLE_KEY`.

