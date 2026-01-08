# 📚 Documentação Técnica Completa
## Portal do Aluno - Escola Nova Era Tech

**Versão:** 1.0.0  
**Data:** Janeiro 2025  
**Stack:** Next.js 14 + TypeScript + Supabase + TailwindCSS

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Diretórios](#2-estrutura-de-diretórios)
3. [Banco de Dados (Supabase)](#3-banco-de-dados-supabase)
4. [Sistema de Autenticação](#4-sistema-de-autenticação)
5. [Sistema de Gamificação](#5-sistema-de-gamificação)
6. [Páginas do Dashboard do Aluno](#6-páginas-do-dashboard-do-aluno)
7. [APIs (Routes)](#7-apis-routes)
8. [Componentes Principais](#8-componentes-principais)
9. [Contextos (State Management)](#9-contextos-state-management)
10. [Integrações Externas](#10-integrações-externas)
11. [Políticas RLS (Row Level Security)](#11-políticas-rls-row-level-security)
12. [Variáveis de Ambiente](#12-variáveis-de-ambiente)
13. [Scripts SQL Importantes](#13-scripts-sql-importantes)
14. [Fluxos de Negócio](#14-fluxos-de-negócio)
15. [Guia de Manutenção](#15-guia-de-manutenção)

---

## 1. Visão Geral da Arquitetura

### 1.1 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | Next.js (App Router) | 14.2.x |
| Linguagem | TypeScript | 5.x |
| Estilização | TailwindCSS | 3.x |
| Banco de Dados | Supabase (PostgreSQL) | - |
| Autenticação | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Realtime | Supabase Realtime | - |
| IA | OpenAI GPT-4 | - |
| Deploy | Vercel | - |

### 1.2 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router                                              │
│  ├── /aluno/* (Dashboard do Aluno - Protegido)                  │
│  ├── /api/* (API Routes - Server Side)                          │
│  └── /* (Landing Pages - Público)                               │
├─────────────────────────────────────────────────────────────────┤
│                        MIDDLEWARE                                │
│  - Verificação de autenticação                                   │
│  - Redirecionamento de rotas protegidas                         │
│  - Validação de cookies Supabase                                │
├─────────────────────────────────────────────────────────────────┤
│                     SUPABASE BACKEND                             │
│  ├── Auth (Autenticação JWT)                                    │
│  ├── Database (PostgreSQL + RLS)                                │
│  ├── Storage (Avatars, Imagens Comunidade)                      │
│  └── Realtime (Notificações em tempo real)                      │
├─────────────────────────────────────────────────────────────────┤
│                   INTEGRAÇÕES EXTERNAS                           │
│  └── OpenAI API (Geração de Quiz e Desafios)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Padrões de Projeto

- **App Router**: Estrutura de páginas baseada em diretórios
- **Server Components**: Componentes renderizados no servidor por padrão
- **Client Components**: Marcados com `'use client'` quando necessário
- **API Routes**: Endpoints RESTful em `/app/api/`
- **Context API**: Gerenciamento de estado global (Auth, Theme, Notifications)
- **RLS (Row Level Security)**: Segurança a nível de banco de dados

---

## 2. Estrutura de Diretórios

```
escolanovaeratech/
├── src/
│   ├── app/                          # App Router (páginas e APIs)
│   │   ├── aluno/                    # Dashboard do Aluno
│   │   │   ├── admin/                # Painel Administrativo
│   │   │   │   ├── components/       # Tabs do admin
│   │   │   │   └── page.tsx
│   │   │   ├── aulas/                # Página de Aulas (em breve)
│   │   │   ├── central-de-ajuda/     # Manual do Portal
│   │   │   ├── comunidade/           # Fórum Q&A
│   │   │   │   └── pergunta/[id]/    # Detalhe da pergunta
│   │   │   ├── desafios/             # Desafios de código
│   │   │   ├── formularios/          # Formulários/Pesquisas
│   │   │   ├── perfil/               # Perfil do usuário
│   │   │   ├── quiz/                 # Quizzes
│   │   │   ├── ranking/              # Ranking e Mural
│   │   │   ├── login/                # Login
│   │   │   ├── signup/               # Cadastro
│   │   │   ├── forgot-password/      # Recuperação de senha
│   │   │   ├── reset-password/       # Reset de senha
│   │   │   ├── layout.tsx            # Layout do dashboard
│   │   │   └── page.tsx              # Página inicial (Início)
│   │   ├── api/                      # API Routes
│   │   │   ├── admin/                # APIs administrativas
│   │   │   ├── aluno/                # APIs de autenticação aluno
│   │   │   ├── auth/                 # APIs de autenticação geral
│   │   │   ├── comunidade/           # APIs da comunidade
│   │   │   ├── desafios/             # APIs de desafios
│   │   │   ├── formularios/          # APIs de formulários
│   │   │   ├── quiz/                 # APIs de quiz
│   │   │   ├── ranking/              # APIs de ranking
│   │   │   ├── sugestoes/            # APIs de sugestões/bugs
│   │   │   ├── users/                # APIs de usuários
│   │   │   └── xp/                   # APIs de XP
│   │   ├── globals.css               # Estilos globais
│   │   ├── layout.tsx                # Layout raiz
│   │   └── page.tsx                  # Landing page
│   ├── components/                   # Componentes reutilizáveis
│   │   ├── aluno/                    # Componentes do dashboard
│   │   ├── comunidade/               # Componentes da comunidade
│   │   ├── quiz/                     # QuizPlayer
│   │   └── ui/                       # Componentes de UI genéricos
│   ├── lib/                          # Utilitários e lógica
│   │   ├── server/                   # Código server-side
│   │   │   ├── gamification.ts       # Lógica de XP server
│   │   │   ├── getSupabaseClient.ts  # Cliente Supabase autenticado
│   │   │   ├── supabaseAdmin.ts      # Cliente com service role
│   │   │   └── requestAuth.ts        # Validação de JWT
│   │   ├── gamification/             # Constantes de XP
│   │   ├── constants/                # Constantes (cursos, etc)
│   │   ├── AuthContext.tsx           # Contexto de autenticação
│   │   ├── NotificationsContext.tsx  # Contexto de notificações
│   │   ├── ThemeContext.tsx          # Contexto de tema
│   │   ├── gamification.ts           # Lógica de níveis client
│   │   ├── supabase.ts               # Cliente Supabase
│   │   └── openai.ts                 # Integração OpenAI
│   └── types/                        # Tipos TypeScript
│       ├── database.ts               # Tipos das tabelas
│       └── quiz.ts                   # Tipos de quiz
├── docs/                             # Documentação e scripts SQL
├── public/                           # Arquivos estáticos
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## 3. Banco de Dados (Supabase)

### 3.1 Diagrama de Entidades

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │     quizzes     │     │    desafios     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ titulo          │     │ titulo          │
│ name            │     │ descricao       │     │ descricao       │
│ role            │     │ tecnologia      │     │ tecnologia      │
│ access_level    │     │ nivel           │     │ dificuldade     │
│ level           │     │ questoes (JSON) │     │ xp              │
│ xp              │     │ xp              │     │ periodicidade   │
│ xp_mensal       │     │ disponivel      │     │ requisitos(JSON)│
│ coins           │     │ created_by (FK) │     │ curso_id        │
│ streak          │     │ created_at      │     │ gerado_por_ia   │
│ avatar_url      │     └─────────────────┘     │ created_by (FK) │
│ bio             │                              └─────────────────┘
│ created_at      │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│user_quiz_progress│    │user_desafio_    │     │ user_xp_history │
├─────────────────┤     │   progress      │     ├─────────────────┤
│ id (PK)         │     ├─────────────────┤     │ id (PK)         │
│ user_id (FK)    │     │ id (PK)         │     │ user_id (FK)    │
│ quiz_id (FK)    │     │ user_id (FK)    │     │ source          │
│ completo        │     │ desafio_id (FK) │     │ source_id       │
│ pontuacao       │     │ completo        │     │ amount          │
│ tentativas      │     │ created_at      │     │ description     │
│ melhor_pontuacao│     └─────────────────┘     │ created_at      │
│ respostas (JSON)│                              └─────────────────┘
│ created_at      │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    perguntas    │     │    respostas    │     │  notificacoes   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ titulo          │     │ pergunta_id(FK) │     │ titulo          │
│ descricao       │     │ autor_id (FK)   │     │ mensagem        │
│ autor_id (FK)   │     │ conteudo        │     │ tipo            │
│ tags (ARRAY)    │     │ votos           │     │ data_inicio     │
│ categoria       │     │ melhor_resposta │     │ data_fim        │
│ votos           │     │ resposta_pai_id │     │ publico_alvo    │
│ visualizacoes   │     │ mencoes (ARRAY) │     │ target_user_id  │
│ resolvida       │     │ imagem_url      │     │ is_sugestao_bug │
│ melhor_resposta │     │ created_at      │     │ imagem_url      │
│ imagem_url      │     └─────────────────┘     │ action_url      │
│ created_at      │                              │ created_by (FK) │
└─────────────────┘                              └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   formularios   │     │ formulario_     │     │desafio_submissions│
├─────────────────┤     │   respostas     │     ├─────────────────┤
│ id (PK)         │     ├─────────────────┤     │ id (PK)         │
│ nome            │     │ id (PK)         │     │ user_id (FK)    │
│ tipo            │     │ formulario_id   │     │ desafio_id (FK) │
│ ativo           │     │ user_id (FK)    │     │ github_url      │
│ perguntas(JSON) │     │ respostas(JSON) │     │ status          │
│ created_by (FK) │     │ created_at      │     │ admin_notes     │
│ created_at      │     └─────────────────┘     │ reviewed_by(FK) │
└─────────────────┘                              │ reviewed_at     │
                                                 └─────────────────┘

┌─────────────────┐
│openai_token_usage│
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ feature         │
│ endpoint        │
│ model           │
│ prompt_tokens   │
│ completion_tokens│
│ total_tokens    │
│ estimated_cost  │
│ metadata (JSON) │
│ created_at      │
└─────────────────┘
```

### 3.2 Tabelas Detalhadas

#### 3.2.1 `users` - Usuários do Sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK - ID do Supabase Auth |
| `email` | VARCHAR | Email único |
| `name` | VARCHAR | Nome completo |
| `role` | ENUM | `'aluno'` ou `'admin'` |
| `access_level` | ENUM | `'full'` ou `'limited'` |
| `level` | INTEGER | Nível atual (1-9) |
| `xp` | INTEGER | XP total acumulado |
| `xp_mensal` | INTEGER | XP do mês (zera mensalmente) |
| `coins` | INTEGER | Moedas (não usado no MVP) |
| `streak` | INTEGER | Dias consecutivos (não usado) |
| `avatar_url` | TEXT | URL do avatar no Storage |
| `bio` | TEXT | Biografia do usuário |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

**Políticas RLS:**
- Alunos podem ler/atualizar apenas seu próprio registro
- Admins podem ler todos os registros
- Função `is_admin()` para verificação de admin

---

#### 3.2.2 `quizzes` - Quizzes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `titulo` | VARCHAR | Título do quiz |
| `descricao` | TEXT | Descrição |
| `tecnologia` | VARCHAR | Ex: "Next.js", "Python" |
| `nivel` | ENUM | `'iniciante'`, `'intermediario'`, `'avancado'` |
| `questoes` | JSONB | Array de perguntas |
| `xp` | INTEGER | XP máximo (padrão: 20) |
| `disponivel` | BOOLEAN | Se está ativo |
| `created_by` | UUID | FK -> users.id |
| `created_at` | TIMESTAMP | Data de criação |

**Estrutura do campo `questoes` (JSONB):**
```typescript
interface QuizQuestion {
  id: string
  prompt: string              // Texto da pergunta
  options: {
    id: string
    label: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
    text: string
  }[]
  correctOptionId: string     // ID da opção correta
  points: number              // Pontos por acerto
  explanation?: string        // Explicação
}
```

---

#### 3.2.3 `user_quiz_progress` - Progresso em Quizzes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK -> users.id |
| `quiz_id` | UUID | FK -> quizzes.id |
| `completo` | BOOLEAN | Se completou |
| `pontuacao` | INTEGER | Pontuação da última tentativa |
| `tentativas` | INTEGER | Número de tentativas |
| `melhor_pontuacao` | INTEGER | Melhor pontuação |
| `respostas` | JSONB | Respostas da última tentativa |
| `created_at` | TIMESTAMP | Primeira tentativa |
| `updated_at` | TIMESTAMP | Última tentativa |

**Estrutura do campo `respostas` (JSONB):**
```typescript
interface QuizAnswer {
  questionId: string
  selectedOptionId: string
  correct: boolean
}[]
```

---

#### 3.2.4 `desafios` - Desafios de Código

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `titulo` | VARCHAR | Título |
| `descricao` | TEXT | Descrição completa |
| `tecnologia` | VARCHAR | Tecnologia principal |
| `dificuldade` | ENUM | `'iniciante'`, `'intermediario'`, `'avancado'` |
| `xp` | INTEGER | XP ao completar (padrão: 50) |
| `periodicidade` | ENUM | `'semanal'`, `'mensal'`, `'especial'` |
| `prazo` | TIMESTAMP | Data limite (opcional) |
| `requisitos` | JSONB | Array de requisitos |
| `curso_id` | VARCHAR | Curso vinculado (opcional) |
| `gerado_por_ia` | BOOLEAN | Se foi gerado pela IA |
| `solicitado_por` | UUID | Quem solicitou (se IA) |
| `created_by` | UUID | FK -> users.id |
| `created_at` | TIMESTAMP | Data de criação |

**Valores de `curso_id`:**
- `'android'` - Android (Kotlin)
- `'frontend'` - Web Frontend (React)
- `'backend'` - Backend NodeJs
- `'ios'` - iOS (Swift)
- `'analise-dados'` - Análise de Dados (Python)
- `'norte-tech'` - Norte Tech
- `'logica-programacao'` - Lógica de Programação
- `null` - Desafio Geral

---

#### 3.2.5 `desafio_submissions` - Submissões de Desafios

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK -> users.id |
| `desafio_id` | UUID | FK -> desafios.id |
| `github_url` | VARCHAR | URL do repositório |
| `status` | ENUM | `'pendente'`, `'aprovado'`, `'rejeitado'` |
| `admin_notes` | TEXT | Notas do admin |
| `reviewed_by` | UUID | Admin que revisou |
| `reviewed_at` | TIMESTAMP | Data da revisão |
| `created_at` | TIMESTAMP | Data da submissão |

---

#### 3.2.6 `user_xp_history` - Histórico de XP

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK -> users.id |
| `source` | ENUM | `'aula'`, `'quiz'`, `'desafio'`, `'comunidade'` |
| `source_id` | UUID | ID da fonte (quiz_id, desafio_id, etc) |
| `amount` | INTEGER | Quantidade de XP |
| `description` | TEXT | Descrição legível |
| `created_at` | TIMESTAMP | Data do ganho |

---

#### 3.2.7 `perguntas` - Perguntas da Comunidade

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `titulo` | VARCHAR | Título da pergunta |
| `descricao` | TEXT | Descrição detalhada |
| `autor_id` | UUID | FK -> users.id |
| `tags` | TEXT[] | Array de tags |
| `categoria` | VARCHAR | Categoria |
| `votos` | INTEGER | Contagem de votos |
| `visualizacoes` | INTEGER | Contagem de views |
| `resolvida` | BOOLEAN | Se foi resolvida |
| `melhor_resposta_id` | UUID | FK -> respostas.id |
| `imagem_url` | TEXT | Imagem anexada |
| `created_at` | TIMESTAMP | Data de criação |

---

#### 3.2.8 `respostas` - Respostas da Comunidade

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `pergunta_id` | UUID | FK -> perguntas.id |
| `autor_id` | UUID | FK -> users.id |
| `conteudo` | TEXT | Conteúdo da resposta |
| `votos` | INTEGER | Contagem de votos |
| `melhor_resposta` | BOOLEAN | Se é a melhor |
| `resposta_pai_id` | UUID | Para comentários aninhados |
| `mencoes` | UUID[] | IDs de usuários mencionados |
| `imagem_url` | TEXT | Imagem anexada |
| `created_at` | TIMESTAMP | Data de criação |

---

#### 3.2.9 `notificacoes` - Sistema de Notificações

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `titulo` | VARCHAR | Título |
| `mensagem` | TEXT | Mensagem |
| `tipo` | ENUM | `'info'`, `'update'`, `'warning'` |
| `data_inicio` | TIMESTAMP | Início da vigência |
| `data_fim` | TIMESTAMP | Fim da vigência |
| `publico_alvo` | ENUM | `'todos'`, `'alunos-full'`, `'alunos-limited'` |
| `target_user_id` | UUID | Notificação individual (opcional) |
| `is_sugestao_bug` | BOOLEAN | Se é sugestão/bug de aluno |
| `imagem_url` | TEXT | Imagem anexada |
| `action_url` | VARCHAR | URL de ação ao clicar |
| `created_by` | UUID | Criador (admin ou aluno) |
| `created_at` | TIMESTAMP | Data de criação |

---

#### 3.2.10 `formularios` - Formulários/Pesquisas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `nome` | VARCHAR | Nome do formulário |
| `tipo` | VARCHAR | Tipo (ex: "pesquisa", "feedback") |
| `ativo` | BOOLEAN | Se está ativo |
| `perguntas` | JSONB | Array de perguntas |
| `created_by` | UUID | FK -> users.id |
| `created_at` | TIMESTAMP | Data de criação |

**Estrutura do campo `perguntas` (JSONB):**
```typescript
interface FormularioPergunta {
  id: string
  texto: string
  tipo: 'texto' | 'multipla_escolha' | 'checkbox' | 'escala'
  opcoes?: string[]     // Para múltipla escolha e checkbox
  obrigatoria: boolean
  pontos?: number       // XP ao responder (opcional)
}
```

---

#### 3.2.11 `openai_token_usage` - Consumo de Tokens OpenAI

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK -> users.id |
| `feature` | VARCHAR | Feature que usou (quiz, desafio) |
| `endpoint` | VARCHAR | Endpoint da API |
| `model` | VARCHAR | Modelo usado (gpt-4, etc) |
| `prompt_tokens` | INTEGER | Tokens de prompt |
| `completion_tokens` | INTEGER | Tokens de resposta |
| `total_tokens` | INTEGER | Total de tokens |
| `estimated_cost_usd` | DECIMAL | Custo estimado em USD |
| `metadata` | JSONB | Dados adicionais |
| `created_at` | TIMESTAMP | Data do uso |

---

### 3.3 Buckets de Storage

| Bucket | Descrição | Políticas |
|--------|-----------|-----------|
| `avatars` | Avatares dos usuários | Usuário pode ler/escrever seu próprio, leitura pública |
| `comunidade` | Imagens de perguntas/respostas | Autenticados podem escrever, leitura pública |

---

## 4. Sistema de Autenticação

### 4.1 Fluxo de Autenticação

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   /aluno/login  │     │  Supabase Auth  │     │  Tabela users   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. Email/Senha        │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 2. JWT Token          │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 3. Buscar dados user  │                       │
         ├───────────────────────┼──────────────────────►│
         │                       │                       │
         │ 4. Dados do usuário   │                       │
         │◄──────────────────────┼───────────────────────┤
         │                       │                       │
         │ 5. Criar AuthUser     │                       │
         │   (Context State)     │                       │
         ▼                       │                       │
┌─────────────────┐              │                       │
│ AuthContext.tsx │              │                       │
│   user state    │              │                       │
└─────────────────┘              │                       │
```

### 4.2 Middleware de Proteção

**Arquivo:** `src/middleware.ts`

**Rotas Protegidas:**
- `/aluno/*` (exceto login, signup, forgot-password, reset-password)

**Rotas Públicas do Aluno:**
- `/aluno/login`
- `/aluno/signup`
- `/aluno/forgot-password`
- `/aluno/reset-password`
- `/aluno/auth/confirm`

**Lógica:**
1. Verifica se há cookies do Supabase
2. Valida sessão com `createMiddlewareClient`
3. Redireciona para `/aluno/login` se não autenticado
4. Em desenvolvimento, mais permissivo

### 4.3 AuthContext

**Arquivo:** `src/lib/AuthContext.tsx`

**Interface AuthUser:**
```typescript
interface AuthUser {
  id: string
  name: string
  email: string
  role: 'aluno' | 'admin'
  accessLevel: 'full' | 'limited'
  avatarUrl: string | null
  bio: string | null
  level: number
  xp: number
  xpMensal: number
  coins: number
  streak: number
  createdAt: string
}
```

**Funções disponíveis:**
- `user` - Usuário atual
- `loading` - Estado de carregamento
- `initialized` - Se auth foi inicializado
- `signOut()` - Fazer logout
- `refreshSession()` - Atualizar sessão
- `initializeAuth()` - Inicializar auth

### 4.4 Validação de JWT em APIs

**Arquivo:** `src/lib/server/requestAuth.ts`

```typescript
// Extrair e validar userId do Bearer token
const userId = await requireUserIdFromBearer(request)

// Extrair token para passar ao Supabase
const accessToken = getAccessTokenFromBearer(request)
```

---

## 5. Sistema de Gamificação

### 5.1 Constantes de XP

**Arquivo:** `src/lib/gamification/constants.ts`

```typescript
export const XP_CONSTANTS = {
  comunidade: {
    pergunta: 10,        // Criar uma pergunta
    resposta: 1,         // Responder uma pergunta
    respostaCerta: 100,  // Ter resposta marcada como correta
  },
  quiz: {
    maximo: 20,          // XP máximo por quiz (proporcional à pontuação)
  },
  desafio: {
    completo: 50,        // Completar um desafio
  },
  formulario: {
    preenchido: 1,       // Preencher formulário
  },
}
```

### 5.2 Sistema de Níveis

**Arquivo:** `src/lib/gamification.ts`

**Thresholds de XP:**
```
Nível 1: 0 XP      (Iniciante)
Nível 2: 10 XP     (Iniciante)
Nível 3: 20 XP     (Iniciante)
Nível 4: 40 XP     (Intermediário)
Nível 5: 80 XP     (Intermediário)
Nível 6: 160 XP    (Intermediário)
Nível 7: 320 XP    (Avançado)
Nível 8: 640 XP    (Avançado)
Nível 9: 1280 XP   (Avançado)
```

**Funções principais:**
```typescript
// Calcular nível baseado em XP
calculateLevel(totalXP: number): number

// Obter categoria do nível
getLevelCategory(level: number): 'iniciante' | 'intermediario' | 'avancado'

// Obter cor da borda baseada no nível
getLevelBorderColor(level: number): string
// Retorna: 'border-yellow-500' | 'border-blue-500' | 'border-purple-600'

// Calcular progresso para próximo nível
getLevelProgress(currentXP: number, currentLevel: number): number // 0-100
```

### 5.3 Inserção de XP (Server-Side)

**Arquivo:** `src/lib/server/gamification.ts`

**Fluxo de inserção:**
1. Tenta usar função RPC `award_xp_to_user` (SECURITY DEFINER)
2. Se falhar, usa INSERT direto (fallback)
3. Sincroniza nível automaticamente após inserir

**Funções principais:**
```typescript
// Inserir entrada de XP
insertXpEntry({
  userId: string
  source: 'aula' | 'quiz' | 'desafio' | 'comunidade'
  sourceId: string
  amount: number
  description?: string
  accessToken?: string
})

// Completar quiz
completarQuiz({
  userId: string
  quizId: string
  pontuacao: number  // 0-100
  respostas?: { questionId, selectedOptionId, correct }[]
  accessToken?: string
})

// Completar desafio
completarDesafio({
  userId: string
  desafioId: string
  accessToken?: string
})

// Responder na comunidade
responderComunidade({
  userId: string
  perguntaId: string
  conteudo: string
  accessToken?: string
})
```

### 5.4 Ranking

**Tipos de Ranking:**
- **Mensal:** Baseado em `xp_mensal` (zera todo mês)
- **Geral:** Baseado em `xp` (acumulado total)

**API:** `GET /api/ranking?type=mensal|geral&limit=50`

---

## 6. Páginas do Dashboard do Aluno

### 6.1 Página Inicial (`/aluno`)

**Arquivo:** `src/app/aluno/page.tsx`

**Features:**
- Card de boas-vindas com nome e nível
- Progresso de XP para próximo nível
- Top 3 do ranking (mensal e geral)
- Quiz em destaque
- Notificações/Avisos da escola
- Estatísticas do aluno

**Tabelas utilizadas:**
- `users` - Dados do usuário
- `quizzes` - Quiz em destaque
- `notificacoes` - Avisos
- `user_xp_history` - Histórico XP

---

### 6.2 Ranking (`/aluno/ranking`)

**Arquivo:** `src/app/aluno/ranking/page.tsx`

**Features:**
- Ranking completo (mensal/geral)
- Mural dos Campeões (12 meses)
- Countdown para fim do mês
- Modal de campeão com confetti
- Compartilhamento para redes sociais

**Tabelas utilizadas:**
- `users` - Dados para ranking
- `user_xp_history` - Histórico mensal

**Bibliotecas especiais:**
- `canvas-confetti` - Animação de confetti
- `html-to-image` - Geração de imagem para share

---

### 6.3 Quiz (`/aluno/quiz`)

**Arquivo:** `src/app/aluno/quiz/page.tsx`

**Features:**
- Lista de quizzes disponíveis
- Histórico de quizzes feitos
- Modal de criação (apenas admin)
- QuizPlayer para responder
- Modal de revisão (se < 100%)
- Empty state para novos alunos

**Tabelas utilizadas:**
- `quizzes` - Lista de quizzes
- `user_quiz_progress` - Progresso do aluno
- `user_xp_history` - XP ganho

**Componentes:**
- `QuizPlayer` - Player interativo
- `CreateQuizModal` - Criação de quiz

---

### 6.4 Desafios (`/aluno/desafios`)

**Arquivo:** `src/app/aluno/desafios/page.tsx`

**Features:**
- Solicitar novo desafio (gerado por IA)
- Lista de desafios disponíveis
- Meus desafios (em andamento/concluídos)
- Submissão via GitHub URL
- Desistir de desafio

**Tabelas utilizadas:**
- `desafios` - Lista de desafios
- `user_desafio_progress` - Progresso
- `desafio_submissions` - Submissões
- `user_desafio_atribuido` - Atribuições

**Integração:**
- OpenAI GPT-4 para geração

---

### 6.5 Comunidade (`/aluno/comunidade`)

**Arquivo:** `src/app/aluno/comunidade/page.tsx`

**Features:**
- Lista de perguntas
- Filtros (todas, minhas, não resolvidas)
- Criar nova pergunta
- Upload de imagem
- Sistema de votos
- Cards diferenciados (resolvida = verde)

**Tabelas utilizadas:**
- `perguntas` - Perguntas
- `respostas` - Respostas
- `users` - Dados dos autores

---

### 6.6 Detalhe da Pergunta (`/aluno/comunidade/pergunta/[id]`)

**Arquivo:** `src/app/aluno/comunidade/pergunta/[id]/page.tsx`

**Features:**
- Visualização completa da pergunta
- Lista de respostas
- Thread de comentários
- Marcar melhor resposta (autor)
- Sistema de votos
- Upload de imagem nas respostas
- Menções de usuários (@nome)

**Tabelas utilizadas:**
- `perguntas` - Dados da pergunta
- `respostas` - Respostas e comentários
- `notificacoes` - Notificar menções

---

### 6.7 Perfil (`/aluno/perfil`)

**Arquivo:** `src/app/aluno/perfil/page.tsx`

**Features:**
- Informações do usuário
- Upload de avatar
- Editar bio
- Card de nível com modal explicativo
- Histórico de XP
- Conquistas e badges

**Tabelas utilizadas:**
- `users` - Dados do usuário
- `user_xp_history` - Histórico XP

**Storage:**
- Bucket `avatars` para fotos de perfil

---

### 6.8 Central de Ajuda (`/aluno/central-de-ajuda`)

**Arquivo:** `src/app/aluno/central-de-ajuda/page.tsx`

**Features:**
- Acordeões explicativos de cada seção
- Formulário de sugestões/bugs
- Upload de imagem em sugestões
- Navegação para todas as páginas

**Tabelas utilizadas:**
- `notificacoes` - Para sugestões/bugs

---

### 6.9 Formulários (`/aluno/formularios`)

**Arquivo:** `src/app/aluno/formularios/page.tsx`

**Features:**
- Lista de formulários disponíveis
- Responder formulários
- Histórico de respostas
- Ganho de XP ao responder

**Tabelas utilizadas:**
- `formularios` - Lista de formulários
- `formulario_respostas` - Respostas do aluno

---

### 6.10 Painel Admin (`/aluno/admin`)

**Arquivo:** `src/app/aluno/admin/page.tsx`

**Acesso:** Apenas usuários com `role: 'admin'`

**Tabs:**

#### 6.10.1 Tab Alunos (`AdminAlunosTab`)
- Lista de todos os alunos
- Filtros por role e access_level
- Busca por nome/email
- Paginação

#### 6.10.2 Tab Quiz (`AdminQuizTab`)
- Criar novo quiz
- Gerar quiz com IA
- Editar/Deletar quizzes
- Paginação

#### 6.10.3 Tab Desafios (`AdminDesafiosTab`)
- Sub-tab: Desafios (criar/editar)
- Sub-tab: Submissões (aprovar/rejeitar)
- Paginação em ambas

#### 6.10.4 Tab Notificações (`AdminNotificacoesTab`)
- Sub-tab: Enviadas (criar notificações)
- Sub-tab: Recebidas (ver sugestões/bugs)
- Paginação em ambas

#### 6.10.5 Tab Formulários (`AdminFormulariosTab`)
- Criar formulários
- Ver respostas
- Paginação

#### 6.10.6 Tab Tokens (`AdminTokensTab`)
- Consumo de tokens OpenAI
- Gráficos de custo
- Top alunos por consumo
- Filtro por período

**Tabelas utilizadas:** Todas as tabelas do sistema

---

## 7. APIs (Routes)

### 7.1 APIs de Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/aluno/login` | Login de aluno |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/session` | Verificar sessão |
| POST | `/api/auth/token` | Refresh token |
| POST | `/api/users/create` | Criar usuário (pós-signup) |

---

### 7.2 APIs de Usuário

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/users/me` | Dados do usuário atual |
| GET | `/api/users/me/stats` | Estatísticas do usuário |
| GET | `/api/users/me/xp-history` | Histórico de XP |
| GET | `/api/users/search` | Buscar usuários (para menções) |
| POST | `/api/users/sync-level` | Sincronizar nível |
| POST | `/api/users/sync-xp-mensal` | Zerar XP mensal |

---

### 7.3 APIs de Quiz

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/quiz/gerar` | Gerar quiz com IA |
| POST | `/api/quiz/[id]/completar` | Completar quiz |
| GET/POST/DELETE | `/api/admin/quiz` | CRUD de quizzes (admin) |

---

### 7.4 APIs de Desafios

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/desafios/gerar` | Gerar desafio com IA |
| POST | `/api/desafios/[id]/submeter` | Submeter solução |
| POST | `/api/desafios/[id]/completar` | Marcar como completo |
| POST | `/api/desafios/[id]/desistir` | Desistir do desafio |
| GET/PATCH | `/api/admin/submissions` | Gerenciar submissões |
| PATCH | `/api/admin/submissions/[id]` | Aprovar/Rejeitar |

---

### 7.5 APIs da Comunidade

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/comunidade/perguntas` | Listar/Criar perguntas |
| GET | `/api/comunidade/perguntas/[id]` | Detalhes da pergunta |
| DELETE | `/api/comunidade/perguntas/[id]/delete` | Deletar pergunta |
| POST | `/api/comunidade/perguntas/[id]/responder` | Responder pergunta |
| POST | `/api/comunidade/perguntas/[id]/votar` | Votar na pergunta |
| POST | `/api/comunidade/perguntas/[id]/visualizar` | Incrementar views |
| POST | `/api/comunidade/perguntas/[id]/imagem` | Upload de imagem |
| GET | `/api/comunidade/perguntas/[id]/respostas` | Listar respostas |
| POST | `/api/comunidade/respostas/[id]/votar` | Votar na resposta |
| POST | `/api/comunidade/respostas/[id]/imagem` | Upload de imagem |
| POST | `/api/comunidade/respostas/[id]/comentarios` | Adicionar comentário |
| POST | `/api/comunidade/validar-mencoes` | Validar @menções |

---

### 7.6 APIs de Ranking

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/ranking` | Ranking mensal/geral |
| GET | `/api/ranking/historico` | Histórico de campeões |

---

### 7.7 APIs de Sugestões/Bugs

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/sugestoes/enviar` | Enviar sugestão/bug |
| POST | `/api/sugestoes/[id]/imagem` | Upload de imagem |

---

### 7.8 APIs de Formulários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/formularios` | Listar/Criar formulários |
| GET | `/api/formularios/[id]` | Detalhes do formulário |
| POST | `/api/formularios/[id]/resposta` | Submeter resposta |

---

### 7.9 APIs de XP

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/xp/add` | Adicionar XP (admin) |

---

### 7.10 APIs Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/tokens` | Consumo de tokens OpenAI |

---

## 8. Componentes Principais

### 8.1 Layout do Dashboard

**AlunoSidebar** (`src/components/aluno/AlunoSidebar.tsx`)
- Menu lateral responsivo
- Links para todas as páginas
- Indicador de admin
- Collapse em mobile

**AlunoHeader** (`src/components/aluno/AlunoHeader.tsx`)
- Logo
- Sino de notificações
- Display de XP (clicável para modal)
- Menu do usuário
- Toggle de tema

### 8.2 Componentes de Gamificação

**ProgressCard** (`src/components/aluno/ProgressCard.tsx`)
- Barra de progresso de XP
- Indicador de nível
- Animações de progresso

**BadgeDisplay** (`src/components/comunidade/BadgeDisplay.tsx`)
- Display de badges/conquistas
- Tooltips com descrições

### 8.3 Componentes de Quiz

**QuizPlayer** (`src/components/quiz/QuizPlayer.tsx`)
- Navegação entre perguntas
- Seleção de respostas
- Modo revisão
- Resultado final
- Animações

### 8.4 Componentes de Comunidade

**CommentThread** (`src/components/comunidade/CommentThread.tsx`)
- Thread de comentários aninhados
- Sistema de votos
- Marcação de melhor resposta

**QuestionImageUpload** (`src/components/comunidade/QuestionImageUpload.tsx`)
- Upload de imagem
- Preview
- Compressão automática
- Validação de tipo/tamanho

### 8.5 Componentes UI Genéricos

| Componente | Descrição |
|------------|-----------|
| `Modal` | Modal reutilizável |
| `Pagination` | Paginação genérica |
| `DatePicker` | Seletor de data |
| `PasswordInput` | Input de senha com toggle |
| `CountdownTimer` | Timer regressivo |

---

## 9. Contextos (State Management)

### 9.1 AuthContext

**Arquivo:** `src/lib/AuthContext.tsx`

**Responsabilidades:**
- Gerenciar estado de autenticação
- Buscar dados do usuário do banco
- Refresh de sessão
- Logout

**Uso:**
```typescript
const { user, loading, signOut, refreshSession } = useAuth()
```

### 9.2 ThemeContext

**Arquivo:** `src/lib/ThemeContext.tsx`

**Responsabilidades:**
- Toggle dark/light mode
- Persistir preferência no localStorage
- Classe `dark` no `<html>`

**Uso:**
```typescript
const { theme, toggleTheme } = useTheme()
```

### 9.3 NotificationsContext

**Arquivo:** `src/lib/NotificationsContext.tsx`

**Responsabilidades:**
- Buscar notificações ativas
- Supabase Realtime para novas notificações
- Gerenciar lidas/não lidas (localStorage)
- Filtrar por público-alvo

**Uso:**
```typescript
const { 
  notifications,
  unreadCount,
  isModalOpen,
  openModal,
  closeModal,
  markAsRead,
  markAllAsRead 
} = useNotifications()
```

### 9.4 SidebarContext

**Arquivo:** `src/lib/SidebarContext.tsx`

**Responsabilidades:**
- Estado de collapse do sidebar
- Responsividade mobile

---

## 10. Integrações Externas

### 10.1 OpenAI

**Arquivo:** `src/lib/openai.ts`

**Uso:**
- Geração de quizzes personalizados
- Geração de desafios de código

**Modelo:** GPT-4 Turbo

**Tracking:** Tabela `openai_token_usage`

**Custo estimado:** Calculado automaticamente

---

## 11. Políticas RLS (Row Level Security)

### 11.1 Funções Auxiliares

```sql
-- Verifica se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Concede XP a usuário (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION award_xp_to_user(
  p_user_id UUID,
  p_source TEXT,
  p_source_id UUID,
  p_amount INTEGER,
  p_description TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ ... $$;

-- Completa desafio (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION complete_desafio_for_user(
  p_user_id UUID,
  p_desafio_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ ... $$;
```

### 11.2 Políticas Principais

#### users
- SELECT: Próprio usuário ou admin
- UPDATE: Apenas próprio usuário
- INSERT: Via trigger ou API

#### quizzes
- SELECT: Todos autenticados
- INSERT/UPDATE/DELETE: Apenas admin

#### user_quiz_progress
- SELECT: Próprio usuário
- INSERT/UPDATE: Próprio usuário

#### perguntas
- SELECT: Todos autenticados
- INSERT: Autenticados
- DELETE: Autor ou admin

#### notificacoes
- SELECT: Conforme público-alvo e target_user_id
- INSERT: Admin ou via RPC (sugestões)

---

## 12. Variáveis de Ambiente

### 12.1 Obrigatórias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Para admin operations

# OpenAI
OPENAI_API_KEY=sk-...
```

### 12.2 Opcionais

```bash
# Ambiente
NODE_ENV=production|development

# Feature flags (não usados no MVP)
ENABLE_COINS=false
ENABLE_INTENSIVO=false
```

---

## 13. Scripts SQL Importantes

### 13.1 Schema Principal
- `docs/SCHEMA_SUPABASE.sql` - Schema completo

### 13.2 Migrações
- `docs/supabase_add_respostas_quiz.sql` - Coluna respostas em quiz
- `docs/supabase_add_is_sugestao_bug_column.sql` - Sugestões/bugs
- `docs/supabase_add_imagem_url_notificacoes.sql` - Imagem em notificações

### 13.3 RLS
- `docs/supabase_rls_sugestoes_bugs.sql` - Políticas de sugestões
- `docs/RLS_FUNCTION_AWARD_XP.sql` - Função de XP
- `docs/RLS_POLICIES_GAMIFICATION.sql` - Políticas de gamificação

### 13.4 Correções de XP
- `docs/supabase_update_xp_desafio_40_to_50.sql` - Atualizar XP de desafios

---

## 14. Fluxos de Negócio

### 14.1 Fluxo de Quiz

```
1. Aluno acessa /aluno/quiz
2. Seleciona quiz disponível
3. QuizPlayer carrega perguntas
4. Aluno responde todas as perguntas
5. Ao finalizar:
   - Calcula pontuação (0-100%)
   - POST /api/quiz/[id]/completar
   - completarQuiz() no server:
     - Busca XP máximo (20)
     - Calcula XP proporcional
     - Verifica limite já ganho
     - Insere em user_xp_history
     - Atualiza user_quiz_progress
     - Sincroniza nível
   - Dispara evento 'xpGained'
   - AuthContext atualiza user
6. Modal de resultado exibido
7. Se < 100%, botão "Revisar" disponível
```

### 14.2 Fluxo de Desafio

```
1. Aluno solicita novo desafio
2. POST /api/desafios/gerar (OpenAI)
3. Desafio gerado e atribuído
4. Aluno desenvolve solução
5. Submete URL do GitHub
   - POST /api/desafios/[id]/submeter
   - Cria desafio_submission (pendente)
6. Admin revê submissão
   - PATCH /api/admin/submissions/[id]
   - Se aprovado: complete_desafio_for_user()
   - 50 XP concedido
   - Notificação enviada ao aluno
7. Aluno recebe XP e notificação
```

### 14.3 Fluxo de Comunidade

```
Criar Pergunta:
1. POST /api/comunidade/perguntas
2. 10 XP concedido ao autor
3. Pergunta aparece na lista

Responder:
1. POST /api/comunidade/perguntas/[id]/responder
2. 1 XP concedido ao autor da resposta
3. Se tiver @menções, notificações criadas

Marcar Melhor Resposta:
1. Autor da pergunta clica "Marcar como correta"
2. 100 XP concedido ao autor da resposta
3. Pergunta marcada como resolvida
4. Card fica verde
```

### 14.4 Fluxo de Ranking

```
Mensal:
- Baseado em xp_mensal
- Zera todo dia 1 do mês (cron job)
- Campeão registrado em histórico

Geral:
- Baseado em xp total
- Acumulativo desde o cadastro
```

---

## 15. Guia de Manutenção

### 15.1 Adicionar Nova Página

1. Criar diretório em `src/app/aluno/[nome]/`
2. Criar `page.tsx` com `'use client'` se necessário
3. Adicionar link no `AlunoSidebar.tsx`
4. Adicionar rota no middleware se necessário

### 15.2 Adicionar Nova API

1. Criar diretório em `src/app/api/[nome]/`
2. Criar `route.ts` com handlers (GET, POST, etc)
3. Usar `requireUserIdFromBearer()` para auth
4. Usar `getSupabaseClient()` com accessToken

### 15.3 Adicionar Nova Tabela

1. Criar tabela no Supabase
2. Adicionar interface em `src/types/database.ts`
3. Criar políticas RLS necessárias
4. Documentar no `docs/SCHEMA_SUPABASE.sql`

### 15.4 Modificar Gamificação

1. Atualizar constantes em `src/lib/gamification/constants.ts`
2. Se necessário, criar script de migração
3. Atualizar funções RPC no Supabase
4. Testar em desenvolvimento

### 15.5 Deploy

1. Push para branch feature
2. Criar PR para main
3. Merge ativa deploy automático na Vercel
4. Verificar logs na Vercel
5. Testar em produção

### 15.6 Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| 401 em API | Verificar token JWT e RLS |
| XP não atualiza | Verificar função RPC e eventos |
| Notificação não aparece | Verificar público-alvo e datas |
| Quiz sem perguntas | Verificar campo questoes JSONB |
| Imagem não carrega | Verificar bucket Storage e políticas |

---

## 📝 Changelog

### v1.0.0 (Janeiro 2025)
- MVP completo do Portal do Aluno
- Sistema de gamificação (XP, níveis, ranking)
- Quizzes com IA e revisão
- Desafios com submissão GitHub
- Comunidade Q&A
- Painel administrativo
- Central de Ajuda
- Sugestões e Bugs

---

**Documento gerado em:** Janeiro 2025  
**Autor:** Equipe de Desenvolvimento  
**Próxima revisão:** Conforme atualizações do sistema

