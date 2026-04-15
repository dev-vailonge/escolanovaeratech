-- Script: inserir varios desafios de uma vez na tabela desafios
-- Uso: ajuste o JSON do bloco "lote" e execute no SQL Editor (Supabase/Postgres).

begin;

with lote(payload) as (
  values (
    '[
      {
        "titulo": "Desafio de Landing Page Responsiva",
        "descricao": "Monte uma landing page responsiva com SEO basico.",
        "tecnologia": "HTML",
        "dificuldade": "iniciante",
        "periodicidade": "semanal",
        "curso_id": "frontend",
        "requisitos": [
          "Layout responsivo para mobile e desktop",
          "Secoes de hero, beneficios e contato",
          "Publicacao no GitHub"
        ],
        "passos": [
          { "titulo": "Estrutura", "detalhes": "Crie o HTML semantico." },
          { "titulo": "Estilo", "detalhes": "Aplique CSS responsivo." },
          { "titulo": "Entrega", "detalhes": "Versione e documente no README." }
        ]
      },
      {
        "titulo": "Desafio de Consumo de API com React",
        "descricao": "Consuma uma API publica e exiba lista com busca e filtros.",
        "tecnologia": "React",
        "dificuldade": "intermediario",
        "periodicidade": "mensal",
        "curso_id": "frontend",
        "requisitos": [
          "Buscar dados de uma API publica",
          "Exibir estado de loading e erro",
          "Implementar filtro por texto"
        ],
        "passos": [
          { "titulo": "Setup", "detalhes": "Configure o projeto React." },
          { "titulo": "Integracao", "detalhes": "Implemente fetch e tratamento de erros." },
          { "titulo": "UX", "detalhes": "Adicione busca, filtros e pagina de detalhes." }
        ]
      }
    ]'::jsonb
  )
),
registros as (
  select
    gen_random_uuid() as id,
    item->>'titulo' as titulo,
    item->>'descricao' as descricao,
    item->>'tecnologia' as tecnologia,
    item->>'dificuldade' as dificuldade,
    150::int as xp, -- padrao da plataforma
    item->>'periodicidade' as periodicidade,
    null::timestamptz as prazo,
    coalesce(item->'requisitos', '[]'::jsonb) as requisitos,
    coalesce(item->'passos', '[]'::jsonb) as passos,
    null::text as imagem_url,
    nullif(item->>'curso_id', '') as curso_id,
    false::boolean as gerado_por_ia,
    null::uuid as solicitado_por,
    null::uuid as created_by
  from lote l
  cross join lateral jsonb_array_elements(l.payload) as item
),
validos as (
  select r.*
  from registros r
  where r.titulo is not null
    and r.descricao is not null
    and r.tecnologia is not null
    and r.dificuldade in ('iniciante', 'intermediario', 'avancado')
    and r.periodicidade in ('semanal', 'mensal', 'especial')
    and (r.curso_id is null or exists (select 1 from public.cursos c where c.id = r.curso_id))
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
  v.id,
  v.titulo,
  v.descricao,
  v.tecnologia,
  v.dificuldade,
  v.xp,
  v.periodicidade,
  v.prazo,
  v.requisitos,
  v.passos,
  v.imagem_url,
  v.curso_id,
  v.gerado_por_ia,
  v.solicitado_por,
  v.created_by
from validos v
returning id, titulo, curso_id, created_at;

commit;
