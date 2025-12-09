'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface CreateNotificacaoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (notificacao: any) => void
  notificacao?: any // Para edição
}

export default function CreateNotificacaoModal({ isOpen, onClose, onSave, notificacao }: CreateNotificacaoModalProps) {
  const { theme } = useTheme()
  const isEditing = !!notificacao

  const [formData, setFormData] = useState({
    titulo: notificacao?.titulo || '',
    mensagem: notificacao?.mensagem || '',
    tipo: notificacao?.tipo || 'info',
    dataInicio: notificacao?.dataInicio || new Date().toISOString().split('T')[0],
    dataFim: notificacao?.dataFim || '',
    publicoAlvo: notificacao?.publicoAlvo || 'todos',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
    // Não fecha aqui - deixa a aba controlar após sucesso
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Notificação' : 'Criar Nova Notificação'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Título *
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className={cn(
              "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
            required
          />
        </div>

        {/* Mensagem */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Mensagem *
          </label>
          <textarea
            value={formData.mensagem}
            onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
            rows={4}
            className={cn(
              "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
            required
          />
        </div>

        {/* Tipo e Público-alvo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="info">Informação</option>
              <option value="update">Atualização</option>
              <option value="warning">Aviso</option>
            </select>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Público-alvo *
            </label>
            <select
              value={formData.publicoAlvo}
              onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="todos">Todos</option>
              <option value="alunos-full">Alunos Ilimitados</option>
              <option value="alunos-limited">Alunos Limitados</option>
            </select>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Data de Início *
            </label>
            <input
              type="date"
              value={formData.dataInicio}
              onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            />
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Data de Fim *
            </label>
            <input
              type="date"
              value={formData.dataFim}
              onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
        }}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? "bg-white/10 text-gray-300 hover:bg-white/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            )}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Notificação'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

