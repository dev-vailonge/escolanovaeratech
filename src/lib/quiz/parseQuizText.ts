/**
 * Utilitário para parse de quiz em formato texto puro
 * Converte texto formatado em QuizQuestion[]
 */

import type { QuizQuestion, QuizOption, OptionLabel } from '@/types/quiz'
import { generateQuestionId, generateOptionId, OPTION_LABELS } from '@/types/quiz'

/**
 * Parse texto formatado do quiz para QuizQuestion[]
 * Formato esperado:
 * 1. Pergunta...
 * A) Alternativa 1
 * B) Alternativa 2
 * ...
 * R: C
 * E: Explicação
 * ---
 */
export function parseQuizText(text: string): { questions: QuizQuestion[]; errors: string[] } {
  const errors: string[] = []
  const questions: QuizQuestion[] = []
  
  // Divide por separadores: ---
  const blocks = text.split(/^---+$/gm).filter(b => b.trim())
  
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


