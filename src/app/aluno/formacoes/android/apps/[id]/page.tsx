'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import {
  ArrowLeft,
  Zap,
  Cloud,
  Send,
  CheckCircle2,
  Search,
  ExternalLink,
} from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { getAuthToken } from '@/lib/getAuthToken'
import { HOTMART_CURSOS } from '@/lib/constants/hotmart'
import {
  getFormacaoAndroidApp,
  type FormacaoAndroidRelatedLesson,
} from '@/data/formacao-android-desafios'
import { DESAFIO_ENVIO_DESABILITADO } from '@/lib/constants/desafios'
import ValidarFormacaoModal from '@/components/aluno/ValidarFormacaoModal'

type DetailTab = 'overview' | 'requisitos' | 'aulas' | 'concluidos'

function relatedLessonKey(lesson: FormacaoAndroidRelatedLesson, index: number) {
  return lesson.href ?? `${lesson.title}-${index}`
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'requisitos', label: 'Requisitos' },
  { id: 'aulas', label: 'Sugestões de aulas' },
  { id: 'concluidos', label: 'Concluídos' },
]

export default function FormacaoAndroidAppDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const app = useMemo(() => getFormacaoAndroidApp(id), [id])
  const { theme } = useTheme()
  const { user, refreshSession } = useAuth()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [repoUrl, setRepoUrl] = useState('')
  const [showValidarModal, setShowValidarModal] = useState(false)
  const [hotmartEmail, setHotmartEmail] = useState('')
  const [isValidatingFormacao, setIsValidatingFormacao] = useState(false)
  const [validarError, setValidarError] = useState('')
  const [canSubmitAfterValidation, setCanSubmitAfterValidation] = useState(false)

  if (!app) {
    notFound()
  }

  const heroSrc = app.detailCoverSrc ?? app.coverSrc
  const heroIsWideDetail = Boolean(app.detailCoverSrc)

  const githubHref =
    app.githubRepoUrl ??
    `https://github.com/search?q=${encodeURIComponent(`${app.title} android kotlin`)}&type=repositories`

  const shell = cn(
    'min-h-[calc(100vh-4rem)] pb-16',
    isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f4f4f5] text-gray-900'
  )

  const card = cn(
    'rounded-2xl border p-5 md:p-6',
    isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white shadow-sm'
  )

  const muted = isDark ? 'text-gray-400' : 'text-gray-600'
  const labelMuted = isDark ? 'text-gray-500' : 'text-gray-500'

  const continueToSubmitFlow = () => {
    // Fluxo de envio (será implementado depois).
  }

  const handleClickEnviarProjeto = () => {
    if (DESAFIO_ENVIO_DESABILITADO) return
    if (user?.role !== 'formacao' && !canSubmitAfterValidation) {
      setValidarError('')
      setShowValidarModal(true)
      return
    }
    continueToSubmitFlow()
  }

  const handleValidateFormacao = async () => {
    if (!hotmartEmail.trim()) {
      setValidarError('Informe o e-mail usado na Hotmart.')
      return
    }

    setIsValidatingFormacao(true)
    setValidarError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setValidarError('Não foi possível obter o token de autenticação. Faça login novamente.')
        return
      }

      const res = await fetch('/api/formacoes/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: hotmartEmail.trim(),
          subdomain: HOTMART_CURSOS.android.subdomain,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao validar formação')
      }

      if (!data?.validated) {
        if (data?.reason === 'email_not_found') {
          setValidarError('E-mail não encontrado na formação informada.')
        } else if (data?.reason === 'status_not_active') {
          setValidarError('Seu acesso na Hotmart não está ACTIVE para essa formação.')
        } else {
          setValidarError('Não foi possível validar sua formação com os dados informados.')
        }
        return
      }

      setCanSubmitAfterValidation(true)
      await refreshSession()
      setShowValidarModal(false)
      continueToSubmitFlow()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao validar formação'
      setValidarError(message)
    } finally {
      setIsValidatingFormacao(false)
    }
  }

  return (
    <div className={shell}>
      <ValidarFormacaoModal
        isOpen={showValidarModal}
        onClose={() => {
          if (isValidatingFormacao) return
          setShowValidarModal(false)
        }}
        email={hotmartEmail}
        onEmailChange={setHotmartEmail}
        onValidate={handleValidateFormacao}
        isValidating={isValidatingFormacao}
        errorMessage={validarError}
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8">
        <Link
          href="/aluno/formacoes/android#desafios"
          className={cn(
            'inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors',
            isDark ? 'text-gray-300 hover:text-[#F2C94C]' : 'text-gray-700 hover:text-yellow-700'
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Voltar aos desafios
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 lg:gap-12">
          <div>
            {heroSrc ? (
              <div
                className={cn(
                  'relative w-full rounded-2xl overflow-hidden border mb-8 bg-[#e8eee8]',
                  heroIsWideDetail
                    ? 'min-h-[200px] max-h-[420px] aspect-[2.35/1]'
                    : 'max-h-[340px] min-h-[200px] aspect-[16/10]',
                  isDark ? 'border-white/15' : 'border-gray-200'
                )}
              >
                <Image
                  src={heroSrc}
                  alt={app.title}
                  fill
                  className={
                    heroIsWideDetail ? 'object-contain object-center' : 'object-cover object-top'
                  }
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  priority
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide',
                  isDark
                    ? 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30'
                    : 'bg-yellow-100 text-yellow-900 border border-yellow-300/80'
                )}
              >
                <Zap className="h-3.5 w-3.5" aria-hidden />
                {app.difficulty}
              </span>
            </div>

            <h1
              className={cn(
                'text-3xl md:text-4xl lg:text-[2.5rem] font-black tracking-tight uppercase leading-tight mb-5',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              {app.heroTitle}
            </h1>

            <p className={cn('text-base md:text-lg leading-relaxed mb-6', muted)}>{app.summary}</p>

            <div className="flex flex-wrap gap-2 mb-10">
              {app.tags.map((t) => (
                <span
                  key={t}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide border',
                    isDark
                      ? 'bg-black border-white/20 text-gray-200'
                      : 'bg-gray-900 border-gray-800 text-white'
                  )}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide transition-colors border-2 bg-transparent',
                  isDark
                    ? 'border-[#F2C94C] text-[#F2C94C] hover:bg-[#F2C94C]/10'
                    : 'border-yellow-600 text-gray-900 hover:bg-yellow-50/80'
                )}
              >
                Ver projeto no GitHub
              </a>
            </div>
          </div>

          <aside className="space-y-6 lg:pt-0">
            <div className={card}>
              <h2 className={cn('text-xs font-bold uppercase tracking-widest mb-4', labelMuted)}>
                Resumo do desafio
              </h2>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className={labelMuted}>XP</dt>
                  <dd className="font-bold text-[#F2C94C]">{app.xp}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={labelMuted}>Nível</dt>
                  <dd className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    {app.difficulty}
                  </dd>
                </div>
              </dl>
            </div>

            <div id="submit-mission" className={cn(card, 'scroll-mt-24')}>
              <div className="flex items-center gap-2 mb-4">
                <Cloud className={cn('h-5 w-5', isDark ? 'text-gray-400' : 'text-gray-600')} aria-hidden />
                <h2 className={cn('text-sm font-extrabold uppercase tracking-wide', isDark ? 'text-white' : 'text-gray-900')}>
                  Enviar projeto
                </h2>
              </div>
              <p className={cn('text-xs mb-3', labelMuted)}>URL do repositório (GitHub ou similar)</p>
              {DESAFIO_ENVIO_DESABILITADO && (
                <p
                  className={cn(
                    'text-xs rounded-xl border px-3 py-2 mb-3',
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  )}
                >
                  O envio do projeto está temporariamente indisponível.
                </p>
              )}
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={DESAFIO_ENVIO_DESABILITADO}
                placeholder="https://github.com/usuario/repositorio"
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F2C94C]/50',
                  DESAFIO_ENVIO_DESABILITADO && 'opacity-60 cursor-not-allowed',
                  isDark
                    ? 'bg-black border-white/15 text-white placeholder:text-gray-600'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400'
                )}
              />
              <button
                type="button"
                disabled={DESAFIO_ENVIO_DESABILITADO}
                title={
                  DESAFIO_ENVIO_DESABILITADO
                    ? 'Envio temporariamente indisponível'
                    : undefined
                }
                onClick={handleClickEnviarProjeto}
                className={cn(
                  'mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold uppercase tracking-wide transition-colors',
                  'bg-[#F2C94C] text-black hover:bg-[#f5d35c] border border-[#F2C94C]',
                  DESAFIO_ENVIO_DESABILITADO && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Send className="h-4 w-4" aria-hidden />
                Enviar projeto
              </button>
            </div>

            <div className={card}>
              <h2 className={cn('text-xs font-bold uppercase tracking-widest mb-2', labelMuted)}>
                Aulas sugeridas
              </h2>
              <p className={cn('text-xs leading-relaxed mb-4', labelMuted)}>
                Links abrem no Hotmart Club (curso da formação). Sem link? Use o termo na busca do curso na área do
                aluno.
              </p>
              <ul className="space-y-3">
                {app.relatedLessons.slice(0, 3).map((l, i) => (
                  <li key={relatedLessonKey(l, i)} className="text-sm font-medium">
                    {l.href ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'inline-flex items-start gap-2 rounded-lg -mx-1 px-1 py-0.5 transition-colors',
                          isDark
                            ? 'text-[#F2C94C] hover:bg-white/5 hover:text-[#f5d35c]'
                            : 'text-yellow-800 hover:bg-yellow-50'
                        )}
                      >
                        <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                        <span>{l.title}</span>
                      </a>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-start gap-2',
                          isDark ? 'text-gray-300' : 'text-gray-800'
                        )}
                      >
                        <Search className="h-4 w-4 shrink-0 mt-0.5 text-[#F2C94C]" aria-hidden />
                        {l.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={cn(
                  'mt-5 text-xs font-bold uppercase tracking-wide text-[#F2C94C] hover:underline',
                  'w-full text-left'
                )}
                onClick={() => setActiveTab('aulas')}
              >
                Ver todas as sugestões
              </button>
            </div>
          </aside>
        </div>

        <div
          className={cn(
            'mt-14 md:mt-16 pt-10 border-t',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <nav className="flex flex-wrap gap-2 sm:gap-8 border-b border-current opacity-90 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wide border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-[#F2C94C] text-[#F2C94C]'
                    : cn(
                        'border-transparent',
                        isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'
                      )
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className={card}>
                <h3 className={cn('text-lg font-extrabold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                  Objetivo do app
                </h3>
                <p className={cn('text-sm leading-relaxed', muted)}>{app.objective}</p>
              </div>
              <div className={card}>
                <h3 className={cn('text-lg font-extrabold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                  O que você vai praticar
                </h3>
                <ul className="space-y-3">
                  {app.practiceItems.map((item) => (
                    <li key={item} className={cn('flex gap-2 text-sm leading-relaxed', muted)}>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F2C94C] mt-0.5" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'requisitos' && (
            <div className={card}>
              <h3 className={cn('text-lg font-extrabold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
                Requisitos para entrega
              </h3>
              <ul className="space-y-3">
                {app.requirements.map((req) => (
                  <li
                    key={req}
                    className={cn('flex gap-2 text-sm leading-relaxed', muted)}
                  >
                    <span className="text-[#F2C94C] font-bold">—</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'aulas' && (
            <div className={card}>
              <h3 className={cn('text-lg font-extrabold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                Aulas na plataforma
              </h3>
              <p className={cn('text-sm leading-relaxed mb-6', muted)}>
                Quando houver link, a aula abre direto no{' '}
                <span className="font-medium">Hotmart Club</span> (produto da formação Android). Itens só com título
                são sugestões de termo para a busca interna do curso.
              </p>
              <ol className="space-y-4 list-none pl-0">
                {app.relatedLessons.map((l, i) => (
                  <li
                    key={relatedLessonKey(l, i)}
                    className={cn(
                      'flex items-start gap-3 text-sm border-b pb-4 last:border-0 last:pb-0',
                      isDark ? 'border-white/10 text-gray-300' : 'border-gray-100 text-gray-800'
                    )}
                  >
                    {l.href ? (
                      <ExternalLink className="h-4 w-4 text-[#F2C94C] shrink-0 mt-0.5" aria-hidden />
                    ) : (
                      <Search className="h-4 w-4 text-[#F2C94C] shrink-0 mt-0.5" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      {l.href ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'font-semibold underline-offset-2 hover:underline break-words',
                            isDark ? 'text-[#F2C94C]' : 'text-yellow-900'
                          )}
                        >
                          {l.title}
                        </a>
                      ) : (
                        <span className="font-semibold">{l.title}</span>
                      )}
                      <span className={cn('block text-xs mt-1', labelMuted)}>
                        {l.description ??
                          (l.href
                            ? 'Conteúdo recomendado para avançar nesse desafio.'
                            : 'Digite na busca do curso ou navegue pelos módulos com esse tema.')}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === 'concluidos' && (
            <div className={cn(card, 'text-center py-10')}>
              <p className={muted}>
                Nenhuma entrega registrada ainda. Quando você enviar o link do repositório, o histórico aparecerá
                aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
