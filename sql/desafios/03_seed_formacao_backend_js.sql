-- Script: seed da Formacao Backend JS em public.cursos_desafios
-- Referencia de conteudo: https://github.com/Escola-Nova-Era/form-backend/tree/main
-- Modelo de estrutura: mesma ideia usada na Formacao Android (cursos_desafios).
--
-- O script:
-- 1) cria/atualiza o curso "backend" em public.cursos;
-- 2) cria/atualiza 15 modulos (desafios) com ON CONFLICT (curso_id, slug);
-- 3) opcionalmente define o desafio destaque para o primeiro modulo.

begin;

insert into public.cursos (
  slug,
  nome,
  descricao_curta,
  ativo,
  ordem,
  xp_maximo,
  tags
)
select
  'backend',
  'Formação Backend JS',
  'Jornada guiada e desafios práticos: da primeira linha de código a aplicações com arquitetura e testes.',
  true,
  1,
  15500,
  '[]'::jsonb
where not exists (
  select 1
  from public.cursos c
  where c.slug = 'backend'
);

update public.cursos
set
  nome = 'Formação Backend JS',
  descricao_curta = 'Jornada guiada e desafios práticos: da primeira linha de código a aplicações com arquitetura e testes.',
  ativo = true,
  ordem = 1,
  xp_maximo = 15500,
  tags = '[]'::jsonb,
  updated_at = now()
where slug = 'backend';

do $$
begin
  if not exists (select 1 from public.cursos where slug = 'backend') then
    raise exception 'Curso com slug "backend" nao encontrado/nao criado em public.cursos.';
  end if;
end $$;

with modulos as (
  select
    (select c.id from public.cursos c where c.slug = 'backend' limit 1) as curso_id,
    v.ordem,
    v.slug,
    v.titulo,
    v.hero_titulo,
    v.resumo,
    v.objetivo,
    v.xp,
    v.tags,
    v.itens_pratica,
    v.requisitos,
    v.aulas_sugeridas,
    v.imagem_capa_url,
    v.imagem_detalhe_url,
    v.url_repositorio_referencia,
    v.metadata,
    null::jsonb as plano_estudos
  from (
    values
      (
        1,
        'desafio-01-crud-mysql',
        'Desafio 01 - CRUD com MySQL',
        'CRUD COM MYSQL',
        'Primeiro desafio da trilha Backend JS com operacoes essenciais de banco SQL.',
        'Construir um CRUD completo com SQL (CREATE, INSERT, SELECT, UPDATE, DELETE), aplicando modelagem basica e boas praticas de persistencia.',
        500,
        '["BACKEND","MYSQL","SQL","CRUD"]'::jsonb,
        '["Modelagem basica de tabela","Comandos DDL e DML","Operacoes de CRUD","Consultas SQL"]'::jsonb,
        '["Criar tabela principal com chave primaria","Inserir, listar, atualizar e remover registros","Versionar e documentar consultas no README"]'::jsonb,
        '[
          {"title":"Banco SQL - fundamentos","description":"Revisao de CREATE, INSERT, SELECT, UPDATE e DELETE."},
          {"title":"Boas praticas de modelagem","description":"Definicao de tipos, constraints e organizacao de scripts SQL."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-01-crud-mysql',
        '{"difficulty":"Iniciante","visual":"chart","level":"nivel-1"}'::jsonb
      ),
      (
        2,
        'desafio-02-mongodb-basico',
        'Desafio 02 - MongoDB Basico',
        'MONGODB BASICO',
        'Introducao pratica a NoSQL com colecoes, documentos e operacoes essenciais.',
        'Criar colecoes e manipular documentos no MongoDB usando filtros, atualizacoes e operacoes de remocao.',
        500,
        '["BACKEND","MONGODB","NOSQL","CRUD"]'::jsonb,
        '["Collections e documentos","Consultas find","Update e delete","Modelagem NoSQL inicial"]'::jsonb,
        '["Criar colecao com dados de exemplo","Implementar consultas com filtros","Atualizar e remover documentos","Registrar exemplos no README"]'::jsonb,
        '[
          {"title":"MongoDB Essentials","description":"Fundamentos de documentos, colecoes e operadores basicos."},
          {"title":"Modelagem NoSQL","description":"Quando usar embutido e quando referenciar documentos."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-02-mongodb-basico',
        '{"difficulty":"Iniciante","visual":"map","level":"nivel-1"}'::jsonb
      ),
      (
        3,
        'desafio-03-api-nestjs',
        'Desafio 03 - API com NestJS',
        'API COM NESTJS',
        'Construcao da primeira API estruturada com arquitetura modular e rotas REST.',
        'Desenvolver API com NestJS aplicando controllers, services, DTOs e validacao de entrada.',
        500,
        '["BACKEND","NESTJS","API","TYPESCRIPT"]'::jsonb,
        '["Arquitetura modular","Controllers e Services","DTOs","Validacao de dados"]'::jsonb,
        '["Criar endpoints REST basicos","Separar regras de negocio em services","Aplicar DTOs e validacoes","Padronizar respostas HTTP"]'::jsonb,
        '[
          {"title":"NestJS Basico","description":"Criacao de modulos, controllers e services."},
          {"title":"Validacao de requests","description":"Uso de DTOs e regras para entradas seguras."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-03-api-nestjs',
        '{"difficulty":"Iniciante","visual":"wireframe","level":"nivel-1"}'::jsonb
      ),
      (
        4,
        'desafio-04-docker-basico',
        'Desafio 04 - Docker Basico',
        'DOCKER BASICO',
        'Containerizacao inicial para padronizar ambiente de desenvolvimento backend.',
        'Containerizar a aplicacao backend com Dockerfile e executar o projeto em container de forma reproduzivel.',
        500,
        '["BACKEND","DOCKER","CONTAINERS","DEVOPS"]'::jsonb,
        '["Dockerfile","Build de imagem","Execucao de container","Variaveis de ambiente"]'::jsonb,
        '["Criar Dockerfile funcional","Buildar imagem da aplicacao","Executar container com variaveis","Documentar comandos de uso"]'::jsonb,
        '[
          {"title":"Docker para backend","description":"Build, run e nocao de camadas no Dockerfile."},
          {"title":"Ambiente padronizado","description":"Organizacao de dependencias e configuracoes de execucao."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-04-docker-basico',
        '{"difficulty":"Iniciante","visual":"phone","level":"nivel-1"}'::jsonb
      ),
      (
        5,
        'desafio-05-testes-jest',
        'Desafio 05 - Testes com Jest',
        'TESTES COM JEST',
        'Primeiros testes automatizados para garantir confiabilidade no backend.',
        'Escrever testes unitarios com Jest para cobrir regras de negocio e fluxos principais da API.',
        500,
        '["BACKEND","JEST","TESTES","QUALIDADE"]'::jsonb,
        '["Testes unitarios","Matchers","Mocks basicos","Cobertura inicial"]'::jsonb,
        '["Criar suite de testes para servicos","Cobrir cenarios de sucesso e erro","Usar mocks para dependencias","Gerar relatorio de cobertura"]'::jsonb,
        '[
          {"title":"Jest Fundamentals","description":"Estrutura de testes, describe/it e assertions."},
          {"title":"Teste de unidade backend","description":"Como isolar regras de negocio e medir cobertura."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-05-testes-jest',
        '{"difficulty":"Iniciante","visual":"crypto","level":"nivel-1"}'::jsonb
      ),
      (
        6,
        'desafio-06-relacionamentos-sql',
        'Desafio 06 - Relacionamentos SQL',
        'RELACIONAMENTOS SQL',
        'Evolucao da modelagem relacional com chaves estrangeiras e joins.',
        'Projetar relacionamentos 1:1, 1:N e N:N com integridade referencial e consultas com joins.',
        1000,
        '["BACKEND","SQL","RELACIONAMENTOS","MODELAGEM"]'::jsonb,
        '["Foreign keys","Joins","Integridade referencial","Normalizacao basica"]'::jsonb,
        '["Modelar entidades relacionadas","Aplicar constraints de FK","Construir consultas com JOIN","Validar regras ON DELETE e ON UPDATE"]'::jsonb,
        '[
          {"title":"Relational Modeling","description":"Como desenhar entidades e cardinalidade no SQL."},
          {"title":"Joins na pratica","description":"INNER/LEFT/RIGHT para consultas de negocio."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-06-relacionamentos-sql',
        '{"difficulty":"Intermediario","visual":"chart","level":"nivel-2"}'::jsonb
      ),
      (
        7,
        'desafio-07-rede-social-mongodb',
        'Desafio 07 - Rede Social MongoDB',
        'REDE SOCIAL MONGODB',
        'Modelagem de dominio social em NoSQL com foco em consultas e escalabilidade.',
        'Construir base de dados de rede social com documentos, relacionamentos referenciados e operacoes de agregacao.',
        1000,
        '["BACKEND","MONGODB","SOCIAL","AGGREGATION"]'::jsonb,
        '["Modelagem de feed","Relacionamentos em documentos","Consultas agregadas","Atualizacao de dados"]'::jsonb,
        '["Definir colecoes de usuarios e posts","Implementar interacoes (curtidas/comentarios)","Criar consultas agregadas","Documentar decisoes de modelagem"]'::jsonb,
        '[
          {"title":"MongoDB Aggregation","description":"Pipelines para filtros, agrupamentos e projecoes."},
          {"title":"Modelagem social","description":"Padroes para relacionamentos em redes sociais."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-07-rede-social-mongodb',
        '{"difficulty":"Intermediario","visual":"map","level":"nivel-2"}'::jsonb
      ),
      (
        8,
        'desafio-08-api-rest-completa',
        'Desafio 08 - API REST Completa',
        'API REST COMPLETA',
        'Implementacao de API robusta com padrao de rotas, validacoes e tratamento de erros.',
        'Entregar API REST completa com CRUDs, validacoes e respostas padronizadas em cenarios reais.',
        1000,
        '["BACKEND","REST","API","ARQUITETURA"]'::jsonb,
        '["Endpoints CRUD","Validacao de entrada","Tratamento de erros","Padrao de resposta"]'::jsonb,
        '["Implementar recursos principais da API","Padronizar codigos de status","Adicionar validacoes e middlewares","Documentar uso dos endpoints"]'::jsonb,
        '[
          {"title":"Boas praticas REST","description":"Padroes de rotas, recursos e status codes."},
          {"title":"Tratamento de erros","description":"Respostas consistentes para falhas de dominio e infraestrutura."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-08-api-rest-completa',
        '{"difficulty":"Intermediario","visual":"wireframe","level":"nivel-2"}'::jsonb
      ),
      (
        9,
        'desafio-09-docker-compose',
        'Desafio 09 - Docker Compose',
        'DOCKER COMPOSE',
        'Orquestracao de servicos backend com banco e aplicacao em ambiente integrado.',
        'Subir aplicacao e banco com Docker Compose, garantindo comunicacao entre servicos e configuracao consistente.',
        1000,
        '["BACKEND","DOCKER","DOCKER-COMPOSE","ORQUESTRACAO"]'::jsonb,
        '["docker-compose.yml","Networks e volumes","Variaveis de ambiente","Servico de banco"]'::jsonb,
        '["Configurar compose com app e banco","Definir volumes e rede","Garantir startup funcional","Documentar comandos de execucao"]'::jsonb,
        '[
          {"title":"Compose para backend","description":"Subida de multiplos servicos com dependencia entre containers."},
          {"title":"Ambientes locais consistentes","description":"Padronizacao de configuracao para equipe."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-09-docker-compose',
        '{"difficulty":"Intermediario","visual":"phone","level":"nivel-2"}'::jsonb
      ),
      (
        10,
        'desafio-10-testes-com-mock',
        'Desafio 10 - Testes com Mock',
        'TESTES COM MOCK',
        'Fortalecimento da qualidade com mocks, spies e cenarios assincronos.',
        'Criar testes com mock de dependencias externas para validar comportamento de servicos e fluxos assincronos.',
        1000,
        '["BACKEND","JEST","MOCK","TESTES"]'::jsonb,
        '["Mocks e spies","Testes assincronos","Isolamento de dependencias","Cenarios de erro"]'::jsonb,
        '["Mockar APIs/repositorios","Cobrir cenarios de sucesso, falha e timeout","Validar chamadas esperadas","Melhorar cobertura dos modulos criticos"]'::jsonb,
        '[
          {"title":"Mocks no Jest","description":"Simulacao de dependencias e validacao de interacoes."},
          {"title":"Testes assincronos","description":"Promises, rejects e controle de fluxo em testes."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-10-testes-com-mock',
        '{"difficulty":"Intermediario","visual":"crypto","level":"nivel-2"}'::jsonb
      ),
      (
        11,
        'desafio-11-api-estilo-spotify',
        'Desafio 11 - API Estilo Spotify',
        'API ESTILO SPOTIFY',
        'Projeto avancado de API com dominio mais rico e relacoes entre recursos.',
        'Construir API inspirada em plataforma de streaming, com recursos encadeados e consultas estruturadas.',
        1500,
        '["BACKEND","API","DESIGN","DOMINIO"]'::jsonb,
        '["Modelagem de dominio","Recursos relacionados","Consultas compostas","Padroes REST avancados"]'::jsonb,
        '["Modelar entidades de streaming","Implementar endpoints por recurso","Garantir consistencia entre relacoes","Documentar contrato da API"]'::jsonb,
        '[
          {"title":"API Design avancado","description":"Estrategias para recursos ricos e relacoes complexas."},
          {"title":"Modelagem orientada ao dominio","description":"Estruturar dados e regras para cenarios reais."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-11-api-estilo-spotify',
        '{"difficulty":"Avancado","visual":"media","level":"nivel-3"}'::jsonb
      ),
      (
        12,
        'desafio-12-autenticacao',
        'Desafio 12 - Autenticacao',
        'AUTENTICACAO',
        'Implementacao de autenticacao segura com fluxo de login e protecao de rotas.',
        'Aplicar autenticacao em API/backend incluindo validacao de credenciais, sessao/token e autorizacao basica.',
        1500,
        '["BACKEND","AUTH","SEGURANCA","JWT"]'::jsonb,
        '["Login e logout","Protecao de rotas","Validacao de credenciais","Autorizacao basica"]'::jsonb,
        '["Implementar fluxo de autenticacao","Proteger endpoints privados","Tratar erros de acesso","Documentar estrategia de seguranca"]'::jsonb,
        '[
          {"title":"Autenticacao backend","description":"Fluxo de login, tokens/sessoes e protecao de endpoints."},
          {"title":"Seguranca de API","description":"Boas praticas de validacao e autorizacao."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-12-autenticacao',
        '{"difficulty":"Avancado","visual":"map","level":"nivel-3"}'::jsonb
      ),
      (
        13,
        'desafio-13-docker-avancado',
        'Desafio 13 - Docker Avancado',
        'DOCKER AVANCADO',
        'Estrategias avancadas de containerizacao para ambientes mais profissionais.',
        'Aplicar boas praticas avancadas de Docker, incluindo otimizacao de imagem, variaveis e organizacao de deploy.',
        1500,
        '["BACKEND","DOCKER","DEVOPS","DEPLOY"]'::jsonb,
        '["Dockerfile avancado","Otimizacao de imagem","Configuracao de ambiente","Boas praticas de deploy"]'::jsonb,
        '["Refinar Dockerfile para producao","Aplicar configuracoes seguras","Reduzir tamanho de imagem","Documentar fluxo de build e release"]'::jsonb,
        '[
          {"title":"Docker avancado","description":"Tecnicas para imagens menores e builds mais eficientes."},
          {"title":"Preparacao para deploy","description":"Padroes de ambiente e variaveis para producao."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-13-docker-avancado',
        '{"difficulty":"Avancado","visual":"phone","level":"nivel-3"}'::jsonb
      ),
      (
        14,
        'desafio-14-arquitetura-multiplos-servicos',
        'Desafio 14 - Arquitetura com Multiplos Servicos',
        'MULTIPLOS SERVICOS',
        'Arquitetura backend distribuida com separacao de responsabilidades por servico.',
        'Estruturar sistema com multiplos servicos, comunicacao entre camadas e organizacao orientada a arquitetura.',
        1500,
        '["BACKEND","ARQUITETURA","MICROSERVICOS","ESCALABILIDADE"]'::jsonb,
        '["Separacao por servico","Comunicacao entre modulos","Organizacao em camadas","Observabilidade basica"]'::jsonb,
        '["Definir fronteiras de servicos","Implementar comunicacao entre componentes","Padronizar contratos","Documentar arquitetura e trade-offs"]'::jsonb,
        '[
          {"title":"Arquitetura de servicos","description":"Padroes para dividir dominio em modulos independentes."},
          {"title":"Integracao entre servicos","description":"Contratos, resiliencia e organizacao do ecossistema backend."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-14-arquitetura-multiplos-servicos',
        '{"difficulty":"Avancado","visual":"wireframe","level":"nivel-3"}'::jsonb
      ),
      (
        15,
        'desafio-15-projeto-final',
        'Desafio 15 - Projeto Final',
        'PROJETO FINAL BACKEND',
        'Encerramento da formacao com projeto completo para portfolio profissional.',
        'Entregar um projeto backend completo, aplicando APIs, banco, autenticacao, testes e deploy com documentacao final.',
        1500,
        '["BACKEND","PROJETO-FINAL","PORTFOLIO","PRODUCAO"]'::jsonb,
        '["Planejamento de escopo","Implementacao fim a fim","Qualidade e testes","Documentacao e entrega"]'::jsonb,
        '["Definir problema e arquitetura","Implementar API e persistencia","Aplicar autenticacao e testes","Publicar repositorio com README completo"]'::jsonb,
        '[
          {"title":"Projeto backend completo","description":"Consolidacao de todos os pilares da formacao."},
          {"title":"Entrega para portfolio","description":"Criterios de qualidade para demonstrar nivel profissional."}
        ]'::jsonb,
        null,
        null,
        'https://github.com/Escola-Nova-Era/form-backend/tree/main/desafio-15-projeto-final',
        '{"difficulty":"Avancado","visual":"media","level":"nivel-3"}'::jsonb
      )
  ) as v(
    ordem,
    slug,
    titulo,
    hero_titulo,
    resumo,
    objetivo,
    xp,
    tags,
    itens_pratica,
    requisitos,
    aulas_sugeridas,
    imagem_capa_url,
    imagem_detalhe_url,
    url_repositorio_referencia,
    metadata
  )
)
insert into public.cursos_desafios (
  curso_id,
  ordem,
  slug,
  titulo,
  hero_titulo,
  resumo,
  objetivo,
  xp,
  tags,
  itens_pratica,
  requisitos,
  aulas_sugeridas,
  imagem_capa_url,
  imagem_detalhe_url,
  url_repositorio_referencia,
  metadata,
  plano_estudos
)
select
  m.curso_id,
  m.ordem,
  m.slug,
  m.titulo,
  m.hero_titulo,
  m.resumo,
  m.objetivo,
  m.xp,
  m.tags,
  m.itens_pratica,
  m.requisitos,
  m.aulas_sugeridas,
  m.imagem_capa_url,
  m.imagem_detalhe_url,
  m.url_repositorio_referencia,
  m.metadata,
  m.plano_estudos
from modulos m
on conflict (curso_id, slug)
do update set
  ordem = excluded.ordem,
  titulo = excluded.titulo,
  hero_titulo = excluded.hero_titulo,
  resumo = excluded.resumo,
  objetivo = excluded.objetivo,
  xp = excluded.xp,
  tags = excluded.tags,
  itens_pratica = excluded.itens_pratica,
  requisitos = excluded.requisitos,
  aulas_sugeridas = excluded.aulas_sugeridas,
  imagem_capa_url = excluded.imagem_capa_url,
  imagem_detalhe_url = excluded.imagem_detalhe_url,
  url_repositorio_referencia = excluded.url_repositorio_referencia,
  metadata = excluded.metadata,
  plano_estudos = excluded.plano_estudos,
  updated_at = now();

-- Opcional: define o modulo 1 como destaque da formacao backend.
update public.cursos c
set desafio_destaque_id = d.id,
    updated_at = now()
from public.cursos_desafios d
where c.slug = 'backend'
  and d.curso_id = c.id
  and d.slug = 'desafio-01-crud-mysql';

-- Conferencia final
select
  d.ordem,
  d.slug,
  d.titulo,
  d.xp,
  d.metadata ->> 'difficulty' as difficulty,
  d.url_repositorio_referencia
from public.cursos_desafios d
where d.curso_id = (select c.id from public.cursos c where c.slug = 'backend' limit 1)
order by d.ordem;

commit;
