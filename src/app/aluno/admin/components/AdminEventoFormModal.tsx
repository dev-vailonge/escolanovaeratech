'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  ALUNO_EVENTO_TIPOS,
  ALUNO_EVENTO_TIPO_LABELS,
  type AlunoEventoTipo,
} from '@/data/aluno-eventos'
import type { DatabaseAlunoEvento } from '@/types/database'

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(local: string): string {
  const d = new Date(local)
  return d.toISOString()
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  event?: DatabaseAlunoEvento | null
}

const emptyForm = () => ({
  tipo: 'meetup' as AlunoEventoTipo,
  title: '',
  series_label: '',
  description: '',
  start_local: '',
  end_local: '',
  publicado: true,
})

export default function AdminEventoFormModal({ isOpen, onClose, onSaved, event }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isEdit = !!event
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (event) {
      setForm({
        tipo: event.tipo,
        title: event.title,
        series_label: event.series_label ?? '',
        description: event.description,
        start_local: isoToDatetimeLocal(event.start_at),
        end_local: isoToDatetimeLocal(event.end_at),
        publicado: event.publicado,
      })
    } else {
      setForm({
        ...emptyForm(),
        start_local: isoToDatetimeLocal(new Date().toISOString()),
        end_local: isoToDatetimeLocal(new Date(Date.now() + 3600000).toISOString()),
      })
    }
  }, [isOpen, event])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.start_local || !form.end_local) {
      setError('Preencha início e fim do evento.')
      return
    }
    const start_at = datetimeLocalToIso(form.start_local)
    const end_at = datetimeLocalToIso(form.end_local)
    if (Date.parse(end_at) <= Date.parse(start_at)) {
      setError('O horário de término deve ser depois do início.')
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setError('Sessão expirada. Entre novamente.')
      return
    }

    setSaving(true)
    try {
      if (isEdit && event) {
        const res = await fetch(`/api/admin/eventos/${event.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tipo: form.tipo,
            title: form.title,
            description: form.description,
            series_label: form.series_label.trim() || null,
            start_at,
            end_at,
            publicado: form.publicado,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Erro ao salvar')
      } else {
        const res = await fetch('/api/admin/eventos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tipo: form.tipo,
            title: form.title,
            description: form.description,
            series_label: form.series_label.trim() || null,
            start_at,
            end_at,
            publicado: form.publicado,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Erro ao criar')
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
    isDark
      ? 'border-white/15 bg-white/5 text-white placeholder:text-gray-500 focus:border-yellow-400/60'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-yellow-500'
  )

  const labelCls = cn('mb-1 block text-xs font-semibold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar evento' : 'Novo evento'}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <div
            className={cn(
              'rounded-lg border p-3 text-sm',
              isDark ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-800'
            )}
          >
            {error}
          </div>
        ) : null}

        <div>
          <label className={labelCls} htmlFor="ev-tipo">
            Tipo
          </label>
          <select
            id="ev-tipo"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as AlunoEventoTipo }))}
            className={inputCls}
          >
            {ALUNO_EVENTO_TIPOS.map((t) => (
              <option key={t} value={t}>
                {ALUNO_EVENTO_TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="ev-title">
            Título
          </label>
          <input
            id="ev-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputCls}
            placeholder="Ex.: Office hours Android"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="ev-series">
            Tema / trilha (opcional)
          </label>
          <input
            id="ev-series"
            type="text"
            value={form.series_label}
            onChange={(e) => setForm((f) => ({ ...f, series_label: e.target.value }))}
            className={inputCls}
            placeholder="Ex.: Formação Android"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="ev-start">
              Início
            </label>
            <input
              id="ev-start"
              type="datetime-local"
              required
              value={form.start_local}
              onChange={(e) => setForm((f) => ({ ...f, start_local: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ev-end">
              Término
            </label>
            <input
              id="ev-end"
              type="datetime-local"
              required
              value={form.end_local}
              onChange={(e) => setForm((f) => ({ ...f, end_local: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="ev-desc">
            Descrição
          </label>
          <textarea
            id="ev-desc"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={cn(inputCls, 'resize-y min-h-[100px]')}
            placeholder="Texto exibido no card do aluno"
          />
        </div>

        <label className={cn('flex cursor-pointer items-center gap-2 text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
          <input
            type="checkbox"
            checked={form.publicado}
            onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-400 text-yellow-600 focus:ring-yellow-500"
          />
          Publicado (visível para alunos)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
              isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-yellow-500 text-white hover:bg-yellow-600'
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
