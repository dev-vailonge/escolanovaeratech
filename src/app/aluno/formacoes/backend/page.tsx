'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Loader2, ArrowRight, Trophy } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import type { DatabaseCurso, DatabaseCursoDesafio } from '@/types/database'
import IniciarDesafioPlanoModal from '@/components/aluno/IniciarDesafioPlanoModal'
import { HOTMART_CURSOS } from '@/lib/constants/hotmart'
import { useFormacaoDesafioAccessGate } from '@/lib/hooks/useFormacaoDesafioAccessGate'
import { FormacaoGateAdminTestToggle } from '@/components/aluno/FormacaoGateAdminTestToggle'

export default function FormacaoBackendPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [curso, setCurso] = useState<DatabaseCurso | null>(null)
  const [modulos, setModulos] = useState<DatabaseCursoDesafio[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [moduloSelecionado, setModuloSelecionado] = useState<DatabaseCursoDesafio | null>(null)

  const { gate, validarModal } = useFormacaoDesafioAccessGate({
    hotmartSubdomain: HOTMART_CURSOS.backend.subdomain,
  })

  const loginHref = '/?redirect=' + encodeURIComponent('/aluno/formacoes/backend')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: cursoRow, error: cursoErr } = await supabase
          .from('cursos')
          .select('*')
          .eq('slug', 'backend')
          .maybeSingle()

        if (cursoErr || !cursoRow) {
          throw new Error('Formação Backend não encontrada.')
        }

        const { data: modulosRows, error: modErr } = await supabase
          .from('cursos_desafios')
          .select('*')
          .eq('curso_id', cursoRow.id)
          .order('ordem', { ascending: true })

        if (modErr) {
          throw new Error('Não foi possível carregar os desafios da formação.')
        }

        if (!cancelled) {
          setCurso(cursoRow as DatabaseCurso)
          setModulos((modulosRows ?? []) as DatabaseCursoDesafio[])
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar formação.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalXp = useMemo(() => modulos.reduce((acc, m) => acc + (m.xp || 0), 0), [modulos])

  return (
    <section className={cn('min-h-[60vh]', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-8">
        <div
          className={cn(
            'rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 max-w-3xl">
              <h1 className={cn('text-3xl md:text-4xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                Formação <span className="text-[#F2C94C]">Backend JS</span>
              </h1>
              <p className={cn('text-sm md:text-base leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-600')}>
                Jornada guiada e desafios práticos: da primeira linha de código a aplicações com arquitetura e testes.
              </p>
            </div>
            <div className={cn('rounded-2xl border px-4 py-3', isDark ? 'border-[#F2C94C]/40 bg-[#F2C94C]/10' : 'border-yellow-300 bg-yellow-50')}>
              <p className={cn('text-xs font-bold uppercase tracking-wide', isDark ? 'text-[#F2C94C]' : 'text-yellow-800')}>XP da trilha</p>
              <p className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>
                +{totalXp.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'rounded-3xl border p-5 md:p-6',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="mb-5">
            <h2 className={cn('text-xl md:text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
              Desafios da formação
            </h2>
            <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {curso?.nome ?? 'Backend JS'} • {modulos.length} desafios
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={cn('w-6 h-6 animate-spin', isDark ? 'text-[#F2C94C]' : 'text-yellow-600')} />
            </div>
          ) : error ? (
            <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700')}>
              {error}
            </div>
          ) : modulos.length === 0 ? (
            <div className={cn('rounded-xl border p-6 text-center', isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600')}>
              Nenhum desafio cadastrado para esta formação.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {modulos.map((m) => (
                <article
                  key={m.id}
                  className={cn(
                    'rounded-2xl border p-4 flex flex-col gap-3',
                    isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-xs font-bold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      Desafio {String(m.ordem).padStart(2, '0')}
                    </span>
                    <span className={cn('text-xs font-bold rounded-full px-2 py-1', isDark ? 'bg-[#F2C94C]/15 text-[#F2C94C]' : 'bg-yellow-100 text-yellow-800')}>
                      +{m.xp} XP
                    </span>
                  </div>
                  <h3 className={cn('text-lg font-bold leading-snug', isDark ? 'text-white' : 'text-gray-900')}>{m.titulo}</h3>
                  <p className={cn('text-sm leading-relaxed line-clamp-3', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    {m.resumo || m.objetivo}
                  </p>
                  <div className="mt-auto pt-2">
                    {user ? (
                      <button
                        type="button"
                        onClick={() => gate(() => {
                          setModuloSelecionado(m)
                          setModalOpen(true)
                        })}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#F2C94C] bg-[#F2C94C] py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#f5d35c]"
                      >
                        Iniciar desafio
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <Link
                        href={loginHref}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#F2C94C] bg-[#F2C94C] py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#f5d35c]"
                      >
                        Entrar para iniciar
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'rounded-2xl border p-4 flex items-center gap-3',
            isDark ? 'border-white/10 bg-black/30 text-gray-300' : 'border-gray-200 bg-white text-gray-700'
          )}
        >
          <Trophy className="w-5 h-5 text-[#F2C94C]" />
          <p className="text-sm">
            Ao concluir os desafios, você avança no ranking com XP real da trilha.
          </p>
        </div>

        <FormacaoGateAdminTestToggle isDark={isDark} />

        {validarModal}
        <IniciarDesafioPlanoModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setModuloSelecionado(null)
          }}
          moduloSlug={moduloSelecionado?.slug ?? ''}
          cursoSlug="backend"
          isDark={isDark}
          desafioLabel={moduloSelecionado?.titulo}
        />
      </div>
    </section>
  )
}
