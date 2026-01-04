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

-- Verificar permissões da função
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    r.rolname AS granted_to
FROM pg_proc p
JOIN pg_proc_acl pa ON p.oid = pa.oid
JOIN pg_roles r ON pa.grantee = r.oid
WHERE p.proname = 'complete_desafio_for_user';

