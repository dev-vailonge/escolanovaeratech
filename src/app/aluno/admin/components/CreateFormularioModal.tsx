'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { FormularioPergunta } from '@/types/database'

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
    perguntas: (formulario?.perguntas || []) as FormularioPergunta[],
  })

  const [expandedPerguntas, setExpandedPerguntas] = useState<Set<string>>(new Set())

  // Inicializar perguntas ao abrir modal
  useEffect(() => {
    if (isOpen) {
      if (formulario?.perguntas && formulario.perguntas.length > 0) {
        setFormData({
          nome: formulario.nome || '',
          tipo: formulario.tipo || 'feedback',
          ativo: formulario.ativo !== undefined ? formulario.ativo : true,
          perguntas: formulario.perguntas,
        })
        setExpandedPerguntas(new Set([formulario.perguntas[0]?.id]))
      } else {
        setFormData({
          nome: formulario?.nome || '',
          tipo: formulario?.tipo || 'feedback',
          ativo: formulario?.ativo !== undefined ? formulario.ativo : true,
          perguntas: [],
        })
        setExpandedPerguntas(new Set())
      }
    }
  }, [isOpen, formulario])

  const criarNovaPergunta = (): FormularioPergunta => ({
    id: `pergunta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    texto: '',
    tipo: 'texto',
    obrigatoria: false,
    pontos: undefined,
  })

  const adicionarPergunta = () => {
    const novaPergunta = criarNovaPergunta()
    setFormData({
      ...formData,
      perguntas: [...formData.perguntas, novaPergunta],
    })
    setExpandedPerguntas(new Set([...expandedPerguntas, novaPergunta.id]))
  }

  const removerPergunta = (id: string) => {
    setFormData({
      ...formData,
      perguntas: formData.perguntas.filter((p) => p.id !== id),
    })
    const novosExpanded = new Set(expandedPerguntas)
    novosExpanded.delete(id)
    setExpandedPerguntas(novosExpanded)
  }

  const atualizarPergunta = (id: string, updates: Partial<FormularioPergunta>) => {
    setFormData({
      ...formData,
      perguntas: formData.perguntas.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })
  }

  const toggleExpandPergunta = (id: string) => {
    const novosExpanded = new Set(expandedPerguntas)
    if (novosExpanded.has(id)) {
      novosExpanded.delete(id)
    } else {
      novosExpanded.add(id)
    }
    setExpandedPerguntas(novosExpanded)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar nome e tipo
    if (!formData.nome.trim()) {
      alert('Por favor, preencha o nome do formulário.')
      return
    }

    if (!formData.tipo.trim()) {
      alert('Por favor, selecione o tipo do formulário.')
      return
    }
    
    // Validar perguntas (apenas se houver)
    if (formData.perguntas && formData.perguntas.length > 0) {
      for (const pergunta of formData.perguntas) {
        if (!pergunta.texto.trim()) {
          alert('Por favor, preencha o texto de todas as perguntas.')
          return
        }
        
        if ((pergunta.tipo === 'multipla_escolha' || pergunta.tipo === 'checkbox') && 
            (!pergunta.opcoes || pergunta.opcoes.length === 0 || pergunta.opcoes.every(op => !op.trim()))) {
          alert(`A pergunta "${pergunta.texto}" precisa ter pelo menos uma opção válida.`)
          return
        }
      }
    }
    
    // Preparar dados para envio - remover perguntas vazias
    const dadosParaEnvio = {
      ...formData,
      perguntas: formData.perguntas && formData.perguntas.length > 0 
        ? formData.perguntas.filter(p => p.texto.trim()) // Remove perguntas vazias
        : []
    }
    
    console.log('📤 Enviando dados do formulário:', dadosParaEnvio)
    await onSave(dadosParaEnvio)
    // Não fecha aqui - deixa a aba controlar após sucesso
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Formulário' : 'Criar Novo Formulário'}
      size="lg"
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

        {/* Perguntas */}
        <div className="space-y-3 pt-4 border-t" style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <label className={cn(
              "block text-sm font-medium",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Perguntas do Formulário
            </label>
            <button
              type="button"
              onClick={adicionarPergunta}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                theme === 'dark'
                  ? "bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              )}
            >
              <Plus className="w-4 h-4" />
              Adicionar Pergunta
            </button>
          </div>

          {formData.perguntas.length === 0 ? (
            <p className={cn(
              "text-sm text-center py-4",
              theme === 'dark' ? "text-gray-500" : "text-gray-400"
            )}>
              Nenhuma pergunta adicionada. Clique em "Adicionar Pergunta" para começar.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {formData.perguntas.map((pergunta, index) => (
                <div
                  key={pergunta.id}
                  className={cn(
                    "rounded-lg border p-3",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => toggleExpandPergunta(pergunta.id)}
                      className={cn(
                        "flex items-center gap-2 flex-1 text-left",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      {expandedPerguntas.has(pergunta.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        Pergunta {index + 1}
                        {pergunta.texto && `: ${pergunta.texto.substring(0, 30)}${pergunta.texto.length > 30 ? '...' : ''}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removerPergunta(pergunta.id)}
                      className={cn(
                        "p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors",
                        theme === 'dark' ? "hover:text-red-300" : "hover:text-red-600"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expandedPerguntas.has(pergunta.id) && (
                    <div className="space-y-3 mt-3">
                      {/* Texto da Pergunta */}
                      <div>
                        <label className={cn(
                          "block text-xs font-medium mb-1",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          Texto da Pergunta *
                        </label>
                        <input
                          type="text"
                          value={pergunta.texto}
                          onChange={(e) => atualizarPergunta(pergunta.id, { texto: e.target.value })}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
                            theme === 'dark'
                              ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                              : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
                          )}
                          placeholder="Ex: O que você achou do curso?"
                        />
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className={cn(
                          "block text-xs font-medium mb-1",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          Tipo *
                        </label>
                        <select
                          value={pergunta.tipo}
                          onChange={(e) => {
                            const novoTipo = e.target.value as FormularioPergunta['tipo']
                            atualizarPergunta(pergunta.id, {
                              tipo: novoTipo,
                              opcoes: (novoTipo === 'multipla_escolha' || novoTipo === 'checkbox') ? ['Opção 1', 'Opção 2'] : undefined,
                            })
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
                            theme === 'dark'
                              ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                              : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
                          )}
                        >
                          <option value="texto">Texto Livre</option>
                          <option value="multipla_escolha">Múltipla Escolha</option>
                          <option value="checkbox">Checkbox (Múltiplas Respostas)</option>
                          <option value="escala">Escala (1-5)</option>
                        </select>
                      </div>

                      {/* Opções (para múltipla escolha e checkbox) */}
                      {(pergunta.tipo === 'multipla_escolha' || pergunta.tipo === 'checkbox') && (
                        <div>
                          <label className={cn(
                            "block text-xs font-medium mb-1",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Opções *
                          </label>
                          <div className="space-y-2">
                            {(pergunta.opcoes || []).map((opcao, opcaoIndex) => (
                              <div key={opcaoIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opcao}
                                  onChange={(e) => {
                                    const novasOpcoes = [...(pergunta.opcoes || [])]
                                    novasOpcoes[opcaoIndex] = e.target.value
                                    atualizarPergunta(pergunta.id, { opcoes: novasOpcoes })
                                  }}
                                  className={cn(
                                    "flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
                                    theme === 'dark'
                                      ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                                      : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
                                  )}
                                  placeholder={`Opção ${opcaoIndex + 1}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const novasOpcoes = [...(pergunta.opcoes || [])]
                                    novasOpcoes.splice(opcaoIndex, 1)
                                    atualizarPergunta(pergunta.id, { opcoes: novasOpcoes })
                                  }}
                                  className={cn(
                                    "p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors",
                                    theme === 'dark' ? "hover:text-red-300" : "hover:text-red-600"
                                  )}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const novasOpcoes = [...(pergunta.opcoes || []), '']
                                atualizarPergunta(pergunta.id, { opcoes: novasOpcoes })
                              }}
                              className={cn(
                                "text-xs px-2 py-1 rounded transition-colors",
                                theme === 'dark'
                                  ? "text-yellow-400 hover:text-yellow-300"
                                  : "text-yellow-600 hover:text-yellow-700"
                              )}
                            >
                              + Adicionar Opção
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Pontuação */}
                      <div>
                        <label className={cn(
                          "block text-xs font-medium mb-1",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          Pontos ao Responder (opcional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={pergunta.pontos ?? ''}
                          onChange={(e) => {
                            const valor = e.target.value === '' ? undefined : parseInt(e.target.value)
                            atualizarPergunta(pergunta.id, { pontos: valor })
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
                            theme === 'dark'
                              ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                              : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
                          )}
                          placeholder="Ex: 10 (deixe vazio para não dar pontos)"
                        />
                        <p className={cn(
                          "text-xs mt-1",
                          theme === 'dark' ? "text-gray-500" : "text-gray-400"
                        )}>
                          O aluno ganhará estes pontos ao responder esta pergunta
                        </p>
                      </div>

                      {/* Obrigatória */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`obrigatoria-${pergunta.id}`}
                          checked={pergunta.obrigatoria}
                          onChange={(e) => atualizarPergunta(pergunta.id, { obrigatoria: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <label
                          htmlFor={`obrigatoria-${pergunta.id}`}
                          className={cn(
                            "text-xs font-medium cursor-pointer",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}
                        >
                          Pergunta obrigatória
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

