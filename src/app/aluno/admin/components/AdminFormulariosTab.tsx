'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Eye, Loader2 } from 'lucide-react'
import CreateFormularioModal from './CreateFormularioModal'
import ViewRespostasModal from './ViewRespostasModal'
import { getAllFormularios, createFormulario, updateFormulario, deleteFormulario, toggleFormularioAtivo, getRespostasFormulario, createNotificacao } from '@/lib/database'
import type { DatabaseFormulario } from '@/types/database'
import Pagination from '@/components/ui/Pagination'
import SafeLoading from '@/components/ui/SafeLoading'

export default function AdminFormulariosTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [formularios, setFormularios] = useState<DatabaseFormulario[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingFormulario, setEditingFormulario] = useState<DatabaseFormulario | null>(null)
  const [viewingRespostas, setViewingRespostas] = useState<DatabaseFormulario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [respostasCount, setRespostasCount] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    carregarFormularios()
  }, [])

  // Paginação - calcular formulários paginados
  const formulariosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return formularios.slice(startIndex, endIndex)
  }, [formularios, currentPage, itemsPerPage])

  const carregarFormularios = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Carregando formulários...')
      
      // Usar Promise.race com timeout para getAllFormularios
      const timeoutPromise = new Promise<DatabaseFormulario[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar formulários')), 10000)
      })
      
      const dataPromise = getAllFormularios()
      const dados = await Promise.race([dataPromise, timeoutPromise])
      
      console.log(`📊 Formulários carregados: ${dados.length}`)
      console.log('📋 Dados:', dados)
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
    } catch (err: any) {
      console.error('Erro ao carregar formulários:', err)
      setError(err.message || 'Erro ao carregar formulários. Tente novamente.')
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
        perguntas: formularioData.perguntas && Array.isArray(formularioData.perguntas) && formularioData.perguntas.length > 0 
          ? formularioData.perguntas 
          : undefined,
        created_by: user?.id || null
      }

      console.log('📋 Dados do formulário a serem salvos:', dadosFormulario)

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
        console.log('🔄 Criando novo formulário...')
        const novoFormulario = await createFormulario(dadosFormulario, user?.id)
        if (novoFormulario) {
          console.log('✅ Formulário criado com sucesso:', novoFormulario.id)
          
          // Criar notificação para todos os alunos sobre o novo formulário
          if (novoFormulario.ativo) {
            try {
              const agora = new Date()
              const dataFim = new Date()
              dataFim.setMonth(dataFim.getMonth() + 1) // Notificação válida por 1 mês
              
              const notificacao = await createNotificacao({
                titulo: 'Novo Formulário Disponível',
                mensagem: `Um novo formulário "${novoFormulario.nome}" está disponível para você responder.`,
                tipo: 'info',
                data_inicio: agora.toISOString(),
                data_fim: dataFim.toISOString(),
                publico_alvo: 'todos',
                action_url: `/aluno/formularios/${novoFormulario.id}`,
                created_by: user?.id || null
              })
              
              if (notificacao) {
                console.log('✅ Notificação criada com sucesso:', notificacao.id)
              } else {
                console.warn('⚠️ Formulário criado, mas falha ao criar notificação')
              }
            } catch (notifError) {
              console.error('❌ Erro ao criar notificação:', notifError)
              // Não falhar o processo se a notificação falhar
            }
          }
          
          // Fechar modal primeiro
          setIsCreating(false)
          // Aguardar um pouco para garantir que o banco processou
          await new Promise(resolve => setTimeout(resolve, 300))
          // Recarregar formulários
          await carregarFormularios()
        } else {
          console.error('❌ Falha ao criar formulário - createFormulario retornou null')
          setError('Erro ao criar formulário. Verifique o console para mais detalhes.')
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao salvar formulário:', err)
      setError(`Erro ao salvar formulário: ${err?.message || 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (formularioId: string) => {
    // Buscar informações do formulário antes de deletar
    const formulario = formularios.find(f => f.id === formularioId)
    const nomeFormulario = formulario?.nome || 'este formulário'
    const numeroRespostas = respostasCount[formularioId] || 0
    
    let mensagem = `Tem certeza que deseja excluir "${nomeFormulario}"?\n\n` +
      `⚠️ ATENÇÃO:\n` +
      `- Todas as ${numeroRespostas} resposta(s) serão excluídas\n` +
      `- ${numeroRespostas > 0 ? `Os ${numeroRespostas} usuário(s) que responderam perderão 1 XP cada\n` : ''}`+
      `- As notificações relacionadas serão excluídas\n` +
      `- Esta ação não pode ser desfeita`
    
    if (!confirm(mensagem)) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteFormulario(formularioId)
      if (sucesso) {
        await carregarFormularios()
        console.log(`✅ Formulário "${nomeFormulario}" excluído. ${numeroRespostas} usuário(s) tiveram XP revertido.`)
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

  if (loading || error) {
    return (
      <SafeLoading
        loading={loading}
        error={error}
        onRetry={carregarFormularios}
        loadingMessage="Carregando formulários..."
        errorMessage="Não foi possível carregar os formulários. Tente novamente."
      />
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

      {/* Modal Visualizar Respostas */}
      <ViewRespostasModal
        isOpen={!!viewingRespostas}
        onClose={() => setViewingRespostas(null)}
        formularioId={viewingRespostas?.id || ''}
        formularioNome={viewingRespostas?.nome || ''}
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
        <>
          <div className="space-y-3">
            {formulariosPaginados.map((formulario) => (
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
                    onClick={() => setViewingRespostas(formulario)}
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
        
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(formularios.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={formularios.length}
        />
      </>
      )}
    </div>
  )
}
