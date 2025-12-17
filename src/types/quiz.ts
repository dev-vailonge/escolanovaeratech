/**
 * Tipos para Quiz com perguntas estruturadas
 * Compatível com lógica do aluno e persistência no Supabase
 */

// Labels das opções (A até F)
export type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

// Opção de resposta
export interface QuizOption {
  id: string
  label: OptionLabel
  text: string
}

// Pergunta do quiz
export interface QuizQuestion {
  id: string
  prompt: string              // Texto da pergunta
  options: QuizOption[]       // 2-6 opções
  correctOptionId: string     // ID da opção correta
  points: number              // Pontos por acerto
  penalty?: number            // Penalidade por erro (0 por padrão)
  explanation?: string        // Explicação da resposta correta
}

// Quiz completo
export interface Quiz {
  id: string
  title: string
  description: string
  technology: string
  level: 'iniciante' | 'intermediario' | 'avancado'
  xpGain: number
  questionCount: number
  questions: QuizQuestion[]
  available: boolean
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

// ─────────────────────────────────────────────────────────────
// Tipos para tentativa do aluno (lógica futura)
// ─────────────────────────────────────────────────────────────

// Resposta do aluno a uma pergunta
export interface QuizAnswerResult {
  questionId: string
  selectedOptionId: string
  correct: boolean
  earnedPoints: number
}

// Tentativa completa do quiz pelo aluno
export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  startedAt: string
  finishedAt?: string
  answers: QuizAnswerResult[]
  totalPoints: number
  totalCorrect: number
  totalQuestions: number
  passed: boolean            // Se atingiu nota mínima (ex: 60%)
}

// Status de uma pergunta durante o quiz
export interface QuestionStatus {
  questionId: string
  answered: boolean
  locked: boolean            // Não permite editar após confirmar
  selectedOptionId?: string
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export const OPTION_LABELS: OptionLabel[] = ['A', 'B', 'C', 'D', 'E', 'F']

export function generateOptionId(): string {
  return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateQuizId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Cria uma opção vazia com label automático
export function createEmptyOption(index: number): QuizOption {
  return {
    id: generateOptionId(),
    label: OPTION_LABELS[index] || 'A',
    text: ''
  }
}

// Cria uma pergunta vazia com 4 opções padrão
export function createEmptyQuestion(): QuizQuestion {
  const options = [0, 1, 2, 3].map(createEmptyOption)
  return {
    id: generateQuestionId(),
    prompt: '',
    options,
    correctOptionId: '',
    points: 10,
    penalty: 0,
    explanation: ''
  }
}

// Valida uma pergunta
export interface QuestionValidation {
  valid: boolean
  errors: {
    prompt?: string
    options?: string
    correctOption?: string
    points?: string
  }
}

export function validateQuestion(question: QuizQuestion): QuestionValidation {
  const errors: QuestionValidation['errors'] = {}
  
  if (!question.prompt.trim()) {
    errors.prompt = 'Texto da pergunta é obrigatório'
  }
  
  const filledOptions = question.options.filter(o => o.text.trim())
  if (filledOptions.length < 2) {
    errors.options = 'Mínimo de 2 opções preenchidas'
  }
  
  if (!question.correctOptionId) {
    errors.correctOption = 'Selecione a opção correta'
  } else {
    const correctExists = question.options.some(o => o.id === question.correctOptionId && o.text.trim())
    if (!correctExists) {
      errors.correctOption = 'A opção correta deve estar preenchida'
    }
  }
  
  if (question.points < 1) {
    errors.points = 'Pontuação deve ser pelo menos 1'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Valida quiz completo
export interface QuizValidation {
  valid: boolean
  errors: {
    title?: string
    description?: string
    questions?: string
    questionErrors?: { index: number; errors: QuestionValidation['errors'] }[]
  }
}

export function validateQuiz(quiz: Partial<Quiz>): QuizValidation {
  const errors: QuizValidation['errors'] = {}
  
  if (!quiz.title?.trim()) {
    errors.title = 'Título é obrigatório'
  }
  
  if (!quiz.description?.trim()) {
    errors.description = 'Descrição é obrigatória'
  }
  
  if (!quiz.questions || quiz.questions.length === 0) {
    errors.questions = 'Adicione pelo menos 1 pergunta'
  } else {
    const questionErrors: QuizValidation['errors']['questionErrors'] = []
    quiz.questions.forEach((q, idx) => {
      const validation = validateQuestion(q)
      if (!validation.valid) {
        questionErrors.push({ index: idx, errors: validation.errors })
      }
    })
    if (questionErrors.length > 0) {
      errors.questionErrors = questionErrors
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0 && !errors.questionErrors?.length,
    errors
  }
}

// Converte Quiz para formato do banco (DatabaseQuiz)
export function quizToDatabaseFormat(quiz: Quiz): {
  titulo: string
  descricao: string
  tecnologia: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  questoes: QuizQuestion[]
  xp: number
  disponivel: boolean
  created_by: string | null
} {
  return {
    titulo: quiz.title,
    descricao: quiz.description,
    tecnologia: quiz.technology,
    nivel: quiz.level,
    questoes: quiz.questions,
    xp: quiz.xpGain,
    disponivel: quiz.available,
    created_by: quiz.createdBy || null
  }
}

// Converte DatabaseQuiz para Quiz
export function databaseToQuizFormat(db: {
  id: string
  titulo: string
  descricao: string
  tecnologia: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  questoes: any[]
  xp: number
  disponivel: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}): Quiz {
  return {
    id: db.id,
    title: db.titulo,
    description: db.descricao,
    technology: db.tecnologia,
    level: db.nivel,
    xpGain: db.xp,
    questionCount: Array.isArray(db.questoes) ? db.questoes.length : 0,
    questions: Array.isArray(db.questoes) ? db.questoes : [],
    available: db.disponivel,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    createdBy: db.created_by
  }
}


