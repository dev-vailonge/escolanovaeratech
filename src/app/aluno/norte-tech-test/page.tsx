'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react'
import type {
  NorteTechTestRespostasData,
  NorteTechTestResultadoIA,
  NorteTechTestAreaId,
  NorteTechTestAreaRespostasData,
} from '@/types/database'
import SafeLoading from '@/components/ui/SafeLoading'

const FORMACOES_OPCOES = ['android', 'frontend', 'backend', 'ios', 'analise-dados'] as const

const AREAS_IDS: NorteTechTestAreaId[] = [
  'android',
  'frontend',
  'backend',
  'ios',
  'analise-dados',
]

const TOTAL_ETAPAS = 8

const FORMACAO_LABELS: Record<string, string> = {
  android: 'Android',
  frontend: 'Web Frontend',
  backend: 'Backend',
  ios: 'iOS',
  'analise-dados': 'Análise de Dados',
  ainda_explorando: 'Ainda explorando',
}

export default function NorteTechTestPage() {
  const { theme } = useTheme()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const loadingRef = useRef(false)
  const redirectingRef = useRef(false)
  const [etapa, setEtapa] = useState(1)
  const [respostas, setRespostas] = useState<NorteTechTestRespostasData>({})
  const [areaRespostas, setAreaRespostas] = useState<Record<string, NorteTechTestAreaRespostasData>>({})
  const [resultado, setResultado] = useState<NorteTechTestResultadoIA | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!user) return
    if (redirectingRef.current) return
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/norte-tech-test/state', { credentials: 'include' })
      if (res.status === 401) {
        if (!redirectingRef.current) redirectingRef.current = true
        await signOut()
        router.push('/aluno/login?expired=1')
        return
      }
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setRespostas(data.respostas || {})
      setResultado(data.resultado_ia || null)
      setAreaRespostas(data.areas || {})
      if (data.respostas?.etapa_atual) {
        setEtapa(Math.min(TOTAL_ETAPAS, Math.max(1, data.respostas.etapa_atual)))
      }
    } catch (e) {
      setError('Não foi possível carregar suas respostas.')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [user, signOut, router])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvar = useCallback(
    async (novasRespostas: NorteTechTestRespostasData) => {
      setSaving(true)
      setError(null)
      try {
        const res = await fetch('/api/norte-tech-test/respostas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ respostas: novasRespostas }),
        })
        if (res.status === 401) {
          await signOut()
          router.push('/aluno/login?expired=1')
          return
        }
        if (!res.ok) throw new Error('Erro ao salvar')
      } catch (e) {
        setError('Erro ao salvar. Tente de novo.')
      } finally {
        setSaving(false)
      }
    },
    [signOut, router]
  )

  const salvarArea = useCallback(
    async (areaId: string, resp: NorteTechTestAreaRespostasData) => {
      setError(null)
      try {
        const res = await fetch('/api/norte-tech-test/areas/respostas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ area_id: areaId, respostas: resp }),
        })
        if (res.status === 401) {
          await signOut()
          router.push('/aluno/login?expired=1')
          return
        }
        if (!res.ok) throw new Error('Erro ao salvar')
        setAreaRespostas((prev) => ({ ...prev, [areaId]: resp }))
      } catch (e) {
        setError('Erro ao salvar. Tente de novo.')
      }
    },
    [signOut, router]
  )

  const areasCompletas = (): boolean => {
    return AREAS_IDS.every((id) => {
      const data = areaRespostas[id]
      if (!data || typeof data !== 'object') return false
      const todosNumeros =
        typeof data.curti_praticar === 'number' &&
        typeof data.energia === 'number' &&
        typeof data.dificuldade === 'number' &&
        typeof data.confianca === 'number'
      const temMeVejo = data.me_vejo_6_meses != null
      const todosTextos =
        (data.o_que_mais_gostei ?? '').trim() !== '' &&
        (data.o_que_foi_mais_dificil ?? '').trim() !== ''
      return todosNumeros && temMeVejo && todosTextos
    })
  }

  const podeVerSugestao = areasCompletas()

  const atualizar = useCallback(
    (atualizacao: Partial<NorteTechTestRespostasData>) => {
      setRespostas((prev) => ({ ...prev, ...atualizacao, etapa_atual: etapa }))
    },
    [etapa]
  )

  const avancar = async () => {
    if (etapa >= TOTAL_ETAPAS) return
    const proxima = etapa + 1
    await salvar({ ...respostas, etapa_atual: proxima })
    setEtapa(proxima)
    setRespostas((prev) => ({ ...prev, etapa_atual: proxima }))
  }

  const voltar = () => {
    if (etapa > 1) {
      setEtapa(etapa - 1)
    }
  }

  const limparResultado = useCallback(async () => {
    try {
      const res = await fetch('/api/norte-tech-test/respostas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clear_resultado: true }),
      })
      if (res.status === 401) {
        await signOut()
        router.push('/aluno/login?expired=1')
        return
      }
      setResultado(null)
      setEtapa(1)
      await carregar()
    } catch {
      setResultado(null)
      setEtapa(1)
    }
  }, [carregar, signOut, router])

  const rodarAnalise = async () => {
    setAnalisando(true)
    setError(null)
    try {
      const res = await fetch('/api/norte-tech-test/analisar', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.status === 401) {
        await signOut()
        router.push('/aluno/login?expired=1')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Erro na análise')
      setResultado(data.resultado)
      await carregar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao analisar. Tente de novo.')
    } finally {
      setAnalisando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <SafeLoading loading={true} error={null} loadingMessage="Carregando..." />
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <div className="space-y-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
      <div>
        <h1
          className={cn(
            'text-2xl md:text-3xl font-bold mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          Norte Tech Test
        </h1>
        <p
          className={cn(
            'text-sm md:text-base',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Responda às perguntas aos poucos. Preencha o feedback de cada área conforme avança no curso. Nossa sugestão de formação aparece antes da sua decisão.
        </p>
      </div>

      {error && (
        <div
          className={cn(
            'rounded-xl p-4 border',
            isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
          )}
        >
          {error}
        </div>
      )}

      {(
        <>
          <ProgressoEtapas etapa={etapa} total={TOTAL_ETAPAS} theme={theme} />

          <div
            className={cn(
              'rounded-xl border p-6 md:p-8 transition-colors duration-300',
              isDark ? 'bg-gray-800/30 border-white/10' : 'bg-white border-gray-200 shadow-sm'
            )}
          >
            {etapa === 1 && (
              <Etapa1 respostas={respostas} atualizar={atualizar} theme={theme} />
            )}
            {etapa === 2 && (
              <Etapa2FeedbackAreas
                areaRespostas={areaRespostas}
                salvarArea={salvarArea}
                theme={theme}
              />
            )}
            {etapa === 3 && (
              <Etapa3Reflexao respostas={respostas} atualizar={atualizar} theme={theme} />
            )}
            {etapa === 4 && (
              <Etapa4Comparando respostas={respostas} atualizar={atualizar} theme={theme} />
            )}
            {etapa === 5 && (
              <EtapaSugestaoIA
                resultado={resultado}
                analisando={analisando}
                podeVerSugestao={podeVerSugestao}
                onVerSugestao={rodarAnalise}
                onRefazer={limparResultado}
                theme={theme}
              />
            )}
            {etapa === 6 && (
              <Etapa6Decisao respostas={respostas} atualizar={atualizar} theme={theme} />
            )}
            {etapa === 7 && (
              <Etapa7ProximoPasso respostas={respostas} atualizar={atualizar} theme={theme} />
            )}
            {etapa === 8 && (
              <Etapa8Compromisso respostas={respostas} atualizar={atualizar} theme={theme} />
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={voltar}
                disabled={etapa <= 1}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  etapa <= 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <ChevronLeft className="w-5 h-5" /> Anterior
              </button>
              <div className="flex items-center gap-3">
                {etapa !== 5 && (
                  <button
                    type="button"
                    onClick={() => salvar({ ...respostas, etapa_atual: etapa })}
                    disabled={saving}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                      isDark
                        ? 'border-white/30 text-gray-200 hover:bg-white/10'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100',
                      saving && 'opacity-70 cursor-wait'
                    )}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    Salvar
                  </button>
                )}
                {etapa === 5 ? (
                resultado ? (
                  <button
                    type="button"
                    onClick={avancar}
                    disabled={saving}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
                      isDark
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600',
                      saving && 'opacity-70 cursor-wait'
                    )}
                  >
                    Continuar <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={rodarAnalise}
                    disabled={analisando || !podeVerSugestao}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
                      isDark
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600',
                      (analisando || !podeVerSugestao) && 'opacity-70 cursor-wait'
                    )}
                  >
                    {analisando ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Gerando sua sugestão...
                      </>
                    ) : !podeVerSugestao ? (
                      'Complete o feedback das 5 áreas'
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Ver minha sugestão
                      </>
                    )}
                  </button>
                )
              ) : etapa === 8 ? (
                <button
                  type="button"
                  onClick={() => {
                    salvar({ ...respostas, etapa_atual: 8 })
                  }}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
                    isDark
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                  )}
                >
                  Concluir
                </button>
              ) : etapa < TOTAL_ETAPAS ? (
                <button
                  type="button"
                  onClick={avancar}
                  disabled={saving}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
                    isDark
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600',
                    saving && 'opacity-70 cursor-wait'
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : null}
                  Próxima <ChevronRight className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          </div>

          </div>

          {saving && (
            <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>
              Salvando...
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ProgressoEtapas({
  etapa,
  total,
  theme,
}: {
  etapa: number
  total: number
  theme: string
}) {
  const isDark = theme === 'dark'
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={cn(
            'h-2 flex-1 rounded-full transition-colors',
            n <= etapa
              ? isDark
                ? 'bg-yellow-400'
                : 'bg-yellow-500'
              : isDark
                ? 'bg-white/10'
                : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  )
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  theme,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  theme: string
  rows?: number
}) {
  const isDark = theme === 'dark'
  return (
    <div className="space-y-2">
      <label className={cn('block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'w-full rounded-lg border px-4 py-3 text-sm transition-colors',
          isDark
            ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400/50'
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-yellow-500'
        )}
      />
    </div>
  )
}

function CampoSelect({
  label,
  value,
  onChange,
  theme,
  opcoes,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  theme: string
  opcoes: { id: string; nome: string }[]
}) {
  const isDark = theme === 'dark'
  return (
    <div className="space-y-2">
      <label className={cn('block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-lg border px-4 py-3 text-sm transition-colors',
          isDark
            ? 'bg-white/5 border-white/10 text-white focus:border-yellow-400/50'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-yellow-500'
        )}
      >
        <option value="">Selecione...</option>
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>
    </div>
  )
}

const opcoesFormacao = FORMACOES_OPCOES.map((id) => ({
  id,
  nome: FORMACAO_LABELS[id] ?? id,
}))

function Etapa1({
  respostas,
  atualizar,
  theme,
}: {
  respostas: NorteTechTestRespostasData
  atualizar: (p: Partial<NorteTechTestRespostasData>) => void
  theme: string
}) {
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
        1. Antes de começar
      </h2>
      <CampoTexto
        theme={theme}
        label="Por que você entrou no Norte Tech?"
        value={respostas.por_que_entrei ?? ''}
        onChange={(v) => atualizar({ por_que_entrei: v })}
        placeholder="Ex.: quero mudar de carreira, entender programação..."
      />
      <CampoTexto
        theme={theme}
        label="O que mais te assusta hoje em relação à programação?"
        value={respostas.o_que_assusta ?? ''}
        onChange={(v) => atualizar({ o_que_assusta: v })}
        placeholder="Ex.: não saber por onde começar, matemática..."
      />
      <div className="space-y-2">
        <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
          Quais áreas você acha que pode gostar? (pode marcar várias)
        </label>
        <div className="flex flex-wrap gap-2">
          {opcoesFormacao.map((o) => {
            const selecionadas = respostas.areas_interesse ?? []
            const checked = selecionadas.includes(o.id)
            return (
              <label
                key={o.id}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors',
                  theme === 'dark'
                    ? checked
                      ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                      : 'bg-white/10 border-white/30 text-gray-200 hover:bg-white/15'
                    : checked
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selecionadas.filter((x) => x !== o.id)
                      : [...selecionadas, o.id]
                    atualizar({ areas_interesse: next })
                  }}
                  className="sr-only"
                />
                {o.nome}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Etapa2FeedbackAreas({
  areaRespostas,
  salvarArea,
  theme,
}: {
  areaRespostas: Record<string, NorteTechTestAreaRespostasData>
  salvarArea: (areaId: string, resp: NorteTechTestAreaRespostasData) => Promise<void>
  theme: string
}) {
  const [areaAberta, setAreaAberta] = useState<string | null>(null)
  const isDark = theme === 'dark'

  const areaCompleta = (id: string) => {
    const data = areaRespostas[id]
    if (!data || typeof data !== 'object') return false
    const todosNumeros =
      typeof data.curti_praticar === 'number' &&
      typeof data.energia === 'number' &&
      typeof data.dificuldade === 'number' &&
      typeof data.confianca === 'number'
    const temMeVejo = data.me_vejo_6_meses != null
    const todosTextos =
      (data.o_que_mais_gostei ?? '').trim() !== '' &&
      (data.o_que_foi_mais_dificil ?? '').trim() !== ''
    return todosNumeros && temMeVejo && todosTextos
  }

  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
        2. Feedback por área
      </h2>
      <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
        Preencha o feedback de cada área conforme você avança no curso. Todas as 5 áreas são obrigatórias para ver a sugestão Norte Tech.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {AREAS_IDS.map((areaId) => {
          const nome = FORMACAO_LABELS[areaId] ?? areaId
          const completo = areaCompleta(areaId)
          const aberto = areaAberta === areaId
          return (
            <div key={areaId}>
              <button
                type="button"
                onClick={() => setAreaAberta(aberto ? null : areaId)}
                className={cn(
                  'w-full rounded-xl border p-4 text-left transition-colors flex items-center justify-between gap-3',
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                  completo && (isDark ? 'border-yellow-400/30' : 'border-yellow-400/50')
                )}
              >
                <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>{nome}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {completo && (
                    <CheckCircle2 className={cn('w-4 h-4', isDark ? 'text-green-400' : 'text-green-600')} />
                  )}
                  {!completo && (
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Responder</span>
                  )}
                  <ChevronRight
                    className={cn('w-4 h-4 transition-transform', aberto && 'rotate-90', isDark ? 'text-gray-400' : 'text-gray-500')}
                  />
                </span>
              </button>
              {aberto && (
                <FormFeedbackArea
                  areaId={areaId}
                  nome={nome}
                  data={areaRespostas[areaId] || {}}
                  onSave={(resp) => salvarArea(areaId, resp)}
                  onClose={() => setAreaAberta(null)}
                  theme={theme}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FormFeedbackArea({
  areaId,
  nome,
  data,
  onSave,
  onClose,
  theme,
}: {
  areaId: string
  nome: string
  data: NorteTechTestAreaRespostasData
  onSave: (r: NorteTechTestAreaRespostasData) => Promise<void>
  onClose: () => void
  theme: string
}) {
  const isDark = theme === 'dark'
  const [r, setR] = useState<NorteTechTestAreaRespostasData>(data)
  const [saving, setSaving] = useState(false)

  const salvar = async () => {
    setSaving(true)
    await onSave(r)
    setSaving(false)
  }

  const Escala = ({
    label,
    value,
    onChange,
    hintPositivo = '1 = pouco, 5 = muito',
  }: {
    label: string
    value: number | undefined
    onChange: (n: number) => void
    hintPositivo?: string
  }) => (
    <div className="space-y-1">
      <label className={cn('block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>{label}</label>
      <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>{hintPositivo}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'w-10 h-10 rounded-lg border text-sm font-medium transition-colors',
              value === n
                ? isDark ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-yellow-500 text-gray-900 border-yellow-500'
                : isDark ? 'bg-white/10 border-white/40 text-gray-200 hover:bg-white/15 hover:border-white/50' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className={cn('mt-2 rounded-xl border p-4', isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{nome}</h3>
        <button type="button" onClick={onClose} className={cn('p-1 rounded', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200')}>
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4">
        <Escala label="Quanto você gostou de praticar?" hintPositivo="1 = pouco, 5 = muito" value={r.curti_praticar} onChange={(n) => setR((p) => ({ ...p, curti_praticar: n }))} />
        <Escala label="Quanto essa área te deu energia?" hintPositivo="1 = pouco, 5 = muito" value={r.energia} onChange={(n) => setR((p) => ({ ...p, energia: n }))} />
        <Escala label="Quanto achou difícil?" hintPositivo="1 = fácil, 5 = difícil" value={r.dificuldade} onChange={(n) => setR((p) => ({ ...p, dificuldade: n }))} />
        <Escala label="Quanto se sentiu confiante?" hintPositivo="1 = pouco, 5 = muito" value={r.confianca} onChange={(n) => setR((p) => ({ ...p, confianca: n }))} />
        <div className="space-y-1">
          <label className={cn('block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Você se vê estudando essa área por 6 meses?</label>
          <div className="flex gap-2">
            {(['sim', 'nao', 'talvez'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setR((p) => ({ ...p, me_vejo_6_meses: opt }))}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  r.me_vejo_6_meses === opt
                    ? isDark ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                    : isDark ? 'bg-white/10 border-white/40 text-gray-200 hover:bg-white/15' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {opt === 'sim' ? 'Sim' : opt === 'nao' ? 'Não' : 'Talvez'}
              </button>
            ))}
          </div>
        </div>
        <CampoTexto theme={theme} label="O que você mais gostou?" value={r.o_que_mais_gostei ?? ''} onChange={(v) => setR((p) => ({ ...p, o_que_mais_gostei: v }))} rows={2} />
        <CampoTexto theme={theme} label="O que foi mais difícil?" value={r.o_que_foi_mais_dificil ?? ''} onChange={(v) => setR((p) => ({ ...p, o_que_foi_mais_dificil: v }))} rows={2} />
        <CampoTexto theme={theme} label="Comentário livre" value={r.comentario_livre ?? ''} onChange={(v) => setR((p) => ({ ...p, comentario_livre: v }))} rows={2} />
      </div>
      <button
        type="button"
        onClick={salvar}
        disabled={saving}
        className={cn(
          'mt-4 px-4 py-2 rounded-lg font-medium',
          isDark ? 'bg-yellow-400 text-black' : 'bg-yellow-500 text-gray-900',
          saving && 'opacity-70'
        )}
      >
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}

function EtapaSugestaoIA({
  resultado,
  analisando,
  podeVerSugestao,
  onVerSugestao,
  onRefazer,
  theme,
}: {
  resultado: NorteTechTestResultadoIA | null
  analisando: boolean
  podeVerSugestao: boolean
  onVerSugestao: () => void
  onRefazer: () => void
  theme: string
}) {
  const isDark = theme === 'dark'
  if (resultado) {
    return (
      <div className="space-y-6">
        <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
          5. Sugestão Norte Tech
        </h2>
        <BlocoResultadoSugestao resultado={resultado} theme={theme} />
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Use essa sugestão para refletir. Na próxima etapa você vai registrar sua decisão.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onRefazer}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              isDark
                ? 'border-white/20 text-gray-300 hover:bg-white/10'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            Refazer teste
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
        5. Sugestão Norte Tech
      </h2>
      <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
        Com base no seu feedback por área e nas suas respostas, geramos uma sugestão de formação. Clique em &quot;Ver minha sugestão&quot; abaixo.
      </p>
      {!podeVerSugestao && (
        <p className={cn('text-sm', isDark ? 'text-amber-400' : 'text-amber-700')}>
          Complete o feedback das 5 áreas na etapa 2 para habilitar a sugestão.
        </p>
      )}
    </div>
  )
}

function BlocoResultadoSugestao({ resultado, theme }: { resultado: NorteTechTestResultadoIA; theme: string }) {
  const isDark = theme === 'dark'
  const formacaoLabel = FORMACAO_LABELS[resultado.formacao_sugerida] ?? resultado.formacao_sugerida
  return (
    <div className={cn('rounded-xl p-6 border-2', isDark ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-yellow-50 border-yellow-400')}>
      <p className={cn('text-sm font-medium mb-1', isDark ? 'text-yellow-400' : 'text-yellow-800')}>Formação sugerida</p>
      <p className={cn('text-2xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>{formacaoLabel}</p>
      <p className={cn('text-sm mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>Confiança da sugestão: {resultado.confianca}/10</p>
      {resultado.resumo && <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-700')}>{resultado.resumo}</p>}
      {resultado.proximos_passos && (
        <p className={cn('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
          <span className="font-medium">Próximos passos: </span>
          {resultado.proximos_passos}
        </p>
      )}
    </div>
  )
}

function Etapa3Reflexao({
  respostas,
  atualizar,
  theme,
}: {
  respostas: NorteTechTestRespostasData
  atualizar: (p: Partial<NorteTechTestRespostasData>) => void
  theme: string
}) {
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
        3. Reflexão sobre o curso
      </h2>
      <CampoTexto
        theme={theme}
        label="O que você aprendeu sobre programação que não sabia antes?"
        value={respostas.o_que_aprendi ?? ''}
        onChange={(v) => atualizar({ o_que_aprendi: v })}
      />
      <CampoTexto
        theme={theme}
        label="O que mais te surpreendeu durante o curso?"
        value={respostas.o_que_surpreendeu ?? ''}
        onChange={(v) => atualizar({ o_que_surpreendeu: v })}
      />
      <div className="space-y-2">
        <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
          Hoje você se sente mais confiante do que no começo?
        </label>
        <div className="flex gap-2">
          {[
            { value: true, label: 'Sim' },
            { value: false, label: 'Não' },
          ].map((opt) => {
            const current = respostas.mais_confiante
            const selected = current === opt.value
            const isDark = theme === 'dark'
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => atualizar({ mais_confiante: opt.value })}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  selected
                    ? isDark ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                    : isDark ? 'bg-white/10 border-white/40 text-gray-200 hover:bg-white/15' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Etapa4Comparando({
  respostas,
  atualizar,
  theme,
}: {
  respostas: NorteTechTestRespostasData
  atualizar: (p: Partial<NorteTechTestRespostasData>) => void
  theme: string
}) {
  const isDark = theme === 'dark'
  const perguntas: { key: keyof NorteTechTestRespostasData; label: string }[] = [
    { key: 'area_mais_gostei_praticar', label: 'Área que você mais gostou de praticar' },
    { key: 'area_mais_energia', label: 'Área que te deu mais energia' },
    { key: 'area_dificil_interessante', label: 'Área que achou mais difícil, mas interessante' },
    { key: 'area_menos_gostei', label: 'Área que você menos gostou' },
    { key: 'area_uma_so_6_meses', label: 'Se você pudesse estudar só UMA área pelos próximos 6 meses, qual seria?' },
  ]
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
        4. Comparando as áreas
      </h2>
      <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
        Sem pensar demais, escolha uma opção em cada pergunta.
      </p>
      {perguntas.map(({ key, label }) => (
        <div key={key} className="space-y-2">
          <label className={cn('block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
            {label}
          </label>
          <div className="flex flex-wrap gap-2">
            {opcoesFormacao.map((o) => {
              const value = respostas[key]
              const selected = value === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => atualizar({ [key]: o.id })}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors',
                    selected
                      ? isDark ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                      : isDark ? 'bg-white/10 border-white/30 text-gray-200 hover:bg-white/15' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {o.nome}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Etapa6Decisao({
  respostas,
  atualizar,
  theme,
}: {
  respostas: NorteTechTestRespostasData
  atualizar: (p: Partial<NorteTechTestRespostasData>) => void
  theme: string
}) {
  const isDark = theme === 'dark'
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
        6. Minha decisão
      </h2>
      <div className="space-y-2">
        <label className={cn('block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
          A área da programação que eu escolho focar agora é
        </label>
        <div className="flex flex-wrap gap-2">
          {opcoesFormacao.map((o) => {
            const selected = respostas.area_escolhida === o.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => atualizar({ area_escolhida: o.id })}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors',
                  selected
                    ? isDark ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                    : isDark ? 'bg-white/10 border-white/30 text-gray-200 hover:bg-white/15' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                )}
              >
                {o.nome}
              </button>
            )
          })}
        </div>
      </div>
      <CampoTexto
        theme={theme}
        label="Por quê?"
        value={respostas.porque_escolhi ?? ''}
        onChange={(v) => atualizar({ porque_escolhi: v })}
        placeholder="Em uma ou duas frases..."
      />
    </div>
  )
}

function Etapa7ProximoPasso({
  respostas,
  atualizar,
  theme,
}: {
  respostas: NorteTechTestRespostasData
  atualizar: (p: Partial<NorteTechTestRespostasData>) => void
  theme: string
}) {
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
        7. Próximo passo prático
      </h2>
      <CampoTexto
        theme={theme}
        label="O que você precisa aprender a seguir nessa área?"
        value={respostas.o_que_aprender ?? ''}
        onChange={(v) => atualizar({ o_que_aprender: v })}
      />
      <CampoTexto
        theme={theme}
        label="Qual será seu próximo passo concreto?"
        value={respostas.proximo_passo_concreto ?? ''}
        onChange={(v) => atualizar({ proximo_passo_concreto: v })}
      />
      <CampoTexto
        theme={theme}
        label="Quando você começa?"
        value={respostas.quando_comeco ?? ''}
        onChange={(v) => atualizar({ quando_comeco: v })}
        placeholder="Ex.: na próxima semana, no próximo mês..."
      />
    </div>
  )
}

function Etapa8Compromisso({
  respostas,
  atualizar,
  theme,
}: {
  respostas: NorteTechTestRespostasData
  atualizar: (p: Partial<NorteTechTestRespostasData>) => void
  theme: string
}) {
  return (
    <div className="space-y-6">
      <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
        8. Compromisso
      </h2>
      <CampoTexto
        theme={theme}
        label='Complete: "Nos próximos meses, eu me comprometo a continuar estudando programação focando em…"'
        value={respostas.texto_compromisso ?? ''}
        onChange={(v) => atualizar({ texto_compromisso: v })}
        rows={4}
      />
      <div className="space-y-3">
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          Escolha uma previsão de data para cada próximo passo. Isso te ajuda a manter um ritmo constante de estudo.
        </p>
        <div className="space-y-2">
          <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            Entrar para a formação
          </label>
          <input
            type="date"
            value={respostas.data_entrar_formacao ?? ''}
            onChange={(e) =>
              atualizar({ data_entrar_formacao: e.target.value ? e.target.value : null })
            }
            className={cn(
              'rounded-lg border px-3 py-2 text-sm w-full sm:w-64',
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white focus:border-yellow-400/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-yellow-500'
            )}
          />
        </div>
        <div className="space-y-2">
          <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            Fazer um projeto da formação
          </label>
          <input
            type="date"
            value={respostas.data_fazer_projeto ?? ''}
            onChange={(e) =>
              atualizar({ data_fazer_projeto: e.target.value ? e.target.value : null })
            }
            className={cn(
              'rounded-lg border px-3 py-2 text-sm w-full sm:w-64',
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white focus:border-yellow-400/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-yellow-500'
            )}
          />
        </div>
        <div className="space-y-2">
          <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            Fazer um post no LinkedIn sobre o projeto
          </label>
          <input
            type="date"
            value={respostas.data_post_linkedin ?? ''}
            onChange={(e) =>
              atualizar({ data_post_linkedin: e.target.value ? e.target.value : null })
            }
            className={cn(
              'rounded-lg border px-3 py-2 text-sm w-full sm:w-64',
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white focus:border-yellow-400/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-yellow-500'
            )}
          />
        </div>
      </div>
    </div>
  )
}

function TelaResultado({
  resultado,
  theme,
  onRefazer,
}: {
  resultado: NorteTechTestResultadoIA
  theme: string
  onRefazer: () => void
}) {
  const isDark = theme === 'dark'
  const formacaoLabel = FORMACAO_LABELS[resultado.formacao_sugerida] ?? resultado.formacao_sugerida
  const slug = resultado.formacao_sugerida === 'ainda_explorando' ? null : resultado.formacao_sugerida
  const linkFormacao = slug ? `/norte-tech?formacao=${slug}` : null

  return (
    <div
      className={cn(
        'rounded-xl border p-6 md:p-8 transition-colors duration-300',
        isDark ? 'bg-gray-800/30 border-white/10' : 'bg-white border-gray-200 shadow-sm'
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isDark ? 'bg-yellow-400/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
          )}
        >
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Sua sugestão
          </h2>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Com base nas suas respostas, nossa sugestão é:
          </p>
        </div>
      </div>

      <div
        className={cn(
          'rounded-xl p-6 mb-6 border-2',
          isDark ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-yellow-50 border-yellow-400'
        )}
      >
        <p className={cn('text-sm font-medium mb-1', isDark ? 'text-yellow-400' : 'text-yellow-800')}>
          Formação sugerida
        </p>
        <p className={cn('text-2xl font-bold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
          {formacaoLabel}
        </p>
        <p className={cn('text-sm mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
          Nível de confiança da sugestão: {resultado.confianca}/10
        </p>
        {resultado.resumo && (
          <p className={cn('text-sm leading-relaxed mt-4', isDark ? 'text-gray-300' : 'text-gray-700')}>
            {resultado.resumo}
          </p>
        )}
        {resultado.proximos_passos && (
          <p className={cn('text-sm mt-3', isDark ? 'text-gray-400' : 'text-gray-600')}>
            <span className="font-medium">Próximos passos: </span>
            {resultado.proximos_passos}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {linkFormacao && (
          <a
            href={linkFormacao}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
              isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
            )}
          >
            Conhecer formação <ArrowRight className="w-4 h-4" />
          </a>
        )}
        <button
          type="button"
          onClick={onRefazer}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
            isDark
              ? 'border-white/20 text-gray-300 hover:bg-white/10'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          Refazer teste
        </button>
      </div>
    </div>
  )
}
