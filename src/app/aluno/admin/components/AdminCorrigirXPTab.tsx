'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { RefreshCw, AlertCircle, CheckCircle, Loader2, Info, Settings, Wrench } from 'lucide-react'
import { safeFetch } from '@/lib/utils/safeSupabaseQuery'

export default function AdminCorrigirXPTab() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const executarLimpeza = async () => {
    try {
      setLoading(true)
      setError(null)
      setResultado(null)

      // Obter token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }

      // Executar API com timeout
      const response = await safeFetch('/api/admin/limpar-xp-mensal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          mes,
          ano,
          dryRun
        }),
        timeout: 30000, // 30 segundos para operações de XP
        retry: true,
        retryAttempts: 1
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao executar limpeza')
      }

      const data = await response.json()

      setResultado(data)
    } catch (err: any) {
      console.error('Erro ao executar limpeza:', err)
      setError(err.message || 'Erro ao executar limpeza')
    } finally {
      setLoading(false)
    }
  }

  const executarCorrecaoQuiz = async () => {
    try {
      setLoading(true)
      setError(null)
      setResultado(null)

      // Obter token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }

      // Executar API com timeout
      const response = await safeFetch('/api/admin/corrigir-xp-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          dryRun
        }),
        timeout: 30000, // 30 segundos para operações de XP
        retry: true,
        retryAttempts: 1
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao executar correção')
      }

      const data = await response.json()

      setResultado(data)
    } catch (err: any) {
      console.error('Erro ao executar correção:', err)
      setError(err.message || 'Erro ao executar correção')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className={cn(
        "p-6 rounded-lg",
        theme === 'dark' 
          ? "bg-gray-800/30 border border-white/10" 
          : "bg-yellow-500/10 border border-yellow-400/90"
      )}>
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-red-400" : "text-red-600"
        )}>
          Acesso negado. Apenas administradores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com explicação */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Settings className={cn(
            "w-6 h-6",
            theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
          )} />
          <h2 className={cn(
            "text-2xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Manutenção de XP
          </h2>
        </div>
        <p className={cn(
          "text-sm leading-relaxed",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Ferramentas para corrigir inconsistências de XP e recalcular valores mensais. 
          Use quando houver discrepâncias entre o XP exibido e o histórico, ou após correções de bugs.
        </p>
        
        {/* Info box */}
        <div className={cn(
          "p-4 rounded-lg border flex items-start gap-3",
          theme === 'dark'
            ? "bg-blue-900/20 border-blue-700/50"
            : "bg-blue-50 border-blue-200"
        )}>
          <Info className={cn(
            "w-5 h-5 flex-shrink-0 mt-0.5",
            theme === 'dark' ? "text-blue-400" : "text-blue-600"
          )} />
          <div className="space-y-1 text-sm">
            <p className={cn(
              "font-medium",
              theme === 'dark' ? "text-blue-300" : "text-blue-900"
            )}>
              Quando usar:
            </p>
            <ul className={cn(
              "list-disc list-inside space-y-1",
              theme === 'dark' ? "text-blue-200" : "text-blue-800"
            )}>
              <li><strong>Limpar XP Mensal:</strong> Quando o XP mensal na tabela não corresponde ao histórico</li>
              <li><strong>Corrigir XP Quiz:</strong> Quando quizzes tiveram XP calculado incorretamente</li>
            </ul>
            <p className={cn(
              "mt-2 text-xs italic",
              theme === 'dark' ? "text-blue-300/80" : "text-blue-700"
            )}>
              💡 Sempre use "Dry Run" primeiro para ver o que será alterado antes de aplicar.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "p-6 rounded-lg space-y-6 border",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-white border-yellow-400/90 shadow-sm"
      )}>
        {/* Seção: Limpar XP Mensal */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className={cn(
              "w-5 h-5",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )} />
            <h3 className={cn(
              "text-lg font-semibold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Limpar XP Mensal
            </h3>
          </div>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Recalcula o XP mensal de um usuário baseado no histórico real. Útil quando há inconsistências entre o valor na tabela e o histórico.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Email do Usuário
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full px-4 py-2 rounded-lg border transition-colors",
                  theme === 'dark' 
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                )}
                placeholder="usuario@email.com"
              />
            </div>
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Mês
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value) || 1)}
                className={cn(
                  "w-full px-4 py-2 rounded-lg border transition-colors",
                  theme === 'dark' 
                    ? "bg-gray-700/50 border-gray-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" 
                    : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                )}
              />
            </div>
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Ano
              </label>
              <input
                type="number"
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value) || new Date().getFullYear())}
                className={cn(
                  "w-full px-4 py-2 rounded-lg border transition-colors",
                  theme === 'dark' 
                    ? "bg-gray-700/50 border-gray-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" 
                    : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                )}
              />
            </div>
          </div>
        </div>

        {/* Seção: Corrigir XP Quiz */}
        <div className={cn(
          "pt-4 border-t",
          theme === 'dark' ? "border-white/10" : "border-gray-200"
        )}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className={cn(
                "w-5 h-5",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-lg font-semibold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Corrigir XP de Quizzes
              </h3>
            </div>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Identifica e corrige quizzes com XP faltante. Deixe o email vazio para processar todos os alunos.
            </p>
          </div>
        </div>

        {/* Dry Run Checkbox */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg",
          theme === 'dark' ? "bg-gray-700/30" : "bg-yellow-50"
        )}>
          <input
            type="checkbox"
            id="dryRun"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className={cn(
              "w-4 h-4 rounded",
              theme === 'dark' 
                ? "text-yellow-400 border-gray-600 bg-gray-700" 
                : "text-yellow-600 border-gray-300"
            )}
          />
          <label htmlFor="dryRun" className={cn(
            "text-sm cursor-pointer",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            <strong>Dry Run</strong> - Apenas simular, não aplicar alterações (recomendado para testar primeiro)
          </label>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={executarLimpeza}
            disabled={loading || !email}
            className={cn(
              "px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
              theme === 'dark'
                ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Limpar XP Mensal
          </button>

          <button
            onClick={executarCorrecaoQuiz}
            disabled={loading}
            className={cn(
              "px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
              theme === 'dark'
                ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Corrigir XP Quiz
          </button>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className={cn(
          "p-4 rounded-lg border flex items-start gap-3",
          theme === 'dark' 
            ? "bg-red-900/20 border-red-700/50" 
            : "bg-red-50 border-red-200"
        )}>
          <AlertCircle className={cn(
            "w-5 h-5 flex-shrink-0 mt-0.5",
            theme === 'dark' ? "text-red-400" : "text-red-600"
          )} />
          <p className={cn(
            "text-sm",
            theme === 'dark' ? "text-red-300" : "text-red-700"
          )}>
            {error}
          </p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className={cn(
          "p-6 rounded-lg space-y-6 border",
          theme === 'dark'
            ? "bg-gray-800/30 border-white/10"
            : "bg-white border-yellow-400/90 shadow-sm"
        )}>
          <div className="flex items-center gap-2">
            <CheckCircle className={cn(
              "w-5 h-5",
              theme === 'dark' ? "text-green-400" : "text-green-600"
            )} />
            <h3 className={cn(
              "text-lg font-semibold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Resultado
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn(
              "p-4 rounded-lg",
              theme === 'dark' ? "bg-gray-700/30" : "bg-gray-50"
            )}>
              <p className={cn(
                "text-xs font-medium mb-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                XP Mensal Anterior
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {resultado.xpMensalAnterior || resultado.xpMensalAnterior === 0 ? resultado.xpMensalAnterior : '-'}
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-lg",
              theme === 'dark' ? "bg-gray-700/30" : "bg-gray-50"
            )}>
              <p className={cn(
                "text-xs font-medium mb-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                XP Mensal Novo
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? "text-green-400" : "text-green-600"
              )}>
                {resultado.xpMensalNovo || resultado.xpMensalNovo === 0 ? resultado.xpMensalNovo : '-'}
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-lg",
              theme === 'dark' ? "bg-gray-700/30" : "bg-gray-50"
            )}>
              <p className={cn(
                "text-xs font-medium mb-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Diferença
              </p>
              <p className={cn(
                "text-2xl font-bold",
                (resultado.diferenca || 0) >= 0 
                  ? (theme === 'dark' ? "text-green-400" : "text-green-600")
                  : (theme === 'dark' ? "text-red-400" : "text-red-600")
              )}>
                {resultado.diferenca !== undefined ? (resultado.diferenca > 0 ? '+' : '') + resultado.diferenca : '-'}
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-lg",
              theme === 'dark' ? "bg-gray-700/30" : "bg-gray-50"
            )}>
              <p className={cn(
                "text-xs font-medium mb-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                {resultado.totalEntradas !== undefined ? 'Total de Entradas' : 'Casos Afetados'}
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {resultado.totalEntradas || resultado.totalCasosAfetados || 0}
              </p>
            </div>
          </div>

          {resultado.entradasContadas && resultado.entradasContadas.length > 0 && (
            <div>
              <p className={cn(
                "text-sm font-medium mb-3",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Entradas Contadas:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resultado.entradasContadas.map((entrada: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-lg text-sm",
                    theme === 'dark' ? "bg-gray-700/50" : "bg-gray-50"
                  )}>
                    <span className={cn(
                      "font-medium",
                      theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    )}>
                      {entrada.source}:
                    </span>{' '}
                    <span className={cn(
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {entrada.amount} XP
                    </span>
                    {' - '}
                    <span className={cn(
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      {entrada.description || 'Sem descrição'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.casosAfetados && resultado.casosAfetados.length > 0 && (
            <div>
              <p className={cn(
                "text-sm font-medium mb-3",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Casos Afetados:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resultado.casosAfetados.map((caso: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-lg text-sm",
                    theme === 'dark' ? "bg-gray-700/50" : "bg-gray-50"
                  )}>
                    <span className={cn(
                      "font-medium",
                      theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    )}>
                      {caso.userEmail}:
                    </span>{' '}
                    <span className={cn(
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {caso.quizTitulo} - {caso.xpFaltante} XP faltante
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.message && (
            <p className={cn(
              "text-sm p-3 rounded-lg",
              theme === 'dark' 
                ? "bg-green-900/20 text-green-300 border border-green-700/50" 
                : "bg-green-50 text-green-700 border border-green-200"
            )}>
              {resultado.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
