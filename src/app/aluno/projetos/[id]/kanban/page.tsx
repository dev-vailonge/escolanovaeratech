'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Bold, Code, Filter, Italic, Link2, List, ListOrdered, Loader2, MessageSquareQuote, Plus, Tag, Trash2, UserCheck, Users, X } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { createPortal } from 'react-dom'
import type {
  ProjetoRealKanbanColuna,
  DatabaseProjetoRealKanbanTarefa,
  DatabaseProjetoRealKanbanTarefaAnexo,
} from '@/types/database'

const COLUNAS: Array<{ id: ProjetoRealKanbanColuna; label: string }> = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Em progresso' },
  { id: 'done', label: 'Concluido' },
]
const LABELS_FIXAS = ['iniciante', 'intermediário', 'avançado'] as const
const PLATAFORMAS_FIXAS = ['Android', 'iOS', 'Web', 'Backend', 'Análise de dados'] as const
const KANBAN_IMAGES_BUCKET = 'kanban-card-images'

const normalizePlataforma = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const getPlataformaClasses = (plataforma: string, isDark: boolean) => {
  const normalized = normalizePlataforma(plataforma)
  if (normalized === 'backend') {
    return isDark ? 'bg-yellow-500/25 text-yellow-300' : 'bg-yellow-100 text-yellow-900'
  }
  if (normalized === 'android') {
    return isDark ? 'bg-green-500/25 text-green-300' : 'bg-green-100 text-green-900'
  }
  if (normalized === 'ios') {
    return isDark ? 'bg-blue-500/25 text-blue-300' : 'bg-blue-100 text-blue-900'
  }
  if (normalized === 'web') {
    return isDark ? 'bg-purple-500/25 text-purple-300' : 'bg-purple-100 text-purple-900'
  }
  if (normalized === 'analise de dados') {
    return isDark ? 'bg-red-500/25 text-red-300' : 'bg-red-100 text-red-900'
  }
  return isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-200 text-gray-700'
}

const getPlataformaSelectedButtonClasses = (plataforma: string, isDark: boolean) => {
  const normalized = normalizePlataforma(plataforma)
  if (normalized === 'backend') return isDark ? 'bg-yellow-500 text-black' : 'bg-yellow-500 text-black'
  if (normalized === 'android') return isDark ? 'bg-green-500 text-black' : 'bg-green-600 text-white'
  if (normalized === 'ios') return isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
  if (normalized === 'web') return isDark ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white'
  if (normalized === 'analise de dados') return isDark ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
  return isDark ? 'bg-white/20 text-white' : 'bg-gray-400 text-white'
}

const INLINE_MD_REGEX = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)]+)\))/g

const renderInlineMarkdown = (text: string, isDark: boolean, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0
  for (const match of text.matchAll(INLINE_MD_REGEX)) {
    const token = match[0]
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-text-${matchIndex}`}>{text.slice(lastIndex, index)}</span>
      )
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-bold-${matchIndex}`}>{token.slice(2, -2)}</strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-italic-${matchIndex}`}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${matchIndex}`}
          className={cn(
            'rounded px-1 py-0.5 text-[0.9em]',
            isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-200 text-gray-800'
          )}
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('[')) {
      const parts = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
      if (parts) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${matchIndex}`}
            href={parts[2]}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'font-semibold underline underline-offset-2',
              isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
            )}
          >
            {parts[1]}
          </a>
        )
      } else {
        nodes.push(<span key={`${keyPrefix}-raw-${matchIndex}`}>{token}</span>)
      }
    } else {
      nodes.push(<span key={`${keyPrefix}-raw-${matchIndex}`}>{token}</span>)
    }
    lastIndex = index + token.length
    matchIndex += 1
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</span>)
  }
  return nodes
}

const renderDescriptionMarkdown = (value: string, isDark: boolean): ReactNode => {
  const lines = value.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()
    if (!line.trim()) {
      i += 1
      continue
    }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('- ')) {
        items.push(lines[i].trimStart().slice(2))
        i += 1
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={`ul-${i}-${idx}`}>{renderInlineMarkdown(item, isDark, `ul-${i}-${idx}`)}</li>
          ))}
        </ul>
      )
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(lines[i].trimStart().replace(/^\d+\.\s/, ''))
        i += 1
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={`ol-${i}-${idx}`}>{renderInlineMarkdown(item, isDark, `ol-${i}-${idx}`)}</li>
          ))}
        </ol>
      )
      continue
    }
    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className={cn(
            'border-l-2 pl-3 italic',
            isDark ? 'border-[#F2C94C]/60 text-gray-300' : 'border-[#F2C94C] text-gray-700'
          )}
        >
          {renderInlineMarkdown(line.slice(2), isDark, `quote-${i}`)}
        </blockquote>
      )
      i += 1
      continue
    }
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInlineMarkdown(line, isDark, `p-${i}`)}
      </p>
    )
    i += 1
  }
  return <div className="space-y-2">{blocks}</div>
}

type KanbanTarefa = DatabaseProjetoRealKanbanTarefa & {
  assignees?: Array<{ user_id: string; name: string; avatar_url?: string | null }>
  commentsCount?: number
}

type ParticipanteProjeto = {
  user_id: string
  name: string
  avatar_url: string | null
}

type KanbanAnexo = DatabaseProjetoRealKanbanTarefaAnexo

export default function ProjetoKanbanPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [tarefas, setTarefas] = useState<KanbanTarefa[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false)
  const [filterPlataforma, setFilterPlataforma] = useState<string>('')
  const [filterLabel, setFilterLabel] = useState<string>('')
  const [taskPendingDelete, setTaskPendingDelete] = useState<{ id: string; titulo: string } | null>(null)
  const [deletingTask, setDeletingTask] = useState(false)
  const [nomeProjeto, setNomeProjeto] = useState('')
  const [participantes, setParticipantes] = useState<ParticipanteProjeto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAssign, setSavingAssign] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createModalColuna, setCreateModalColuna] = useState<ProjetoRealKanbanColuna | null>(null)
  const [createTitulo, setCreateTitulo] = useState('')
  const [createDescricao, setCreateDescricao] = useState('')
  const [createLabels, setCreateLabels] = useState<string[]>([])
  const [createPlataformas, setCreatePlataformas] = useState<string[]>([])
  const [createAssigneeIds, setCreateAssigneeIds] = useState<string[]>([])
  const [createShowMembersMenu, setCreateShowMembersMenu] = useState(false)
  const [createMemberSearch, setCreateMemberSearch] = useState('')
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverColuna, setDragOverColuna] = useState<ProjetoRealKanbanColuna | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('after')
  const [lastDroppedTaskId, setLastDroppedTaskId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showLabelsMenu, setShowLabelsMenu] = useState(false)
  const [showPlataformasMenu, setShowPlataformasMenu] = useState(false)
  const [showMembersMenu, setShowMembersMenu] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [imageViewer, setImageViewer] = useState<{ url: string; title: string } | null>(null)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [selectedPlataformas, setSelectedPlataformas] = useState<string[]>([])
  const [selectedTaskAnexos, setSelectedTaskAnexos] = useState<KanbanAnexo[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const labelsButtonRef = useRef<HTMLButtonElement | null>(null)
  const plataformasButtonRef = useRef<HTMLButtonElement | null>(null)
  const membersButtonRef = useRef<HTMLButtonElement | null>(null)
  const createMembersButtonRef = useRef<HTMLButtonElement | null>(null)
  const [labelsPopoverPos, setLabelsPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [plataformasPopoverPos, setPlataformasPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [membersPopoverPos, setMembersPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [createMembersPopoverPos, setCreateMembersPopoverPos] = useState<{ top: number; left: number } | null>(null)

  const load = useCallback(async () => {
    if (!id.trim()) return
    setLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nao autenticado')
      setCurrentUserId(session.user?.id ?? null)
      const res = await fetch(`/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const projetoRes = await fetch(`/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({}))
      const projetoJson = await projetoRes.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar board')
      setTarefas(Array.isArray(json?.tarefas) ? json.tarefas : [])
      setNomeProjeto(typeof projetoJson?.projeto?.title === 'string' ? projetoJson.projeto.title : '')
      setParticipantes(Array.isArray(projetoJson?.participantesAlunos) ? projetoJson.participantesAlunos : [])
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao carregar board')
      setTarefas([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const loadAnexos = useCallback(
    async (tarefaId: string) => {
      if (!id.trim() || !tarefaId.trim()) return
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Nao autenticado')
        const res = await fetch(
          `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas/${encodeURIComponent(tarefaId)}/anexos`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        )
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar anexos')
        setSelectedTaskAnexos(Array.isArray(json?.anexos) ? json.anexos : [])
      } catch (e: unknown) {
        setError((e as Error).message || 'Erro ao carregar anexos')
        setSelectedTaskAnexos([])
      }
    },
    [id]
  )

  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((t) => {
      if (filterAssignedToMe) {
        if (!currentUserId) return false
        const ids = (t.assignees || []).map((a) => a.user_id)
        if (!ids.includes(currentUserId)) return false
      }
      if (filterPlataforma) {
        const plats = t.plataformas || []
        if (!plats.includes(filterPlataforma)) return false
      }
      if (filterLabel) {
        const labs = t.labels || []
        if (!labs.includes(filterLabel)) return false
      }
      return true
    })
  }, [tarefas, filterAssignedToMe, filterPlataforma, filterLabel, currentUserId])

  const porColuna = useMemo(
    () =>
      COLUNAS.map((c) => ({
        ...c,
        items: tarefasFiltradas.filter((t) => t.coluna === c.id).sort((a, b) => a.ordem - b.ordem),
      })),
    [tarefasFiltradas]
  )

  const criar = async () => {
    if (!createTitulo.trim() || !id.trim() || !createModalColuna) return
    setSaving(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nao autenticado')
      const res = await fetch(`/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: createTitulo.trim(),
          descricao: createDescricao.trim(),
          coluna: createModalColuna,
          labels: createLabels,
          plataformas: createPlataformas,
          assignee_user_ids: createAssigneeIds,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel criar tarefa')
      setCreateTitulo('')
      setCreateDescricao('')
      setCreateLabels([])
      setCreatePlataformas([])
      setCreateAssigneeIds([])
      setCreateModalColuna(null)
      setCreateShowMembersMenu(false)
      setCreateMemberSearch('')
      await load()
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao criar tarefa')
    } finally {
      setSaving(false)
    }
  }

  const toggleCreateLabel = (label: string) => {
    setCreateLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))
  }

  const toggleCreatePlataforma = (plataforma: string) => {
    setCreatePlataformas((prev) =>
      prev.includes(plataforma) ? prev.filter((p) => p !== plataforma) : [...prev, plataforma]
    )
  }

  const toggleCreateAssignee = (userId: string) => {
    setCreateAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
    setCreateShowMembersMenu(false)
  }

  const persistReorder = async (updates: Array<{ id: string; coluna: ProjetoRealKanbanColuna; ordem: number }>) => {
    if (!id.trim() || updates.length === 0) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Nao autenticado')
    const results = await Promise.all(
      updates.map(async (item) => {
        const res = await fetch(
          `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas/${encodeURIComponent(item.id)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ coluna: item.coluna, ordem: item.ordem }),
          }
        )
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Nao foi possivel reordenar tarefa')
        return true
      })
    )
    if (results.length !== updates.length) {
      throw new Error('Falha ao persistir reordenação')
    }
  }

  const remover = async (tarefaId: string): Promise<boolean> => {
    if (!id.trim()) return false
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nao autenticado')
      const res = await fetch(`/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas/${encodeURIComponent(tarefaId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel excluir tarefa')
      await load()
      return true
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao excluir tarefa')
      return false
    }
  }

  const confirmarExclusaoTarefa = async () => {
    if (!taskPendingDelete) return
    setDeletingTask(true)
    setError(null)
    const ok = await remover(taskPendingDelete.id)
    if (ok) {
      if (selectedTaskId === taskPendingDelete.id) setSelectedTaskId(null)
      setTaskPendingDelete(null)
    }
    setDeletingTask(false)
  }

  const onDropDestino = async (
    nextColuna: ProjetoRealKanbanColuna,
    targetTaskId?: string,
    position: 'before' | 'after' = 'after'
  ) => {
    if (!draggingTaskId) return
    const task = tarefas.find((t) => t.id === draggingTaskId)
    setDragOverColuna(null)
    setDragOverTaskId(null)
    setDraggingTaskId(null)
    if (!task) return
    if (targetTaskId && targetTaskId === task.id) return

    const sourceColuna = task.coluna
    const sourceSemCard = tarefas
      .filter((t) => t.coluna === sourceColuna && t.id !== task.id)
      .sort((a, b) => a.ordem - b.ordem)
    const targetListaBase =
      sourceColuna === nextColuna
        ? sourceSemCard
        : tarefas.filter((t) => t.coluna === nextColuna).sort((a, b) => a.ordem - b.ordem)

    let insertAt = targetListaBase.length
    if (targetTaskId) {
      const idx = targetListaBase.findIndex((t) => t.id === targetTaskId)
      if (idx >= 0) insertAt = position === 'before' ? idx : idx + 1
    }

    const movedTask: KanbanTarefa = { ...task, coluna: nextColuna }
    const targetComCard = [...targetListaBase]
    targetComCard.splice(insertAt, 0, movedTask)

    const nextTarefas = tarefas.map((t) => ({ ...t }))
    const updates: Array<{ id: string; coluna: ProjetoRealKanbanColuna; ordem: number }> = []

    const applyColuna = (items: KanbanTarefa[], coluna: ProjetoRealKanbanColuna) => {
      items.forEach((item, idx) => {
        const current = nextTarefas.find((t) => t.id === item.id)
        if (!current) return
        if (current.ordem !== idx || current.coluna !== coluna) {
          current.ordem = idx
          current.coluna = coluna
          updates.push({ id: current.id, coluna, ordem: idx })
        }
      })
    }

    if (sourceColuna === nextColuna) {
      applyColuna(targetComCard, nextColuna)
    } else {
      applyColuna(sourceSemCard, sourceColuna)
      applyColuna(targetComCard, nextColuna)
    }

    if (updates.length === 0) return
    const prev = tarefas
    setTarefas(nextTarefas)
    setLastDroppedTaskId(task.id)
    window.setTimeout(() => setLastDroppedTaskId((curr) => (curr === task.id ? null : curr)), 350)
    try {
      await persistReorder(updates)
    } catch (e: unknown) {
      setTarefas(prev)
      setError((e as Error).message || 'Erro ao mover tarefa')
      await load()
    }
  }

  const selectedTask = useMemo(
    () => tarefas.find((t) => t.id === selectedTaskId) ?? null,
    [tarefas, selectedTaskId]
  )

  useEffect(() => {
    if (!selectedTask) return
    setDraftTitle(selectedTask.titulo)
    setDraftDescription(selectedTask.descricao || '')
    setSelectedAssigneeIds((selectedTask.assignees || []).map((a) => a.user_id))
    setSelectedLabels(Array.isArray(selectedTask.labels) ? selectedTask.labels : [])
    setSelectedPlataformas(Array.isArray(selectedTask.plataformas) ? selectedTask.plataformas : [])
    setShowLabelsMenu(false)
    setShowPlataformasMenu(false)
    setShowMembersMenu(false)
    setMemberSearch('')
    setIsEditingTitle(false)
    setIsEditingDescription(false)
    void loadAnexos(selectedTask.id)
  }, [selectedTaskId, selectedTask, loadAnexos])

  useEffect(() => {
    if (selectedTaskId !== null) return
    setShowLabelsMenu(false)
    setShowPlataformasMenu(false)
    setShowMembersMenu(false)
    setMemberSearch('')
    setSelectedTaskAnexos([])
  }, [selectedTaskId])

  const participantesFiltrados = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    if (!query) return participantes
    return participantes.filter((p) => p.name.toLowerCase().includes(query))
  }, [participantes, memberSearch])

  const createParticipantesFiltrados = useMemo(() => {
    const query = createMemberSearch.trim().toLowerCase()
    if (!query) return participantes
    return participantes.filter((p) => p.name.toLowerCase().includes(query))
  }, [participantes, createMemberSearch])

  useEffect(() => {
    if (!showLabelsMenu) return
    const updatePos = () => {
      const rect = labelsButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setLabelsPopoverPos({
        top: rect.bottom + 8,
        left: Math.max(12, rect.left - 20),
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [showLabelsMenu])

  useEffect(() => {
    if (!showMembersMenu) return
    const updatePos = () => {
      const rect = membersButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setMembersPopoverPos({
        top: rect.bottom + 8,
        left: Math.max(12, rect.left - 120),
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [showMembersMenu])

  useEffect(() => {
    if (!createShowMembersMenu) return
    const updatePos = () => {
      const rect = createMembersButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setCreateMembersPopoverPos({
        top: rect.bottom + 8,
        left: Math.max(12, rect.left - 120),
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [createShowMembersMenu])

  useEffect(() => {
    if (!showPlataformasMenu) return
    const updatePos = () => {
      const rect = plataformasButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPlataformasPopoverPos({
        top: rect.bottom + 8,
        left: Math.max(12, rect.left - 20),
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [showPlataformasMenu])

  const toggleAssignee = async (userId: string) => {
    if (!selectedTask) return
    const nextIds = selectedAssigneeIds.includes(userId)
      ? selectedAssigneeIds.filter((id) => id !== userId)
      : [...selectedAssigneeIds, userId]
    setSelectedAssigneeIds(nextIds)
    const nextAssignees = participantes
      .filter((p) => nextIds.includes(p.user_id))
      .map((p) => ({
        user_id: p.user_id,
        name: p.name,
        avatar_url: p.avatar_url,
      }))
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              assignees: nextAssignees,
            }
          : t
      )
    )
    setShowMembersMenu(false)
    await salvarDetalhesCard({ assignee_user_ids: nextIds })
  }

  const salvarDetalhesCard = async (payload: {
    titulo?: string
    descricao?: string
    imagem_url?: string | null
    labels?: string[]
    plataformas?: string[]
    assignee_user_ids?: string[]
  }) => {
    if (!id.trim() || !selectedTask) return
    setSavingAssign(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nao autenticado')
      const res = await fetch(
        `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas/${encodeURIComponent(selectedTask.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel atualizar tarefa')
      await load()
      setSelectedTaskId(selectedTask.id)
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao atualizar responsaveis')
    } finally {
      setSavingAssign(false)
    }
  }

  const salvarTitulo = async () => {
    const tituloTrimmed = draftTitle.trim()
    if (!tituloTrimmed || !selectedTask) {
      setDraftTitle(selectedTask?.titulo || '')
      setIsEditingTitle(false)
      return
    }
    await salvarDetalhesCard({ titulo: tituloTrimmed })
    setIsEditingTitle(false)
  }

  const salvarDescricao = async () => {
    if (!selectedTask) return
    const descricaoTrimmed = draftDescription.trim()
    await salvarDetalhesCard({ descricao: descricaoTrimmed })
    setIsEditingDescription(false)
  }

  const uploadImagemArquivo = async (file: File, scope: string): Promise<string> => {
    const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg'
    const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `projetos-reais/${id}/${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
    const { error: uploadError } = await supabase.storage
      .from(KANBAN_IMAGES_BUCKET)
      .upload(path, file, { upsert: false })
    if (uploadError) throw new Error(uploadError.message || 'Nao foi possivel enviar imagem')
    const { data } = supabase.storage.from(KANBAN_IMAGES_BUCKET).getPublicUrl(path)
    const publicUrl = data?.publicUrl
    if (!publicUrl) throw new Error('Nao foi possivel gerar URL da imagem')
    return publicUrl
  }

  const adicionarAnexo = async (file: File) => {
    if (!selectedTask || !id.trim()) return
    setUploadingAttachment(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nao autenticado')

      const arquivoUrl = await uploadImagemArquivo(file, `attachment-${selectedTask.id}`)
      const res = await fetch(
        `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas/${encodeURIComponent(selectedTask.id)}/anexos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: file.name || `imagem-${Date.now()}.jpg`,
            arquivo_url: arquivoUrl,
          }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel adicionar anexo')
      if (json?.anexo?.id) {
        setSelectedTaskAnexos((prev) => [json.anexo as KanbanAnexo, ...prev])
      }
      await loadAnexos(selectedTask.id)
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao adicionar anexo')
    } finally {
      setUploadingAttachment(false)
    }
  }

  const removerAnexo = async (anexoId: string) => {
    if (!selectedTask || !id.trim()) return
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nao autenticado')
      const res = await fetch(
        `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/kanban-tarefas/${encodeURIComponent(selectedTask.id)}/anexos/${encodeURIComponent(anexoId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel remover anexo')
      setSelectedTaskAnexos((prev) => prev.filter((anexo) => anexo.id !== anexoId))
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao remover anexo')
    }
  }

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) => {
      const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
      void salvarDetalhesCard({ labels: next })
      return next
    })
  }

  const togglePlataforma = (plataforma: string) => {
    setSelectedPlataformas((prev) => {
      const next = prev.includes(plataforma)
        ? prev.filter((p) => p !== plataforma)
        : [...prev, plataforma]
      void salvarDetalhesCard({ plataformas: next })
      return next
    })
  }

  const applyDescriptionFormat = (
    type: 'bold' | 'italic' | 'bullet' | 'numbered' | 'link' | 'quote' | 'code'
  ) => {
    const input = descriptionTextareaRef.current
    if (!input) return
    const value = draftDescription
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const selected = value.slice(start, end)
    let nextValue = value
    let nextStart = start
    let nextEnd = end

    if (type === 'bold') {
      const text = selected || 'texto'
      const insertion = `**${text}**`
      nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
      nextStart = start + 2
      nextEnd = start + 2 + text.length
    }
    if (type === 'italic') {
      const text = selected || 'texto'
      const insertion = `*${text}*`
      nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
      nextStart = start + 1
      nextEnd = start + 1 + text.length
    }
    if (type === 'code') {
      const text = selected || 'codigo'
      const insertion = selected.includes('\n') ? `\`\`\`\n${text}\n\`\`\`` : `\`${text}\``
      nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
      nextStart = start
      nextEnd = start + insertion.length
    }
    if (type === 'link') {
      const text = selected || 'texto do link'
      const insertion = `[${text}](https://)`
      nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
      nextStart = start + text.length + 3
      nextEnd = nextStart + 8
    }
    if (type === 'quote') {
      const text = selected || 'citação'
      const lines = text.split('\n').map((line) => `> ${line}`)
      const insertion = lines.join('\n')
      nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
      nextStart = start
      nextEnd = start + insertion.length
    }
    if (type === 'bullet' || type === 'numbered') {
      const text = selected || 'item'
      const lines = text.split('\n')
      const insertion =
        type === 'bullet'
          ? lines.map((line) => `- ${line}`).join('\n')
          : lines.map((line, idx) => `${idx + 1}. ${line}`).join('\n')
      nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`
      nextStart = start
      nextEnd = start + insertion.length
    }

    setDraftDescription(nextValue)
    window.requestAnimationFrame(() => {
      descriptionTextareaRef.current?.focus()
      descriptionTextareaRef.current?.setSelectionRange(nextStart, nextEnd)
    })
  }

  return (
    <section className={cn('min-h-[70vh] pb-16', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href={`/aluno/projetos/${id}`}
          className={cn(
            'inline-flex items-center gap-2 text-sm font-semibold transition-colors',
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para projeto
        </Link>

        <h1 className={cn('mt-6 text-2xl font-black uppercase tracking-tight md:text-3xl', isDark ? 'text-white' : 'text-gray-900')}>
          {`Board - ${nomeProjeto || 'Projeto'}`}
        </h1>

        {!loading ? (
          <div
            className={cn(
              'mt-4 flex flex-col gap-3 rounded-2xl border p-3 md:flex-row md:flex-wrap md:items-center md:gap-4',
              isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
            )}
          >
            <div className="flex items-center gap-2">
              <Filter className={cn('h-4 w-4 shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')} />
              <span className={cn('text-xs font-black uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Filtros
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFilterAssignedToMe((v) => !v)}
              disabled={!currentUserId}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                filterAssignedToMe
                  ? 'border-[#F2C94C] bg-[#F2C94C]/15 text-[#F2C94C]'
                  : isDark
                    ? 'border-white/15 bg-black/30 text-white hover:bg-white/10'
                    : 'border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100',
                !currentUserId && 'cursor-not-allowed opacity-50'
              )}
            >
              <UserCheck className="h-4 w-4" />
              Atribuído a mim
            </button>
            <label className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <span className={cn('text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-600')}>Plataforma</span>
              <select
                value={filterPlataforma}
                onChange={(e) => setFilterPlataforma(e.target.value)}
                className={cn(
                  'min-w-[180px] rounded-xl border px-3 py-2 text-sm',
                  isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                )}
              >
                <option value="">Todas</option>
                {PLATAFORMAS_FIXAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <span className={cn('text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-600')}>Label</span>
              <select
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                className={cn(
                  'min-w-[180px] rounded-xl border px-3 py-2 text-sm',
                  isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                )}
              >
                <option value="">Todas</option>
                {LABELS_FIXAS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            {(filterAssignedToMe || filterPlataforma || filterLabel) && (
              <button
                type="button"
                onClick={() => {
                  setFilterAssignedToMe(false)
                  setFilterPlataforma('')
                  setFilterLabel('')
                }}
                className={cn(
                  'text-sm font-semibold underline-offset-2 hover:underline',
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

        {loading ? (
          <div className="mt-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#F2C94C]" /></div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {porColuna.map((c) => (
              <section
                key={c.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (dragOverColuna !== c.id) setDragOverColuna(c.id)
                  if (dragOverTaskId !== null) setDragOverTaskId(null)
                }}
                onDragLeave={() => {
                  if (dragOverColuna === c.id) setDragOverColuna(null)
                  if (dragOverTaskId !== null) setDragOverTaskId(null)
                }}
                onDrop={() => onDropDestino(c.id)}
                className={cn(
                  'rounded-2xl border p-3 transition-colors',
                  dragOverColuna === c.id &&
                    'border-[#F2C94C] bg-[#F2C94C]/10 ring-2 ring-[#F2C94C]/30',
                  isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className={cn('text-xs font-black uppercase tracking-wide', isDark ? 'text-white' : 'text-gray-900')}>{c.label}</h2>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700')}>{c.items.length}</span>
                </div>
                <div className="space-y-3">
                  {c.items.map((t) => (
                    <div key={t.id} className="space-y-2">
                      {dragOverTaskId === t.id && dragOverPosition === 'before' ? (
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-150 ease-out',
                            isDark ? 'bg-[#F2C94C]/45' : 'bg-[#F2C94C]/70'
                          )}
                        />
                      ) : null}
                      <article
                        draggable
                        onDragStart={() => setDraggingTaskId(t.id)}
                        onDragEnd={() => {
                          setDraggingTaskId(null)
                          setDragOverColuna(null)
                          setDragOverTaskId(null)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
                          setDragOverColuna(c.id)
                          setDragOverTaskId(t.id)
                          setDragOverPosition(pos)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          void onDropDestino(c.id, t.id, dragOverPosition)
                        }}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={cn(
                          'cursor-grab rounded-xl border p-3 transition-all duration-200 ease-out active:cursor-grabbing',
                          draggingTaskId === t.id && 'scale-[0.98] opacity-60 shadow-lg',
                          lastDroppedTaskId === t.id &&
                            (isDark
                              ? 'scale-[1.01] border-[#F2C94C]/70 shadow-[0_0_0_3px_rgba(242,201,76,0.25)]'
                              : 'scale-[1.01] border-[#F2C94C] shadow-[0_0_0_3px_rgba(242,201,76,0.35)]'),
                          isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'
                        )}
                      >
                      <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{t.titulo}</h3>
                      {t.imagem_url ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setImageViewer({ url: t.imagem_url as string, title: t.titulo })
                          }}
                          className="mt-2 block w-full overflow-hidden rounded-lg border border-white/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.imagem_url} alt={t.titulo} className="h-28 w-full object-cover" />
                        </button>
                      ) : null}
                      {(t.labels || []).length > 0 ? (
                        <div className="mt-2">
                          <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
                            Label:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(t.labels || []).map((label) => (
                              <span
                                key={`${t.id}-label-${label}`}
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  isDark ? 'bg-[#F2C94C]/20 text-[#F2C94C]' : 'bg-yellow-100 text-yellow-900'
                                )}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {(t.plataformas || []).length > 0 ? (
                        <div className="mt-2">
                          <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
                            Plataforma:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(t.plataformas || []).map((plataforma) => (
                              <span
                                key={`${t.id}-plataforma-${plataforma}`}
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  getPlataformaClasses(plataforma, isDark)
                                )}
                              >
                                {plataforma}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {(t.assignees || []).length > 0 ? (
                        <div className="mt-3 flex items-center -space-x-2">
                          {(t.assignees || []).slice(0, 5).map((member) =>
                            member.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={`${t.id}-${member.user_id}`}
                                src={member.avatar_url}
                                alt={member.name}
                                title={member.name}
                                className={cn(
                                  'h-7 w-7 rounded-full border-2 object-cover',
                                  isDark ? 'border-[#0f0f0f]' : 'border-gray-50'
                                )}
                              />
                            ) : (
                              <div
                                key={`${t.id}-${member.user_id}`}
                                title={member.name}
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                                  isDark ? 'border-[#0f0f0f] bg-white/15 text-white' : 'border-gray-50 bg-gray-300 text-gray-700'
                                )}
                              >
                                {member.name.slice(0, 1).toUpperCase()}
                              </div>
                            )
                          )}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTaskPendingDelete({ id: t.id, titulo: t.titulo })
                          }}
                          className={cn('ml-auto inline-flex items-center rounded-lg p-1.5', isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      </article>
                      {dragOverTaskId === t.id && dragOverPosition === 'after' ? (
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-150 ease-out',
                            isDark ? 'bg-[#F2C94C]/45' : 'bg-[#F2C94C]/70'
                          )}
                        />
                      ) : null}
                    </div>
                  ))}
                  {c.items.length === 0 ? (
                    <p className={cn('rounded-xl border border-dashed p-3 text-xs', isDark ? 'border-white/15 text-gray-500' : 'border-gray-300 text-gray-500')}>
                      Sem tarefas nesta coluna.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalColuna(c.id)
                    setCreateTitulo('')
                    setCreateDescricao('')
                    setCreateLabels([])
                    setCreatePlataformas([])
                    setCreateAssigneeIds([])
                    setCreateMemberSearch('')
                    setCreateShowMembersMenu(false)
                  }}
                  className={cn(
                    'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-colors',
                    isDark
                      ? 'border-white/15 bg-black/20 text-white hover:bg-white/10'
                      : 'border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar card
                </button>
              </section>
            ))}
          </div>
        )}
      </div>
      <Modal
        isOpen={taskPendingDelete !== null}
        onClose={() => {
          if (!deletingTask) setTaskPendingDelete(null)
        }}
        title="Excluir tarefa"
        size="sm"
      >
        <div className="space-y-4">
          <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Tem certeza que deseja excluir{' '}
            <span className="font-semibold text-[#F2C94C]">{taskPendingDelete?.titulo}</span>? Esta ação não pode ser
            desfeita.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={deletingTask}
              onClick={() => setTaskPendingDelete(null)}
              className={cn(
                'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
                isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-gray-300 text-gray-900 hover:bg-gray-50'
              )}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deletingTask}
              onClick={() => void confirmarExclusaoTarefa()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deletingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={createModalColuna !== null}
        onClose={() => {
          if (!saving) {
            setCreateModalColuna(null)
            setCreateShowMembersMenu(false)
            setCreateMemberSearch('')
          }
        }}
        title={createModalColuna ? `Novo card - ${COLUNAS.find((c) => c.id === createModalColuna)?.label || ''}` : 'Novo card'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Titulo</p>
            <input
              value={createTitulo}
              onChange={(e) => setCreateTitulo(e.target.value)}
              placeholder="Titulo da tarefa"
              className={cn(
                'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
              )}
            />
          </div>
          <div>
            <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Description</p>
            <textarea
              value={createDescricao}
              onChange={(e) => setCreateDescricao(e.target.value)}
              rows={4}
              placeholder="Descricao (opcional)"
              className={cn(
                'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
              )}
            />
          </div>
          <div>
            <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Labels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LABELS_FIXAS.map((label) => {
                const checked = createLabels.includes(label)
                return (
                  <button
                    key={`create-${label}`}
                    type="button"
                    onClick={() => toggleCreateLabel(label)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      checked
                        ? isDark
                          ? 'bg-[#F2C94C] text-black'
                          : 'bg-yellow-400 text-black'
                        : isDark
                          ? 'bg-white/10 text-gray-200'
                          : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Plataformas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATAFORMAS_FIXAS.map((plataforma) => {
                const checked = createPlataformas.includes(plataforma)
                return (
                  <button
                    key={`create-${plataforma}`}
                    type="button"
                    onClick={() => toggleCreatePlataforma(plataforma)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      checked
                        ? getPlataformaSelectedButtonClasses(plataforma, isDark)
                        : isDark
                          ? 'bg-white/10 text-gray-200'
                          : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {plataforma}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(createAssigneeIds || []).length === 0 ? (
              <button
                ref={createMembersButtonRef}
                type="button"
                onClick={() => setCreateShowMembersMenu((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold',
                  isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                )}
              >
                <Users className="h-4 w-4" />
                Members
              </button>
            ) : (
              <div className="flex items-center -space-x-2">
                {participantes
                  .filter((p) => createAssigneeIds.includes(p.user_id))
                  .slice(0, 5)
                  .map((member) =>
                    member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`create-facepile-${member.user_id}`}
                        src={member.avatar_url}
                        alt={member.name}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 object-cover',
                          isDark ? 'border-[#111111]' : 'border-white'
                        )}
                      />
                    ) : (
                      <div
                        key={`create-facepile-${member.user_id}`}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                          isDark ? 'border-[#111111] bg-white/15 text-white' : 'border-white bg-gray-300 text-gray-700'
                        )}
                      >
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                    )
                  )}
                <button
                  ref={createMembersButtonRef}
                  type="button"
                  onClick={() => setCreateShowMembersMenu((v) => !v)}
                  className={cn(
                    'ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-base font-bold',
                    isDark
                      ? 'border-[#111111] bg-white/90 text-black hover:bg-white'
                      : 'border-white bg-gray-100 text-gray-800 hover:bg-gray-200'
                  )}
                  aria-label="Abrir seleção de membros"
                >
                  +
                </button>
              </div>
            )}
            {createAssigneeIds.length > 0 ? (
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {createAssigneeIds.length} membro(s) selecionado(s)
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={criar}
            disabled={saving || !createTitulo.trim() || !createModalColuna}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2C94C] px-4 py-2 text-sm font-bold text-black hover:bg-[#e8bd3d] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar card
          </button>
        </div>
      </Modal>
      {createShowMembersMenu && createMembersPopoverPos
        ? createPortal(
            <div
              className={cn(
                'fixed z-[11000] w-[360px] rounded-xl border shadow-2xl',
                isDark ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-white'
              )}
              style={{ top: createMembersPopoverPos.top, left: createMembersPopoverPos.left }}
            >
              <div className={cn('flex items-center justify-between border-b px-3 py-2', isDark ? 'border-white/10' : 'border-gray-200')}>
                <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Members</p>
                <button
                  type="button"
                  onClick={() => setCreateShowMembersMenu(false)}
                  className={cn(
                    'rounded p-1',
                    isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  )}
                  aria-label="Fechar members"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <input
                  value={createMemberSearch}
                  onChange={(e) => setCreateMemberSearch(e.target.value)}
                  placeholder="Search members"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                  )}
                />
                <p className={cn('mt-3 text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Board members
                </p>
                <div className="mt-2 h-[230px] space-y-1 overflow-y-auto">
                  {createParticipantesFiltrados.map((p) => {
                    const checked = createAssigneeIds.includes(p.user_id)
                    return (
                      <button
                        key={`create-popover-member-${p.user_id}`}
                        type="button"
                        onClick={() => toggleCreateAssignee(p.user_id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                          checked
                            ? isDark
                              ? 'bg-white/10 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDark
                              ? 'text-gray-300 hover:bg-white/5'
                              : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', isDark ? 'bg-white/15 text-white' : 'bg-gray-300 text-gray-700')}>
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="flex-1">{p.name}</span>
                        <input type="checkbox" readOnly checked={checked} />
                      </button>
                    )
                  })}
                  {createParticipantesFiltrados.length === 0 ? (
                    <p className={cn('px-2 py-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                      Nenhum membro encontrado.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => {
          setSelectedTaskId(null)
          setShowLabelsMenu(false)
          setShowPlataformasMenu(false)
          setShowMembersMenu(false)
          setMemberSearch('')
        }}
        title="Card"
        size="md"
      >
        {selectedTask ? (
          <div className="space-y-4">
            <div>
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={salvarTitulo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') salvarTitulo()
                    if (e.key === 'Escape') {
                      setDraftTitle(selectedTask.titulo)
                      setIsEditingTitle(false)
                    }
                  }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-lg font-bold',
                    isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                  )}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className={cn('text-left text-2xl font-black leading-tight', isDark ? 'text-white' : 'text-gray-900')}
                >
                  {selectedTask.titulo}
                </button>
              )}
            </div>

            <div className="relative flex flex-wrap items-center gap-2">
              <button
                ref={labelsButtonRef}
                type="button"
                onClick={() => {
                  setShowLabelsMenu((v) => !v)
                  setShowPlataformasMenu(false)
                  setShowMembersMenu(false)
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold',
                  isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                )}
              >
                <Tag className="h-4 w-4" />
                Labels
              </button>
              <button
                ref={plataformasButtonRef}
                type="button"
                onClick={() => {
                  setShowPlataformasMenu((v) => !v)
                  setShowLabelsMenu(false)
                  setShowMembersMenu(false)
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold',
                  isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                )}
              >
                Plataformas
              </button>
              <div className="ml-1 flex items-center gap-2">
                {(selectedTask.assignees || []).length === 0 ? (
                  <button
                    ref={membersButtonRef}
                    type="button"
                    onClick={() => {
                      setShowMembersMenu((v) => !v)
                      setShowLabelsMenu(false)
                      setShowPlataformasMenu(false)
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold',
                      isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Members
                  </button>
                ) : (
                  <div className="flex items-center -space-x-2">
                    {(selectedTask.assignees || []).slice(0, 5).map((member) =>
                      member.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={member.user_id}
                          src={member.avatar_url}
                          alt={member.name}
                          className={cn(
                            'h-8 w-8 rounded-full border-2 object-cover',
                            isDark ? 'border-[#111111]' : 'border-white'
                          )}
                        />
                      ) : (
                        <div
                          key={member.user_id}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                            isDark ? 'border-[#111111] bg-white/15 text-white' : 'border-white bg-gray-300 text-gray-700'
                          )}
                        >
                          {member.name.slice(0, 1).toUpperCase()}
                        </div>
                      )
                    )}
                    <button
                      ref={membersButtonRef}
                      type="button"
                      onClick={() => {
                        setShowMembersMenu((v) => !v)
                        setShowLabelsMenu(false)
                        setShowPlataformasMenu(false)
                      }}
                      className={cn(
                        'ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-base font-bold',
                        isDark
                          ? 'border-[#111111] bg-white/90 text-black hover:bg-white'
                          : 'border-white bg-gray-100 text-gray-800 hover:bg-gray-200'
                      )}
                      aria-label="Abrir seleção de membros"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Attachments</p>
                <label
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold',
                    isDark ? 'border-white/15 bg-black/30 text-white hover:bg-white/5' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (file) {
                        void adicionarAnexo(file)
                      }
                      e.currentTarget.value = ''
                    }}
                  />
                </label>
              </div>
              <div className="mt-2 space-y-2">
                {selectedTaskAnexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-2',
                      isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setImageViewer({ url: anexo.arquivo_url, title: anexo.nome })}
                      className="flex min-w-0 items-center gap-2 text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={anexo.arquivo_url} alt={anexo.nome} className="h-10 w-14 rounded object-cover" />
                      <span className="min-w-0">
                        <span className={cn('block truncate text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                          {anexo.nome}
                        </span>
                        <span className={cn('block text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          {new Date(anexo.created_at).toLocaleString('pt-BR')}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removerAnexo(anexo.id)}
                      className={cn(
                        'rounded p-1.5',
                        isDark ? 'text-gray-400 hover:bg-white/10 hover:text-red-300' : 'text-gray-500 hover:bg-gray-200 hover:text-red-600'
                      )}
                      aria-label="Remover anexo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {selectedTaskAnexos.length === 0 ? (
                  <p className={cn('rounded-lg border border-dashed px-3 py-2 text-xs', isDark ? 'border-white/15 text-gray-500' : 'border-gray-300 text-gray-500')}>
                    Nenhum anexo adicionado ainda.
                  </p>
                ) : null}
                {uploadingAttachment ? (
                  <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>Enviando anexo...</p>
                ) : null}
              </div>
            </div>

            <div>
              {(selectedTask.labels || []).length > 0 ? (
                <div className="mb-3">
                  <p className={cn('mb-1 text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Label:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTask.labels || []).map((label) => (
                      <span
                        key={`selected-${selectedTask.id}-${label}`}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          isDark ? 'bg-[#F2C94C]/20 text-[#F2C94C]' : 'bg-yellow-100 text-yellow-900'
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {(selectedTask.plataformas || []).length > 0 ? (
                <div className="mb-3">
                  <p className={cn('mb-1 text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Plataforma:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTask.plataformas || []).map((plataforma) => (
                      <span
                        key={`selected-plataforma-${selectedTask.id}-${plataforma}`}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          getPlataformaClasses(plataforma, isDark)
                        )}
                      >
                        {plataforma}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>Description</p>
              {isEditingDescription ? (
                <div className="mt-1 space-y-2">
                  <div
                    className={cn(
                      'flex flex-wrap items-center gap-1 rounded-lg border p-1.5',
                      isDark ? 'border-white/15 bg-black/30' : 'border-gray-300 bg-white'
                    )}
                  >
                    {[
                      { id: 'bold', icon: Bold, label: 'Negrito' },
                      { id: 'italic', icon: Italic, label: 'Itálico' },
                      { id: 'bullet', icon: List, label: 'Lista' },
                      { id: 'numbered', icon: ListOrdered, label: 'Lista numerada' },
                      { id: 'link', icon: Link2, label: 'Link' },
                      { id: 'quote', icon: MessageSquareQuote, label: 'Citação' },
                      { id: 'code', icon: Code, label: 'Código' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          applyDescriptionFormat(
                            id as 'bold' | 'italic' | 'bullet' | 'numbered' | 'link' | 'quote' | 'code'
                          )
                        }
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                          isDark
                            ? 'border-white/15 text-gray-200 hover:bg-white/10'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={descriptionTextareaRef}
                    autoFocus
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    onBlur={salvarDescricao}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault()
                        void salvarDescricao()
                      }
                      if (e.key === 'Escape') {
                        setDraftDescription(selectedTask.descricao || '')
                        setIsEditingDescription(false)
                      }
                    }}
                    rows={6}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm',
                      isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                    )}
                  />
                  <p className={cn('text-[11px]', isDark ? 'text-gray-500' : 'text-gray-500')}>
                    Use a toolbar para formatar. Pressione Ctrl/Cmd + Enter para salvar.
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    'mt-1 w-full rounded-lg border border-dashed px-3 py-2 text-left text-sm',
                    isDark ? 'border-white/15 text-gray-200' : 'border-gray-300 text-gray-800'
                  )}
                >
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(true)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                        isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      )}
                    >
                      Editar descrição
                    </button>
                  </div>
                  {selectedTask.descricao ? (
                    renderDescriptionMarkdown(selectedTask.descricao, isDark)
                  ) : (
                    <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Sem descrição.</p>
                  )}
                </div>
              )}
            </div>
            {savingAssign ? (
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Salvando alteracoes...
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
      {showMembersMenu && membersPopoverPos
        ? createPortal(
            <div
              className={cn(
                'fixed z-[11000] w-[360px] rounded-xl border shadow-2xl',
                isDark ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-white'
              )}
              style={{ top: membersPopoverPos.top, left: membersPopoverPos.left }}
            >
              <div className={cn('flex items-center justify-between border-b px-3 py-2', isDark ? 'border-white/10' : 'border-gray-200')}>
                <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Members</p>
                <button
                  type="button"
                  onClick={() => setShowMembersMenu(false)}
                  className={cn(
                    'rounded p-1',
                    isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  )}
                  aria-label="Fechar members"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-white/15 bg-black/30 text-white' : 'border-gray-300 bg-white text-gray-900'
                  )}
                />
                <p className={cn('mt-3 text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Board members
                </p>
                <div className="mt-2 h-[230px] space-y-1 overflow-y-auto">
                  {participantesFiltrados.map((p) => {
                    const checked = selectedAssigneeIds.includes(p.user_id)
                    return (
                      <button
                        key={p.user_id}
                        type="button"
                        onClick={() => {
                          void toggleAssignee(p.user_id)
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                          checked
                            ? isDark
                              ? 'bg-white/10 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDark
                              ? 'text-gray-300 hover:bg-white/5'
                              : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', isDark ? 'bg-white/15 text-white' : 'bg-gray-300 text-gray-700')}>
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="flex-1">{p.name}</span>
                        <input type="checkbox" readOnly checked={checked} />
                      </button>
                    )
                  })}
                  {participantesFiltrados.length === 0 ? (
                    <p className={cn('px-2 py-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                      Nenhum membro encontrado.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      <Modal
        isOpen={Boolean(imageViewer)}
        onClose={() => setImageViewer(null)}
        title={imageViewer?.title || 'Imagem'}
        size="lg"
      >
        {imageViewer ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageViewer.url} alt={imageViewer.title} className="max-h-[70vh] w-full rounded-lg object-contain" />
        ) : null}
      </Modal>
      {showPlataformasMenu && plataformasPopoverPos
        ? createPortal(
            <div
              className={cn(
                'fixed z-[11000] w-[320px] rounded-xl border shadow-2xl',
                isDark ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-white'
              )}
              style={{ top: plataformasPopoverPos.top, left: plataformasPopoverPos.left }}
            >
              <div className={cn('flex items-center justify-between border-b px-3 py-2', isDark ? 'border-white/10' : 'border-gray-200')}>
                <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Plataformas</p>
                <button
                  type="button"
                  onClick={() => setShowPlataformasMenu(false)}
                  className={cn(
                    'rounded p-1',
                    isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  )}
                  aria-label="Fechar plataformas"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className={cn('text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Selecione as plataformas
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLATAFORMAS_FIXAS.map((plataforma) => {
                    const checked = selectedPlataformas.includes(plataforma)
                    return (
                      <button
                        key={plataforma}
                        type="button"
                        onClick={() => togglePlataforma(plataforma)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          checked
                            ? getPlataformaSelectedButtonClasses(plataforma, isDark)
                            : isDark
                              ? 'bg-white/10 text-gray-200'
                              : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {plataforma}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      {showLabelsMenu && labelsPopoverPos
        ? createPortal(
            <div
              className={cn(
                'fixed z-[11000] w-[320px] rounded-xl border shadow-2xl',
                isDark ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-white'
              )}
              style={{ top: labelsPopoverPos.top, left: labelsPopoverPos.left }}
            >
              <div className={cn('flex items-center justify-between border-b px-3 py-2', isDark ? 'border-white/10' : 'border-gray-200')}>
                <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Labels</p>
                <button
                  type="button"
                  onClick={() => setShowLabelsMenu(false)}
                  className={cn(
                    'rounded p-1',
                    isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  )}
                  aria-label="Fechar labels"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className={cn('text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Selecione as labels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LABELS_FIXAS.map((label) => {
                    const checked = selectedLabels.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleLabel(label)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                          checked
                            ? isDark
                              ? 'bg-[#F2C94C] text-black'
                              : 'bg-yellow-400 text-black'
                            : isDark
                              ? 'bg-white/10 text-gray-200'
                              : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {label}
                        {checked ? <X className="h-3 w-3" /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  )
}
