'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface CreateFormularioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formulario: any) => void
  formulario?: any // Para edição
}

export default function CreateFormularioModal({ isOpen, onClose, onSave, formulario }: CreateFormularioModalProps) {
  const { theme } = useTheme()
  const isEditing = !!formulario

  const [formData, setFormData] = useState({
    nome: formulario?.nome || '',
    tipo: formulario?.tipo || 'feedback',
    ativo: formulario?.ativo !== undefined ? formulario.ativo : true,
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
      title={isEditing ? 'Editar Formulário' : 'Criar Novo Formulário'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Nome do Formulário *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className={cn(
              "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
            placeholder="Ex: Feedback de Curso, Depoimento de Aluno"
            required
          />
        </div>

        {/* Tipo */}
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
            <option value="feedback">Feedback</option>
            <option value="depoimento">Depoimento</option>
            <option value="pesquisa">Pesquisa</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        {/* Status Ativo */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
          />
          <label
            htmlFor="ativo"
            className={cn(
              "text-sm font-medium cursor-pointer",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}
          >
            Formulário ativo (visível para alunos)
          </label>
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
            {isEditing ? 'Salvar Alterações' : 'Criar Formulário'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

