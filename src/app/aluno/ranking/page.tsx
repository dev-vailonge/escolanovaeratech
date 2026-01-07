'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Trophy, TrendingUp, HelpCircle, MessageSquare, CheckCircle, Target, FileText, Award, Lock, RefreshCw, Crown, Clock, Share2, Download } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { calculateLevel, getLevelBorderColor, getLevelRequirements, getLevelCategory } from '@/lib/gamification'
import BadgeDisplay from '@/components/comunidade/BadgeDisplay'
import CountdownTimer from '@/components/ui/countdown-timer'
import html2canvas from 'html2canvas'

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
  const [tipoRanking, setTipoRanking] = useState<'mensal' | 'geral'>('geral')
  const [tipoMural, setTipoMural] = useState<'mensal' | 'geral'>('mensal')
  const [rankingGeral, setRankingGeral] = useState<any[] | null>(null)
  const [gerandoImagem, setGerandoImagem] = useState(false)
  const muralRef = useRef<HTMLDivElement>(null)
  
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

        // Busca ranking conforme o tipo selecionado (mensal ou geral)
        const res = await fetch(`/api/ranking?type=${tipoRanking}&_t=${Date.now()}`, {
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

    // Executar imediatamente ao montar e quando refreshTrigger ou tipoRanking mudar
    run()
    
    return () => {
      mounted = false
    }
  }, [refreshTrigger, authUser, tipoRanking]) // Adicionar tipoRanking como dependência

  // Removido fallback para mock - ranking deve vir sempre da API

  // Buscar ranking geral para o mural (quando tipoMural for 'geral')
  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (tipoMural !== 'geral' || !authUser) {
        if (mounted) setRankingGeral(null)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const res = await fetch(`/api/ranking?type=geral&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))

        if (res.ok && mounted) {
          setRankingGeral(json?.ranking || [])
        }
      } catch (e: any) {
        console.error('Erro ao buscar ranking geral para mural:', e)
        if (mounted) setRankingGeral(null)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [tipoMural, authUser])

  // Buscar histórico de campeões para o mural (todos os meses do ano atual)
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

        // Buscar histórico completo (sem limite para pegar todos os meses possíveis)
        const res = await fetch(`/api/ranking/historico?limit=100&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !mounted) return

        const historico = json?.historico || []
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
  
  
  // Criar lista de meses (12 meses do ano atual: Jan a Dez)
  const mesesAno = useMemo(() => {
    const lista: Array<{ key: string; nome: string; nomeAbreviado: string; date: Date }> = []
    const anoAtual = now.getFullYear()
    
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
  
  // Criar mapa de posições no ranking geral por user_id
  const posicoesGeral = useMemo(() => {
    const mapa = new Map<string, number>()
    if (rankingGeral && rankingGeral.length > 0) {
      rankingGeral.forEach((user: any, index: number) => {
        mapa.set(user.id, user.position ?? index + 1)
      })
    }
    return mapa
  }, [rankingGeral])

  // Criar mapa de campeões por mês para o mural (12 meses do ano atual)
  const campeoesMural = useMemo(() => {
    const mapa = new Map<string, any>()
    const anoAtual = new Date().getFullYear()
    
    // Adicionar campeão do mês anterior (se existir e estivermos no dia 1)
    if (isDia1 && campeaoMensal) {
      mapa.set(mesAnteriorKey, {
        ...campeaoMensal,
        mesKey: mesAnteriorKey,
      })
    }
    
    // Adicionar campeões do histórico que pertencem ao ano atual
    historicoCampeoes.forEach(campeao => {
      if (campeao.mesKey) {
        const [year] = campeao.mesKey.split('-')
        if (parseInt(year) === anoAtual) {
          mapa.set(campeao.mesKey, campeao)
        }
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
    const xpMensal = u.xp_mensal || 0
    // Para ranking mensal, usar XP mensal para calcular nível. Para geral, usar XP total
    const xpParaNivel = tipoRanking === 'mensal' ? xpMensal : xpTotal
    const calculatedLevel = calculateLevel(xpTotal) // Sempre calcular nível baseado no XP total (nível não muda por mês)
    return {
      id: u.id,
      name: u.name,
      level: calculatedLevel, // Usar nível calculado (baseado em XP total)
      xp: xpTotal, // XP total (all time)
      xpMensal: xpMensal, // XP do mês
      xpExibido: tipoRanking === 'mensal' ? xpMensal : xpTotal, // XP a ser exibido conforme o tipo
      position: u.position ?? idx + 1,
      accessLevel: 'full',
      avatarUrl: u.avatar_url || null,
    }
  }) : []

  const currentUserId = authUser?.id
  const currentUser = currentUserId ? filteredRanking.find(u => u.id === currentUserId) : null
  const currentUserPosition = currentUser?.position || 0

  // Função para gerar e compartilhar imagem do mural
  const handleCompartilharMural = async () => {
    if (!muralRef.current) return

    setGerandoImagem(true)
    try {
      // Temporariamente esconder o botão de compartilhar para não aparecer na imagem
      const shareButton = muralRef.current.querySelector('button[title="Compartilhar mural nas redes sociais"]') as HTMLElement
      const originalDisplay = shareButton?.style.display
      if (shareButton) {
        shareButton.style.display = 'none'
      }

      // Gerar imagem do mural usando html2canvas
      const canvas = await html2canvas(muralRef.current, {
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        scale: 2, // Maior qualidade
        logging: false,
        useCORS: true,
        allowTaint: false,
      })

      // Restaurar visibilidade do botão
      if (shareButton) {
        shareButton.style.display = originalDisplay || ''
      }

      // Converter canvas para blob
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Erro ao gerar imagem')
          setGerandoImagem(false)
          return
        }

        // Criar URL temporária
        const url = URL.createObjectURL(blob)

        // Tentar usar Web Share API se disponível (mobile)
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'mural-campeoes.png', { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            navigator.share({
              title: 'Mural dos Campeões - Escola Nova Era Tech',
              text: 'Confira o Mural dos Campeões Mensais!',
              files: [file],
            }).then(() => {
              URL.revokeObjectURL(url)
              setGerandoImagem(false)
            }).catch((error) => {
              console.error('Erro ao compartilhar:', error)
              // Fallback para download
              downloadImage(url)
            })
            return
          }
        }

        // Fallback: download da imagem
        downloadImage(url)
      }, 'image/png', 0.95)
    } catch (error) {
      console.error('Erro ao gerar imagem do mural:', error)
      setGerandoImagem(false)
    }
  }

  // Função auxiliar para fazer download da imagem
  const downloadImage = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `mural-campeoes-${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setGerandoImagem(false)
  }

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

        {/* Link para informações sobre pontos */}
        <div className="flex justify-center mb-4">
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

        {(loading || error) && (
          <div
            className={cn(
              'border rounded-lg p-3 text-sm mb-4',
              error
                ? theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
                : theme === 'dark'
                  ? 'bg-gray-800/30 border-white/10 text-gray-300'
                  : 'bg-yellow-500/10 border-yellow-400/50 text-gray-700'
            )}
          >
            {loading && 'Carregando ranking...'}
            {!loading && error}
          </div>
        )}
      </div>

      {/* Ranking Completo */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
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
                  : "bg-yellow-500/10 border-yellow-400/70 text-gray-700 hover:bg-yellow-500/20 hover:border-yellow-500"
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

        {/* Seletor de Tipo de Ranking */}
        <div className={cn(
          "backdrop-blur-sm border rounded-lg p-1.5 mb-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/30 border-white/10"
            : "bg-yellow-500/10 border-yellow-400/50"
        )}>
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={() => setTipoRanking('mensal')}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-all text-sm flex-1",
                tipoRanking === 'mensal'
                  ? theme === 'dark'
                    ? "bg-yellow-400 text-black shadow-md"
                    : "bg-yellow-500 text-white shadow-md"
                  : theme === 'dark'
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-yellow-500/20"
              )}
            >
              Mês
            </button>
            <button
              onClick={() => setTipoRanking('geral')}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-all text-sm flex-1",
                tipoRanking === 'geral'
                  ? theme === 'dark'
                    ? "bg-yellow-400 text-black shadow-md"
                    : "bg-yellow-500 text-white shadow-md"
                  : theme === 'dark'
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-yellow-500/20"
              )}
            >
              Geral
            </button>
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
                  {user.xpExibido.toLocaleString('pt-BR')} XP
                </p>
                <p className={cn(
                  "text-xs hidden md:block",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  {tipoRanking === 'mensal' ? 'Este mês' : `Nível ${user.level}`}
                </p>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Mural dos Campeões - 12 Meses */}
      <div ref={muralRef} className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Mural dos Campeões
          </h2>
          <button
            onClick={handleCompartilharMural}
            disabled={gerandoImagem}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-xs md:text-sm",
              gerandoImagem && "opacity-50 cursor-not-allowed",
              theme === 'dark'
                ? "bg-black/30 border-white/10 text-gray-300 hover:bg-black/50 hover:border-yellow-400/50"
                : "bg-yellow-500/10 border-yellow-400/70 text-gray-700 hover:bg-yellow-500/20 hover:border-yellow-500"
            )}
            title="Compartilhar mural nas redes sociais"
          >
            {gerandoImagem ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Compartilhar
              </>
            )}
          </button>
        </div>
        
        {/* Seletor de Tipo de Mural */}
        <div className={cn(
          "backdrop-blur-sm border rounded-lg p-1.5 mb-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/30 border-white/10"
            : "bg-yellow-500/10 border-yellow-400/50"
        )}>
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={() => setTipoMural('mensal')}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-all text-sm flex-1",
                tipoMural === 'mensal'
                  ? theme === 'dark'
                    ? "bg-yellow-400 text-black shadow-md"
                    : "bg-yellow-500 text-white shadow-md"
                  : theme === 'dark'
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-yellow-500/20"
              )}
            >
              Mês
            </button>
            <button
              onClick={() => setTipoMural('geral')}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-all text-sm flex-1",
                tipoMural === 'geral'
                  ? theme === 'dark'
                    ? "bg-yellow-400 text-black shadow-md"
                    : "bg-yellow-500 text-white shadow-md"
                  : theme === 'dark'
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-yellow-500/20"
              )}
            >
              Geral
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {mesesAno.map((mes) => {
            const campeao = campeoesMural.get(mes.key)
            const category = campeao ? getLevelCategory(campeao.level) : null
            const posicaoGeral = campeao ? posicoesGeral.get(campeao.id) : null
            
            return (
              <div
                key={mes.key}
                className={cn(
                  "flex flex-col items-center p-3 md:p-4 rounded-lg transition-all duration-300 relative",
                  theme === 'dark'
                    ? "bg-black/30 border border-white/10 hover:border-white/20"
                    : "bg-yellow-500/10 border border-yellow-400/50 hover:border-yellow-300"
                )}
              >
                {/* Troféu no topo */}
                <Trophy className={cn(
                  "w-5 h-5 md:w-6 md:h-6 mb-2",
                  campeao
                    ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    : theme === 'dark' ? "text-gray-600" : "text-gray-400"
                )} />
                
                {/* Avatar com borda colorida baseada no nível */}
                {campeao ? (
                  <>
                    {campeao.avatarUrl ? (
                      <img
                        src={campeao.avatarUrl}
                        alt={campeao.name}
                        className={cn(
                          "w-12 h-12 md:w-16 md:h-16 rounded-full mb-2 object-cover border-[3px]",
                          getLevelBorderColor(campeao.level, theme === 'dark')
                        )}
                      />
                    ) : (
                      <div className={cn(
                        "w-12 h-12 md:w-16 md:h-16 rounded-full mb-2 flex items-center justify-center font-bold text-lg md:text-xl border-[3px]",
                        theme === 'dark'
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                          : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                        getLevelBorderColor(campeao.level, theme === 'dark')
                      )}>
                        {campeao.name.charAt(0)}
                      </div>
                    )}
                    
                    {/* Nome completo */}
                    <p className={cn(
                      "font-semibold text-xs md:text-sm text-center mb-1 truncate w-full",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {campeao.name}
                    </p>
                    
                    {/* XP do mês ou Posição Geral */}
                    {tipoMural === 'mensal' ? (
                      <p className={cn(
                        "font-bold text-xs text-center mb-1",
                        theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                      )}>
                        {campeao.xpMensal.toLocaleString('pt-BR')} XP
                      </p>
                    ) : (
                      <p className={cn(
                        "font-bold text-xs text-center mb-1",
                        theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                      )}>
                        #{posicaoGeral || '?'} Geral
                      </p>
                    )}
                    
                    {/* Nível na borda (badge) */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold border-2",
                      category === 'iniciante'
                        ? theme === 'dark'
                          ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                          : "bg-yellow-500/30 border-yellow-500 text-yellow-700"
                        : category === 'intermediario'
                        ? theme === 'dark'
                          ? "bg-blue-500/20 border-blue-500 text-blue-400"
                          : "bg-blue-500/30 border-blue-500 text-blue-700"
                        : theme === 'dark'
                        ? "bg-purple-600/20 border-purple-600 text-purple-400"
                        : "bg-purple-600/30 border-purple-600 text-purple-700"
                    )}>
                      {campeao.level}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Placeholder quando não há campeão */}
                    <div className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-full mb-2 flex items-center justify-center border-[3px] border-dashed",
                      theme === 'dark'
                        ? "border-gray-600 bg-gray-800/30"
                        : "border-gray-300 bg-gray-100"
                    )}>
                      <span className={cn(
                        "text-xs md:text-sm",
                        theme === 'dark' ? "text-gray-600" : "text-gray-400"
                      )}>
                        ?
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs text-center",
                      theme === 'dark' ? "text-gray-500" : "text-gray-500"
                    )}>
                      Sem campeão
                    </p>
                  </>
                )}
                
                {/* Nome do mês */}
                <p className={cn(
                  "text-xs text-center mt-1 font-medium",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  {mes.nomeAbreviado.split(' ')[0]}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Card Próximo Campeão - Contador */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <h2 className={cn(
          "text-lg md:text-xl font-bold mb-4 md:mb-6 text-center",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Próximo Campeão
        </h2>
        
        <div className={cn(
          "backdrop-blur-sm border rounded-xl p-4 md:p-6 w-full transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/30 border-yellow-400/50"
            : "bg-yellow-50 border-yellow-300"
        )}>
          <div className="text-center w-full">
            <div className="w-full opacity-60">
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
                  : "bg-yellow-500/10 border-yellow-400/50"
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
                  : "bg-yellow-500/10 border-yellow-400/50"
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
                  : "bg-yellow-500/10 border-yellow-400/50"
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
                : "bg-yellow-500/10 border-yellow-400/50"
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
                : "bg-yellow-500/10 border-yellow-400/50"
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
                50 XP
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
                : "bg-yellow-500/10 border-yellow-400/50"
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
                : "bg-yellow-500/10 border-yellow-400/50"
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

