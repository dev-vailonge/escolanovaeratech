'use client'

import { useEffect, useMemo, useState } from 'react'
import { mockRanking } from '@/data/aluno/mockRanking'
import { mockUser } from '@/data/aluno/mockUser'
import { Trophy, TrendingUp, HelpCircle, MessageSquare, CheckCircle, Target, FileText, Award, Lock } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { calculateLevel, getLevelBorderColor, getLevelRequirements, getLevelCategory } from '@/lib/gamification'

type RankingType = 'mensal' | 'geral'

export default function RankingPage() {
  const { theme } = useTheme()
  const [rankingType, setRankingType] = useState<RankingType>('mensal')
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [hotmartStatus, setHotmartStatus] = useState<string>('')
  const [ranking, setRanking] = useState<any[] | null>(null)
  const [rankingMensal, setRankingMensal] = useState<any[] | null>(null)
  const [isPontuacaoModalOpen, setIsPontuacaoModalOpen] = useState(false)
  
  // Buscar ranking mensal para o Card Mural (sempre)
  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const res = await fetch(`/api/ranking?type=mensal`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) return

        if (!mounted) return
        setRankingMensal(json?.ranking || [])
      } catch (e: any) {
        // Silencioso - não precisa mostrar erro aqui
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  // Buscar ranking conforme o tipo selecionado (para a lista)
  // Mensal: ranking do mês atual (ordenado por xp_mensal)
  // Geral: ranking all time (ordenado por xp total)
  useEffect(() => {
    let mounted = true
    const run = async () => {
      setError('')
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Não autenticado')

        // Busca ranking mensal ou geral conforme o seletor
        const res = await fetch(`/api/ranking?type=${rankingType}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar ranking')

        if (!mounted) return
        // ranking contém lista ordenada:
        // - Se mensal: ordenado por xp_mensal (maior pontuação do mês)
        // - Se geral: ordenado por xp (maior pontuação all time)
        setRanking(json?.ranking || [])
        setHotmartStatus(json?.hotmart?.message || '')
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Erro ao carregar ranking')
        setRanking(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [rankingType])

  const fallbackRankingMensal = useMemo(() => {
    return mockRanking
      .filter(user => user.accessLevel === 'full')
      .sort((a, b) => b.xpMensal - a.xpMensal)
      .map((user, index) => ({ ...user, position: index + 1, avatarUrl: user.avatar || null }))
  }, [])

  // Fallback ranking para quando a API não retornar dados
  // Mensal: ordena por xpMensal (maior pontuação do mês)
  // Geral: ordena por xp (maior pontuação all time)
  const fallbackRanking = useMemo(() => {
    return mockRanking
      .filter(user => user.accessLevel === 'full')
      .sort((a, b) => {
        // Mensal: ordena por XP do mês
        // Geral: ordena por XP total (all time)
        const xpA = rankingType === 'mensal' ? a.xpMensal : a.xp
        const xpB = rankingType === 'mensal' ? b.xpMensal : b.xp
        return xpB - xpA // Descendente (maior primeiro)
      })
      .map((user, index) => {
        const xpTotal = user.xp || 0
        const calculatedLevel = calculateLevel(xpTotal) // Calcular nível baseado no XP
        return { 
          ...user, 
          level: calculatedLevel, // Usar nível calculado
          position: index + 1, 
          avatarUrl: user.avatar || null 
        }
      })
  }, [rankingType])

  // Campeão do mês para o Card Mural
  const campeaoMensal = useMemo(() => {
    if (rankingMensal && rankingMensal.length > 0) {
      const u = rankingMensal[0]
      const xpTotal = u.xp || 0
      const calculatedLevel = calculateLevel(xpTotal)
      return {
        id: u.id,
        name: u.name,
        level: calculatedLevel, // Usar nível calculado
        xp: xpTotal, // XP total para cálculo do nível
        xpMensal: u.xp_mensal,
        avatarUrl: u.avatar_url || null,
      }
    }
    // Fallback para mock
    const fallback = fallbackRankingMensal[0]
    if (fallback) {
      const xpTotal = fallback.xp || 0
      const calculatedLevel = calculateLevel(xpTotal)
      return {
        id: fallback.id,
        name: fallback.name,
        level: calculatedLevel, // Usar nível calculado
        xp: xpTotal,
        xpMensal: fallback.xpMensal,
        avatarUrl: fallback.avatarUrl,
      }
    }
    return null
  }, [rankingMensal, fallbackRankingMensal])

  // Normaliza dados do ranking da API para o formato esperado
  // A API já retorna ordenado corretamente:
  // - Mensal: ordenado por xp_mensal (maior pontuação do mês primeiro)
  // - Geral: ordenado por xp (maior pontuação all time primeiro)
  const filteredRanking = useMemo(() => {
    if (!ranking) return fallbackRanking
    // Adapter: API retorna xp/xp_mensal/level (snake_case), aqui normalizamos
    return (ranking || []).map((u: any, idx: number) => {
      const xpTotal = u.xp || 0
      const calculatedLevel = calculateLevel(xpTotal) // Calcular nível baseado no XP total
      return {
        id: u.id,
        name: u.name,
        level: calculatedLevel, // Usar nível calculado
        xp: xpTotal, // XP total (all time)
        xpMensal: u.xp_mensal, // XP do mês
        position: u.position ?? idx + 1,
        accessLevel: 'full',
        avatarUrl: u.avatar_url || null,
      }
    })
  }, [ranking, fallbackRanking])

  const currentUserId = authUser?.id || mockUser.id
  const currentUser = filteredRanking.find(u => u.id === currentUserId)
  const currentUserPosition = currentUser?.position || 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Ranking
        </h1>
        <p className={cn(
          "text-sm md:text-base mb-4",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Ranking baseado em XP. Complete aulas, quizzes e desafios para subir de posição!
        </p>

        {(loading || error || hotmartStatus) && (
          <div
            className={cn(
              'border rounded-lg p-3 text-sm mb-4',
              error
                ? theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
                : theme === 'dark'
                  ? 'bg-black/20 border-white/10 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'
            )}
          >
            {loading && 'Carregando ranking...'}
            {!loading && error}
            {!loading && !error && hotmartStatus && `Hotmart: ${hotmartStatus}`}
          </div>
        )}
      </div>

      {/* Card Mural - Campeão do Mês */}
      {campeaoMensal && (
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <h2 className={cn(
            "text-lg md:text-xl font-bold mb-4 md:mb-6 text-center",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Campeão do Mês
          </h2>
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className={cn(
              "backdrop-blur-sm border rounded-xl p-4 md:p-6 w-full transition-colors duration-300",
              theme === 'dark'
                ? "bg-black/30 border-yellow-400/50"
                : "bg-yellow-50 border-yellow-300"
            )}>
              <Trophy className={cn(
                "w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              {campeaoMensal.avatarUrl ? (
                <img
                  src={campeaoMensal.avatarUrl}
                  alt={campeaoMensal.name}
                  className={cn(
                    "w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 md:mb-4 object-cover border-[3px]",
                    getLevelBorderColor(campeaoMensal.level, theme === 'dark')
                  )}
                />
              ) : (
                <div className={cn(
                  "w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center font-bold text-2xl md:text-3xl border-[3px]",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                  getLevelBorderColor(campeaoMensal.level, theme === 'dark')
                )}>
                  {campeaoMensal.name.charAt(0)}
                </div>
              )}
              <p className={cn(
                "font-semibold text-lg md:text-xl text-center mb-2",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {campeaoMensal.name}
              </p>
              <p className={cn(
                "text-sm md:text-base text-center mb-2",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Nível {campeaoMensal.level}
              </p>
              <p className={cn(
                "font-bold text-center text-base md:text-lg",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )}>
                {campeaoMensal.xpMensal.toLocaleString('pt-BR')} XP
              </p>
            </div>
          </div>
          </div>
        )}
        
      {/* Seletores Mensal/Geral */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setRankingType('mensal')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
              rankingType === 'mensal'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "bg-black/30 text-gray-400 border border-white/10 hover:bg-white/5"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setRankingType('geral')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
              rankingType === 'geral'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "bg-black/30 text-gray-400 border border-white/10 hover:bg-white/5"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            )}
          >
            Geral
          </button>
        </div>
        <button
          onClick={() => setIsPontuacaoModalOpen(true)}
          className={cn(
            "flex items-center gap-2 text-xs md:text-sm transition-colors",
        theme === 'dark'
              ? "text-gray-400 hover:text-yellow-400"
              : "text-gray-600 hover:text-yellow-600"
          )}
        >
          <HelpCircle className="w-4 h-4" />
          Como funcionam os pontos?
        </button>
      </div>

      {/* Ranking Completo */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 md:mb-4">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Ranking Completo
          </h2>
          <div className={cn(
            "flex items-center gap-2 text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
            Atualizado hoje
          </div>
        </div>

        <div className="space-y-2">
          {filteredRanking.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg transition-all duration-300",
                user.id === mockUser.id
                  ? theme === 'dark'
                    ? "bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/30"
                    : "bg-yellow-100 border border-yellow-300 shadow-sm"
                  : theme === 'dark'
                    ? "bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20"
                    : "bg-gray-50 border border-gray-200 hover:border-yellow-400 shadow-sm"
              )}
            >
              <div className={cn(
                "text-sm md:text-lg font-bold w-8 md:w-12 text-center flex-shrink-0",
                user.id === mockUser.id
                  ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  : theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                #{user.position}
              </div>
              
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0 border-2",
                    getLevelBorderColor(user.level, theme === 'dark')
                  )}
                />
              ) : (
                <div className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0 border-2",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                  getLevelBorderColor(user.level, theme === 'dark')
                )}>
                  {user.name.charAt(0)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-sm md:text-base truncate",
                  user.id === mockUser.id
                    ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    : theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.name}
                  {user.id === mockUser.id && ' (Você)'}
                </p>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {user.level}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "font-bold text-xs md:text-sm",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {/* Mensal: mostra XP do mês | Geral: mostra XP total (all time) */}
                  {(rankingType === 'mensal' ? user.xpMensal : user.xp).toLocaleString('pt-BR')} XP
                </p>
                <p className={cn(
                  "text-xs hidden md:block",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {user.level}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Como funcionam os pontos */}
      <Modal
        isOpen={isPontuacaoModalOpen}
        onClose={() => setIsPontuacaoModalOpen(false)}
        title="Como funcionam os pontos?"
        size="lg"
      >
        <div className="space-y-4 md:space-y-6">
          {/* Seção Comunidade */}
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <MessageSquare className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-base md:text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Comunidade
              </h3>
            </div>
            <div className="space-y-2">
              <div className={cn(
                "flex items-center justify-between p-2 md:p-3 rounded-lg border gap-2",
                theme === 'dark' 
                  ? "bg-black/30 border-white/10" 
                  : "bg-gray-50 border-gray-200"
              )}>
                <span className={cn(
                  "text-xs md:text-sm flex-1 min-w-0",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}>
                  Pergunta
                </span>
                <span className={cn(
                  "font-bold text-sm md:text-base flex-shrink-0",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  10 XP
                </span>
              </div>
              <div className={cn(
                "flex items-center justify-between p-2 md:p-3 rounded-lg border gap-2",
                theme === 'dark' 
                  ? "bg-black/30 border-white/10" 
                  : "bg-gray-50 border-gray-200"
              )}>
                <span className={cn(
                  "text-xs md:text-sm flex-1 min-w-0",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}>
                  Resposta
                </span>
                <span className={cn(
                  "font-bold text-sm md:text-base flex-shrink-0",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  1 XP
                </span>
              </div>
              <div className={cn(
                "flex items-center justify-between p-2 md:p-3 rounded-lg border gap-2",
                theme === 'dark' 
                  ? "bg-black/30 border-white/10" 
                  : "bg-gray-50 border-gray-200"
              )}>
                <span className={cn(
                  "text-xs md:text-sm flex-1 min-w-0 break-words",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}>
                  Resposta marcada como certa pelo autor
                </span>
                <span className={cn(
                  "font-bold text-sm md:text-base flex-shrink-0",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  100 XP
                </span>
              </div>
            </div>
          </div>

          {/* Seção Quiz */}
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <CheckCircle className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-base md:text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Quiz
              </h3>
            </div>
            <div className={cn(
              "flex items-center justify-between p-2 md:p-3 rounded-lg border gap-2",
              theme === 'dark' 
                ? "bg-black/30 border-white/10" 
                : "bg-gray-50 border-gray-200"
            )}>
              <span className={cn(
                "text-xs md:text-sm flex-1 min-w-0",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Quiz (percentual de acertos)
              </span>
              <span className={cn(
                "font-bold text-sm md:text-base flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )}>
                20 XP
              </span>
            </div>
            <p className={cn(
              "text-xs mt-2 leading-relaxed",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Se acertou todas as perguntas, leva a pontuação toda. Se não acertou todas, leva o percentual de acerto × o valor total. Ex: 80% de acerto = 16 XP
            </p>
          </div>

          {/* Seção Desafios */}
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Target className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-base md:text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Desafios
              </h3>
            </div>
            <div className={cn(
              "flex items-center justify-between p-2 md:p-3 rounded-lg border gap-2",
              theme === 'dark' 
                ? "bg-black/30 border-white/10" 
                : "bg-gray-50 border-gray-200"
            )}>
              <span className={cn(
                "text-xs md:text-sm flex-1 min-w-0",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Desafio concluído
              </span>
              <span className={cn(
                "font-bold text-sm md:text-base flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )}>
                40 XP
              </span>
            </div>
          </div>

          {/* Seção Formulários */}
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <FileText className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-base md:text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Formulários
              </h3>
            </div>
            <div className={cn(
              "flex items-center justify-between p-2 md:p-3 rounded-lg border gap-2",
              theme === 'dark' 
                ? "bg-black/30 border-white/10" 
                : "bg-gray-50 border-gray-200"
            )}>
              <span className={cn(
                "text-xs md:text-sm flex-1 min-w-0",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Formulário preenchido
              </span>
              <span className={cn(
                "font-bold text-sm md:text-base flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )}>
                1 XP
              </span>
            </div>
          </div>

          {/* Seção Níveis - Explicativa */}
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Award className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-base md:text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Níveis
              </h3>
            </div>
            <p className={cn(
              "text-xs md:text-sm mb-3 md:mb-4",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Os níveis vão de 1 a 9, sendo:
            </p>
            
            {/* Grid de Níveis - Explicativo */}
            <div className="grid grid-cols-3 gap-3">
              {getLevelRequirements().map((xpRequired, index) => {
                const level = index + 1
                const category = getLevelCategory(level)
                
                // Cores oficiais (consistentes em ambos os temas)
                let circleBg = ''
                let circleText = ''
                
                if (category === 'iniciante') {
                  circleBg = 'bg-yellow-500'
                  circleText = 'text-white'
                } else if (category === 'intermediario') {
                  circleBg = 'bg-blue-500'
                  circleText = 'text-white'
                } else {
                  circleBg = 'bg-purple-600'
                  circleText = 'text-white'
                }

                return (
                  <div
                    key={level}
                    className="text-center"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center font-bold text-base mx-auto mb-2",
                      circleBg,
                      circleText
                    )}>
                      {level}
                    </div>
                    <p className={cn(
                      "text-sm font-medium mb-0.5",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      Level {level}
                    </p>
                    <p className={cn(
                      "text-xs",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      {xpRequired} pontos
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

