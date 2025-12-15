'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Eye, Loader2 } from 'lucide-react'
import CreateFormularioModal from './CreateFormularioModal'
import { getAllFormularios, createFormulario, updateFormulario, deleteFormulario, toggleFormularioAtivo, getRespostasFormulario } from '@/lib/database'
import type { DatabaseFormulario } from '@/types/database'

export default function AdminFormulariosTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [formularios, setFormularios] = useState<DatabaseFormulario[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingFormulario, setEditingFormulario] = useState<DatabaseFormulario | null>(null)
  const [error, setError] = useState('')
  const [respostasCount, setRespostasCount] = useState<Record<string, number>>({})

  useEffect(() => {
    carregarFormularios()
  }, [])

  const carregarFormularios = async () => {
    try {
      setLoading(true)
      setError('')
      const dados = await getAllFormularios()
      setFormularios(dados)

      // Carregar contagem de respostas para cada formulário EM PARALELO (muito mais rápido)
      if (dados.length > 0) {
        const respostasPromises = dados.map(async (formulario) => {
          const respostas = await getRespostasFormulario(formulario.id)
          return { id: formulario.id, count: respostas.length }
        })
        
        const resultados = await Promise.all(respostasPromises)
        const counts: Record<string, number> = {}
        resultados.forEach(({ id, count }) => {
          counts[id] = count
        })
        setRespostasCount(counts)
      }
    } catch (err) {
      console.error('Erro ao carregar formulários:', err)
      setError('Erro ao carregar formulários. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formularioData: any) => {
    try {
      setError('')
      
      // Preparar dados no formato do banco
      const dadosFormulario: Omit<DatabaseFormulario, 'id' | 'created_at' | 'updated_at'> = {
        nome: formularioData.nome,
        tipo: formularioData.tipo,
        ativo: formularioData.ativo !== undefined ? formularioData.ativo : true,
        created_by: user?.id || null
      }

      console.log('Dados do formulário a serem salvos:', dadosFormulario)

      if (editingFormulario) {
        // Atualizar formulário existente
        const sucesso = await updateFormulario(editingFormulario.id, dadosFormulario)
        if (sucesso) {
          await carregarFormularios()
          setIsCreating(false)
          setEditingFormulario(null)
        } else {
          setError('Erro ao atualizar formulário. Tente novamente.')
        }
      } else {
        // Criar novo formulário
        const novoFormulario = await createFormulario(dadosFormulario, user?.id)
        if (novoFormulario) {
          await carregarFormularios()
          setIsCreating(false)
        } else {
          setError('Erro ao criar formulário. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar formulário:', err)
      setError('Erro ao salvar formulário. Tente novamente.')
    }
  }

  const handleDelete = async (formularioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário? Todas as respostas também serão excluídas. Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteFormulario(formularioId)
      if (sucesso) {
        await carregarFormularios()
      } else {
        setError('Erro ao excluir formulário. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao excluir formulário:', err)
      setError('Erro ao excluir formulário. Tente novamente.')
    }
  }

  const handleToggleAtivo = async (formularioId: string, ativo: boolean) => {
    try {
      setError('')
      const sucesso = await toggleFormularioAtivo(formularioId, !ativo)
      if (sucesso) {
        await carregarFormularios()
      } else {
        setError('Erro ao atualizar status do formulário. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setError('Erro ao atualizar status do formulário. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        theme === 'dark' ? "text-gray-400" : "text-gray-600"
      )}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando formulários...</span>
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
            Gerenciar Formulários
          </h2>
          <p className={cn(
            "text-xs md:text-sm mt-1",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {formularios.length} formulário{formularios.length !== 1 ? 's' : ''} cadastrado{formularios.length !== 1 ? 's' : ''}
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
          Criar Formulário
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

      {/* Modal Criar/Editar Formulário */}
      <CreateFormularioModal
        isOpen={isCreating || !!editingFormulario}
        onClose={() => {
          setIsCreating(false)
          setEditingFormulario(null)
          setError('')
        }}
        onSave={handleSave}
        formulario={editingFormulario}
      />

      {formularios.length === 0 ? (
        <div className={cn(
          "p-8 text-center rounded-lg border",
          theme === 'dark'
            ? "bg-black/20 border-white/10 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          Nenhum formulário cadastrado ainda. Clique em "Criar Formulário" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {formularios.map((formulario) => (
            <div
              key={formulario.id}
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
                      {formulario.nome}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border capitalize",
                      theme === 'dark'
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-purple-100 text-purple-700 border-purple-300"
                    )}>
                      {formulario.tipo}
                    </span>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border",
                      formulario.ativo
                        ? theme === 'dark'
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-green-100 text-green-700 border-green-300"
                        : theme === 'dark'
                          ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          : "bg-gray-100 text-gray-600 border-gray-300"
                    )}>
                      {formulario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                      {respostasCount[formulario.id] || 0} resposta{(respostasCount[formulario.id] || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleAtivo(formulario.id, formulario.ativo)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      theme === 'dark'
                        ? "hover:bg-white/10 text-gray-400 hover:text-white"
                        : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                    )}
                    title={formulario.ativo ? "Desativar" : "Ativar"}
                  >
                    {formulario.ativo ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      theme === 'dark'
                        ? "hover:bg-white/10 text-gray-400 hover:text-white"
                        : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                    )}
                    title="Ver Respostas"
                    onClick={() => {
                      // TODO: Implementar visualização de respostas
                      alert(`Este formulário tem ${respostasCount[formulario.id] || 0} resposta(s). A visualização detalhada será implementada em breve.`)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingFormulario(formulario)}
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
                    onClick={() => handleDelete(formulario.id)}
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
        </div>
      )}
    </div>
  )
}
