'use client'

import { useEffect, useState, useCallback, memo, useMemo } from 'react'
import Image from 'next/image'
import ProgressCard from '@/components/aluno/ProgressCard'
import { BookOpen, Trophy, HelpCircle, Target, Clock, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { getNotificacoesAtivas } from '@/lib/database'
import type { DatabaseNotificacao } from '@/types/database'

// Tipos para estatísticas do usuário
interface UserStats {
  aulasCompletas: number
  quizCompletos: number
  desafiosConcluidos: number
  tempoEstudo: number
  participacaoComunidade: number
  perguntasRespondidas: number
  perguntasFeitas: number
}

// Tipos para avisos/notificações
interface Announcement {
  id: string
  title: string
  message: string
  date?: string // opcional (ISO)
  type?: "info" | "warning" | "update" // opcional para cor do badge
}

// Tipo para usuário do ranking
interface RankingUser {
  id: string
  name: string
  level: number
  xp: number
  xp_mensal: number
  avatar_url?: string | null
  position: number
}

// Função para converter notificação do banco para o formato do componente
function convertNotificacaoToAnnouncement(notificacao: DatabaseNotificacao): Announcement {
  return {
    id: notificacao.id,
    title: notificacao.titulo,
    message: notificacao.mensagem,
    date: notificacao.created_at,
    type: notificacao.tipo,
  }
}

// Componente para exibir um card de aviso - memoizado para performance
const AnnouncementCard = memo(function AnnouncementCard({ title, message, type, date }: Announcement) {
  const { theme } = useTheme()

  // Memoizar formatação de data
  const formattedDate = useMemo(() => {
    if (!date) return null
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }, [date])

  return (
    <div className={cn(
      "w-full p-4 md:p-5 rounded-xl backdrop-blur-md border shadow-lg flex flex-col gap-2 transition-colors duration-300",
      theme === 'dark'
        ? "bg-black/20 border-white/10"
        : "bg-white/80 border-yellow-400/90 shadow-md"
    )}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className={cn(
          "text-base md:text-lg font-semibold flex-1 min-w-0",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {title}
        </h3>
        {type && (
          <span className={cn(
            "text-xs px-2 py-1 rounded-md uppercase tracking-wide font-medium flex-shrink-0",
            type === "info" && (
              theme === 'dark'
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-blue-100 text-blue-700 border border-blue-300"
            ),
            type === "update" && (
              theme === 'dark'
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-green-100 text-green-700 border border-green-300"
            ),
            type === "warning" && (
              theme === 'dark'
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                : "bg-yellow-100 text-yellow-700 border border-yellow-300"
            )
          )}>
            {type === "info" ? "Informação" : type === "update" ? "Atualização" : "Aviso"}
          </span>
        )}
      </div>

      <p className={cn(
        "text-sm md:text-base leading-relaxed",
        theme === 'dark' ? "text-white/80" : "text-gray-700"
      )}>
        {message}
      </p>

      {formattedDate && (
        <p className={cn(
          "text-xs md:text-sm mt-1",
          theme === 'dark' ? "text-white/40" : "text-gray-500"
        )}>
          {formattedDate}
        </p>
      )}
    </div>
  )
})

export default function AlunoDashboard() {
  const { user: authUser } = useAuth()
  const { theme } = useTheme()
  
  // Estado para estatísticas reais
  const [stats, setStats] = useState<UserStats>({
    aulasCompletas: 0,
    quizCompletos: 0,
    desafiosConcluidos: 0,
    tempoEstudo: 0,
    participacaoComunidade: 0,
    perguntasRespondidas: 0,
    perguntasFeitas: 0,
  })
  
  // Estado para avisos/notificações reais
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  
  // Estado para ranking real
  const [topRanking, setTopRanking] = useState<RankingUser[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Helper para obter token com timeout e fallback - memoizado
  const getTokenWithTimeout = useCallback(async (): Promise<string | null> => {
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{ data: { session: null } }>((resolve) => 
          setTimeout(() => resolve({ data: { session: null } }), 500) // Reduzido para 500ms
        )
      ])
      
      if (sessionResult?.data?.session?.access_token) {
        return sessionResult.data.session.access_token
      }
    } catch (err) {
      // Silenciar erro em produção para melhor performance
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro ao obter sessão:', err)
      }
    }
    
    return null
  }, [])

  // Buscar todos os dados em paralelo para melhor performance
  const fetchAllData = useCallback(async () => {
    try {
      setLoadingData(true)
      
      // Obter token e authUser primeiro
      const [token, currentAuthUser] = await Promise.all([
        getTokenWithTimeout(),
        Promise.resolve(authUser) // Já está disponível no contexto
      ])
      
      // Carregar notificações filtradas por userId (se disponível)
      const notificacoesPromise = getNotificacoesAtivas(currentAuthUser?.id)

      // Executar requisições críticas primeiro (stats e notificações)
      const [statsResult, notificacoesResult] = await Promise.allSettled([
        // Stats do usuário
        token && currentAuthUser?.id
          ? fetch('/api/users/me/stats', { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            })
              .then(async (r) => {
                if (!r.ok) {
                  // Retornar stats vazios ao invés de null para não quebrar a UI
                  return {
                    aulasCompletas: 0,
                    quizCompletos: 0,
                    desafiosConcluidos: 0,
                    tempoEstudo: 0,
                    participacaoComunidade: 0,
                    perguntasRespondidas: 0,
                    perguntasFeitas: 0
                  }
                }
                return r.json()
              })
              .catch(() => {
                // Retornar stats vazios ao invés de null
                return {
                  aulasCompletas: 0,
                  quizCompletos: 0,
                  desafiosConcluidos: 0,
                  tempoEstudo: 0,
                  participacaoComunidade: 0,
                  perguntasRespondidas: 0,
                  perguntasFeitas: 0
                }
              })
          : Promise.resolve({
              aulasCompletas: 0,
              quizCompletos: 0,
              desafiosConcluidos: 0,
              tempoEstudo: 0,
              participacaoComunidade: 0,
              perguntasRespondidas: 0,
              perguntasFeitas: 0
            }),
        // Notificações (já iniciado acima)
        notificacoesPromise,
      ])
      
      // Processar stats e notificações imediatamente
      if (statsResult.status === 'fulfilled' && statsResult.value) {
        setStats(statsResult.value)
      }

      if (notificacoesResult.status === 'fulfilled') {
        setAnnouncements(notificacoesResult.value.map(convertNotificacaoToAnnouncement))
      }
      
      // Carregar ranking em background (não bloqueia a renderização)
      if (token) {
        fetch('/api/ranking?type=geral', { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        })
          .then(async (r) => {
            if (!r.ok) {
              setTopRanking([])
              return
            }
            const json = await r.json()
            if (json?.ranking) {
              setTopRanking(json.ranking.slice(0, 3))
            }
          })
          .catch(() => {
            setTopRanking([])
          })
      }

    } catch (error) {
      // Silenciar erro em produção
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar dados do dashboard:', error)
      }
    } finally {
      setLoadingData(false)
    }
  }, [authUser, getTokenWithTimeout])

  useEffect(() => {
    // Aguardar um pouco para garantir que authUser está disponível, mas não bloquear muito
    const timer = setTimeout(() => {
      fetchAllData()
    }, 100) // Pequeno delay para garantir que authUser está disponível
    
    return () => clearTimeout(timer)
  }, [fetchAllData])

  // Nome do usuário (real ou fallback) - memoizado
  const userName = useMemo(() => authUser?.name || 'Aluno', [authUser?.name])

  // Memoizar top ranking para evitar re-renders
  const topRankingMemo = useMemo(() => topRanking, [topRanking])

  // Memoizar tempo formatado
  const tempoFormatado = useMemo(() => {
    const horas = Math.floor(stats.tempoEstudo / 60)
    const minutos = stats.tempoEstudo % 60
    return `${horas}h ${minutos}m`
  }, [stats.tempoEstudo])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section - Sempre visível, não depende de loading */}
      <div className={cn(
        "backdrop-blur-md bg-gradient-to-r rounded-xl p-4 md:p-6 border transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 from-yellow-400/10 to-transparent border-yellow-400/20"
          : "bg-yellow-50/80 from-yellow-100/50 to-transparent border-yellow-400/90 shadow-md"
      )}>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Olá, {userName}! 👋
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-700"
        )}>
          Continue sua jornada de aprendizado e suba no ranking!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressCard
          title="Aulas Completas"
          count={stats.aulasCompletas}
          icon={<BookOpen className="w-6 h-6 text-yellow-500" />}
          color="yellow"
        />
        <ProgressCard
          title="Quiz Completos"
          count={stats.quizCompletos}
          icon={<HelpCircle className="w-6 h-6 text-blue-500" />}
          color="blue"
        />
        <ProgressCard
          title="Desafios Concluídos"
          count={stats.desafiosConcluidos}
          icon={<Target className="w-6 h-6 text-green-500" style={{ color: 'rgba(109, 220, 45, 1)' }} />}
          color="green"
        />
        <ProgressCard
          title="Perguntas Respondidas"
          count={stats.perguntasRespondidas}
          icon={<MessageCircle className="w-6 h-6 text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Avisos da Escola */}
      {announcements.length > 0 && (
        <section className="w-full flex flex-col gap-3 md:gap-4">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Avisos da Escola
          </h2>

          <div className="flex flex-col gap-3 md:gap-4">
            {announcements.map(announcement => (
              <AnnouncementCard key={announcement.id} {...announcement} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions */}
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <h2 className={cn(
            "text-lg md:text-xl font-bold mb-3 md:mb-4",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Ações Rápidas
          </h2>
          <div className="space-y-2 md:space-y-3">
            <Link
              href="/aluno/comunidade"
              prefetch={true}
              className={cn(
                "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg hover:border-yellow-400/50 transition-all active:scale-[0.98] min-h-[72px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
              )}
            >
              <MessageCircle className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm md:text-base truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Responder Comunidade
                </p>
                <p className={cn(
                  "text-xs md:text-sm truncate",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Ajude outros alunos e ganhe XP
                </p>
              </div>
            </Link>
            <Link
              href="/aluno/quiz"
              prefetch={true}
              className={cn(
                "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg hover:border-yellow-400/50 transition-all active:scale-[0.98] min-h-[72px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
              )}
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm md:text-base truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Novo Quiz Disponível
                </p>
                <p className={cn(
                  "text-xs md:text-sm truncate",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  JavaScript Fundamentos
                </p>
              </div>
            </Link>
            <Link
              href="/aluno/desafios"
              prefetch={true}
              className={cn(
                "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg hover:border-yellow-400/50 transition-all active:scale-[0.98] min-h-[72px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
              )}
            >
              <Target className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm md:text-base truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Desafio da Semana
                </p>
                <p className={cn(
                  "text-xs md:text-sm truncate",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Crie um Card Interativo
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Top Ranking */}
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className={cn(
              "text-lg md:text-xl font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Top Ranking
            </h2>
            <Link
              href="/aluno/ranking"
              prefetch={true}
              className={cn(
                "text-xs md:text-sm hover:opacity-80 transition-opacity",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
              )}
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2 md:space-y-3">
            {loadingData ? (
              <div className={cn(
                "text-center py-4 text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Carregando...
              </div>
            ) : topRanking.length === 0 ? (
              <div className={cn(
                "text-center py-4 text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Nenhum usuário no ranking ainda
              </div>
            ) : (
              topRankingMemo.map((user, index) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg transition-colors duration-300 min-h-[72px]",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10"
                      : "bg-yellow-50/80 border-yellow-400/70"
                  )}
                >
                  <div className={cn(
                    "text-lg md:text-2xl font-bold w-6 md:w-8 text-center",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    #{user.position}
                  </div>
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0 border border-yellow-400/50"
                      loading="lazy"
                      unoptimized
                    />
                  ) : (
                    <div className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0",
                      theme === 'dark'
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                        : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                    )}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm md:text-base truncate",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {user.name}
                    </p>
                    <p className={cn(
                      "text-xs md:text-sm truncate",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      Nível {user.level} • {user.xp} XP
                    </p>
                  </div>
                  {index === 0 && (
                    <Trophy className={cn(
                      "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                      theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
                    )} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0" />
            <h3 className={cn(
              "text-base md:text-lg font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Tempo de Estudo
            </h3>
          </div>
          <p className={cn(
            "text-2xl md:text-3xl font-bold mb-1",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {tempoFormatado}
          </p>
          <p className={cn(
            "text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Total acumulado este mês
          </p>
        </div>

        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0" />
            <h3 className={cn(
              "text-base md:text-lg font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Comunidade
            </h3>
          </div>
          <p className={cn(
            "text-2xl md:text-3xl font-bold mb-1",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {stats.perguntasFeitas}
          </p>
          <p className={cn(
            "text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Perguntas feitas
          </p>
        </div>
      </div>
    </div>
  )
}

