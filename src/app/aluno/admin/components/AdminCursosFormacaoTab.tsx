'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { safeFetch } from '@/lib/utils/safeSupabaseQuery'
import Modal from '@/components/ui/Modal'
import type { DatabaseCurso, DatabaseCursoDesafio } from '@/types/database'
import { BookOpen, Loader2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import SafeLoading from '@/components/ui/SafeLoading'

type CursoListItem = Pick<
  DatabaseCurso,
  | 'id'
  | 'slug'
  | 'nome'
  | 'ativo'
  | 'ordem'
  | 'xp_maximo'
  | 'desafio_destaque_id'
>

type CursoDetail = {
  curso: DatabaseCurso
  modulos: DatabaseCursoDesafio[]
}

function prettyJson(v: unknown, fallback: string): string {
  if (v === null || v === undefined) return fallback
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return fallback
  }
}

async function adminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Não autenticado')

  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await safeFetch(path, {
    ...init,
    headers,
    timeout: 25000,
    retry: true,
    retryAttempts: 2,
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Erro ${res.status}`)
  }
  return json as T
}

type CursoFormState = {
  slug: string
  nome: string
  descricao_curta: string
  ativo: boolean
  ordem: string
  xp_maximo: string
  tagsJson: string
  desafio_destaque_id: string
}

function cursoToForm(c: DatabaseCurso): CursoFormState {
  return {
    slug: c.slug,
    nome: c.nome,
    descricao_curta: c.descricao_curta ?? '',
    ativo: c.ativo,
    ordem: c.ordem != null ? String(c.ordem) : '',
    xp_maximo: String(c.xp_maximo ?? 0),
    tagsJson: prettyJson(c.tags, '[]'),
    desafio_destaque_id: c.desafio_destaque_id ?? '',
  }
}

type ModuloFormState = {
  ordem: string
  slug: string
  titulo: string
  hero_titulo: string
  resumo: string
  objetivo: string
  xp: string
  tagsJson: string
  itensPraticaJson: string
  requisitosJson: string
  aulasJson: string
  imagem_capa_url: string
  imagem_detalhe_url: string
  url_repositorio_referencia: string
  metadataJson: string
  planoEstudosJson: string
}

function emptyModuloForm(ordem: number): ModuloFormState {
  return {
    ordem: String(ordem),
    slug: '',
    titulo: '',
    hero_titulo: '',
    resumo: '',
    objetivo: '',
    xp: '0',
    tagsJson: '[]',
    itensPraticaJson: '[]',
    requisitosJson: '[]',
    aulasJson: '[]',
    imagem_capa_url: '',
    imagem_detalhe_url: '',
    url_repositorio_referencia: '',
    metadataJson: '{}',
    planoEstudosJson: '',
  }
}

function moduloToForm(m: DatabaseCursoDesafio): ModuloFormState {
  return {
    ordem: String(m.ordem),
    slug: m.slug,
    titulo: m.titulo,
    hero_titulo: m.hero_titulo,
    resumo: m.resumo,
    objetivo: m.objetivo,
    xp: String(m.xp),
    tagsJson: prettyJson(m.tags, '[]'),
    itensPraticaJson: prettyJson(m.itens_pratica, '[]'),
    requisitosJson: prettyJson(m.requisitos, '[]'),
    aulasJson: prettyJson(m.aulas_sugeridas, '[]'),
    imagem_capa_url: m.imagem_capa_url ?? '',
    imagem_detalhe_url: m.imagem_detalhe_url ?? '',
    url_repositorio_referencia: m.url_repositorio_referencia ?? '',
    metadataJson: prettyJson(m.metadata, '{}'),
    planoEstudosJson: m.plano_estudos != null ? prettyJson(m.plano_estudos, '{}') : '',
  }
}

function parseJsonField(raw: string, label: string, empty: unknown): unknown {
  const t = raw.trim()
  if (!t) return empty
  try {
    return JSON.parse(t)
  } catch {
    throw new Error(`${label}: JSON inválido`)
  }
}

export default function AdminCursosFormacaoTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [cursos, setCursos] = useState<CursoListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CursoDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [cursoForm, setCursoForm] = useState<CursoFormState | null>(null)
  const [savingCurso, setSavingCurso] = useState(false)
  const [feedback, setFeedback] = useState('')

  const [novoCursoOpen, setNovoCursoOpen] = useState(false)
  const [novoCursoSlug, setNovoCursoSlug] = useState('')
  const [novoCursoNome, setNovoCursoNome] = useState('')
  const [creatingCurso, setCreatingCurso] = useState(false)

  const [moduloModal, setModuloModal] = useState<{
    mode: 'create' | 'edit'
    moduloId?: string
    form: ModuloFormState
  } | null>(null)
  const [savingModulo, setSavingModulo] = useState(false)

  const loadCursos = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const json = await adminJson<{ cursos: CursoListItem[] }>('/api/admin/cursos')
      setCursos(json.cursos || [])
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Erro ao carregar cursos')
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (cursoId: string) => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const json = await adminJson<CursoDetail>(`/api/admin/cursos/${cursoId}`)
      setDetail(json)
      setCursoForm(cursoToForm(json.curso))
    } catch (e: unknown) {
      setDetail(null)
      setCursoForm(null)
      setDetailError(e instanceof Error ? e.message : 'Erro ao carregar curso')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCursos()
  }, [loadCursos])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setCursoForm(null)
      return
    }
    loadDetail(selectedId)
  }, [selectedId, loadDetail])

  const handleSaveCurso = async () => {
    if (!selectedId || !cursoForm) return
    setSavingCurso(true)
    setFeedback('')
    try {
      let tags: unknown = []
      try {
        tags = JSON.parse(cursoForm.tagsJson || '[]')
      } catch {
        throw new Error('Tags: JSON inválido')
      }
      const body = {
        slug: cursoForm.slug.trim(),
        nome: cursoForm.nome.trim(),
        descricao_curta: cursoForm.descricao_curta.trim() || null,
        ativo: cursoForm.ativo,
        ordem: cursoForm.ordem.trim() === '' ? null : Number(cursoForm.ordem),
        xp_maximo: Number(cursoForm.xp_maximo) || 0,
        tags,
        desafio_destaque_id: cursoForm.desafio_destaque_id.trim() || null,
      }
      const json = await adminJson<{ curso: DatabaseCurso }>(`/api/admin/cursos/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setFeedback('Curso atualizado.')
      await loadCursos()
      setDetail((d) =>
        d && d.curso.id === json.curso.id ? { curso: json.curso, modulos: d.modulos } : d
      )
      setCursoForm(cursoToForm(json.curso))
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSavingCurso(false)
    }
  }

  const handleDeleteCurso = async () => {
    if (!selectedId) return
    if (!confirm('Excluir este curso e todos os módulos (desafios) vinculados?')) return
    setFeedback('')
    try {
      await adminJson(`/api/admin/cursos/${selectedId}`, { method: 'DELETE' })
      setSelectedId(null)
      setDetail(null)
      setCursoForm(null)
      setFeedback('Curso excluído.')
      await loadCursos()
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const handleCreateCurso = async () => {
    setCreatingCurso(true)
    setFeedback('')
    try {
      const json = await adminJson<{ curso: DatabaseCurso }>('/api/admin/cursos', {
        method: 'POST',
        body: JSON.stringify({
          slug: novoCursoSlug.trim(),
          nome: novoCursoNome.trim(),
          ativo: true,
          xp_maximo: 0,
          tags: [],
        }),
      })
      setNovoCursoOpen(false)
      setNovoCursoSlug('')
      setNovoCursoNome('')
      await loadCursos()
      setSelectedId(json.curso.id)
      setFeedback('Curso criado.')
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Erro ao criar curso')
    } finally {
      setCreatingCurso(false)
    }
  }

  const openCreateModulo = () => {
    const nextOrdem =
      detail?.modulos.length && detail.modulos.length > 0
        ? Math.max(...detail.modulos.map((m) => m.ordem)) + 1
        : 1
    setModuloModal({ mode: 'create', form: emptyModuloForm(nextOrdem) })
  }

  const openEditModulo = (m: DatabaseCursoDesafio) => {
    setModuloModal({ mode: 'edit', moduloId: m.id, form: moduloToForm(m) })
  }

  const handleSaveModulo = async () => {
    if (!selectedId || !moduloModal) return
    setSavingModulo(true)
    setFeedback('')
    try {
      const f = moduloModal.form
      const tags = parseJsonField(f.tagsJson, 'tags', [])
      const itens_pratica = parseJsonField(f.itensPraticaJson, 'itens_pratica', [])
      const requisitos = parseJsonField(f.requisitosJson, 'requisitos', [])
      const aulas_sugeridas = parseJsonField(f.aulasJson, 'aulas_sugeridas', [])
      const metadata = parseJsonField(f.metadataJson, 'metadata', {})
      let plano_estudos: unknown = null
      if (f.planoEstudosJson.trim()) {
        plano_estudos = parseJsonField(f.planoEstudosJson, 'plano_estudos', null)
      }

      const payload = {
        ordem: Number(f.ordem),
        slug: f.slug.trim(),
        titulo: f.titulo.trim(),
        hero_titulo: f.hero_titulo.trim(),
        resumo: f.resumo.trim(),
        objetivo: f.objetivo.trim(),
        xp: Number(f.xp) || 0,
        tags,
        itens_pratica,
        requisitos,
        aulas_sugeridas,
        imagem_capa_url: f.imagem_capa_url.trim() || null,
        imagem_detalhe_url: f.imagem_detalhe_url.trim() || null,
        url_repositorio_referencia: f.url_repositorio_referencia.trim() || null,
        metadata,
        plano_estudos,
      }

      if (moduloModal.mode === 'create') {
        await adminJson(`/api/admin/cursos/${selectedId}/modulos`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setFeedback('Módulo criado.')
      } else if (moduloModal.moduloId) {
        await adminJson(`/api/admin/cursos-desafios/${moduloModal.moduloId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setFeedback('Módulo atualizado.')
      }

      setModuloModal(null)
      await loadDetail(selectedId)
      await loadCursos()
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Erro ao salvar módulo')
    } finally {
      setSavingModulo(false)
    }
  }

  const handleDeleteModulo = async (moduloId: string) => {
    if (!confirm('Excluir este módulo?')) return
    setFeedback('')
    try {
      await adminJson(`/api/admin/cursos-desafios/${moduloId}`, { method: 'DELETE' })
      setFeedback('Módulo excluído.')
      if (selectedId) await loadDetail(selectedId)
      await loadCursos()
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Erro ao excluir módulo')
    }
  }

  const card = cn(
    'rounded-xl border p-4 md:p-5',
    isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'
  )
  const label = cn('text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')
  const input = cn(
    'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
    isDark ? 'border-white/15 bg-black/40 text-white' : 'border-gray-300 bg-white text-gray-900'
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className={cn('h-6 w-6', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
          <div>
            <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Cursos da formação
            </h2>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              CRUD de <code className="text-xs">cursos</code> e módulos{' '}
              <code className="text-xs">cursos_desafios</code> (conteúdo da trilha / apps).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadCursos()}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
              isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 hover:bg-gray-50'
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar lista
          </button>
          <button
            type="button"
            onClick={() => setNovoCursoOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
              isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-yellow-500 text-white hover:bg-yellow-600'
            )}
          >
            <Plus className="h-4 w-4" />
            Novo curso
          </button>
        </div>
      </div>

      {feedback ? (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            feedback.includes('Erro') || feedback.includes('inválido')
              ? isDark
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-800'
              : isDark
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          )}
        >
          {feedback}
        </p>
      ) : null}

      {listLoading ? (
        <SafeLoading loading loadingMessage="Carregando cursos..." error={null} />
      ) : listError ? (
        <p className={cn('text-sm text-red-500')}>{listError}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className={card}>
            <p className={label}>Cursos</p>
            <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">
              {cursos.length === 0 ? (
                <li className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-600')}>
                  Nenhum curso. Crie um novo.
                </li>
              ) : (
                cursos.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        selectedId === c.id
                          ? isDark
                            ? 'bg-yellow-400/20 text-yellow-200'
                            : 'bg-yellow-100 text-yellow-900'
                          : isDark
                            ? 'hover:bg-white/10'
                            : 'hover:bg-gray-100'
                      )}
                    >
                      <span className="font-semibold">{c.nome}</span>
                      <span className="text-xs opacity-80">{c.slug}</span>
                      {!c.ativo ? (
                        <span className="text-[10px] font-bold uppercase text-red-400">Inativo</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="min-w-0 space-y-4">
            {!selectedId ? (
              <div className={cn(card, 'text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Selecione um curso à esquerda ou crie um novo.
              </div>
            ) : detailLoading ? (
              <div className="flex items-center gap-2 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Carregando detalhes…</span>
              </div>
            ) : detailError ? (
              <p className="text-sm text-red-500">{detailError}</p>
            ) : detail && cursoForm ? (
              <>
                <div className={card}>
                  <p className={label}>Dados do curso</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Slug</label>
                      <input
                        className={input}
                        value={cursoForm.slug}
                        onChange={(e) => setCursoForm((f) => (f ? { ...f, slug: e.target.value } : f))}
                      />
                    </div>
                    <div>
                      <label className={label}>Nome</label>
                      <input
                        className={input}
                        value={cursoForm.nome}
                        onChange={(e) => setCursoForm((f) => (f ? { ...f, nome: e.target.value } : f))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Descrição curta</label>
                      <textarea
                        className={cn(input, 'min-h-[72px] resize-y')}
                        value={cursoForm.descricao_curta}
                        onChange={(e) =>
                          setCursoForm((f) => (f ? { ...f, descricao_curta: e.target.value } : f))
                        }
                      />
                    </div>
                    <div>
                      <label className={label}>Ordem</label>
                      <input
                        className={input}
                        type="number"
                        value={cursoForm.ordem}
                        onChange={(e) => setCursoForm((f) => (f ? { ...f, ordem: e.target.value } : f))}
                      />
                    </div>
                    <div>
                      <label className={label}>XP máximo (metadado)</label>
                      <input
                        className={input}
                        type="number"
                        value={cursoForm.xp_maximo}
                        onChange={(e) => setCursoForm((f) => (f ? { ...f, xp_maximo: e.target.value } : f))}
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        id="curso-ativo"
                        type="checkbox"
                        checked={cursoForm.ativo}
                        onChange={(e) =>
                          setCursoForm((f) => (f ? { ...f, ativo: e.target.checked } : f))
                        }
                        className="h-4 w-4 rounded border-gray-400"
                      />
                      <label htmlFor="curso-ativo" className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-800')}>
                        Curso ativo
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Tags (JSON array de strings)</label>
                      <textarea
                        className={cn(input, 'min-h-[80px] font-mono text-xs')}
                        value={cursoForm.tagsJson}
                        onChange={(e) =>
                          setCursoForm((f) => (f ? { ...f, tagsJson: e.target.value } : f))
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Desafio em destaque (ID do módulo)</label>
                      <select
                        className={input}
                        value={cursoForm.desafio_destaque_id}
                        onChange={(e) =>
                          setCursoForm((f) => (f ? { ...f, desafio_destaque_id: e.target.value } : f))
                        }
                      >
                        <option value="">— Nenhum —</option>
                        {detail.modulos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.ordem} · {m.slug} — {m.titulo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={savingCurso}
                      onClick={handleSaveCurso}
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm font-bold',
                        isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-yellow-500 text-white'
                      )}
                    >
                      {savingCurso ? 'Salvando…' : 'Salvar curso'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCurso}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold',
                        isDark ? 'border-red-400/50 text-red-300 hover:bg-red-500/10' : 'border-red-300 text-red-700'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir curso
                    </button>
                  </div>
                </div>

                <div className={card}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={label}>Módulos (cursos_desafios)</p>
                    <button
                      type="button"
                      onClick={openCreateModulo}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase',
                        isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-900 text-white'
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Novo módulo
                    </button>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table
                      className={cn(
                        'w-full min-w-[520px] text-left text-sm',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      <thead>
                        <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
                          <th
                            className={cn(
                              'py-2 pr-2 text-xs font-bold uppercase tracking-wide',
                              isDark ? 'text-white' : 'text-gray-700'
                            )}
                          >
                            Ordem
                          </th>
                          <th
                            className={cn(
                              'py-2 pr-2 text-xs font-bold uppercase tracking-wide',
                              isDark ? 'text-white' : 'text-gray-700'
                            )}
                          >
                            Slug
                          </th>
                          <th
                            className={cn(
                              'py-2 pr-2 text-xs font-bold uppercase tracking-wide',
                              isDark ? 'text-white' : 'text-gray-700'
                            )}
                          >
                            Título
                          </th>
                          <th
                            className={cn(
                              'py-2 pr-2 text-xs font-bold uppercase tracking-wide',
                              isDark ? 'text-white' : 'text-gray-700'
                            )}
                          >
                            XP
                          </th>
                          <th
                            className={cn(
                              'py-2 text-right text-xs font-bold uppercase tracking-wide',
                              isDark ? 'text-white' : 'text-gray-700'
                            )}
                          >
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.modulos.map((m) => (
                          <tr
                            key={m.id}
                            className={cn('border-b', isDark ? 'border-white/5' : 'border-gray-100')}
                          >
                            <td className={cn('py-2 pr-2', isDark ? 'text-white' : 'text-gray-900')}>
                              {m.ordem}
                            </td>
                            <td
                              className={cn(
                                'py-2 pr-2 font-mono text-xs',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              {m.slug}
                            </td>
                            <td className={cn('py-2 pr-2', isDark ? 'text-white' : 'text-gray-900')}>
                              {m.titulo}
                            </td>
                            <td className={cn('py-2 pr-2', isDark ? 'text-white' : 'text-gray-900')}>
                              {m.xp}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => openEditModulo(m)}
                                className={cn(
                                  'mr-2 inline-flex rounded p-1',
                                  isDark
                                    ? 'text-white hover:bg-white/15'
                                    : 'text-gray-800 hover:bg-gray-100'
                                )}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteModulo(m.id)}
                                className="inline-flex rounded p-1 text-red-400 hover:bg-red-500/10"
                                aria-label="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detail.modulos.length === 0 ? (
                      <p className={cn('mt-2 text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                        Nenhum módulo. Adicione o 10D Challenge e os apps da trilha.
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <Modal
        isOpen={novoCursoOpen}
        onClose={() => !creatingCurso && setNovoCursoOpen(false)}
        title="Novo curso"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className={label}>Slug</label>
            <input
              className={input}
              placeholder="ex: android"
              value={novoCursoSlug}
              onChange={(e) => setNovoCursoSlug(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Nome</label>
            <input
              className={input}
              placeholder="Nome exibido"
              value={novoCursoNome}
              onChange={(e) => setNovoCursoNome(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={creatingCurso || !novoCursoSlug.trim() || !novoCursoNome.trim()}
            onClick={handleCreateCurso}
            className={cn(
              'w-full rounded-lg py-2.5 text-sm font-bold',
              isDark ? 'bg-yellow-400 text-black' : 'bg-yellow-500 text-white'
            )}
          >
            {creatingCurso ? 'Criando…' : 'Criar curso'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={moduloModal != null}
        onClose={() => !savingModulo && setModuloModal(null)}
        title={moduloModal?.mode === 'create' ? 'Novo módulo' : 'Editar módulo'}
        size="lg"
      >
        {moduloModal ? (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Ordem</label>
                <input
                  type="number"
                  className={input}
                  value={moduloModal.form.ordem}
                  onChange={(e) =>
                    setModuloModal((m) =>
                      m ? { ...m, form: { ...m.form, ordem: e.target.value } } : m
                    )
                  }
                />
              </div>
              <div>
                <label className={label}>Slug</label>
                <input
                  className={input}
                  value={moduloModal.form.slug}
                  onChange={(e) =>
                    setModuloModal((m) =>
                      m ? { ...m, form: { ...m.form, slug: e.target.value } } : m
                    )
                  }
                />
              </div>
            </div>
            <div>
              <label className={label}>Título</label>
              <input
                className={input}
                value={moduloModal.form.titulo}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, titulo: e.target.value } } : m
                  )
                }
              />
            </div>
            <div>
              <label className={label}>Hero título</label>
              <input
                className={input}
                value={moduloModal.form.hero_titulo}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, hero_titulo: e.target.value } } : m
                  )
                }
              />
            </div>
            <div>
              <label className={label}>Resumo</label>
              <textarea
                className={cn(input, 'min-h-[64px]')}
                value={moduloModal.form.resumo}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, resumo: e.target.value } } : m
                  )
                }
              />
            </div>
            <div>
              <label className={label}>Objetivo</label>
              <textarea
                className={cn(input, 'min-h-[64px]')}
                value={moduloModal.form.objetivo}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, objetivo: e.target.value } } : m
                  )
                }
              />
            </div>
            <div>
              <label className={label}>XP</label>
              <input
                type="number"
                className={input}
                value={moduloModal.form.xp}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, xp: e.target.value } } : m
                  )
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Imagem capa URL</label>
                <input
                  className={input}
                  value={moduloModal.form.imagem_capa_url}
                  onChange={(e) =>
                    setModuloModal((m) =>
                      m ? { ...m, form: { ...m.form, imagem_capa_url: e.target.value } } : m
                    )
                  }
                />
              </div>
              <div>
                <label className={label}>Imagem detalhe URL</label>
                <input
                  className={input}
                  value={moduloModal.form.imagem_detalhe_url}
                  onChange={(e) =>
                    setModuloModal((m) =>
                      m ? { ...m, form: { ...m.form, imagem_detalhe_url: e.target.value } } : m
                    )
                  }
                />
              </div>
            </div>
            <div>
              <label className={label}>URL repositório referência</label>
              <input
                className={input}
                value={moduloModal.form.url_repositorio_referencia}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, url_repositorio_referencia: e.target.value } } : m
                  )
                }
              />
            </div>
            {(
              [
                ['tagsJson', 'tags (JSON array)'],
                ['itensPraticaJson', 'itens_pratica (JSON array)'],
                ['requisitosJson', 'requisitos (JSON array)'],
                ['aulasJson', 'aulas_sugeridas (JSON array de objetos)'],
                ['metadataJson', 'metadata (JSON objeto)'],
              ] as const
            ).map(([key, lab]) => (
              <div key={key}>
                <label className={label}>{lab}</label>
                <textarea
                  className={cn(input, 'min-h-[72px] font-mono text-xs')}
                  value={moduloModal.form[key]}
                  onChange={(e) =>
                    setModuloModal((m) =>
                      m ? { ...m, form: { ...m.form, [key]: e.target.value } } : m
                    )
                  }
                />
              </div>
            ))}
            <div>
              <label className={label}>plano_estudos (JSON — ex.: 10D; vazio = null)</label>
              <textarea
                className={cn(input, 'min-h-[100px] font-mono text-xs')}
                value={moduloModal.form.planoEstudosJson}
                onChange={(e) =>
                  setModuloModal((m) =>
                    m ? { ...m, form: { ...m.form, planoEstudosJson: e.target.value } } : m
                  )
                }
              />
            </div>
            <button
              type="button"
              disabled={savingModulo}
              onClick={handleSaveModulo}
              className={cn(
                'w-full rounded-lg py-2.5 text-sm font-bold',
                isDark ? 'bg-yellow-400 text-black' : 'bg-yellow-500 text-white'
              )}
            >
              {savingModulo ? 'Salvando…' : moduloModal.mode === 'create' ? 'Criar módulo' : 'Salvar módulo'}
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
