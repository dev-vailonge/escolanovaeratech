'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import CreateNotificacaoModal from './CreateNotificacaoModal'
import { getAllNotificacoes, createNotificacao, updateNotificacao, deleteNotificacao } from '@/lib/database'
import type { DatabaseNotificacao } from '@/types/database'

export default function AdminNotificacoesTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<DatabaseNotificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNotificacao, setEditingNotificacao] = useState<DatabaseNotificacao | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    carregarNotificacoes()
  }, [])

  const carregarNotificacoes = async () => {
    try {
      setLoading(true)
      setError('')
      const dados = await getAllNotificacoes()
      setNotificacoes(dados)
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
      setError('Erro ao carregar notificações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (notificacaoData: any) => {
    try {
      setError('')
      
      // Preparar dados no formato do banco
      // Converter datas para ISO string se necessário
      const dataInicioISO = notificacaoData.dataInicio 
        ? new Date(notificacaoData.dataInicio).toISOString() 
        : new Date().toISOString()
      const dataFimISO = notificacaoData.dataFim 
        ? new Date(notificacaoData.dataFim + 'T23:59:59').toISOString() 
        : new Date().toISOString()

      const dadosNotificacao: Omit<DatabaseNotificacao, 'id' | 'created_at' | 'updated_at'> = {
        titulo: notificacaoData.titulo,
        mensagem: notificacaoData.mensagem,
        tipo: notificacaoData.tipo as 'info' | 'update' | 'warning',
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        publico_alvo: notificacaoData.publicoAlvo as 'todos' | 'alunos-full' | 'alunos-limited',
        created_by: user?.id || null
      }

      console.log('Dados da notificação a serem salvos:', dadosNotificacao)

      if (editingNotificacao) {
        // Atualizar notificação existente
        const sucesso = await updateNotificacao(editingNotificacao.id, dadosNotificacao)
        if (sucesso) {
          await carregarNotificacoes()
          setIsCreating(false)
          setEditingNotificacao(null)
        } else {
          setError('Erro ao atualizar notificação. Tente novamente.')
        }
      } else {
        // Criar nova notificação
        const novaNotificacao = await createNotificacao(dadosNotificacao)
        if (novaNotificacao) {
          await carregarNotificacoes()
          setIsCreating(false)
        } else {
          setError('Erro ao criar notificação. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar notificação:', err)
      setError('Erro ao salvar notificação. Tente novamente.')
    }
  }

  const handleDelete = async (notificacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteNotificacao(notificacaoId)
      if (sucesso) {
        await carregarNotificacoes()
      } else {
        setError('Erro ao excluir notificação. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err)
      setError('Erro ao excluir notificação. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        theme === 'dark' ? "text-gray-400" : "text-gray-600"
      )}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando notificações...</span>
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
            Gerenciar Notificações
          </h2>
          <p className={cn(
            "text-xs md:text-sm mt-1",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {notificacoes.length} notificação{notificacoes.length !== 1 ? 'ões' : ''} cadastrada{notificacoes.length !== 1 ? 's' : ''}
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
          Criar Notificação
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

      {/* Modal Criar/Editar Notificação */}
      <CreateNotificacaoModal
        isOpen={isCreating || !!editingNotificacao}
        onClose={() => {
          setIsCreating(false)
          setEditingNotificacao(null)
          setError('')
        }}
        onSave={handleSave}
        notificacao={editingNotificacao ? {
          ...editingNotificacao,
          dataInicio: editingNotificacao.data_inicio,
          dataFim: editingNotificacao.data_fim,
          publicoAlvo: editingNotificacao.publico_alvo
        } : undefined}
      />

      {notificacoes.length === 0 ? (
        <div className={cn(
          "p-8 text-center rounded-lg border",
          theme === 'dark'
            ? "bg-black/20 border-white/10 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          Nenhuma notificação cadastrada ainda. Clique em "Criar Notificação" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notificacao) => (
            <div
              key={notificacao.id}
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
                      {notificacao.titulo}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border capitalize",
                      notificacao.tipo === 'info' && (
                        theme === 'dark'
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-blue-100 text-blue-700 border-blue-300"
                      ),
                      notificacao.tipo === 'update' && (
                        theme === 'dark'
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-green-100 text-green-700 border-green-300"
                      ),
                      notificacao.tipo === 'warning' && (
                        theme === 'dark'
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      )
                    )}>
                      {notificacao.tipo}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm mb-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {notificacao.mensagem}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                      {new Date(notificacao.data_inicio).toLocaleDateString('pt-BR')} - {new Date(notificacao.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={cn(
                      "capitalize",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      {notificacao.publico_alvo.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingNotificacao(notificacao)}
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
                    onClick={() => handleDelete(notificacao.id)}
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
