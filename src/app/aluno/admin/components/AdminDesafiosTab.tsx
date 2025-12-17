'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Sparkles, Loader2, Filter } from 'lucide-react'
import CreateDesafioModal from './CreateDesafioModal'
import { getAllDesafios, createDesafio, updateDesafio, deleteDesafio } from '@/lib/database'
import type { DatabaseDesafio } from '@/types/database'
import { getCursoNome, CURSOS_COM_GERAL, type CursoId } from '@/lib/constants/cursos'

export default function AdminDesafiosTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [desafios, setDesafios] = useState<DatabaseDesafio[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingDesafio, setEditingDesafio] = useState<DatabaseDesafio | null>(null)
  const [error, setError] = useState('')
  const [filtroCurso, setFiltroCurso] = useState<CursoId | 'todos'>('todos')

  useEffect(() => {
    carregarDesafios()
  }, [])

  const carregarDesafios = async () => {
    try {
      setLoading(true)
      setError('')
      const dados = await getAllDesafios()
      setDesafios(dados)
    } catch (err) {
      console.error('Erro ao carregar desafios:', err)
      setError('Erro ao carregar desafios. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (desafioData: any) => {
    try {
      setError('')
      
      // Preparar dados no formato do banco
      const dadosDesafio: Omit<DatabaseDesafio, 'id' | 'created_at' | 'updated_at'> = {
        titulo: desafioData.titulo,
        descricao: desafioData.descricao,
        tecnologia: desafioData.tecnologia,
        dificuldade: desafioData.dificuldade as 'iniciante' | 'intermediario' | 'avancado',
        xp: desafioData.xp,
        periodicidade: desafioData.periodicidade as 'semanal' | 'mensal' | 'especial',
        prazo: null, // Pode ser adicionado depois se necessário
        requisitos: Array.isArray(desafioData.requisitos) ? desafioData.requisitos : [],
        curso_id: desafioData.curso_id || null,
        created_by: user?.id || null
      }

      console.log('Dados do desafio a serem salvos:', dadosDesafio)

      if (editingDesafio) {
        // Atualizar desafio existente
        const sucesso = await updateDesafio(editingDesafio.id, dadosDesafio)
        if (sucesso) {
          await carregarDesafios()
          setIsCreating(false)
          setEditingDesafio(null)
        } else {
          setError('Erro ao atualizar desafio. Tente novamente.')
        }
      } else {
        // Criar novo desafio
        const novoDesafio = await createDesafio(dadosDesafio)
        if (novoDesafio) {
          await carregarDesafios()
          setIsCreating(false)
        } else {
          setError('Erro ao criar desafio. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar desafio:', err)
      setError('Erro ao salvar desafio. Tente novamente.')
    }
  }

  const handleDelete = async (desafioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteDesafio(desafioId)
      if (sucesso) {
        await carregarDesafios()
      } else {
        setError('Erro ao excluir desafio. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao excluir desafio:', err)
      setError('Erro ao excluir desafio. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        theme === 'dark' ? "text-gray-400" : "text-gray-600"
      )}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando desafios...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Gerenciar Desafios
          </h2>
          <p className={cn(
            "text-xs md:text-sm mt-1",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {desafios.length} desafio{desafios.length !== 1 ? 's' : ''} cadastrado{desafios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
            theme === 'dark'
              ? "bg-yellow-400 text-black hover:bg-yellow-300"
              : "bg-yellow-500 text-white hover:bg-yellow-600"
          )}
        >
          <Plus className="w-4 h-4" />
          Criar Desafio
        </button>
      </div>

      {error && (
        <div className={cn(
          "p-3 rounded-lg border",
          theme === 'dark'
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-700"
        )}>
          {error}
        </div>
      )}

      {/* Modal Criar/Editar Desafio */}
      <CreateDesafioModal
        isOpen={isCreating || !!editingDesafio}
        onClose={() => {
          setIsCreating(false)
          setEditingDesafio(null)
          setError('')
        }}
        onSave={handleSave}
        desafio={editingDesafio}
      />

      {/* Filtro por Curso */}
      {desafios.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className={cn(
            "w-4 h-4",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )} />
          <select
            value={filtroCurso || 'todos'}
            onChange={(e) => setFiltroCurso(e.target.value as CursoId | 'todos')}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
          >
            <option value="todos">Todos os cursos</option>
            {CURSOS_COM_GERAL.map((curso) => (
              <option key={curso.id || 'geral'} value={curso.id || 'geral'}>
                {curso.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {desafios.length === 0 ? (
        <div className={cn(
          "p-8 text-center rounded-lg border",
          theme === 'dark'
            ? "bg-black/20 border-white/10 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          Nenhum desafio cadastrado ainda. Clique em "Criar Desafio" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {desafios
            .filter((desafio) => {
              if (filtroCurso === 'todos') return true
              if (filtroCurso === null) return !desafio.curso_id
              return desafio.curso_id === filtroCurso
            })
            .map((desafio) => (
            <div
              key={desafio.id}
              className={cn(
                "p-4 rounded-lg border transition-colors",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                  : "bg-gray-50 border-gray-200 hover:border-yellow-400"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className={cn(
                      "font-semibold text-base",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {desafio.titulo}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border capitalize",
                      theme === 'dark'
                        ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    )}>
                      {desafio.dificuldade}
                    </span>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border capitalize",
                      theme === 'dark'
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-purple-100 text-purple-700 border-purple-300"
                    )}>
                      {desafio.periodicidade}
                    </span>
                    {desafio.curso_id && (
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border",
                        theme === 'dark'
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-blue-100 text-blue-700 border-blue-300"
                      )}>
                        {getCursoNome(desafio.curso_id as CursoId)}
                      </span>
                    )}
                    {!desafio.curso_id && (
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border",
                        theme === 'dark'
                          ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      )}>
                        Geral
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm mb-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {desafio.descricao}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                      {desafio.tecnologia}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    )}>
                      +{desafio.xp} XP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingDesafio(desafio)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      theme === 'dark'
                        ? "hover:bg-white/10 text-gray-400 hover:text-white"
                        : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                    )}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(desafio.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      theme === 'dark'
                        ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        : "hover:bg-red-100 text-gray-600 hover:text-red-600"
                    )}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {desafios.filter((desafio) => {
            if (filtroCurso === 'todos') return false
            if (filtroCurso === null) return !!desafio.curso_id
            return desafio.curso_id !== filtroCurso
          }).length === desafios.length && (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              Nenhum desafio encontrado para o filtro selecionado.
            </div>
          )}
        </div>
      )}

      <div className={cn(
        "p-4 rounded-lg border border-dashed",
        theme === 'dark'
          ? "border-white/20 bg-black/10"
          : "border-gray-300 bg-gray-50"
      )}>
        <button
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}
          disabled
        >
          <Sparkles className="w-4 h-4" />
          <span>Gerar Desafio com IA (Em breve)</span>
        </button>
      </div>
    </div>
  )
}
