// Comunidade - Perguntas e Respostas mockadas (estilo StackOverflow)
export interface Pergunta {
  id: string
  titulo: string
  descricao: string
  autor: {
    id: string
    nome: string
    avatar?: string
    nivel: number
  }
  tags: string[]
  votos: number
  respostas: number
  visualizacoes: number
  resolvida: boolean
  melhorRespostaId?: string
  dataCriacao: string
  categoria: string
}

export interface Resposta {
  id: string
  perguntaId: string
  conteudo: string
  autor: {
    id: string
    nome: string
    avatar?: string
    nivel: number
  }
  votos: number
  melhorResposta: boolean
  dataCriacao: string
}

export const mockPerguntas: Pergunta[] = [
  {
    id: '1',
    titulo: 'Como centralizar um div com CSS?',
    descricao: 'Estou tentando centralizar um div na página mas não consigo. Alguém pode ajudar com diferentes métodos?',
    autor: {
      id: 'user1',
      nome: 'Ana Silva',
      nivel: 5,
    },
    tags: ['css', 'html', 'layout'],
    votos: 12,
    respostas: 5,
    visualizacoes: 89,
    resolvida: true,
    melhorRespostaId: 'resp1',
    dataCriacao: '2024-12-20T10:30:00',
    categoria: 'Web Development',
  },
  {
    id: '2',
    titulo: 'Qual a diferença entre let, const e var no JavaScript?',
    descricao: 'Sou iniciante e quero entender quando usar cada uma dessas declarações de variável.',
    autor: {
      id: 'user2',
      nome: 'Pedro Costa',
      nivel: 3,
    },
    tags: ['javascript', 'variaveis', 'fundamentos'],
    votos: 8,
    respostas: 3,
    visualizacoes: 156,
    resolvida: true,
    melhorRespostaId: 'resp3',
    dataCriacao: '2024-12-21T14:15:00',
    categoria: 'Web Development',
  },
  {
    id: '3',
    titulo: 'Como fazer requisições HTTP com async/await?',
    descricao: 'Preciso fazer uma requisição para uma API e não entendo bem como usar async/await. Alguém tem um exemplo prático?',
    autor: {
      id: 'user3',
      nome: 'Maria Santos',
      nivel: 7,
    },
    tags: ['javascript', 'async-await', 'api', 'fetch'],
    votos: 15,
    respostas: 4,
    visualizacoes: 234,
    resolvida: false,
    dataCriacao: '2024-12-22T09:45:00',
    categoria: 'Web Development',
  },
  {
    id: '4',
    titulo: 'Erro ao usar useState no React',
    descricao: 'Estou recebendo o erro "React Hook useState is called conditionally". Como resolver isso?',
    autor: {
      id: 'user4',
      nome: 'Carlos Lima',
      nivel: 4,
    },
    tags: ['react', 'hooks', 'usestate', 'erro'],
    votos: 6,
    respostas: 2,
    visualizacoes: 78,
    resolvida: false,
    dataCriacao: '2024-12-23T16:20:00',
    categoria: 'React',
  },
  {
    id: '5',
    titulo: 'Como criar um layout responsivo com Tailwind CSS?',
    descricao: 'Quero criar um site responsivo usando Tailwind. Quais classes devo usar para mobile, tablet e desktop?',
    autor: {
      id: 'user5',
      nome: 'Juliana Rocha',
      nivel: 6,
    },
    tags: ['tailwind', 'css', 'responsive', 'design'],
    votos: 10,
    respostas: 3,
    visualizacoes: 145,
    resolvida: true,
    melhorRespostaId: 'resp8',
    dataCriacao: '2024-12-24T11:00:00',
    categoria: 'Web Development',
  },
]

export const mockRespostas: Resposta[] = [
  {
    id: 'resp1',
    perguntaId: '1',
    conteudo: 'Existem várias formas de centralizar um div. A mais moderna e recomendada é usar Flexbox:\n\n```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n```\n\nOu você pode usar Grid:\n\n```css\n.container {\n  display: grid;\n  place-items: center;\n}\n```\n\nPara centralizar horizontalmente apenas, use `margin: 0 auto` no elemento.',
    autor: {
      id: 'user6',
      nome: 'João Silva',
      nivel: 12,
    },
    votos: 18,
    melhorResposta: true,
    dataCriacao: '2024-12-20T11:00:00',
  },
  {
    id: 'resp2',
    perguntaId: '1',
    conteudo: 'Outra opção é usar position absolute:\n\n```css\n.parent {\n  position: relative;\n}\n.child {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}\n```',
    autor: {
      id: 'user7',
      nome: 'Lucas Pereira',
      nivel: 8,
    },
    votos: 5,
    melhorResposta: false,
    dataCriacao: '2024-12-20T11:30:00',
  },
  {
    id: 'resp3',
    perguntaId: '2',
    conteudo: '**var**: Escopo de função, pode ser redeclarada, hoisting com inicialização como undefined.\n\n**let**: Escopo de bloco, não pode ser redeclarada, hoisting mas sem inicialização (TDZ).\n\n**const**: Escopo de bloco, não pode ser redeclarada nem reatribuída (mas objetos/arrays podem ser mutados).\n\nUse `const` por padrão, `let` quando precisar reatribuir, e evite `var`.',
    autor: {
      id: 'user8',
      nome: 'Fernanda Souza',
      nivel: 10,
    },
    votos: 22,
    melhorResposta: true,
    dataCriacao: '2024-12-21T15:00:00',
  },
  {
    id: 'resp4',
    perguntaId: '3',
    conteudo: 'Exemplo básico com fetch:\n\n```javascript\nasync function buscarDados() {\n  try {\n    const response = await fetch(\'https://api.exemplo.com/dados\');\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error(\'Erro:\', error);\n  }\n}\n```',
    autor: {
      id: 'user6',
      nome: 'João Silva',
      nivel: 12,
    },
    votos: 8,
    melhorResposta: false,
    dataCriacao: '2024-12-22T10:15:00',
  },
  {
    id: 'resp8',
    perguntaId: '5',
    conteudo: 'Tailwind usa breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px).\n\nExemplo:\n```html\n<div class="w-full md:w-1/2 lg:w-1/3">\n  Conteúdo responsivo\n</div>\n```\n\nUse `hidden` e `block` para mostrar/ocultar em diferentes tamanhos.',
    autor: {
      id: 'user9',
      nome: 'Rafael Alves',
      nivel: 9,
    },
    votos: 12,
    melhorResposta: true,
    dataCriacao: '2024-12-24T12:00:00',
  },
]

