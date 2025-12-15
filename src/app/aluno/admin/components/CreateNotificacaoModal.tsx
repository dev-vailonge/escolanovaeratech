'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import DatePicker from '@/components/ui/DatePicker'
import { Loader2 } from 'lucide-react'

interface CreateNotificacaoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (notificacao: any) => void
  notificacao?: any // Para edição
}

const getDefaultFormData = () => ({
  titulo: '',
  mensagem: '',
  tipo: 'info',
  dataInicio: new Date().toISOString().split('T')[0],
  dataFim: '',
  publicoAlvo: 'todos',
})

export default function CreateNotificacaoModal({ isOpen, onClose, onSave, notificacao }: CreateNotificacaoModalProps) {
  const { theme } = useTheme()
  const isEditing = !!notificacao
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState(getDefaultFormData())

  // Atualiza formData quando a notificação muda ou o modal abre
  useEffect(() => {
    if (isOpen) {
      if (notificacao) {
        // Converter datas ISO para formato de input date
        const dataInicio = notificacao.dataInicio 
          ? (notificacao.dataInicio.includes('T') 
              ? notificacao.dataInicio.split('T')[0] 
              : notificacao.dataInicio)
          : new Date().toISOString().split('T')[0]
        
        const dataFim = notificacao.dataFim 
          ? (notificacao.dataFim.includes('T') 
              ? notificacao.dataFim.split('T')[0] 
              : notificacao.dataFim)
          : ''

        setFormData({
          titulo: notificacao.titulo || '',
          mensagem: notificacao.mensagem || '',
          tipo: notificacao.tipo || 'info',
          dataInicio,
          dataFim,
          publicoAlvo: notificacao.publicoAlvo || 'todos',
        })
      } else {
        // Reset para valores default ao criar novo
        setFormData(getDefaultFormData())
      }
    }
  }, [isOpen, notificacao])

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar datas
    if (!formData.dataInicio) {
      setError('Por favor, selecione a data de início.')
      return
    }
    if (!formData.dataFim) {
      setError('Por favor, selecione a data de fim.')
      return
    }
    if (formData.dataFim < formData.dataInicio) {
      setError('A data de fim deve ser posterior à data de início.')
      return
    }
    
    setError('')
    setIsLoading(true)
    try {
      await onSave(formData)
      // Não fecha aqui - deixa a aba controlar após sucesso
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData(getDefaultFormData())
      setError('')
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Notificação' : 'Criar Nova Notificação'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mensagem de Erro */}
        {error && (
          <div className={cn(
            "p-3 rounded-lg border text-sm",
            theme === 'dark'
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            {error}
          </div>
        )}

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
          <DatePicker
            label="Data de Início"
            value={formData.dataInicio}
            onChange={(date) => setFormData({ ...formData, dataInicio: date })}
            required
            placeholder="Selecione a data"
          />

          <DatePicker
            label="Data de Fim"
            value={formData.dataFim}
            onChange={(date) => setFormData({ ...formData, dataFim: date })}
            required
            minDate={formData.dataInicio}
            placeholder="Selecione a data"
          />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
        }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? "bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            )}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
              theme === 'dark'
                ? "bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
                : "bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
            )}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Notificação'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

