-- Script para verificar se a função complete_desafio_for_user existe no banco

-- Verificar se a função existe
SELECT 
    proname AS function_name,
    pg_get_function_identity_arguments(oid) AS arguments,
    prorettype::regtype AS return_type,
    prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'complete_desafio_for_user';

-- Se não retornar nenhuma linha, a função não existe
-- Execute o arquivo RLS_FUNCTION_AWARD_XP.sql para criá-la

-- Verificar permissões da função (usando acl)
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.proacl AS permissions
FROM pg_proc p
WHERE p.proname = 'complete_desafio_for_user';

-- Verificar se a função tem SECURITY DEFINER (deve retornar 't' = true)
SELECT 
    proname AS function_name,
    prosecdef AS security_definer,
    CASE WHEN prosecdef THEN 'SIM (correto)' ELSE 'NÃO (deve ser SECURITY DEFINER)' END AS status
FROM pg_proc
WHERE proname = 'complete_desafio_for_user';

