'use client'

import { HelpCircle, CheckCircle2, Play, Trophy, Lock, Loader2, BookOpen, Lightbulb, Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { hasFullAccess } from '@/lib/types/auth'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { getAllQuizzes } from '@/lib/database'
import { getAuthToken } from '@/lib/getAuthToken'
import type { DatabaseQuiz } from '@/types/database'
import type { QuizQuestion } from '@/types/quiz'
import QuizPlayer, { QuizResult } from '@/components/quiz/QuizPlayer'

// Interface para quiz na UI (com progresso do usuário)
interface QuizUI {
  id: string
  titulo: string
  descricao: string
  tecnologia: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  questoes: QuizQuestion[]
  numQuestoes: number
  tempoEstimado: number
  xpGanho: number
  completo: boolean
  pontuacao?: number
  tentativas: number
  melhorPontuacao?: number
  disponivel: boolean
  xpTotalGanho?: number // XP total já ganho deste quiz
  dataConclusao?: string // Data/hora de conclusão do quiz
}

export default function QuizPage() {
  const { theme } = useTheme()
  const { user: authUser } = useAuth()
  const canParticipate = hasFullAccess(authUser)

  const [quizes, setQuizes] = useState<QuizUI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState<QuizUI | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // Estados para abas e modal de seleção
  const [activeTab, setActiveTab] = useState<'inicial' | 'concluidos'>('inicial')
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [selectedTecnologia, setSelectedTecnologia] = useState('')
  const [selectedNivel, setSelectedNivel] = useState<'iniciante' | 'intermediario' | 'avancado' | ''>('')
  const [selectionError, setSelectionError] = useState<string>('')
  const [isGerando, setIsGerando] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  
  // Mensagens animadas e provocativas para o loading (20 mensagens para cobrir 60s)
  const loadingMessages = [
    {
      title: "Nossa IA está criando um quiz para você!",
      subtitle: "Aguarde um momento enquanto geramos",
      emoji: "✨"
    },
    {
      title: "Espere mais um pouco...",
      subtitle: "Estamos gerando seu quiz personalizado",
      emoji: "⚡"
    },
    {
      title: "Se prepare heim!",
      subtitle: "As perguntas estão sendo criadas especialmente para você",
      emoji: "🔥"
    },
    {
      title: "Pensando nas melhores questões...",
      subtitle: "Nossa IA está analisando o nível escolhido",
      emoji: "🤔"
    },
    {
      title: "Criando perguntas desafiadoras!",
      subtitle: "Garantindo que o quiz seja interessante",
      emoji: "💡"
    },
    {
      title: "Quase lá!",
      subtitle: "Últimos ajustes para garantir que o quiz seja perfeito",
      emoji: "🎯"
    },
    {
      title: "Validando cada questão...",
      subtitle: "Garantindo qualidade e relevância",
      emoji: "✅"
    },
    {
      title: "Faltam só alguns segundos...",
      subtitle: "Nossa IA está finalizando as questões",
      emoji: "🚀"
    },
    {
      title: "Quase pronto!",
      subtitle: "Organizando as perguntas de forma inteligente",
      emoji: "📝"
    },
    {
      title: "Criando as alternativas...",
      subtitle: "Garantindo que cada opção seja relevante",
      emoji: "🎲"
    },
    {
      title: "Adicionando explicações...",
      subtitle: "Para que você aprenda com cada resposta",
      emoji: "📚"
    },
    {
      title: "Revisando tudo...",
      subtitle: "Garantindo que está tudo perfeito para você",
      emoji: "🔍"
    },
    {
      title: "Quase finalizando!",
      subtitle: "Ajustando os últimos detalhes",
      emoji: "⚙️"
    },
    {
      title: "Preparando o quiz...",
      subtitle: "Organizando tudo para sua experiência",
      emoji: "🎨"
    },
    {
      title: "Últimos toques!",
      subtitle: "Deixando tudo perfeito para você",
      emoji: "🌟"
    },
    {
      title: "Quase terminando...",
      subtitle: "Só mais alguns segundos",
      emoji: "⏳"
    },
    {
      title: "Finalizando!",
      subtitle: "O quiz está quase pronto",
      emoji: "🎊"
    },
    {
      title: "Está quase pronto!",
      subtitle: "Só mais um pouquinho",
      emoji: "💫"
    },
    {
      title: "Quase acabando!",
      subtitle: "Últimos ajustes finais",
      emoji: "⚡"
    },
    {
      title: "Está saindo do forno!",
      subtitle: "Seu quiz personalizado está quase pronto",
      emoji: "🔥"
    }
  ]
  
  // Opções para os dropdowns (mesmas tecnologias da página de desafios)
  const TECNOLOGIAS_POR_CATEGORIA = {
    'Frontend Web': ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
    'Backend': ['Node.js', 'Express', 'APIs REST', 'PostgreSQL', 'MongoDB'],
    'Mobile Android': ['Kotlin', 'Jetpack Compose', 'Android'],
    'Mobile iOS': ['Swift', 'SwiftUI'],
    'Análise de Dados': ['Python', 'Pandas', 'SQL', 'Data Visualization'],
    'Fundamentos': ['Lógica de Programação', 'Algoritmos', 'Estrutura de Dados', 'Git'],
  }
  const tecnologias = Object.values(TECNOLOGIAS_POR_CATEGORIA).flat()
  const niveis: Array<'iniciante' | 'intermediario' | 'avancado'> = ['iniciante', 'intermediario', 'avancado']

  // Rotacionar mensagens de loading a cada 3 segundos
  useEffect(() => {
    if (!isGerando) {
      setLoadingMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => {
        // Ciclar pelas mensagens
        return (prev + 1) % loadingMessages.length
      })
    }, 3000) // Mudar mensagem a cada 3 segundos

    return () => clearInterval(interval)
  }, [isGerando, loadingMessages.length])

  // Carregar quizzes do Supabase
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true)
        
        // Buscar quizzes, progresso e XP ganho em paralelo para melhor performance
        const [dbQuizzes, progressResult, xpHistoryResult] = await Promise.allSettled([
          getAllQuizzes(),
          // Buscar progresso do usuário se logado
          authUser?.id
            ? supabase
                .from('user_quiz_progress')
                .select('quiz_id, tentativas, melhor_pontuacao, completo, updated_at')
                .eq('user_id', authUser.id)
                .then(({ data, error }) => {
                  if (error) {
                    console.error('❌ Erro ao buscar progresso:', error)
                    return []
                  }
                  return data || []
                })
            : Promise.resolve([]),
          // Buscar histórico de XP ganho em quizzes
          authUser?.id
            ? supabase
                .from('user_xp_history')
                .select('source_id, amount')
                .eq('user_id', authUser.id)
                .eq('source', 'quiz')
                .then(({ data, error }) => {
                  if (error) {
                    console.error('❌ Erro ao buscar histórico de XP:', error)
                    return []
                  }
                  return data || []
                })
            : Promise.resolve([])
        ])
        
        // Processar quizzes
        if (dbQuizzes.status !== 'fulfilled') {
          throw new Error('Erro ao carregar quizzes')
        }
        
        // Processar progresso
        let userProgress: Record<string, { tentativas: number; melhor_pontuacao: number | null; completo: boolean; dataConclusao?: string }> = {}
        if (progressResult.status === 'fulfilled' && Array.isArray(progressResult.value)) {
          progressResult.value.forEach((p: any) => {
            userProgress[p.quiz_id] = {
              tentativas: p.tentativas || 0,
              melhor_pontuacao: p.melhor_pontuacao,
              completo: p.completo || false,
              dataConclusao: p.completo ? p.updated_at : undefined
            }
          })
        }

        // Processar XP ganho por quiz
        let xpGanhoPorQuiz: Record<string, number> = {}
        if (xpHistoryResult.status === 'fulfilled' && Array.isArray(xpHistoryResult.value)) {
          xpHistoryResult.value.forEach((entry: any) => {
            if (entry.source_id) {
              xpGanhoPorQuiz[entry.source_id] = (xpGanhoPorQuiz[entry.source_id] || 0) + (entry.amount || 0)
            }
          })
        }
        
        // Converter para formato UI
        const quizzesUI: QuizUI[] = dbQuizzes.value
          .filter(q => q.disponivel) // Só mostrar disponíveis
          .map(q => {
            const progress = userProgress[q.id]
            const questoesArray = Array.isArray(q.questoes) ? q.questoes as QuizQuestion[] : []
            const numQuestoes = questoesArray.length
            
            return {
              id: q.id,
              titulo: q.titulo,
              descricao: q.descricao,
              tecnologia: q.tecnologia,
              nivel: q.nivel,
              questoes: questoesArray,
              numQuestoes,
              tempoEstimado: Math.max(5, Math.ceil(numQuestoes * 1.5)), // ~1.5 min por questão
              xpGanho: q.xp,
              completo: progress?.completo || false,
              pontuacao: progress?.melhor_pontuacao ?? undefined,
              tentativas: progress?.tentativas || 0,
              melhorPontuacao: progress?.melhor_pontuacao ?? undefined,
              disponivel: q.disponivel,
              xpTotalGanho: xpGanhoPorQuiz[q.id] || 0,
              dataConclusao: progress?.dataConclusao
            }
          })
        
        setQuizes(quizzesUI)
      } catch (err) {
        console.error('Erro ao carregar quizzes:', err)
        setError('Erro ao carregar quizzes. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuizzes()
  }, [authUser?.id])

  const quizesCompletos = useMemo(() => quizes.filter(q => q.completo), [quizes])
  const quizesCompletosCount = useMemo(() => quizesCompletos.length, [quizesCompletos])

  // Abrir modal de seleção para fazer novo quiz
  const handleFazerQuiz = () => {
    if (!canParticipate) return
    setSelectionError('')
    setSelectedTecnologia('')
    setSelectedNivel('')
    setShowSelectionModal(true)
  }

  // Confirmar seleção e gerar/buscar quiz
  const handleConfirmarSelecao = async () => {
    if (!selectedTecnologia || !selectedNivel) {
      setSelectionError('Por favor, selecione tecnologia e nível')
      return
    }

    setIsGerando(true)
    setSelectionError('')
    setLoadingMessageIndex(0) // Resetar mensagem ao iniciar

    try {
      console.log('🔐 Obtendo token para gerar quiz...')
      let token = await getAuthToken()
      
      // Se não conseguiu token, tentar uma última vez com getSession direto
      if (!token) {
        console.log('🔄 Última tentativa: getSession() direto...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token || null
          if (token) {
            console.log('✅ Token obtido na última tentativa')
          }
        } catch (e) {
          console.error('❌ Última tentativa falhou:', e)
        }
      }
      
      if (!token) {
        console.error('❌ Token não encontrado após todas as tentativas')
        setSelectionError('Não foi possível obter o token de autenticação. Por favor, faça logout e login novamente.')
        setIsGerando(false)
        return
      }

      const res = await fetch('/api/quiz/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tecnologia: selectedTecnologia, nivel: selectedNivel })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao gerar quiz')
      }

      // Converter DatabaseQuiz para QuizUI
      const quizDb = json.quiz as DatabaseQuiz
      const questoes = Array.isArray(quizDb.questoes) ? quizDb.questoes as QuizQuestion[] : []
      
      const quizUI: QuizUI = {
        id: quizDb.id,
        titulo: quizDb.titulo,
        descricao: quizDb.descricao,
        tecnologia: quizDb.tecnologia,
        nivel: quizDb.nivel,
        questoes,
        numQuestoes: questoes.length,
        tempoEstimado: questoes.length * 2, // 2 min por pergunta
        xpGanho: quizDb.xp,
        completo: false, // Será verificado depois
        tentativas: 0,
        disponivel: quizDb.disponivel
      }

      // Fechar modal de seleção
      setShowSelectionModal(false)
      setSelectionError('')
      
      // Abrir QuizPlayer
      setError('')
      setSuccess('')
      setSelectedQuiz(quizUI)
      setIsPlaying(true)
    } catch (e: any) {
      setSelectionError(e?.message || 'Erro ao gerar quiz')
    } finally {
      setIsGerando(false)
    }
  }

  // Iniciar quiz (para refazer)
  const handleStartQuiz = (quiz: QuizUI) => {
    if (!canParticipate) return
    if (quiz.numQuestoes === 0) {
      setError('Este quiz ainda não tem perguntas cadastradas.')
      return
    }
    setError('')
    setSuccess('')
    setSelectedQuiz(quiz)
    setIsPlaying(true)
  }

  // Completar quiz
  const handleCompleteQuiz = async (result: QuizResult) => {
    if (!selectedQuiz || !authUser?.id) return
    
    try {
      // Obter token
      const getToken = async () => {
        try {
          const { data } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: null } }>((resolve) => 
              setTimeout(() => resolve({ data: { session: null } }), 3000)
            )
          ])
          if (data?.session?.access_token) return data.session.access_token
        } catch {}
        
        // Fallback localStorage
        const key = 'sb-' + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token'
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            return JSON.parse(stored)?.access_token
          } catch {}
        }
        return null
      }
      
      const token = await getToken()
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/quiz/${selectedQuiz.id}/completar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pontuacao: result.pontuacao }),
      })
      
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Falha ao registrar quiz')

      const xp = json?.result?.xp ?? 0
      const xpRemanescente = json?.result?.xpRemanescente ?? 0
      const tentativas = json?.result?.tentativas ?? (selectedQuiz.tentativas + 1)
      const melhorPontuacao = json?.result?.melhorPontuacao ?? Math.max(selectedQuiz.melhorPontuacao || 0, result.pontuacao)
      const awarded = json?.result?.awarded !== false

      // Atualizar estado local
      setQuizes((prev) =>
        prev.map((q) => {
          if (q.id === selectedQuiz.id) {
            const novoXpTotalGanho = (q.xpTotalGanho || 0) + xp
            return {
              ...q,
              completo: true,
              pontuacao: result.pontuacao,
              tentativas,
              melhorPontuacao,
              xpTotalGanho: novoXpTotalGanho
            }
          }
          return q
        })
      )

      if (awarded) {
        const mensagem = xpRemanescente > 0
          ? `✅ Quiz concluído! Você ganhou ${xp} XP (${xpRemanescente} XP restantes) com ${result.acertos}/${result.total} acertos.`
          : `✅ Quiz concluído! Você ganhou ${xp} XP com ${result.acertos}/${result.total} acertos.`
        setSuccess(mensagem)
      } else {
        setSuccess(`✅ Quiz concluído! Você já atingiu o limite máximo de XP deste quiz (${selectedQuiz.xpGanho} XP).`)
      }
    } catch (e: any) {
      console.error('Erro ao registrar quiz:', e)
      setError(e?.message || 'Erro ao registrar resultado')
    }
  }

  // Fechar quiz
  const handleCloseQuiz = () => {
    setSelectedQuiz(null)
    setIsPlaying(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Quiz
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Teste seus conhecimentos e ganhe XP
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center p-12",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando quizzes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Modal do Quiz Player */}
      <Modal 
        isOpen={isPlaying && !!selectedQuiz} 
        onClose={handleCloseQuiz} 
        title="" 
        size="lg"
      >
        {selectedQuiz && (
          <QuizPlayer
            quizId={selectedQuiz.id}
            titulo={selectedQuiz.titulo}
            questoes={selectedQuiz.questoes}
            xpTotal={selectedQuiz.xpGanho}
            onComplete={handleCompleteQuiz}
            onCancel={handleCloseQuiz}
          />
        )}
      </Modal>

      {/* Modal de Seleção de Tecnologia e Nível */}
      <Modal 
        isOpen={showSelectionModal} 
        onClose={() => {
          if (!isGerando) {
            setShowSelectionModal(false)
            setSelectionError('')
          }
        }} 
        title={isGerando ? "Gerando Quiz" : "Selecione Tecnologia e Nível"} 
        size="md"
      >
        {isGerando ? (
          // Loading interativo com mensagens dinâmicas
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500",
                theme === 'dark'
                  ? "bg-yellow-500/20"
                  : "bg-yellow-100"
              )}>
                <Sparkles className={cn(
                  "w-10 h-10 animate-pulse",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )} />
              </div>
              
              <h3 className={cn(
                "text-xl font-bold mb-2 text-center transition-all duration-300 flex items-center justify-center gap-2",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )} key={loadingMessageIndex}>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                  {loadingMessages[loadingMessageIndex]?.emoji || '✨'}
                </span>
                <span>{loadingMessages[loadingMessageIndex]?.title || 'Gerando quiz...'}</span>
              </h3>
              
              <p className={cn(
                "text-sm text-center max-w-md mb-4 transition-all duration-300",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )} key={`subtitle-${loadingMessageIndex}`}>
                {loadingMessages[loadingMessageIndex]?.subtitle || 'Aguarde um momento...'}
                {selectedTecnologia && (
                  <> de <strong className={cn(
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )}>{selectedTecnologia}</strong> no nível <strong className={cn(
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )}>{selectedNivel === 'iniciante' ? 'Iniciante' : selectedNivel === 'intermediario' ? 'Intermediário' : 'Avançado'}</strong></>
                )}
              </p>
              
              <div className={cn(
                "w-full max-w-xs h-2 rounded-full overflow-hidden",
                theme === 'dark' ? "bg-white/10" : "bg-gray-200"
              )}>
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    theme === 'dark' ? "bg-yellow-500" : "bg-yellow-600"
                  )} 
                  style={{
                    width: `${Math.min(50 + (loadingMessageIndex * 2.5), 95)}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }} 
                />
              </div>
              
              <p className={cn(
                "text-xs text-center mt-4 animate-pulse",
                theme === 'dark' ? "text-gray-500" : "text-gray-500"
              )}>
                {loadingMessageIndex < 6 
                  ? "Isso pode levar alguns segundos..." 
                  : loadingMessageIndex < 14
                  ? "Quase terminando..."
                  : "Finalizando..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectionError && (
              <div className={cn(
                'border rounded-lg p-3 text-sm',
                theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
              )}>
                {selectionError}
              </div>
            )}

            <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Tecnologia
            </label>
            <select
              value={selectedTecnologia}
              onChange={(e) => {
                setSelectedTecnologia(e.target.value)
                setSelectionError('')
              }}
              className={cn(
                "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            >
              <option value="">Selecione uma tecnologia</option>
              {Object.entries(TECNOLOGIAS_POR_CATEGORIA).map(([categoria, techs]) => (
                <optgroup key={categoria} label={categoria}>
                  {techs.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Nível
            </label>
            <select
              value={selectedNivel}
              onChange={(e) => {
                setSelectedNivel(e.target.value as 'iniciante' | 'intermediario' | 'avancado' | '')
                setSelectionError('')
              }}
              className={cn(
                "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            >
              <option value="">Selecione um nível</option>
              {niveis.map(nivel => (
                <option key={nivel} value={nivel}>
                  {nivel === 'iniciante' ? 'Iniciante' : nivel === 'intermediario' ? 'Intermediário' : 'Avançado'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowSelectionModal(false)
                setSelectionError('')
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              )}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarSelecao}
              disabled={isGerando}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                isGerando && "opacity-50 cursor-not-allowed",
                theme === 'dark'
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              )}
            >
              {isGerando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Iniciar Quiz'
              )}
            </button>
          </div>
          </div>
        )}
      </Modal>

      {(error || success) && (
        <div
          className={cn(
            'border rounded-lg p-3 text-sm',
            error
              ? theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
              : theme === 'dark'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-green-50 border-green-200 text-green-700'
          )}
        >
          {error || success}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Quiz
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Teste seus conhecimentos e ganhe XP
        </p>
      </div>

      {/* Abas */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-1 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('inicial')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base",
              activeTab === 'inicial'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20"
            )}
          >
            Novo Quiz
          </button>
          <button
            onClick={() => setActiveTab('concluidos')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base",
              activeTab === 'concluidos'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20"
            )}
          >
            Quiz Concluídos
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        {activeTab === 'inicial' ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            <HelpCircle className={cn(
              "w-16 h-16 md:w-20 md:h-20 mb-6",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )} />
            <h2 className={cn(
              "text-xl md:text-2xl font-bold mb-4 text-center",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Pronto para testar seus conhecimentos?
            </h2>
            <p className={cn(
              "text-sm md:text-base mb-8 text-center max-w-md",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Escolha uma tecnologia e nível para começar um novo quiz e ganhar XP!
            </p>
            <button
              onClick={handleFazerQuiz}
              disabled={!canParticipate}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold text-base md:text-lg transition-all",
                !canParticipate
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                  : theme === 'dark'
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
              )}
            >
              {!canParticipate ? 'Acesso Limitado' : 'Fazer Quiz'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {/* Card de Estatísticas */}
            <div className={cn(
              "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
              theme === 'dark'
                ? "bg-gray-800/30 border-white/10"
                : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
            )}>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className={cn(
                    "text-xl md:text-2xl font-bold",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {quizesCompletosCount}
                  </p>
                  <p className={cn(
                    "text-xs md:text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Quiz Concluídos
                  </p>
                </div>
              </div>
            </div>

            {/* Insights Gerais */}
            {quizesCompletos.length > 0 && (() => {
              const quizzesComBaixaPontuacao = quizesCompletos.filter(q => (q.melhorPontuacao || 0) < 70)
              if (quizzesComBaixaPontuacao.length === 0) return null
              
              const tecnologiasComDificuldade = [...new Set(quizzesComBaixaPontuacao.map(q => q.tecnologia))]
              
              return (
                <div className={cn(
                  "p-4 rounded-xl border",
                  theme === 'dark' 
                    ? "bg-blue-500/10 border-blue-500/30" 
                    : "bg-blue-50 border-blue-200"
                )}>
                  <div className="flex items-start gap-3">
                    <Lightbulb className={cn(
                      "w-5 h-5 flex-shrink-0 mt-0.5",
                      theme === 'dark' ? "text-blue-400" : "text-blue-600"
                    )} />
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold mb-2",
                        theme === 'dark' ? "text-blue-300" : "text-blue-800"
                      )}>
                        💡 Recomendações de Estudo
                      </h3>
                      <div className={cn(
                        "space-y-2 text-sm",
                        theme === 'dark' ? "text-blue-200" : "text-blue-700"
                      )}>
                        <p>
                          Você teve dificuldades em {quizzesComBaixaPontuacao.length} {quizzesComBaixaPontuacao.length === 1 ? 'quiz' : 'quizzes'}.
                        </p>
                        {tecnologiasComDificuldade.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Foque em revisar:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              {tecnologiasComDificuldade.map((tech, idx) => (
                                <li key={idx}>{tech}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="mt-2">
                          Recomendamos refazer esses quizzes após revisar os conceitos para melhorar seu desempenho!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {quizesCompletos.length === 0 ? (
              <div className={cn(
                "p-8 text-center rounded-xl border",
                theme === 'dark'
                  ? "bg-gray-800/30 border-white/10 text-gray-400"
                  : "bg-yellow-500/10 border-yellow-400/50 text-gray-600"
              )}>
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum quiz concluído ainda</p>
                <p className="text-sm">Complete quizzes para vê-los aqui!</p>
              </div>
            ) : (
              quizesCompletos.map((quiz) => (
                <div
                  key={quiz.id}
                  className={cn(
                    "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                    theme === 'dark'
                      ? "bg-gray-800/30 border-white/10 hover:border-yellow-400/50"
                      : "bg-yellow-500/10 border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                        <h3 className={cn(
                          "text-base md:text-lg font-semibold flex-1 min-w-0",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {quiz.titulo}
                        </h3>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border",
                          theme === 'dark'
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        )}>
                          {quiz.tecnologia}
                        </span>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border flex items-center gap-1 whitespace-nowrap",
                          theme === 'dark'
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-green-100 text-green-700 border-green-300"
                        )}>
                          <Trophy className="w-3 h-3" />
                          {quiz.melhorPontuacao}%
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm md:text-base mb-3 md:mb-4 line-clamp-2",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        {quiz.descricao}
                      </p>
                      
                      <div className={cn(
                        "flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-3",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
                          {quiz.numQuestoes} questões
                        </span>
                        <span className="capitalize">{quiz.nivel}</span>
                        <span className={cn(
                          "font-semibold",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )}>
                          +{quiz.xpGanho} XP
                        </span>
                      </div>

                      <div className={cn(
                        "text-xs md:text-sm",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        <p>
                          Melhor pontuação: <span className={cn(
                            "font-semibold",
                            theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                          )}>
                            {quiz.melhorPontuacao}%
                          </span>
                        </p>
                        <p>Tentativas: {quiz.tentativas}</p>
                        <p>
                          XP ganho: <span className={cn(
                            "font-semibold",
                            theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                          )}>
                            {quiz.melhorPontuacao 
                              ? Math.round((quiz.melhorPontuacao / 100) * quiz.xpGanho) 
                              : 0}/{quiz.xpGanho} XP
                          </span>
                        </p>
                        {quiz.dataConclusao && (
                          <p>
                            Concluído em: <span className="font-semibold">
                              {new Date(quiz.dataConclusao).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!canParticipate && (
                        <div className={cn(
                          "p-3 rounded-lg text-sm",
                          theme === 'dark'
                            ? "bg-yellow-400/10 border border-yellow-400/30 text-yellow-400"
                            : "bg-yellow-50 border border-yellow-300 text-yellow-700"
                        )}>
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Upgrade para participar</span>
                          </div>
                        </div>
                      )}
                      <button 
                        className={cn(
                          "btn-primary w-full md:w-auto",
                          (!canParticipate || quiz.numQuestoes === 0) && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!quiz.disponivel || !canParticipate || quiz.numQuestoes === 0}
                        onClick={() => handleStartQuiz(quiz)}
                      >
                        {!canParticipate 
                          ? 'Acesso Limitado' 
                          : quiz.numQuestoes === 0
                            ? 'Sem perguntas'
                            : 'Refazer'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
