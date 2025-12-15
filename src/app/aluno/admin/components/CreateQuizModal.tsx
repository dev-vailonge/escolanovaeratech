'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  Upload,
  FileJson,
  FileText,
  Copy,
  Check
} from 'lucide-react'
import type {
  QuizQuestion,
  QuizOption,
  QuestionValidation,
  OptionLabel
} from '@/types/quiz'
import {
  OPTION_LABELS,
  createEmptyQuestion,
  createEmptyOption,
  generateQuestionId,
  generateOptionId,
  validateQuestion,
  validateQuiz
} from '@/types/quiz'

interface CreateQuizModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quiz: any) => void
  quiz?: any // Para edição
}

type CreationMode = 'manual' | 'import' | 'ai'

// ─────────────────────────────────────────────────────────────
// PARSER: Texto formatado → QuizQuestion[]
// ─────────────────────────────────────────────────────────────
function parseFormattedText(text: string): { questions: QuizQuestion[]; errors: string[] } {
  const errors: string[] = []
  const questions: QuizQuestion[] = []
  
  // Divide por separadores comuns: ---, ===, linhas em branco duplas, ou numeração
  const blocks = text.split(/(?:^|\n)(?:---+|===+|\n{2,}|(?=\d+[\.\)]\s))/gm).filter(b => b.trim())
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    if (!block) continue
    
    try {
      const question = parseQuestionBlock(block, i + 1)
      if (question) {
        questions.push(question)
      }
    } catch (e: any) {
      errors.push(`Bloco ${i + 1}: ${e.message}`)
    }
  }
  
  return { questions, errors }
}

function parseQuestionBlock(block: string, index: number): QuizQuestion | null {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length < 3) return null
  
  let prompt = ''
  const options: QuizOption[] = []
  let correctLabel: OptionLabel | '' = ''
  let explanation = ''
  let points = 10
  
  for (const line of lines) {
    // IMPORTANTE: A ordem de verificação é crucial!
    // "E:" = explicação, "E)" ou "E." = opção E
    
    // 1. Verificar resposta correta (R: D, Gabarito: B, etc)
    const answerMatch = line.match(/^(?:R:|Resposta:|Correta:|Gabarito:?)\s*([A-Fa-f])\s*$/i)
    if (answerMatch) {
      correctLabel = answerMatch[1].toUpperCase() as OptionLabel
      continue
    }
    
    // 2. Verificar explicação: "E:" seguido de texto (não confundir com opção "E)")
    // Explicação usa ":" como separador, opção usa ")" ou "."
    const explanationMatch = line.match(/^(?:E:|Explicação:|Explicacao:|Exp:)\s*(.+)/i)
    if (explanationMatch && !line.match(/^E[\.\)]/i)) {
      explanation = explanationMatch[1].trim()
      continue
    }
    
    // 3. Verificar pontos
    const pointsMatch = line.match(/^(?:Pontos:|Pts:|XP:?)\s*(\d+)/i)
    if (pointsMatch) {
      points = parseInt(pointsMatch[1]) || 10
      continue
    }
    
    // 4. Verificar opção: letra seguida de ) ou . (NÃO ":")
    // Ex: "A) texto", "B. texto", "C) texto"
    const optionMatch = line.match(/^([A-Fa-f])[\.\)]\s*(.+)/)
    if (optionMatch) {
      const label = optionMatch[1].toUpperCase() as OptionLabel
      const text = optionMatch[2].trim()
      
      // Verifica se a opção está marcada como correta (*, [x], (x), ✓)
      const isMarkedCorrect = /[\*✓✔]|^\[x\]|\(x\)/i.test(text)
      const cleanText = text.replace(/[\*✓✔]|\[x\]|\(x\)/gi, '').trim()
      
      if (isMarkedCorrect && !correctLabel) {
        correctLabel = label
      }
      
      options.push({
        id: generateOptionId(),
        label,
        text: cleanText
      })
      continue
    }
    
    // 5. Verificar pergunta (primeira linha sem marcador de opção)
    if (!prompt && !line.match(/^[A-Fa-f][\.\)\:]/i)) {
      const questionMatch = line.match(/^(?:\d+[\.\)]\s*)?(?:P:|Q:|Pergunta:?)?\s*(.+)/i)
      if (questionMatch) {
        prompt = questionMatch[1].trim()
      }
    }
  }
  
  if (!prompt || options.length < 2) {
    return null
  }
  
  // Se não encontrou resposta correta, assume A
  const correctOption = options.find(o => o.label === correctLabel) || options[0]
  
  return {
    id: generateQuestionId(),
    prompt,
    options,
    correctOptionId: correctOption?.id || '',
    points,
    penalty: 0,
    explanation
  }
}

// ─────────────────────────────────────────────────────────────
// PARSER: JSON → QuizQuestion[]
// ─────────────────────────────────────────────────────────────
function parseJSON(text: string): { questions: QuizQuestion[]; errors: string[] } {
  const errors: string[] = []
  const questions: QuizQuestion[] = []
  
  try {
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : (data.questions || data.perguntas || [data])
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const q = normalizeJSONQuestion(item, i)
        if (q) questions.push(q)
      } catch (e: any) {
        errors.push(`Item ${i + 1}: ${e.message}`)
      }
    }
  } catch (e) {
    errors.push('JSON inválido. Verifique a formatação.')
  }
  
  return { questions, errors }
}

function normalizeJSONQuestion(item: any, index: number): QuizQuestion | null {
  const prompt = item.prompt || item.pergunta || item.question || item.texto || item.text || ''
  if (!prompt) return null
  
  // Normalizar opções
  let options: QuizOption[] = []
  const rawOptions = item.options || item.opcoes || item.alternatives || item.alternativas || []
  
  if (Array.isArray(rawOptions)) {
    options = rawOptions.map((opt: any, idx: number) => {
      if (typeof opt === 'string') {
        return {
          id: generateOptionId(),
          label: OPTION_LABELS[idx] || 'A',
          text: opt
        }
      }
      return {
        id: opt.id || generateOptionId(),
        label: opt.label || OPTION_LABELS[idx] || 'A',
        text: opt.text || opt.texto || ''
      }
    })
  }
  
  if (options.length < 2) return null
  
  // Encontrar resposta correta
  let correctOptionId = ''
  const correctIndex = item.correctIndex ?? item.correct ?? item.correta ?? item.resposta ?? item.answer
  
  if (typeof correctIndex === 'number' && options[correctIndex]) {
    correctOptionId = options[correctIndex].id
  } else if (typeof correctIndex === 'string') {
    // Pode ser label (A, B, C) ou ID
    const byLabel = options.find(o => o.label.toLowerCase() === correctIndex.toLowerCase())
    const byId = options.find(o => o.id === correctIndex)
    correctOptionId = byLabel?.id || byId?.id || options[0]?.id || ''
  } else {
    correctOptionId = options[0]?.id || ''
  }
  
  return {
    id: item.id || generateQuestionId(),
    prompt,
    options,
    correctOptionId,
    points: item.points || item.pontos || item.xp || 10,
    penalty: item.penalty || item.penalidade || 0,
    explanation: item.explanation || item.explicacao || ''
  }
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function CreateQuizModal({ isOpen, onClose, onSave, quiz }: CreateQuizModalProps) {
  const { theme } = useTheme()
  const isEditing = !!quiz

  // Estado principal do formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tecnologia, setTecnologia] = useState('HTML')
  const [nivel, setNivel] = useState<'iniciante' | 'intermediario' | 'avancado'>('iniciante')
  const [xp, setXp] = useState(50)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // UI state
  const [creationMode, setCreationMode] = useState<CreationMode>('manual')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, any>>({})
  const [questionErrors, setQuestionErrors] = useState<Record<string, QuestionValidation['errors']>>({})
  const [saving, setSaving] = useState(false)

  // Import state
  const [importText, setImportText] = useState('')
  const [importFormat, setImportFormat] = useState<'text' | 'json'>('text')
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importPreview, setImportPreview] = useState<QuizQuestion[]>([])
  const [copiedExample, setCopiedExample] = useState(false)

  // Inicializar dados ao abrir modal
  useEffect(() => {
    if (isOpen) {
      if (quiz) {
        setTitulo(quiz.titulo || '')
        setDescricao(quiz.descricao || '')
        setTecnologia(quiz.tecnologia || 'HTML')
        setNivel(quiz.nivel || 'iniciante')
        setXp(quiz.xp || 50)
        const existingQuestions = Array.isArray(quiz.perguntas) ? quiz.perguntas : []
        setQuestions(existingQuestions.length > 0 ? existingQuestions : [createEmptyQuestion()])
        if (existingQuestions.length > 0) {
          setExpandedQuestions(new Set([existingQuestions[0].id]))
        }
        setCreationMode('manual')
      } else {
        const firstQuestion = createEmptyQuestion()
        setTitulo('')
        setDescricao('')
        setTecnologia('HTML')
        setNivel('iniciante')
        setXp(50)
        setQuestions([firstQuestion])
        setExpandedQuestions(new Set([firstQuestion.id]))
        setCreationMode('manual')
      }
      setValidationErrors({})
      setQuestionErrors({})
      setImportText('')
      setImportErrors([])
      setImportPreview([])
    }
  }, [isOpen, quiz])

  // Processar importação quando texto muda
  useEffect(() => {
    if (!importText.trim()) {
      setImportPreview([])
      setImportErrors([])
      return
    }
    
    const timer = setTimeout(() => {
      const result = importFormat === 'json' 
        ? parseJSON(importText)
        : parseFormattedText(importText)
      
      setImportPreview(result.questions)
      setImportErrors(result.errors)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [importText, importFormat])

  // Aplicar importação
  const applyImport = () => {
    if (importPreview.length === 0) return
    setQuestions(prev => [...prev.filter(q => q.prompt.trim()), ...importPreview])
    setImportText('')
    setImportPreview([])
    setImportErrors([])
    setCreationMode('manual')
    // Expandir primeira pergunta importada
    if (importPreview.length > 0) {
      setExpandedQuestions(new Set([importPreview[0].id]))
    }
  }

  // Toggle expandir/colapsar pergunta
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  // Adicionar nova pergunta
  const addQuestion = () => {
    const newQ = createEmptyQuestion()
    setQuestions(prev => [...prev, newQ])
    setExpandedQuestions(prev => new Set([...prev, newQ.id]))
  }

  // Remover pergunta
  const removeQuestion = (questionId: string) => {
    if (questions.length <= 1) return
    setQuestions(prev => prev.filter(q => q.id !== questionId))
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
    setQuestionErrors(prev => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  // Atualizar campo de uma pergunta
  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ))
    if (questionErrors[questionId]) {
      setQuestionErrors(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  // Adicionar opção a uma pergunta
  const addOption = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q
      if (q.options.length >= 6) return q
      const newOpt = createEmptyOption(q.options.length)
      return { ...q, options: [...q.options, newOpt] }
    }))
  }

  // Remover opção de uma pergunta
  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q
      if (q.options.length <= 2) return q
      const newOptions = q.options.filter(o => o.id !== optionId)
      const relabeled = newOptions.map((o, i) => ({
        ...o,
        label: OPTION_LABELS[i]
      }))
      const newCorrect = q.correctOptionId === optionId ? '' : q.correctOptionId
      return { ...q, options: relabeled, correctOptionId: newCorrect }
    }))
  }

  // Atualizar texto de uma opção
  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q
      return {
        ...q,
        options: q.options.map(o => o.id === optionId ? { ...o, text } : o)
      }
    }))
  }

  // Definir opção correta
  const setCorrectOption = (questionId: string, optionId: string) => {
    updateQuestion(questionId, { correctOptionId: optionId })
  }

  // Copiar exemplo
  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example)
    setCopiedExample(true)
    setTimeout(() => setCopiedExample(false), 2000)
  }

  // Validar e salvar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const quizData = {
      title: titulo,
      description: descricao,
      technology: tecnologia,
      level: nivel,
      xpGain: xp,
      questions
    }
    
    const validation = validateQuiz(quizData)
    
    if (!validation.valid) {
      const newErrors: Record<string, any> = {}
      if (validation.errors.title) newErrors.titulo = validation.errors.title
      if (validation.errors.description) newErrors.descricao = validation.errors.description
      if (validation.errors.questions) newErrors.questions = validation.errors.questions
      setValidationErrors(newErrors)
      
      if (validation.errors.questionErrors) {
        const qErrors: Record<string, QuestionValidation['errors']> = {}
        validation.errors.questionErrors.forEach(({ index, errors }) => {
          const q = questions[index]
          if (q) {
            qErrors[q.id] = errors
            setExpandedQuestions(prev => new Set([...prev, q.id]))
          }
        })
        setQuestionErrors(qErrors)
      }
      return
    }

    setSaving(true)
    setValidationErrors({})
    
    try {
      const dadosParaSalvar = {
        titulo,
        descricao,
        tecnologia,
        nivel,
        xp,
        questoes: questions.length,
        perguntas: questions
      }
      
      console.log('📝 Salvando quiz com', questions.length, 'perguntas...')
      
      // Esperar o save completar - NÃO fechar o modal aqui
      // O AdminQuizTab vai fechar quando terminar
      await onSave(dadosParaSalvar)
      
      console.log('✅ Quiz salvo com sucesso!')
      // Não chamar onClose() aqui - deixar o AdminQuizTab controlar
    } catch (err: any) {
      console.error('❌ Erro ao salvar quiz:', err)
      setValidationErrors({ general: err?.message || 'Erro ao salvar quiz. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  // Classes reutilizáveis
  const inputClass = cn(
    "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors text-sm",
    theme === 'dark'
      ? "bg-black/50 border-white/10 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20"
  )

  const labelClass = cn(
    "block text-sm font-medium mb-1.5",
    theme === 'dark' ? "text-gray-300" : "text-gray-700"
  )

  const errorClass = cn(
    "text-xs mt-1 flex items-center gap-1",
    theme === 'dark' ? "text-red-400" : "text-red-600"
  )

  // Exemplos para importação
  const textExample = `1. Qual tag HTML define um parágrafo?
A) <p>
B) <paragraph>
C) <para>
D) <text>
R: A
E: A tag <p> é a tag padrão para parágrafos em HTML

---

2. Qual propriedade CSS define a cor do texto?
A) text-color
B) font-color
C) color *
D) foreground
E: A propriedade 'color' define a cor do texto`

  const jsonExample = `[
  {
    "pergunta": "Qual tag HTML define um parágrafo?",
    "opcoes": ["<p>", "<paragraph>", "<para>", "<text>"],
    "correta": 0,
    "pontos": 10,
    "explicacao": "A tag <p> é a tag padrão para parágrafos"
  },
  {
    "pergunta": "Qual propriedade CSS define a cor do texto?",
    "opcoes": ["text-color", "font-color", "color", "foreground"],
    "correta": 2,
    "pontos": 10
  }
]`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Quiz' : 'Criar Novo Quiz'}
      size="xl"
    >
      {/* Toggle Manual / Importar / IA */}
      <div className={cn(
        "flex items-center gap-1 p-1 rounded-lg mb-6",
        theme === 'dark' ? "bg-white/5" : "bg-gray-100"
      )}>
        <button
          type="button"
          onClick={() => setCreationMode('manual')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            creationMode === 'manual'
              ? theme === 'dark'
                ? "bg-yellow-400 text-black"
                : "bg-yellow-500 text-white"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setCreationMode('import')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            creationMode === 'import'
              ? theme === 'dark'
                ? "bg-yellow-400 text-black"
                : "bg-yellow-500 text-white"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Upload className="w-4 h-4" />
          Importar
        </button>
        <button
          type="button"
          disabled
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-not-allowed opacity-50",
            theme === 'dark' ? "text-gray-500" : "text-gray-400"
          )}
          title="Em breve"
        >
          <Sparkles className="w-4 h-4" />
          IA (em breve)
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ABA: IMPORTAR EM MASSA
      ═══════════════════════════════════════════════════════════════ */}
      {creationMode === 'import' && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Seletor de formato */}
          <div className="flex items-center gap-4">
            <span className={cn("text-sm font-medium", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>
              Formato:
            </span>
            <div className={cn(
              "flex items-center gap-1 p-1 rounded-lg",
              theme === 'dark' ? "bg-black/30" : "bg-gray-100"
            )}>
              <button
                type="button"
                onClick={() => setImportFormat('text')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  importFormat === 'text'
                    ? theme === 'dark'
                      ? "bg-white/10 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : theme === 'dark'
                      ? "text-gray-400"
                      : "text-gray-600"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Texto
              </button>
              <button
                type="button"
                onClick={() => setImportFormat('json')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  importFormat === 'json'
                    ? theme === 'dark'
                      ? "bg-white/10 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : theme === 'dark'
                      ? "text-gray-400"
                      : "text-gray-600"
                )}
              >
                <FileJson className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          </div>

          {/* Exemplo */}
          <div className={cn(
            "p-3 rounded-lg border",
            theme === 'dark' ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-medium", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                Exemplo de formato {importFormat === 'json' ? 'JSON' : 'texto'}:
              </span>
              <button
                type="button"
                onClick={() => copyExample(importFormat === 'json' ? jsonExample : textExample)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                  theme === 'dark'
                    ? "text-yellow-400 hover:bg-yellow-400/10"
                    : "text-yellow-600 hover:bg-yellow-100"
                )}
              >
                {copiedExample ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedExample ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <pre className={cn(
              "text-xs overflow-x-auto max-h-32 p-2 rounded",
              theme === 'dark' ? "bg-black/40 text-gray-300" : "bg-white text-gray-700"
            )}>
              {importFormat === 'json' ? jsonExample : textExample}
            </pre>
            <p className={cn("text-xs mt-2", theme === 'dark' ? "text-gray-500" : "text-gray-500")}>
              {importFormat === 'text' 
                ? 'Dicas: Use "---" para separar perguntas. Marque correta com * ou R: A. Use E: para explicação.'
                : 'Dicas: "correta" pode ser índice (0-5) ou letra (A-F). "opcoes" é array de strings.'}
            </p>
          </div>

          {/* Textarea para colar */}
          <div>
            <label className={labelClass}>
              Cole suas perguntas aqui ({importFormat === 'json' ? 'JSON' : 'texto formatado'})
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              className={cn(inputClass, "resize-none font-mono text-xs")}
              placeholder={importFormat === 'json' 
                ? 'Cole um array JSON com suas perguntas...'
                : 'Cole suas perguntas formatadas aqui...'}
            />
          </div>

          {/* Erros de parse */}
          {importErrors.length > 0 && (
            <div className={cn(
              "p-3 rounded-lg border",
              theme === 'dark' ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"
            )}>
              <p className={cn("text-sm font-medium mb-2", theme === 'dark' ? "text-red-400" : "text-red-700")}>
                Avisos ({importErrors.length}):
              </p>
              <ul className={cn("text-xs space-y-1", theme === 'dark' ? "text-red-300" : "text-red-600")}>
                {importErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {importErrors.length > 5 && <li>...e mais {importErrors.length - 5}</li>}
              </ul>
            </div>
          )}

          {/* Preview */}
          {importPreview.length > 0 && (
            <div className={cn(
              "p-3 rounded-lg border",
              theme === 'dark' ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"
            )}>
              <p className={cn("text-sm font-medium mb-2", theme === 'dark' ? "text-green-400" : "text-green-700")}>
                ✓ {importPreview.length} pergunta{importPreview.length !== 1 ? 's' : ''} reconhecida{importPreview.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {importPreview.slice(0, 5).map((q, i) => (
                  <div key={q.id} className={cn(
                    "text-xs p-2 rounded",
                    theme === 'dark' ? "bg-black/30" : "bg-white"
                  )}>
                    <span className={cn("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                      {i + 1}. {q.prompt.slice(0, 60)}{q.prompt.length > 60 ? '...' : ''}
                    </span>
                    <span className={cn("ml-2", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                      ({q.options.length} opções)
                    </span>
                  </div>
                ))}
                {importPreview.length > 5 && (
                  <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                    ...e mais {importPreview.length - 5} perguntas
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botão aplicar */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                theme === 'dark'
                  ? "bg-white/10 text-gray-300 hover:bg-white/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={applyImport}
              disabled={importPreview.length === 0}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2",
                theme === 'dark'
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-yellow-500 text-white hover:bg-yellow-600",
                importPreview.length === 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Adicionar {importPreview.length} pergunta{importPreview.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ABA: MANUAL (formulário normal)
      ═══════════════════════════════════════════════════════════════ */}
      {creationMode === 'manual' && (
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* INFORMAÇÕES BÁSICAS */}
          <div className={cn(
            "p-4 rounded-xl border",
            theme === 'dark' ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <h3 className={cn(
              "text-sm font-semibold mb-4",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Informações do Quiz
            </h3>

            <div className="mb-4">
              <label className={labelClass}>Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  if (validationErrors.titulo) {
                    setValidationErrors(prev => ({ ...prev, titulo: undefined }))
                  }
                }}
                className={cn(inputClass, validationErrors.titulo && "border-red-500")}
                placeholder="Ex: Quiz de HTML Básico"
              />
              {validationErrors.titulo && (
                <p className={errorClass}>
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.titulo}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className={labelClass}>Descrição *</label>
              <textarea
                value={descricao}
                onChange={(e) => {
                  setDescricao(e.target.value)
                  if (validationErrors.descricao) {
                    setValidationErrors(prev => ({ ...prev, descricao: undefined }))
                  }
                }}
                rows={2}
                className={cn(inputClass, "resize-none", validationErrors.descricao && "border-red-500")}
                placeholder="Descreva o que será avaliado neste quiz"
              />
              {validationErrors.descricao && (
                <p className={errorClass}>
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.descricao}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Tecnologia</label>
                <select
                  value={tecnologia}
                  onChange={(e) => setTecnologia(e.target.value)}
                  className={inputClass}
                >
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="React">React</option>
                  <option value="Android">Android</option>
                  <option value="Web Development">Web Development</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Nível</label>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>XP Total</label>
                <input
                  type="number"
                  min="1"
                  value={xp}
                  onChange={(e) => setXp(parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* PERGUNTAS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn(
                "text-sm font-semibold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Perguntas ({questions.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreationMode('import')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    theme === 'dark'
                      ? "bg-white/10 text-gray-300 hover:bg-white/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importar
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    theme === 'dark'
                      ? "bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>
            </div>

          {(validationErrors.questions || validationErrors.general) && (
            <p className={cn(errorClass, "mb-3")}>
              <AlertCircle className="w-3 h-3" />
              {validationErrors.general || validationErrors.questions}
            </p>
          )}

            <div className="space-y-3">
              {questions.map((question, qIndex) => {
                const isExpanded = expandedQuestions.has(question.id)
                const errors = questionErrors[question.id] || {}
                const hasErrors = Object.keys(errors).length > 0
                const validation = validateQuestion(question)

                return (
                  <div
                    key={question.id}
                    className={cn(
                      "rounded-xl border overflow-hidden transition-colors",
                      theme === 'dark'
                        ? hasErrors
                          ? "bg-red-500/5 border-red-500/30"
                          : "bg-black/30 border-white/10"
                        : hasErrors
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-gray-200"
                    )}
                  >
                    {/* Header da pergunta */}
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        theme === 'dark'
                          ? "hover:bg-white/5"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <GripVertical className={cn(
                        "w-4 h-4 flex-shrink-0",
                        theme === 'dark' ? "text-gray-600" : "text-gray-400"
                      )} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            Pergunta {qIndex + 1}
                          </span>
                          {validation.valid && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {hasErrors && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        {question.prompt && (
                          <p className={cn(
                            "text-xs truncate mt-0.5",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            {question.prompt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeQuestion(question.id)
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              theme === 'dark'
                                ? "hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                                : "hover:bg-red-100 text-gray-400 hover:text-red-600"
                            )}
                            title="Remover pergunta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className={cn("w-5 h-5", theme === 'dark' ? "text-gray-400" : "text-gray-500")} />
                        ) : (
                          <ChevronDown className={cn("w-5 h-5", theme === 'dark' ? "text-gray-400" : "text-gray-500")} />
                        )}
                      </div>
                    </div>

                    {/* Conteúdo expandido */}
                    {isExpanded && (
                      <div className={cn(
                        "px-4 pb-4 pt-2 border-t",
                        theme === 'dark' ? "border-white/10" : "border-gray-100"
                      )}>
                        {/* Texto da pergunta */}
                        <div className="mb-4">
                          <label className={labelClass}>Texto da Pergunta *</label>
                          <textarea
                            value={question.prompt}
                            onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })}
                            rows={2}
                            className={cn(inputClass, "resize-none", errors.prompt && "border-red-500")}
                            placeholder="Digite a pergunta aqui..."
                          />
                          {errors.prompt && (
                            <p className={errorClass}>
                              <AlertCircle className="w-3 h-3" />
                              {errors.prompt}
                            </p>
                          )}
                        </div>

                        {/* Opções */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className={labelClass}>Opções *</label>
                            {question.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => addOption(question.id)}
                                className={cn(
                                  "text-xs font-medium transition-colors",
                                  theme === 'dark'
                                    ? "text-yellow-400 hover:text-yellow-300"
                                    : "text-yellow-600 hover:text-yellow-700"
                                )}
                              >
                                + Adicionar opção
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={question.correctOptionId === option.id}
                                    onChange={() => setCorrectOption(question.id, option.id)}
                                    className={cn(
                                      "w-4 h-4 border-2 cursor-pointer",
                                      theme === 'dark'
                                        ? "border-gray-600 text-yellow-400 focus:ring-yellow-400/30"
                                        : "border-gray-300 text-yellow-500 focus:ring-yellow-500/30"
                                    )}
                                  />
                                  <span className={cn(
                                    "w-6 text-center text-sm font-bold",
                                    question.correctOptionId === option.id
                                      ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                                      : theme === 'dark' ? "text-gray-400" : "text-gray-500"
                                  )}>
                                    {option.label}
                                  </span>
                                </label>

                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                                  className={cn(inputClass, "flex-1")}
                                  placeholder={`Opção ${option.label}`}
                                />

                                {question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(question.id, option.id)}
                                    className={cn(
                                      "p-1.5 rounded-lg transition-colors",
                                      theme === 'dark'
                                        ? "hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                                        : "hover:bg-red-100 text-gray-400 hover:text-red-600"
                                    )}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {errors.options && (
                            <p className={errorClass}>
                              <AlertCircle className="w-3 h-3" />
                              {errors.options}
                            </p>
                          )}
                          {errors.correctOption && (
                            <p className={errorClass}>
                              <AlertCircle className="w-3 h-3" />
                              {errors.correctOption}
                            </p>
                          )}
                        </div>

                        {/* Pontuação e Penalidade */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className={labelClass}>Pontos (acerto) *</label>
                            <input
                              type="number"
                              min="1"
                              value={question.points}
                              onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 0 })}
                              className={cn(inputClass, errors.points && "border-red-500")}
                            />
                            {errors.points && (
                              <p className={errorClass}>
                                <AlertCircle className="w-3 h-3" />
                                {errors.points}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Penalidade (erro)</label>
                            <input
                              type="number"
                              min="0"
                              value={question.penalty || 0}
                              onChange={(e) => updateQuestion(question.id, { penalty: parseInt(e.target.value) || 0 })}
                              className={inputClass}
                            />
                          </div>
                        </div>

                        {/* Explicação */}
                        <div>
                          <label className={labelClass}>Explicação (opcional)</label>
                          <textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                            rows={2}
                            className={cn(inputClass, "resize-none")}
                            placeholder="Explique por que a resposta correta é essa (feedback para o aluno)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* BOTÕES */}
          <div className={cn(
            "flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 pb-2",
            theme === 'dark' ? "border-white/10 bg-[#0a0a0a]" : "border-gray-200 bg-white"
          )}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                theme === 'dark'
                  ? "bg-white/10 text-gray-300 hover:bg-white/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2",
                theme === 'dark'
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-yellow-500 text-white hover:bg-yellow-600",
                saving && "opacity-70 cursor-not-allowed"
              )}
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Criar Quiz'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
