'use client'

import { useState } from 'react'
import { Target, Clock, CheckCircle2, Github, Loader2, Send, XCircle, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DatabaseDesafio, DatabaseDesafioSubmission } from '@/types/database'
import AdquirirFormacaoModal from '@/components/aluno/AdquirirFormacaoModal'

export interface MeuDesafioCard {
  id: string
  desafio: DatabaseDesafio
  atribuido_em: string
  submission?: DatabaseDesafioSubmission
  status: 'pendente_envio' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'desistiu'
  dataConclusao?: string
  tentativas: number
}

export type AulaSugeridaUI = { aulaId: string; titulo: string; moduloNome?: string; relevancia?: string; url?: string }

function normalizePassos(raw: unknown): { titulo: string; detalhes?: string }[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((p) => {
      if (typeof p === 'string') return p.trim() ? { titulo: p.trim(), detalhes: '' } : null
      if (p && typeof p === 'object' && 'titulo' in p) {
        const titulo = String((p as { titulo?: string }).titulo || '').trim()
        const detalhes = String((p as { detalhes?: string }).detalhes || '').trim()
        return titulo ? { titulo, detalhes } : null
      }
      return null
    })
    .filter(Boolean) as { titulo: string; detalhes?: string }[]
}

export interface DesafioCardProps {
  theme: 'dark' | 'light'
  meuDesafio: MeuDesafioCard
  expandedPassos: Record<string, boolean>
  setExpandedPassos: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  aulasSugeridas: Record<string, { aulas: AulaSugeridaUI[]; loading: boolean }>
  expandedAulasSugeridas: Record<string, boolean>
  setExpandedAulasSugeridas: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  desafioEmAberto: MeuDesafioCard['status'][]
  onOpenSubmit: (d: MeuDesafioCard) => void
  onOpenDesistir: (d: MeuDesafioCard) => void
  xpCompleto: number
}

function getStatusBadge(status: MeuDesafioCard['status'], theme: 'dark' | 'light') {
  const base = 'px-2 py-1 text-xs rounded-full border flex items-center gap-1'
  const isDark = theme === 'dark'
  switch (status) {
    case 'pendente_envio':
      return <span className={cn(base, isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300')}><Send className="w-3 h-3" />Enviar solução</span>
    case 'aguardando_aprovacao':
      return <span className={cn(base, isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300')}><Clock className="w-3 h-3" />Aguardando</span>
    case 'aprovado':
      return <span className={cn(base, isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300')}><CheckCircle2 className="w-3 h-3" />Aprovado</span>
    case 'rejeitado':
      return <span className={cn(base, isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300')}><XCircle className="w-3 h-3" />Rejeitado</span>
    case 'desistiu':
      return <span className={cn(base, isDark ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-100 text-gray-600 border-gray-300')}><Flag className="w-3 h-3" />Desistiu</span>
  }
}

function ActionButtons({ props }: { props: DesafioCardProps }) {
  const { theme, meuDesafio, onOpenSubmit, onOpenDesistir } = props
  const isDark = theme === 'dark'
  return (
    <div className="flex flex-col gap-2">
      {(meuDesafio.status === 'pendente_envio' || meuDesafio.status === 'rejeitado') && (
        <button onClick={() => onOpenSubmit(meuDesafio)} className={cn('px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto', isDark ? 'bg-yellow-400 hover:bg-yellow-500 text-black' : 'bg-yellow-500 hover:bg-yellow-600 text-white')}><Github className="w-4 h-4" />{meuDesafio.status === 'rejeitado' ? 'Reenviar' : 'Enviar'}</button>
      )}
      {meuDesafio.status === 'aguardando_aprovacao' && (
        <button onClick={() => onOpenSubmit(meuDesafio)} className={cn('px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 w-full md:w-auto', isDark ? 'bg-transparent border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10' : 'bg-transparent border border-yellow-500 text-yellow-600 hover:bg-yellow-50')}><Github className="w-4 h-4" /> Editar Link</button>
      )}
      {meuDesafio.status === 'pendente_envio' && (
        <button onClick={() => onOpenDesistir(meuDesafio)} className={cn('px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 w-full md:w-auto text-sm', isDark ? 'bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10' : 'bg-transparent border border-red-300 text-red-600 hover:bg-red-50')}><Flag className="w-3 h-3" /> Desistir</button>
      )}
    </div>
  )
}

export default function DesafioCard(props: DesafioCardProps) {
  const { theme, meuDesafio, expandedPassos, setExpandedPassos, xpCompleto } = props
  const isDark = theme === 'dark'
  const passos = normalizePassos((meuDesafio.desafio as any).passos)
  const isPassosExpanded = !!expandedPassos[meuDesafio.id]
  const visiblePassos = isPassosExpanded ? passos : passos.slice(0, 4)
  const showAulas = props.desafioEmAberto.includes(meuDesafio.status)
  const aulas = props.aulasSugeridas[meuDesafio.desafio.id]
  const [activeTab, setActiveTab] = useState<'passos' | 'requisitos' | 'aulas'>(() => {
    if (passos.length > 0) return 'passos'
    if ((meuDesafio.desafio.requisitos?.length ?? 0) > 0) return 'requisitos'
    return 'aulas'
  })
  const [showAdquirirFormacao, setShowAdquirirFormacao] = useState(false)

  const tabCls = (tab: 'passos' | 'requisitos' | 'aulas') =>
    cn(
      'px-3 py-2 text-sm md:text-base font-semibold rounded-t-lg transition-colors',
      activeTab === tab
        ? isDark ? 'bg-gray-700/50 text-white border-b-2 border-yellow-400' : 'bg-white/80 text-gray-900 border-b-2 border-yellow-500 shadow-sm'
        : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
    )

  return (
    <div className={cn('backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300', isDark ? 'bg-gray-800/30 border-white/10 hover:border-yellow-400/50' : 'bg-yellow-500/10 border-yellow-400/90 shadow-md')}>
      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
            <h3 className={cn('text-base md:text-lg font-semibold flex-1 min-w-0', isDark ? 'text-white' : 'text-gray-900')}>{meuDesafio.desafio.titulo}</h3>
            <span className={cn('px-2 py-1 text-xs rounded-full border', isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300')}>{meuDesafio.desafio.tecnologia}</span>
            {getStatusBadge(meuDesafio.status, theme)}
          </div>
          <p className={cn('text-sm md:text-base mb-3', isDark ? 'text-gray-400' : 'text-gray-600')}>{meuDesafio.desafio.descricao}</p>

          {/* Tabs: Passo a passo, Requisitos, Aulas */}
          <div className="mb-3">
            <div className={cn('flex gap-0 border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
              {passos.length > 0 && <button type="button" onClick={() => setActiveTab('passos')} className={tabCls('passos')}>🧭 Passo a passo</button>}
              {meuDesafio.desafio.requisitos?.length > 0 && <button type="button" onClick={() => setActiveTab('requisitos')} className={tabCls('requisitos')}>📋 Requisitos</button>}
              {showAulas && <button type="button" onClick={() => setActiveTab('aulas')} className={tabCls('aulas')}>📚 Aulas</button>}
            </div>
            <div className={cn('min-h-[80px] p-3 rounded-b-lg border border-t-0', isDark ? 'bg-gray-800/20 border-white/10' : 'bg-white/30 border-gray-200')}>
              {activeTab === 'passos' && passos.length > 0 && (
                <div>
                  <div className={cn('space-y-1 text-sm md:text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    {visiblePassos.map((p, idx) => <div key={idx}><p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{p.titulo}</p>{p.detalhes && <p className="whitespace-pre-wrap break-words">{p.detalhes}</p>}</div>)}
                  </div>
                  {passos.length > 4 && <button type="button" onClick={() => setExpandedPassos((prev) => ({ ...prev, [meuDesafio.id]: !isPassosExpanded }))} className={cn('text-sm md:text-base font-medium hover:underline mt-2 block', isDark ? 'text-gray-400' : 'text-gray-600')}>{isPassosExpanded ? 'Mostrar menos' : 'Ver todos'}</button>}
                </div>
              )}
              {activeTab === 'requisitos' && meuDesafio.desafio.requisitos?.length > 0 && (
                <ul className={cn('space-y-1 text-sm md:text-base pl-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {meuDesafio.desafio.requisitos.map((req: string, idx: number) => <li key={idx} className="list-disc">{req}</li>)}
                </ul>
              )}
              {activeTab === 'aulas' && showAulas && (
                <div>
                  <p className={cn('text-sm md:text-base mb-3', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Para apoiar sua resolução, sugerimos estas aulas do curso. Assista no seu ritmo antes ou durante o desafio.
                  </p>
                  {aulas?.loading && <p className={cn('text-sm md:text-base flex items-center gap-1', isDark ? 'text-gray-400' : 'text-gray-600')}><Loader2 className="w-3 h-3 animate-spin" /> Buscando aulas...</p>}
                  {!aulas?.loading && aulas?.aulas?.length != null && aulas.aulas.length > 0 ? (
                    <ul className={cn('grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {aulas.aulas.map((aula) => (
                        <li key={aula.aulaId} className={cn('rounded-md p-2 border', isDark ? 'border-white/15 bg-white/5' : 'border-gray-200 bg-gray-50/50')}>
                          {aula.moduloNome && <span className={cn('block font-medium', isDark ? 'text-gray-500' : 'text-gray-500')}>{aula.moduloNome}</span>}
                          {aula.url ? <a href={aula.url} target="_blank" rel="noopener noreferrer" className={cn('hover:underline', isDark ? 'text-blue-400' : 'text-blue-600')}>{aula.titulo}</a> : <span>{aula.titulo}</span>}
                          {aula.relevancia && <span className={cn('block text-xs mt-0.5', isDark ? 'text-gray-500' : 'text-gray-500')}>{aula.relevancia}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : !aulas?.loading && <p className={cn('text-sm md:text-base', isDark ? 'text-gray-500' : 'text-gray-500')}>Nenhuma aula sugerida.</p>}
                  <div className={cn('mt-4 pt-3 border-t', isDark ? 'border-white/10' : 'border-gray-200/50')}>
                    <p className={cn('text-sm mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      Sem acesso às aulas?
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAdquirirFormacao(true)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30' : 'bg-yellow-500/30 text-yellow-800 hover:bg-yellow-500/50 border border-yellow-500/50'
                      )}
                    >
                      Adquirir formação
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={cn('flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            <span className={cn('font-semibold', isDark ? 'text-yellow-400' : 'text-yellow-600')}>Vale {xpCompleto} XP</span>
            {meuDesafio.status === 'aprovado' && meuDesafio.dataConclusao && <><span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> Concluído em: {new Date(meuDesafio.dataConclusao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>{meuDesafio.tentativas > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3 md:w-4 md:h-4" /> Tentativas: {meuDesafio.tentativas}</span>}</>}
            {meuDesafio.status === 'rejeitado' && meuDesafio.dataConclusao && <span className="flex items-center gap-1"><Clock className="w-3 h-3 md:w-4 md:h-4" /> Submetido em: {new Date(meuDesafio.dataConclusao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          {meuDesafio.submission?.github_url && <div className="mt-2"><a href={meuDesafio.submission.github_url} target="_blank" rel="noopener noreferrer" className={cn('text-sm flex items-center gap-1 hover:underline', isDark ? 'text-blue-400' : 'text-blue-600')}><Github className="w-4 h-4" /> Ver repositório</a></div>}
          {meuDesafio.status === 'aprovado' && meuDesafio.submission?.admin_notes && <div className={cn('mt-2 p-3 rounded text-sm whitespace-pre-wrap', isDark ? 'bg-green-500/10 text-green-300' : 'bg-green-50 text-green-700')}><strong>Feedback do Admin:</strong> {meuDesafio.submission.admin_notes}</div>}
          {meuDesafio.status === 'rejeitado' && meuDesafio.submission?.admin_notes && <div className={cn('mt-2 p-3 rounded text-sm whitespace-pre-wrap', isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700')}><strong>Motivo da rejeição:</strong> {meuDesafio.submission.admin_notes}</div>}
        </div>
        <ActionButtons props={props} />
      </div>
      <AdquirirFormacaoModal isOpen={showAdquirirFormacao} onClose={() => setShowAdquirirFormacao(false)} />
    </div>
  )
}
