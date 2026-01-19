'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { 
  Loader2, 
  RefreshCw, 
  DollarSign, 
  Activity, 
  Zap,
  Download,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SafeLoading from '@/components/ui/SafeLoading'
import { safeFetch } from '@/lib/utils/safeSupabaseQuery'

// Tipo dos registros de token usage
interface TokenUsageRecord {
  id: string
  user_name: string
  user_email: string
  user_id: string
  feature: string
  endpoint: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  metadata: Record<string, any>
  created_at: string
}

// Tipo do resumo
interface TokenUsageSummary {
  total_requests: number
  total_tokens: number
  total_cost_usd: number
  by_user: Array<{
    user_name: string
    user_email: string
    requests: number
    tokens: number
    cost: number
  }>
  by_feature: Array<{
    feature: string
    requests: number
    tokens: number
    cost: number
  }>
}

type SortColumn = 'created_at' | 'user_name' | 'total_tokens' | 'estimated_cost_usd'
type SortDirection = 'asc' | 'desc'

export default function AdminTokensTab() {
  const { theme } = useTheme()

  const [records, setRecords] = useState<TokenUsageRecord[]>([])
  const [summary, setSummary] = useState<TokenUsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Ordenação
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 20

  // Metadata expandida
  const [expandedMetadata, setExpandedMetadata] = useState<Set<string>>(new Set())

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      setError(null)
      const isRefresh = refreshing
      if (!isRefresh) {
        setLoading(true)
      }

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Não autenticado')
        return
      }

      // Fazer requisição com timeout
      const response = await safeFetch('/api/admin/tokens', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        timeout: 10000,
        retry: true,
        retryAttempts: 2
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao carregar dados')
      }

      const data = await response.json()

      setRecords(data.records || [])
      setSummary(data.summary || null)
    } catch (err: any) {
      console.error('Erro ao carregar dados de tokens:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, refreshing])

  // Carregar dados ao montar
  useEffect(() => {
    carregarDados()
  }, []) // Só na montagem inicial

  // Função para atualizar (refresh)
  const handleRefresh = () => {
    setRefreshing(true)
    carregarDados()
  }

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true)
      carregarDados()
    }, 30000)

    return () => clearInterval(interval)
  }, [carregarDados])

  // Aplicar ordenação
  const sortedRecords = [...records].sort((a, b) => {
    let comparison = 0
    
    switch (sortColumn) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'user_name':
        comparison = a.user_name.localeCompare(b.user_name)
        break
      case 'total_tokens':
        comparison = a.total_tokens - b.total_tokens
        break
      case 'estimated_cost_usd':
        comparison = a.estimated_cost_usd - b.estimated_cost_usd
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Aplicar paginação
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage)
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  // Handler de ordenação
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Toggle metadata
  const toggleMetadata = (id: string) => {
    const newSet = new Set(expandedMetadata)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedMetadata(newSet)
  }

  // Exportar para CSV (formato Excel)
  const handleExportCSV = () => {
    // Headers em português com nomes descritivos
    const headers = [
      'Data',
      'Hora',
      'Aluno',
      'Email',
      'Funcionalidade',
      'Endpoint API',
      'Modelo OpenAI',
      'Tokens Entrada',
      'Tokens Saída',
      'Total Tokens',
      'Custo (USD)',
      'Tecnologia',
      'Nível'
    ]

    // Processar cada registro
    const rows = sortedRecords.map(record => {
      const date = new Date(record.created_at)
      const metadata = record.metadata || {}
      
      return [
        // Data e Hora separados
        date.toLocaleDateString('pt-BR'),
        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        // Dados do aluno
        record.user_name,
        record.user_email,
        // Detalhes da requisição
        record.feature,
        record.endpoint,
        record.model,
        // Tokens
        record.prompt_tokens.toString(),
        record.completion_tokens.toString(),
        record.total_tokens.toString(),
        // Custo (formato com 6 casas decimais)
        record.estimated_cost_usd.toFixed(6),
        // Metadata
        metadata.tecnologia || '-',
        metadata.nivel || '-'
      ]
    })

    // Adicionar linha de totais
    const totalPromptTokens = sortedRecords.reduce((sum, r) => sum + r.prompt_tokens, 0)
    const totalCompletionTokens = sortedRecords.reduce((sum, r) => sum + r.completion_tokens, 0)
    const totalTokens = sortedRecords.reduce((sum, r) => sum + r.total_tokens, 0)
    const totalCost = sortedRecords.reduce((sum, r) => sum + r.estimated_cost_usd, 0)

    rows.push([]) // Linha vazia
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'TOTAIS:',
      totalPromptTokens.toString(),
      totalCompletionTokens.toString(),
      totalTokens.toString(),
      totalCost.toFixed(6),
      '',
      ''
    ])

    // Função para escapar valores CSV corretamente
    const escapeCSV = (value: string) => {
      // Se contém vírgula, ponto-e-vírgula, aspas ou quebra de linha, envolver em aspas
      if (value.includes(';') || value.includes('"') || value.includes('\n') || value.includes(',')) {
        // Escapar aspas duplas duplicando-as
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    // Montar CSV usando ponto-e-vírgula (padrão Excel Brasil)
    const separator = ';'
    const csvContent = [
      // Título do relatório
      `Relatório de Consumo de Tokens OpenAI${separator}${new Date().toLocaleDateString('pt-BR')}`,
      '', // Linha vazia
      // Headers
      headers.map(escapeCSV).join(separator),
      // Dados
      ...rows.map(row => row.map(cell => escapeCSV(cell)).join(separator))
    ].join('\n')

    // Adicionar BOM para UTF-8 (necessário para Excel reconhecer acentos)
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })
    
    // Criar link de download
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    
    // Nome do arquivo com data
    const fileName = `tokens_openai_${new Date().toISOString().split('T')[0]}.csv`
    link.download = fileName
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpar URL
    URL.revokeObjectURL(url)
  }

  // Formatação
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(6)}`
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR')
  }

  if (loading || error) {
    return (
      <SafeLoading
        loading={loading}
        error={error}
        onRetry={carregarDados}
        loadingMessage="Carregando dados de tokens..."
        errorMessage="Não foi possível carregar os dados de tokens. Tente novamente."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={cn(
          "text-xl md:text-2xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Consumo de Tokens OpenAI
        </h2>
        <p className={cn(
          "text-sm mt-1",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Rastreamento e análise de custos da API OpenAI
        </p>
      </div>

      {error && (
        <div className={cn(
          "p-4 rounded-lg border",
          theme === 'dark'
            ? "bg-red-900/20 border-red-500/50 text-red-400"
            : "bg-red-50 border-red-200 text-red-600"
        )}>
          {error}
        </div>
      )}

      {/* Cards de resumo com botão atualizar e export */}
      <div className="flex flex-col gap-4">
        {/* Legenda */}
        <div className={cn(
          "p-3 rounded-lg border flex items-center gap-2 text-sm",
          theme === 'dark'
            ? "bg-orange-900/10 border-orange-500/30 text-orange-400"
            : "bg-orange-50 border-orange-200 text-orange-700"
        )}>
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Atenção:</strong> Registros marcados como "Estimado" são cálculos retroativos de desafios gerados no passado, não representam uso real da API hoje.
          </span>
        </div>

        {/* Cards de Resumo */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total de Requisições */}
          <div className={cn(
            "p-4 rounded-lg border",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Total de Requisições
                </p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {formatNumber(summary.total_requests)}
                </p>
              </div>
              <Activity className={cn(
                "w-8 h-8",
                theme === 'dark' ? "text-blue-400" : "text-blue-600"
              )} />
            </div>
          </div>

          {/* Total de Tokens */}
          <div className={cn(
            "p-4 rounded-lg border",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Total de Tokens
                </p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {formatNumber(summary.total_tokens)}
                </p>
              </div>
              <Zap className={cn(
                "w-8 h-8",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
            </div>
          </div>

          {/* Custo Total */}
          <div className={cn(
            "p-4 rounded-lg border",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Custo Total (USD)
                </p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {formatCurrency(summary.total_cost_usd)}
                </p>
              </div>
              <DollarSign className={cn(
                "w-8 h-8",
                theme === 'dark' ? "text-green-400" : "text-green-600"
              )} />
            </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              theme === 'dark'
                ? "bg-yellow-400 text-black hover:bg-yellow-500"
                : "bg-yellow-500 text-white hover:bg-yellow-600",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Atualizar
          </button>

          <button
            onClick={handleExportCSV}
            disabled={sortedRecords.length === 0}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              theme === 'dark'
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-green-500 text-white hover:bg-green-600",
              sortedRecords.length === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className={cn(
        "rounded-lg border overflow-hidden",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-gray-200"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={cn(
              "border-b",
              theme === 'dark' ? "border-white/10" : "border-gray-200"
            )}>
              <tr>
                <th 
                  onClick={() => handleSort('created_at')}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-white/5",
                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    Data/Hora
                    {sortColumn === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('user_name')}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-white/5",
                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    Aluno
                    {sortColumn === 'user_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className={cn(
                  "px-4 py-3 text-left text-sm font-medium",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}>
                  Feature / Endpoint
                </th>
                <th className={cn(
                  "px-4 py-3 text-left text-sm font-medium",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}>
                  Modelo
                </th>
                <th 
                  onClick={() => handleSort('total_tokens')}
                  className={cn(
                    "px-4 py-3 text-right text-sm font-medium cursor-pointer hover:bg-white/5",
                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center justify-end gap-2">
                    Tokens
                    {sortColumn === 'total_tokens' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('estimated_cost_usd')}
                  className={cn(
                    "px-4 py-3 text-right text-sm font-medium cursor-pointer hover:bg-white/5",
                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center justify-end gap-2">
                    Custo (USD)
                    {sortColumn === 'estimated_cost_usd' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className={cn(
                  "px-4 py-3 text-center text-sm font-medium",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}>
                  Info
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className={cn(
                    "px-4 py-8 text-center",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <>
                    <tr 
                      key={record.id}
                      className={cn(
                        "border-b transition-colors",
                        theme === 'dark' 
                          ? "border-white/10 hover:bg-white/5" 
                          : "border-gray-200 hover:bg-gray-50",
                        // Destaque para registros estimados
                        record.metadata?.estimado && (
                          theme === 'dark' 
                            ? "bg-orange-900/10" 
                            : "bg-orange-50"
                        )
                      )}
                    >
                      <td className={cn(
                        "px-4 py-3 text-sm",
                        theme === 'dark' ? "text-gray-300" : "text-gray-900"
                      )}>
                        <div className="flex items-center gap-2">
                          {formatDate(record.created_at)}
                          {/* Badge de estimativa */}
                          {record.metadata?.estimado && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              theme === 'dark'
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-orange-100 text-orange-700"
                            )}>
                              Estimado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn(
                          "text-sm font-medium",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {record.user_name}
                        </div>
                        <div className={cn(
                          "text-xs",
                          theme === 'dark' ? "text-gray-400" : "text-gray-500"
                        )}>
                          {record.user_email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn(
                          "text-sm font-medium",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {record.feature}
                        </div>
                        <div className={cn(
                          "text-xs",
                          theme === 'dark' ? "text-gray-400" : "text-gray-500"
                        )}>
                          {record.endpoint}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className={cn(
                          "px-2 py-1 rounded text-xs",
                          theme === 'dark' 
                            ? "bg-white/10 text-gray-300" 
                            : "bg-gray-100 text-gray-800"
                        )}>
                          {record.model}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={cn(
                          "text-sm font-medium",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {formatNumber(record.total_tokens)}
                        </div>
                        <div className={cn(
                          "text-xs",
                          theme === 'dark' ? "text-gray-400" : "text-gray-500"
                        )}>
                          {formatNumber(record.prompt_tokens)} + {formatNumber(record.completion_tokens)}
                        </div>
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-right text-sm font-medium",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {formatCurrency(record.estimated_cost_usd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleMetadata(record.id)}
                          className={cn(
                            "p-1 rounded hover:bg-white/10 transition-colors",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {/* Metadata expandida */}
                    {expandedMetadata.has(record.id) && (
                      <tr className={cn(
                        "border-b",
                        theme === 'dark' ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
                      )}>
                        <td colSpan={7} className="px-4 py-3">
                          <div className={cn(
                            "text-sm",
                            theme === 'dark' ? "text-gray-300" : "text-gray-700"
                          )}>
                            <span className="font-medium">Metadata:</span>
                            <pre className={cn(
                              "mt-2 p-3 rounded text-xs overflow-x-auto",
                              theme === 'dark' 
                                ? "bg-black/30 text-gray-300" 
                                : "bg-white text-gray-800"
                            )}>
                              {JSON.stringify(record.metadata, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className={cn(
            "px-4 py-3 border-t flex items-center justify-between",
            theme === 'dark' ? "border-white/10" : "border-gray-200"
          )}>
            <div className={cn(
              "text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Mostrando {((currentPage - 1) * recordsPerPage) + 1} a {Math.min(currentPage * recordsPerPage, sortedRecords.length)} de {sortedRecords.length} registros
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1 rounded transition-colors",
                  theme === 'dark'
                    ? "bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white"
                    : "bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-900"
                )}
              >
                Anterior
              </button>
              <span className={cn(
                "px-3 py-1",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1 rounded transition-colors",
                  theme === 'dark'
                    ? "bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white"
                    : "bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-900"
                )}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Alunos e Features */}
      {summary && (summary.by_user.length > 0 || summary.by_feature.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Alunos */}
          {summary.by_user.length > 0 && (
            <div className={cn(
              "p-4 rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10"
                : "bg-white border-gray-200"
            )}>
              <h3 className={cn(
                "text-lg font-bold mb-4",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Top Alunos por Custo
              </h3>
              <div className="space-y-3">
                {summary.by_user.slice(0, 5).map((user, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      theme === 'dark' ? "bg-white/5" : "bg-gray-50"
                    )}
                  >
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-sm",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {user.user_name}
                      </div>
                      <div className={cn(
                        "text-xs",
                        theme === 'dark' ? "text-gray-400" : "text-gray-500"
                      )}>
                        {user.requests} requisições · {formatNumber(user.tokens)} tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-bold",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {formatCurrency(user.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Features */}
          {summary.by_feature.length > 0 && (
            <div className={cn(
              "p-4 rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10"
                : "bg-white border-gray-200"
            )}>
              <h3 className={cn(
                "text-lg font-bold mb-4",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Consumo por Feature
              </h3>
              <div className="space-y-3">
                {summary.by_feature.map((feature, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      theme === 'dark' ? "bg-white/5" : "bg-gray-50"
                    )}
                  >
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-sm",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {feature.feature}
                      </div>
                      <div className={cn(
                        "text-xs",
                        theme === 'dark' ? "text-gray-400" : "text-gray-500"
                      )}>
                        {feature.requests} requisições · {formatNumber(feature.tokens)} tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-bold",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {formatCurrency(feature.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

