'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { CURSOS_COM_GERAL, getCursoById, type CursoId } from '@/lib/constants/cursos'

interface CreateDesafioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (desafio: any) => void
  desafio?: any // Para edição
}

export default function CreateDesafioModal({ isOpen, onClose, onSave, desafio }: CreateDesafioModalProps) {
  const { theme } = useTheme()
  const isEditing = !!desafio

  const [formData, setFormData] = useState({
    titulo: desafio?.titulo || '',
    descricao: desafio?.descricao || '',
    tecnologia: desafio?.tecnologia || 'Web Development',
    dificuldade: desafio?.dificuldade || 'intermediario',
    xp: desafio?.xp || 200,
    periodicidade: desafio?.periodicidade || 'semanal',
    curso_id: (desafio?.curso_id ?? null) as CursoId,
  })

  // Atualizar formData quando desafio mudar (edição)
  useEffect(() => {
    if (desafio) {
      setFormData({
        titulo: desafio.titulo || '',
        descricao: desafio.descricao || '',
        tecnologia: desafio.tecnologia || 'Web Development',
        dificuldade: desafio.dificuldade || 'intermediario',
        xp: desafio.xp || 200,
        periodicidade: desafio.periodicidade || 'semanal',
        curso_id: (desafio.curso_id ?? null) as CursoId,
      })
    } else {
      // Reset para criação
      setFormData({
        titulo: '',
        descricao: '',
        tecnologia: 'Web Development',
        dificuldade: 'intermediario',
        xp: 200,
        periodicidade: 'semanal',
        curso_id: null,
      })
    }
  }, [desafio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
    // Não fecha aqui - deixa a aba controlar após sucesso
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Desafio' : 'Criar Novo Desafio'}
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

        {/* Descrição */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Descrição *
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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

        {/* Curso vinculado */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Curso/Formação
          </label>
          <select
            value={formData.curso_id || ''}
            onChange={(e) => setFormData({ ...formData, curso_id: (e.target.value || null) as CursoId })}
            className={cn(
              "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
          >
            {CURSOS_COM_GERAL.map((curso) => (
              <option key={curso.id || 'geral'} value={curso.id || ''}>
                {curso.nome}
              </option>
            ))}
          </select>
          {formData.curso_id && (
            <p className={cn(
              "text-xs mt-1",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              {getCursoById(formData.curso_id)?.descricao}
            </p>
          )}
        </div>

        {/* Tecnologia e Dificuldade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Tecnologia *
            </label>
            <select
              value={formData.tecnologia}
              onChange={(e) => setFormData({ ...formData, tecnologia: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="">Selecione uma tecnologia</option>
              {Object.entries({
                'Frontend Web': ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
                'Backend': ['Node.js', 'Express', 'APIs REST', 'PostgreSQL', 'MongoDB'],
                'Mobile Android': ['Kotlin', 'Jetpack Compose', 'Android'],
                'Mobile iOS': ['Swift', 'SwiftUI'],
                'Análise de Dados': ['Python', 'Pandas', 'SQL', 'Data Visualization'],
                'Fundamentos': ['Lógica de Programação', 'Algoritmos', 'Estrutura de Dados', 'Git'],
              }).map(([categoria, techs]) => (
                <optgroup key={categoria} label={categoria}>
                  {techs.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Dificuldade *
            </label>
            <select
              value={formData.dificuldade}
              onChange={(e) => setFormData({ ...formData, dificuldade: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
        </div>

        {/* XP e Periodicidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              XP Ganho *
            </label>
            <input
              type="number"
              min="1"
              value={formData.xp}
              onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) || 0 })}
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
              Periodicidade *
            </label>
            <select
              value={formData.periodicidade}
              onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="especial">Especial</option>
            </select>
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
            {isEditing ? 'Salvar Alterações' : 'Criar Desafio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

