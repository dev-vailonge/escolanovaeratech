'use client'

import { mockDesafios } from '@/data/aluno/mockDesafios'
import { mockUser } from '@/data/aluno/mockUser'
import { Target, Clock, CheckCircle2, Coins, Trophy, Users, Calendar, Lock } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/features'
import { hasFullAccess } from '@/lib/types/auth'

export default function DesafiosPage() {
  const desafios = mockDesafios
  const { theme } = useTheme()
  const user = mockUser
  const canParticipate = hasFullAccess({ ...user, role: user.role as 'aluno' | 'admin', accessLevel: user.accessLevel })

  const desafiosAtivos = desafios.filter(d => !d.completo)
  const desafiosCompletos = desafios.filter(d => d.completo)
  const totalDesafiosDisponiveis = desafios.length

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'semanal':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'mensal':
        return <Calendar className="w-4 h-4 text-purple-500" />
      default:
        return <Trophy className={cn(
          "w-4 h-4",
          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
        )} />
    }
  }

  const getTipoColor = (tipo: string) => {
    if (theme === 'light') {
      switch (tipo) {
        case 'semanal':
          return 'border-blue-400/90 bg-blue-50'
        case 'mensal':
          return 'border-purple-400/90 bg-purple-50'
        default:
          return 'border-yellow-400/90 bg-yellow-50'
      }
    } else {
      switch (tipo) {
        case 'semanal':
          return 'border-blue-400/30 bg-blue-400/10'
        case 'mensal':
          return 'border-purple-400/30 bg-purple-400/10'
        default:
          return 'border-yellow-400/30 bg-yellow-400/10'
      }
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Desafios
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Complete desafios e ganhe XP para subir no ranking
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-2 md:gap-3">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {desafiosCompletos.length}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Desafios Concluídos
              </p>
            </div>
          </div>
        </div>
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-2 md:gap-3">
            <Target className={cn(
              "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )} />
            <div className="min-w-0">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {totalDesafiosDisponiveis}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Desafios Disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desafios Ativos */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Desafios Ativos
          </h2>
          {desafiosAtivos.length > 0 && (
            <p className={cn(
              "text-xs md:text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              {desafiosAtivos.length} desafio{desafiosAtivos.length !== 1 ? 's' : ''} ativo{desafiosAtivos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {desafiosAtivos.map((desafio) => {
          const prazo = new Date(desafio.prazo)
          const diasRestantes = Math.ceil((prazo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

          return (
            <div
              key={desafio.id}
              className={cn(
                "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                getTipoColor(desafio.tipo),
                theme === 'light' && "shadow-md"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    {getTipoIcon(desafio.tipo)}
                    <h3 className={cn(
                      "text-base md:text-lg font-semibold flex-1 min-w-0",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {desafio.titulo}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full capitalize whitespace-nowrap",
                      theme === 'dark'
                        ? "bg-white/10 text-white"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      {desafio.tipo}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm md:text-base mb-3 md:mb-4",
                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                  )}>
                    {desafio.descricao}
                  </p>
                  
                  <div className={cn(
                    "grid gap-2 md:gap-4 mb-3 md:mb-4",
                    // Grid responsivo: ajusta colunas baseado nas features habilitadas
                    isFeatureEnabled('coins')
                      ? "grid-cols-2 md:grid-cols-4"
                      : "grid-cols-2 md:grid-cols-3"
                  )}>
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <Trophy className={cn(
                        "w-3 h-3 md:w-4 md:h-4 flex-shrink-0",
                        theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                      )} />
                      <span className={cn(
                        "truncate",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}>
                        +{desafio.xpGanho} XP
                      </span>
                    </div>
                    {/* Moedas - Oculto no MVP */}
                    {isFeatureEnabled('coins') && (
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <Coins className={cn(
                          "w-3 h-3 md:w-4 md:h-4 flex-shrink-0",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )} />
                        <span className={cn(
                          "truncate",
                          theme === 'dark' ? "text-gray-300" : "text-gray-700"
                        )}>
                          {desafio.moedasGanho} moedas
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                      <span className={cn(
                        "truncate",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}>
                        {diasRestantes} dias
                      </span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <Users className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
                      <span className={cn(
                        "truncate",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}>
                        {desafio.participantes}
                      </span>
                    </div>
                  </div>

                  {desafio.requisitos && (
                    <div className="flex flex-wrap gap-2">
                      {desafio.requisitos.map((req, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-2 py-1 text-xs rounded border",
                            theme === 'dark'
                              ? "bg-white/5 text-gray-300 border-white/10"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          )}
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {!canParticipate && (
                  <div className={cn(
                    "mb-3 p-3 rounded-lg text-sm",
                    theme === 'dark'
                      ? "bg-yellow-400/10 border border-yellow-400/30 text-yellow-400"
                      : "bg-yellow-50 border border-yellow-300 text-yellow-700"
                  )}>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Upgrade sua conta para participar de desafios e aparecer no ranking</span>
                    </div>
                  </div>
                )}
                <button 
                  className={cn(
                    "btn-primary w-full md:w-auto mt-2 md:mt-0",
                    !canParticipate && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!canParticipate}
                >
                  {!canParticipate ? 'Acesso Limitado' : 'Participar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desafios Completos */}
      {desafiosCompletos.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            <h2 className={cn(
              "text-lg md:text-xl font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Desafios Completos
            </h2>
            <p className={cn(
              "text-xs md:text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Você já concluiu {desafiosCompletos.length} desafio{desafiosCompletos.length !== 1 ? 's' : ''}
            </p>
          </div>
          {desafiosCompletos.map((desafio) => (
            <div
              key={desafio.id}
              className={cn(
                "backdrop-blur-md border rounded-xl p-4 md:p-6 opacity-75 transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/20 border-green-500/30"
                  : "bg-green-50 border-green-400/90 shadow-md"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <h3 className={cn(
                      "text-base md:text-lg font-semibold flex-1 min-w-0",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {desafio.titulo}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border whitespace-nowrap",
                      theme === 'dark'
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-green-100 text-green-700 border-green-300"
                    )}>
                      Completo
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm md:text-base mb-3 md:mb-4",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {desafio.descricao}
                  </p>
                  
                  <div className={cn(
                    "flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    <span>+{desafio.xpGanho} XP ganhos</span>
                    {/* Moedas - Oculto no MVP */}
                    {isFeatureEnabled('coins') && (
                      <span>{desafio.moedasGanho} moedas ganhas</span>
                    )}
                    {desafio.badgeGanho && (
                      <span className={cn(
                        theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                      )}>
                        Badge desbloqueada!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

