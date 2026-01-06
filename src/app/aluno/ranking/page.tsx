'use client'

import { useEffect, useState, useMemo } from 'react'
import { Trophy, TrendingUp, HelpCircle, MessageSquare, CheckCircle, Target, FileText, Award, Lock, RefreshCw, Crown, Clock } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { calculateLevel, getLevelBorderColor, getLevelRequirements, getLevelCategory } from '@/lib/gamification'
import BadgeDisplay from '@/components/comunidade/BadgeDisplay'
import CountdownTimer from '@/components/ui/countdown-timer'

// Função para verificar se o mês atual já fechou
// O mês anterior é considerado fechado no dia 1 (a partir de 00:01)
// Exemplo: Se estamos em 1º de fevereiro às 00:01, janeiro fechou e podemos mostrar o campeão de janeiro
// Se estamos nos dias 2-31, estamos no meio do mês atual (mostra cronômetro)
function isMonthClosed(): boolean {
  const now = new Date()
  const day = now.getDate()
  // Consideramos o mês anterior fechado a partir do dia 1
  // No dia 1, já podemos mostrar o campeão do mês anterior
  return day >= 1
}

// Função para calcular dias restantes até o fim do mês atual
function getDaysUntilMonthEnd(): number {
  const now = new Date()
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const diffTime = lastDayOfMonth.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}


export default function RankingPage() {
  const { theme } = useTheme()
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true) // Iniciar como true para mostrar loading inicial
  const [error, setError] = useState<string>('')
  const [ranking, setRanking] = useState<any[] | null>(null)
  const [rankingMensal, setRankingMensal] = useState<any[] | null>(null)
  const [isPontuacaoModalOpen, setIsPontuacaoModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [historicoCampeoes, setHistoricoCampeoes] = useState<any[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  
  // Calcular mês atual - sempre começar no mês atual
  const nowInit = new Date()
  const mesAtualKeyInit = `${nowInit.getFullYear()}-${String(nowInit.getMonth() + 1).padStart(2, '0')}`
  
  const [mesAtivo, setMesAtivo] = useState<string>(mesAtualKeyInit)
  
  // Buscar ranking mensal para o Card Mural
  // Se o mês fechou (dia >= 2), busca o campeão do mês anterior que acabou de fechar
  useEffect(() => {
    let mounted = true
    const run = async () => {
      // Se não há usuário ainda, aguardar
      if (!authUser) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const now = new Date()
        const day = now.getDate()
        
        // No dia 1, buscar campeão do mês anterior
        // Nos dias 2-31, mostrar cronômetro (não buscar campeão ainda)
        if (day >= 2) {
          console.log('[Ranking] Estamos no meio do mês, mostrando contagem regressiva')
          if (mounted) setRankingMensal([])
          return
        }

        console.log('[Ranking] Dia 1 - buscando campeão do mês anterior...')
        
        // Calcular qual deve ser o mês anterior
        const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const mesAnteriorKey = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
        const mesAnteriorNome = mesAnterior.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        
        console.log('[Ranking] Mês anterior esperado:', mesAnteriorKey, mesAnteriorNome)
        
        // Se o mês fechou, buscar o campeão do mês anterior (último mês fechado)
        const resHistorico = await fetch(`/api/ranking/historico?limit=1&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const jsonHistorico = await resHistorico.json().catch(() => ({}))
        
        console.log('[Ranking] Resposta do histórico:', {
          ok: resHistorico.ok,
          historicoLength: jsonHistorico.historico?.length || 0,
          historico: jsonHistorico.historico
        })
        
        if (resHistorico.ok && jsonHistorico.historico && jsonHistorico.historico.length > 0) {
          const campeaoDoMes = jsonHistorico.historico[0]
          console.log('[Ranking] Campeão encontrado:', campeaoDoMes.name, 'do mês', campeaoDoMes.mes, 'mesKey:', campeaoDoMes.mesKey)
          
          // Validar que o mês retornado é realmente o mês anterior
          if (campeaoDoMes.mesKey === mesAnteriorKey) {
            console.log('[Ranking] ✅ Mês validado corretamente, exibindo campeão')
            // Converter o formato do histórico para o formato esperado pelo ranking
            if (mounted) {
              setRankingMensal([{
                id: campeaoDoMes.id,
                name: campeaoDoMes.name,
                xp: 0, // Não usado para o card
                xp_mensal: campeaoDoMes.xpMensal,
                avatar_url: campeaoDoMes.avatarUrl,
                level: campeaoDoMes.level,
              }])
            }
          } else {
            console.log('[Ranking] ❌ Mês não corresponde ao esperado. Esperado:', mesAnteriorKey, 'Recebido:', campeaoDoMes.mesKey)
            // Se o mês não corresponde, não mostrar campeão
            if (mounted) setRankingMensal([])
          }
        } else {
          console.log('[Ranking] Nenhum campeão encontrado no histórico')
          // Se não encontrar histórico, limpar para não mostrar campeão errado
          if (mounted) setRankingMensal([])
        }
      } catch (e: any) {
        console.error('Erro ao buscar campeão do mês:', e)
        // Em caso de erro, limpar para não mostrar dados incorretos
        if (mounted) setRankingMensal([])
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [refreshTrigger, authUser]) // Adicionar authUser como dependência

  // Buscar ranking conforme o tipo selecionado (para a lista)
  // Mensal: ranking do mês atual (ordenado por xp_mensal)
  // Geral: ranking all time (ordenado por xp total)
  useEffect(() => {
    let mounted = true
    const run = async () => {
      // Se não há usuário ainda, aguardar
      if (!authUser) {
        setLoading(true)
        return
      }

      setError('')
      if (mounted) setLoading(true)
      
      try {
        // Buscar sessão diretamente (mais rápido que esperar por authUser)
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          if (mounted) {
            setError('Não autenticado')
            setLoading(false)
          }
          return
        }

        // Busca ranking geral (all time) - sem cache para dados sempre frescos
        const res = await fetch(`/api/ranking?type=geral&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store', // Forçar busca de dados frescos
        })
        const json = await res.json().catch(() => ({}))
        
        if (!res.ok) {
          throw new Error(json?.error || 'Erro ao carregar ranking')
        }

        if (!mounted) return
        
        // ranking contém lista ordenada por xp total (maior pontuação all time)
        setRanking(json?.ranking || [])
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Erro ao carregar ranking')
        setRanking(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Executar imediatamente ao montar e quando refreshTrigger mudar
    run()
    
    return () => {
      mounted = false
    }
  }, [refreshTrigger, authUser]) // Adicionar authUser como dependência

  // Removido fallback para mock - ranking deve vir sempre da API

  // Buscar histórico de campeões (excluindo o mês atual se ainda não fechou)
  useEffect(() => {
    let mounted = true
    const run = async () => {
      // Se não há usuário ainda, aguardar
      if (!authUser) {
        if (mounted) setLoadingHistorico(true)
        return
      }

      if (mounted) setLoadingHistorico(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          if (mounted) setLoadingHistorico(false)
          return
        }

        const res = await fetch(`/api/ranking/historico?limit=12&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !mounted) return

        // Se o mês fechou, remover o primeiro item do histórico (que é o mês atual)
        // pois ele já está sendo mostrado no card "Campeão do Mês"
        let historico = json?.historico || []
        if (isMonthClosed() && historico.length > 0) {
          historico = historico.slice(1) // Remover o primeiro (mês atual)
        }
        
        setHistoricoCampeoes(historico)
      } catch (e: any) {
        console.error('Erro ao buscar histórico:', e)
      } finally {
        if (mounted) setLoadingHistorico(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [refreshTrigger, authUser]) // Adicionar authUser como dependência

  // Calcular dias restantes e verificar se é dia 1
  const now = new Date()
  const day = now.getDate()
  const isDia1 = day === 1
  const diasRestantes = getDaysUntilMonthEnd()
  
  // Calcular data do fim do mês (último dia do mês às 23:59:59)
  const fimDoMes = useMemo(() => {
    const currentDate = new Date()
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    lastDayOfMonth.setHours(23, 59, 59, 999)
    return lastDayOfMonth
  }, [])
  
  // Calcular mês atual e anterior
  const mesAtualKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mesAnteriorKey = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}`
  
  // Campeão do mês anterior para o Card Mural (só mostra no dia 1)
  const campeaoMensal = useMemo(() => {
    if (!isDia1 || !rankingMensal || rankingMensal.length === 0) return null
    
    const u = rankingMensal[0]
    // Se já tem level (vindo do histórico), usar ele. Senão, calcular
    const level = u.level || calculateLevel(u.xp || 0)
    return {
      id: u.id,
      name: u.name,
      level: level,
      xp: u.xp || 0,
      xpMensal: u.xp_mensal || 0,
      avatarUrl: u.avatar_url || null,
    }
  }, [rankingMensal, isDia1])
  
  
  // Criar lista de meses (12 meses do ano atual: Jan a Dez de 2026)
  const meses = useMemo(() => {
    const lista: Array<{ key: string; nome: string; nomeAbreviado: string; date: Date }> = []
    const anoAtual = now.getFullYear() // Pega o ano atual (2026)
    
    // Sempre mostrar os 12 meses do ano atual (janeiro a dezembro)
    for (let i = 0; i < 12; i++) {
      const date = new Date(anoAtual, i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const nomeCompleto = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const nomeAbreviado = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      lista.push({ 
        key, 
        nome: nomeCompleto.charAt(0).toUpperCase() + nomeCompleto.slice(1),
        nomeAbreviado: nomeAbreviado.charAt(0).toUpperCase() + nomeAbreviado.slice(1),
        date 
      })
    }
    
    return lista
  }, [])
  
  // Criar mapa de campeões por mês
  const campeoesPorMes = useMemo(() => {
    const mapa = new Map<string, any>()
    // Adicionar campeão do mês anterior (se existir e estivermos no dia 1)
    if (isDia1 && campeaoMensal) {
      mapa.set(mesAnteriorKey, {
        ...campeaoMensal,
        mesKey: mesAnteriorKey,
      })
    }
    // Adicionar campeões do histórico
    historicoCampeoes.forEach(campeao => {
      if (campeao.mesKey) {
        mapa.set(campeao.mesKey, campeao)
      }
    })
    return mapa
  }, [historicoCampeoes, campeaoMensal, isDia1, mesAnteriorKey])

  // Normaliza dados do ranking da API para o formato esperado
  // A API já retorna ordenado corretamente:
  // - Mensal: ordenado por xp_mensal (maior pontuação do mês primeiro)
  // - Geral: ordenado por xp (maior pontuação all time primeiro)
  const filteredRanking = ranking ? ranking.map((u: any, idx: number) => {
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
  }) : []

  const currentUserId = authUser?.id
  const currentUser = currentUserId ? filteredRanking.find(u => u.id === currentUserId) : null
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

        {(loading || error) && (
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
          </div>
        )}
      </div>

      {/* Card Mural - Campeão do Mês com Abas */}
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
          Campeões Mensais
        </h2>
        
        {/* Abas dos Meses */}
        <div className={cn(
          "backdrop-blur-sm border rounded-lg p-1.5 mb-4 transition-colors duration-300 overflow-x-auto",
          theme === 'dark'
            ? "bg-black/30 border-white/10"
            : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex gap-1.5 min-w-max justify-center md:justify-start">
            {meses.map((mes) => {
              const isActive = mesAtivo === mes.key
              const isMesAtual = mes.key === mesAtualKey
              
              return (
                <button
                  key={mes.key}
                  onClick={() => setMesAtivo(mes.key)}
                  className={cn(
                    "px-3 py-2 rounded-md font-medium transition-all text-xs md:text-sm whitespace-nowrap flex-shrink-0",
                    "min-w-[50px] text-center",
                    isActive
                      ? theme === 'dark'
                        ? "bg-yellow-400 text-black shadow-md"
                        : "bg-yellow-500 text-white shadow-md"
                      : theme === 'dark'
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-yellow-500/20",
                    isMesAtual && !isActive && "font-semibold"
                  )}
                  title={mes.nome}
                >
                  <span className="hidden md:inline">{mes.nome}</span>
                  <span className="md:hidden">{mes.nomeAbreviado.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex flex-col items-center justify-center w-full">
          {(() => {
            const isMesAtual = mesAtivo === mesAtualKey
            
            // Se estamos no dia 1 e visualizando o mês atual, mostrar campeão do mês anterior
            // Se estamos nos dias 2-31 e visualizando o mês atual, mostrar cronômetro
            // Se visualizando qualquer outro mês, mostrar campeão (se existir)
            if (isMesAtual && !isDia1) {
              // Mês Atual (dias 2-31) - Mostrar contagem regressiva
              return (
                <div className={cn(
                  "backdrop-blur-sm border rounded-xl p-4 md:p-6 w-full transition-colors duration-300",
                  theme === 'dark'
                    ? "bg-black/30 border-yellow-400/50"
                    : "bg-yellow-50 border-yellow-300"
                )}>
                  <div className="text-center w-full">
                    <div className="w-full">
                      <CountdownTimer targetDate={fimDoMes} theme={theme === 'dark' ? 'dark' : 'light'} />
                    </div>
                    <p className={cn(
                      "text-sm md:text-base leading-relaxed mt-4",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      restantes para o campeão do mês ser revelado
                    </p>
                  </div>
                </div>
              )
            }
            
            // Para outros meses ou dia 1 do mês atual, mostrar campeão se existir
            const campeao = campeoesPorMes.get(mesAtivo)
            
            if (campeao) {
              // Mostrar campeão do mês
              return (
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
                  {campeao.avatarUrl ? (
                    <img
                      src={campeao.avatarUrl}
                      alt={campeao.name}
                      className={cn(
                        "w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 md:mb-4 object-cover border-[3px]",
                        getLevelBorderColor(campeao.level, theme === 'dark')
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center font-bold text-2xl md:text-3xl border-[3px]",
                      theme === 'dark'
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                        : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                      getLevelBorderColor(campeao.level, theme === 'dark')
                    )}>
                      {campeao.name.charAt(0)}
                    </div>
                  )}
                  <p className={cn(
                    "font-semibold text-lg md:text-xl text-center mb-2",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {campeao.name}
                  </p>
                  <p className={cn(
                    "text-sm md:text-base text-center mb-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Nível {campeao.level}
                  </p>
                  <p className={cn(
                    "font-bold text-center text-base md:text-lg",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )}>
                    {campeao.xpMensal.toLocaleString('pt-BR')} XP
                  </p>
                </div>
              )
            } else {
              // Mês sem campeão (sem dados históricos)
              return (
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
                  <div className="text-center">
                    <p className={cn(
                      "text-sm md:text-base mb-1",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      Sem dados deste mês
                    </p>
                    <p className={cn(
                      "text-xs md:text-sm",
                      theme === 'dark' ? "text-gray-500" : "text-gray-500"
                    )}>
                      Não há registro de campeão para este período
                    </p>
                  </div>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* Mural de Campeões Históricos */}
      {historicoCampeoes.length > 0 && (
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
            Mural de Campeões
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {historicoCampeoes.map((campeao, index) => (
              <div
                key={index}
                className={cn(
                  "backdrop-blur-sm border rounded-lg p-4 transition-colors duration-300",
                  theme === 'dark'
                    ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                    : "bg-gray-50 border-gray-200 hover:border-yellow-300"
                )}
              >
                <div className="text-center mb-2">
                  <p className={cn(
                    "text-xs md:text-sm font-semibold mb-1",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {campeao.mes}
                  </p>
                  <Trophy className={cn(
                    "w-6 h-6 md:w-8 md:h-8 mx-auto mb-2",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )} />
                </div>
                {campeao.avatarUrl ? (
                  <img
                    src={campeao.avatarUrl}
                    alt={campeao.name}
                    className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-2 object-cover border-2",
                      getLevelBorderColor(campeao.level, theme === 'dark')
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xl md:text-2xl border-2",
                    theme === 'dark'
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                      : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                    getLevelBorderColor(campeao.level, theme === 'dark')
                  )}>
                    {campeao.name.charAt(0)}
                  </div>
                )}
                <p className={cn(
                  "font-semibold text-sm md:text-base text-center mb-1 truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {campeao.name}
                </p>
                <p className={cn(
                  "text-xs md:text-sm text-center mb-1",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {campeao.level}
                </p>
                <p className={cn(
                  "font-bold text-xs md:text-sm text-center",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  {campeao.xpMensal.toLocaleString('pt-BR')} XP
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
        
      {/* Link para informações sobre pontos */}
      <div className="flex justify-center">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-xs md:text-sm",
                loading && "opacity-50 cursor-not-allowed",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-gray-300 hover:bg-black/50 hover:border-yellow-400/50"
                  : "bg-white border-yellow-400/70 text-gray-700 hover:bg-yellow-50 hover:border-yellow-500"
              )}
            >
              <RefreshCw className={cn("w-3 h-3 md:w-4 md:h-4", loading && "animate-spin")} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <div className={cn(
              "flex items-center gap-2 text-xs md:text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
              Atualizado hoje
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filteredRanking.length === 0 && !loading ? (
            <div className={cn(
              "text-center py-8 px-4 rounded-lg",
              theme === 'dark'
                ? "bg-black/30 border border-white/10 text-gray-400"
                : "bg-gray-50 border border-gray-200 text-gray-600"
            )}>
              <p className="text-sm md:text-base">
                {error || 'Nenhum ranking disponível no momento.'}
              </p>
              {!error && (
                <p className="text-xs mt-2">
                  Complete aulas, quizzes e desafios para aparecer no ranking!
                </p>
              )}
            </div>
          ) : (
            filteredRanking.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg transition-all duration-300",
                user.id === currentUserId
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
                user.id === currentUserId
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
                  user.id === currentUserId
                    ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    : theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.name}
                  {user.id === currentUserId && ' (Você)'}
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
                  {user.xp.toLocaleString('pt-BR')} XP
                </p>
                <p className={cn(
                  "text-xs hidden md:block",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {user.level}
                </p>
              </div>
            </div>
          )))}
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

          {/* Seção Top Member */}
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Crown className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-base md:text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Top Member
              </h3>
            </div>
            <div className={cn(
              "p-3 md:p-4 rounded-lg border",
              theme === 'dark' 
                ? "bg-black/30 border-white/10" 
                : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-start gap-3 mb-3">
                <BadgeDisplay badgeType="top_member" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs md:text-sm mb-2 leading-relaxed",
                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                  )}>
                    Ganhe o badge <strong>Top Member</strong> sendo o usuário com mais curtidas nas suas perguntas na comunidade.
                  </p>
                  <div className={cn(
                    "text-xs leading-relaxed space-y-1",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    <p>
                      <strong>Requisitos:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Ter pelo menos 50 curtidas totais nas suas perguntas</li>
                      <li>Ser o usuário com mais curtidas (ranking #1)</li>
                    </ul>
                    <p className="mt-2 italic">
                      Nota: Curtir perguntas não dá XP, mas aumenta sua reputação na comunidade!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

