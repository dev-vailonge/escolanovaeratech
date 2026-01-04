-- Adicionar status 'desistiu' ao CHECK constraint da tabela desafio_submissions
-- Este script atualiza a constraint para permitir o status 'desistiu'

-- Primeiro, remover a constraint antiga (se existir)
ALTER TABLE public.desafio_submissions
DROP CONSTRAINT IF EXISTS desafio_submissions_status_check;

-- Criar nova constraint que inclui 'desistiu'
ALTER TABLE public.desafio_submissions
ADD CONSTRAINT desafio_submissions_status_check
CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'desistiu'));

-- Verificar a constraint criada
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.desafio_submissions'::regclass
AND conname = 'desafio_submissions_status_check';
