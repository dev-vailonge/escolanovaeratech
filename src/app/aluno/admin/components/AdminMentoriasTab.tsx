'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Plus,
  User,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAllUsers } from '@/lib/database'
import { sanitizeHtml } from '@/lib/sanitizeHtml'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import type { DatabaseUser } from '@/types/database'
import type { MentoriaStatus, MentoriaStepStatus } from '@/types/database'

type MentoriaListItem = {
  id: string
  mentor_id: string
  mentorado_id: string
  objetivo_principal: string
  status: MentoriaStatus
  created_at: string
  mentor?: { id: string; name: string; email: string }
  mentorado?: { id: string; name: string; email: string }
}

type StepWithTarefas = {
  id: string
  mentoria_id: string
  titulo: string
  descricao: string
  ordem: number
  status: MentoriaStepStatus
  habilitado: boolean
  tarefas: { id: string; step_id: string; titulo: string; descricao: string; concluida: boolean; links?: { label: string; url: string }[] }[]
}

type MentoriaDetail = MentoriaListItem & { steps: StepWithTarefas[] }

export default function AdminMentoriasTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [mentorias, setMentorias] = useState<MentoriaListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<MentoriaDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [showNewForm, setShowNewForm] = useState(false)
  const [alunos, setAlunos] = useState<DatabaseUser[]>([])
  const [newMentoradoId, setNewMentoradoId] = useState('')
  const [newObjetivo, setNewObjetivo] = useState('')
  const [creating, setCreating] = useState(false)

  const [showAddStep, setShowAddStep] = useState(false)
  const [newStepTitulo, setNewStepTitulo] = useState('')
  const [newStepDescricao, setNewStepDescricao] = useState('')
  const [newStepOrdem, setNewStepOrdem] = useState(0)
  const [addingStep, setAddingStep] = useState(false)

  const [showAddTarefa, setShowAddTarefa] = useState<string | null>(null)
  const [newTarefaTitulo, setNewTarefaTitulo] = useState('')
  const [newTarefaDescricao, setNewTarefaDescricao] = useState('')
  const [addingTarefa, setAddingTarefa] = useState(false)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const loadMentorias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) throw new Error('Não autenticado')

      const res = await fetch('/api/admin/mentorias', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar')
      setMentorias(data.mentorias || [])
      if (!selectedId && data.mentorias?.length) {
        setSelectedId(data.mentorias[0].id)
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar mentorias')
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  const loadDetail = useCallback(async (id: string) => {
    try {
      setLoadingDetail(true)
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/admin/mentorias/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro')
      setDetail(data)
    } catch (e) {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    loadMentorias()
  }, [loadMentorias])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  useEffect(() => {
    getAllUsers().then((users) => {
      const alunosList = users
        .filter((u) => u.role === 'aluno')
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'))
      setAlunos(alunosList)
    })
  }, [])

  const handleCreateMentoria = async () => {
    if (!newMentoradoId || !newObjetivo.trim()) {
      setError('Selecione o aluno e informe o objetivo.')
      return
    }
    try {
      setCreating(true)
      setError(null)
      const token = await getToken()
      if (!token) throw new Error('Não autenticado')

      const { data: { user } } = await supabase.auth.getUser()
      const mentorId = user?.id
      if (!mentorId) throw new Error('Usuário não encontrado')

      const res = await fetch('/api/admin/mentorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentor_id: mentorId,
          mentorado_id: newMentoradoId,
          objetivo_principal: newObjetivo.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar')
      setShowNewForm(false)
      setNewMentoradoId('')
      setNewObjetivo('')
      setSelectedId(data.id)
      loadMentorias()
      if (data.id) loadDetail(data.id)
    } catch (e: any) {
      setError(e.message || 'Erro ao criar mentoria')
    } finally {
      setCreating(false)
    }
  }

  const handleAddStep = async () => {
    if (!selectedId || !detail || !newStepTitulo.trim()) return
    try {
      setAddingStep(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      const nextOrdem = detail.steps.length + 1
      const res = await fetch(`/api/admin/mentorias/${selectedId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: newStepTitulo.trim(),
          descricao: newStepDescricao.trim(),
          ordem: newStepOrdem || nextOrdem,
          habilitado: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro')
      setNewStepTitulo('')
      setNewStepDescricao('')
      setShowAddStep(false)
      loadDetail(selectedId)
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar step')
    } finally {
      setAddingStep(false)
    }
  }

  const handleToggleStepHabilitado = async (step: StepWithTarefas) => {
    if (!selectedId) return
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/admin/mentorias/steps/${step.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ habilitado: !step.habilitado }),
      })
      if (!res.ok) throw new Error('Erro')
      loadDetail(selectedId)
    } catch (e) {
      setError('Erro ao atualizar step')
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Remover este step e todas as tarefas?')) return
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/admin/mentorias/steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro')
      if (selectedId) loadDetail(selectedId)
      loadMentorias()
    } catch (e) {
      setError('Erro ao remover step')
    }
  }

  const handleAddTarefa = async (stepId: string) => {
    if (!newTarefaTitulo.trim()) return
    try {
      setAddingTarefa(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/admin/mentorias/steps/${stepId}/tarefas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: newTarefaTitulo.trim(),
          descricao: newTarefaDescricao.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro')
      setNewTarefaTitulo('')
      setNewTarefaDescricao('')
      setShowAddTarefa(null)
      if (selectedId) loadDetail(selectedId)
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar tarefa')
    } finally {
      setAddingTarefa(false)
    }
  }

  const handleDeleteTarefa = async (tarefaId: string) => {
    if (!confirm('Remover esta tarefa?')) return
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/admin/mentorias/tarefas/${tarefaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro')
      if (selectedId) loadDetail(selectedId)
    } catch (e) {
      setError('Erro ao remover tarefa')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={cn('w-8 h-8 animate-spin', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
          Mentorias
        </h2>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
            isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          )}
        >
          <Plus className="w-4 h-4" />
          Nova mentoria
        </button>
      </div>

      {error && (
        <div className={cn('rounded-lg border p-2 text-sm', isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}>
          {error}
        </div>
      )}

      {showNewForm && (
        <div className={cn('rounded-xl border p-4 space-y-3', isDark ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200')}>
          <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
            Cadastrar aluno na mentoria
          </h3>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Aluno (mentorado)</label>
            <select
              value={newMentoradoId}
              onChange={(e) => setNewMentoradoId(e.target.value)}
              className={cn('w-full rounded-lg border px-3 py-2 text-sm', isDark ? 'bg-black/60 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900')}
            >
              <option value="">Selecione</option>
              {alunos.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Objetivo principal</label>
            <input
              type="text"
              value={newObjetivo}
              onChange={(e) => setNewObjetivo(e.target.value)}
              placeholder="Ex: Transição de carreira"
              className={cn('w-full rounded-lg border px-3 py-2 text-sm', isDark ? 'bg-black/60 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateMentoria}
              disabled={creating}
              className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50')}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Criar
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setError(null); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-500 text-gray-300 hover:bg-white/5"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Mentorados</p>
          {mentorias.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma mentoria cadastrada.</p>
          ) : (
            mentorias.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition-colors',
                  selectedId === m.id
                    ? 'border-yellow-400 bg-yellow-500/10'
                    : isDark ? 'border-white/10 bg-black/40 hover:bg-white/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                <p className="font-medium text-white truncate">
                  {(m.mentorado as any)?.name ?? m.mentorado_id}
                </p>
                <p className="text-xs text-gray-400 truncate">{m.objetivo_principal}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{m.status}</p>
              </button>
            ))
          )}
        </div>

        <div className={cn('rounded-xl border p-4 min-h-[200px]', isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white')}>
          {!selectedId ? (
            <p className="text-sm text-gray-500">Selecione uma mentoria.</p>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400">Objetivo</p>
                <p className="text-sm text-white font-medium">{detail.objetivo_principal}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Mentorado: {(detail.mentorado as any)?.name} ({(detail.mentorado as any)?.email})
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs text-gray-400">Steps</p>
                  <button
                    type="button"
                    onClick={() => setShowAddStep((v) => !v)}
                    className="text-xs text-yellow-400 hover:underline"
                  >
                    + Adicionar step
                  </button>
                </div>

                {showAddStep && (
                  <div className="mb-3 p-3 rounded-lg border border-white/10 space-y-2">
                    <input
                      type="text"
                      value={newStepTitulo}
                      onChange={(e) => setNewStepTitulo(e.target.value)}
                      placeholder="Título do step"
                      className={cn('w-full rounded border px-2 py-1 text-sm', isDark ? 'bg-black/60 text-white' : 'bg-gray-50 text-gray-900')}
                    />
                    <div className={cn(isDark ? 'text-white' : 'text-gray-900')}>
                      <RichTextEditor
                        value={newStepDescricao}
                        onChange={setNewStepDescricao}
                        placeholder="Descrição (negrito, itálico, listas...)"
                        className={cn(isDark ? 'border-white/20 bg-black/60' : 'border-gray-300 bg-gray-50')}
                        minHeight="80px"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddStep}
                        disabled={addingStep || !newStepTitulo.trim()}
                        className="text-xs px-2 py-1 rounded bg-yellow-500 text-black disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button type="button" onClick={() => setShowAddStep(false)} className="text-xs text-gray-400 hover:text-white">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <ul className="space-y-3">
                  {detail.steps
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((step) => (
                      <li
                        key={step.id}
                        className={cn('rounded-lg border p-3', isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {step.ordem}. {step.titulo}
                            </p>
                            <div
                              className="text-xs text-gray-400 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_p]:my-0.5 [&_li]:my-0"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.descricao || '') }}
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                              Status: {step.status} · {step.habilitado ? 'Habilitado' : 'Desabilitado'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleStepHabilitado(step)}
                              title={step.habilitado ? 'Desabilitar' : 'Habilitar'}
                              className="text-xs px-2 py-0.5 rounded border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              {step.habilitado ? 'Desabilitar' : 'Habilitar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 pl-2 border-l-2 border-white/10">
                          <p className="text-[11px] text-gray-500 mb-1">Tarefas</p>
                          {(step.tarefas || []).map((t) => (
                            <div key={t.id} className="flex items-center justify-between gap-2 text-xs text-gray-300 py-0.5">
                              <span>{t.titulo}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteTarefa(t.id)}
                                className="text-red-400 hover:underline"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                          {showAddTarefa === step.id ? (
                            <div className="mt-2 space-y-1">
                              <input
                                type="text"
                                value={newTarefaTitulo}
                                onChange={(e) => setNewTarefaTitulo(e.target.value)}
                                placeholder="Título da tarefa"
                                className={cn('w-full rounded border px-2 py-1 text-xs', isDark ? 'bg-black/60 text-white' : 'bg-white text-gray-900')}
                              />
                              <input
                                type="text"
                                value={newTarefaDescricao}
                                onChange={(e) => setNewTarefaDescricao(e.target.value)}
                                placeholder="Descrição (opcional)"
                                className={cn('w-full rounded border px-2 py-1 text-xs', isDark ? 'bg-black/60 text-white' : 'bg-white text-gray-900')}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddTarefa(step.id)}
                                  disabled={addingTarefa || !newTarefaTitulo.trim()}
                                  className="text-xs px-2 py-0.5 rounded bg-yellow-500 text-black"
                                >
                                  Adicionar
                                </button>
                                <button type="button" onClick={() => setShowAddTarefa(null)} className="text-xs text-gray-400">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowAddTarefa(step.id)}
                              className="text-xs text-yellow-400 hover:underline"
                            >
                              + Adicionar tarefa
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
