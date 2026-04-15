-- Script: inserir 1 novo desafio na tabela desafios
-- Uso: ajuste os valores do bloco "payload" e execute no SQL Editor (Supabase/Postgres).

begin;

with payload as (
  select
    -- Recomendado: gen_random_uuid() para id novo
    gen_random_uuid()::uuid as id,
    'Desafio de API REST com Next.js'::text as titulo,
    'Construa uma API REST com endpoints CRUD e validacoes basicas.'::text as descricao,
    'Next.js'::text as tecnologia,
    'intermediario'::text as dificuldade, -- iniciante | intermediario | avancado
    150::int as xp, -- padrao da plataforma
    'semanal'::text as periodicidade, -- semanal | mensal | especial
    null::timestamptz as prazo,
    jsonb_build_array(
      'Criar rotas para listar, criar, editar e remover registros',
      'Aplicar validacao minima dos dados de entrada',
      'Versionar no GitHub'
    ) as requisitos,
    jsonb_build_array(
      jsonb_build_object(
        'titulo', 'Planejamento',
        'detalhes', 'Defina entidades, campos e endpoints.'
      ),
      jsonb_build_object(
        'titulo', 'Implementacao',
        'detalhes', 'Implemente o CRUD e as validacoes.'
      ),
      jsonb_build_object(
        'titulo', 'Entrega',
        'detalhes', 'Publique o repositorio e documente como rodar.'
      )
    ) as passos,
    null::text as imagem_url,
    'frontend'::text as curso_id, -- ou null para desafio geral
    false::boolean as gerado_por_ia,
    null::uuid as solicitado_por,
    null::uuid as created_by
)
insert into public.desafios (
  id,
  titulo,
  descricao,
  tecnologia,
  dificuldade,
  xp,
  periodicidade,
  prazo,
  requisitos,
  passos,
  imagem_url,
  curso_id,
  gerado_por_ia,
  solicitado_por,
  created_by
)
select
  p.id,
  p.titulo,
  p.descricao,
  p.tecnologia,
  p.dificuldade,
  p.xp,
  p.periodicidade,
  p.prazo,
  p.requisitos,
  p.passos,
  p.imagem_url,
  p.curso_id,
  p.gerado_por_ia,
  p.solicitado_por,
  p.created_by
from payload p
where p.dificuldade in ('iniciante', 'intermediario', 'avancado')
  and p.periodicidade in ('semanal', 'mensal', 'especial')
  and p.xp > 0
  and (p.curso_id is null or exists (select 1 from public.cursos c where c.id = p.curso_id));

-- Conferencia rapida do ultimo item inserido
select
  d.id,
  d.titulo,
  d.tecnologia,
  d.dificuldade,
  d.periodicidade,
  d.xp,
  d.curso_id,
  d.created_at
from public.desafios d
order by d.created_at desc
limit 1;

commit;
