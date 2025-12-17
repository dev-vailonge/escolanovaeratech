'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { getRespostasFormulario, getUserById } from '@/lib/database'
import type { DatabaseFormularioResposta } from '@/types/database'
import { Loader2, User, Mail, Phone, MessageSquare, Calendar } from 'lucide-react'

interface ViewRespostasModalProps {
  isOpen: boolean
  onClose: () => void
  formularioId: string
  formularioNome: string
}

interface RespostaCompleta extends DatabaseFormularioResposta {
  userName?: string
  userEmail?: string
}

export default function ViewRespostasModal({ 
  isOpen, 
  onClose, 
  formularioId, 
  formularioNome 
}: ViewRespostasModalProps) {
  const { theme } = useTheme()
  const [respostas, setRespostas] = useState<RespostaCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && formularioId) {
      carregarRespostas()
    } else {
      // Limpar dados quando fechar
      setRespostas([])
      setError('')
    }
  }, [isOpen, formularioId])

  const carregarRespostas = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Buscar todas as respostas do formulário
      const respostasData = await getRespostasFormulario(formularioId)
      
      // Buscar informações dos usuários em paralelo
      const respostasCompletas = await Promise.all(
        respostasData.map(async (resposta) => {
          const user = await getUserById(resposta.user_id)
          return {
            ...resposta,
            userName: user?.name || 'Usuário desconhecido',
            userEmail: user?.email || 'Email não disponível'
          }
        })
      )
      
      setRespostas(respostasCompletas)
    } catch (err) {
      console.error('Erro ao carregar respostas:', err)
      setError('Erro ao carregar respostas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Extrair campos das respostas (nome, email, telefone, mensagem)
  const getCamposResposta = (resposta: any) => {
    return {
      nome: resposta.nome || resposta.name || '',
      email: resposta.email || '',
      telefone: resposta.telefone || resposta.phone || '',
      mensagem: resposta.mensagem || resposta.message || resposta.texto || ''
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Respostas - ${formularioNome}`}
      size="xl"
    >
      {loading ? (
        <div className={cn(
          "flex items-center justify-center p-8",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando respostas...</span>
        </div>
      ) : error ? (
        <div className={cn(
          "p-4 rounded-lg border",
          theme === 'dark'
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-700"
        )}>
          {error}
        </div>
      ) : respostas.length === 0 ? (
        <div className={cn(
          "p-8 text-center rounded-lg border",
          theme === 'dark'
            ? "bg-black/20 border-white/10 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          Nenhuma resposta encontrada para este formulário.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className={cn(
            "p-4 rounded-lg border",
            theme === 'dark'
              ? "bg-black/30 border-white/10"
              : "bg-gray-50 border-gray-200"
          )}>
            <p className={cn(
              "text-sm font-medium",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Total de respostas: <span className="font-bold text-yellow-500">{respostas.length}</span>
            </p>
          </div>

          {/* Lista de Respostas */}
          <div className="space-y-4">
            {respostas.map((resposta, index) => {
              const campos = getCamposResposta(resposta.respostas)
              
              return (
                <div
                  key={resposta.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                      : "bg-gray-50 border-gray-200 hover:border-yellow-400"
                  )}
                >
                  {/* Cabeçalho da Resposta */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b" style={{
                    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
                  }}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        theme === 'dark'
                          ? "bg-yellow-400/20 text-yellow-400"
                          : "bg-yellow-100 text-yellow-700"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={cn(
                          "font-semibold text-sm",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {resposta.userName}
                        </p>
                        <p className={cn(
                          "text-xs",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          {resposta.userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{
                      color: theme === 'dark' ? 'rgba(156, 163, 175, 1)' : 'rgba(107, 114, 128, 1)'
                    }}>
                      <Calendar className="w-3 h-3" />
                      {formatarData(resposta.created_at)}
                    </div>
                  </div>

                  {/* Campos da Resposta */}
                  <div className="space-y-3">
                    {/* Nome */}
                    {campos.nome && (
                      <div className="flex items-start gap-3">
                        <User className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium mb-1",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Nome
                          </p>
                          <p className={cn(
                            "text-sm",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {campos.nome}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {campos.email && (
                      <div className="flex items-start gap-3">
                        <Mail className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium mb-1",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Email
                          </p>
                          <p className={cn(
                            "text-sm break-all",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {campos.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Telefone */}
                    {campos.telefone && (
                      <div className="flex items-start gap-3">
                        <Phone className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium mb-1",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Telefone
                          </p>
                          <p className={cn(
                            "text-sm",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {campos.telefone}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mensagem */}
                    {campos.mensagem && (
                      <div className="flex items-start gap-3">
                        <MessageSquare className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium mb-1",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Mensagem
                          </p>
                          <p className={cn(
                            "text-sm whitespace-pre-wrap break-words",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {campos.mensagem}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Se não houver campos conhecidos, mostrar o JSON completo */}
                    {!campos.nome && !campos.email && !campos.telefone && !campos.mensagem && (
                      <div className="flex items-start gap-3">
                        <MessageSquare className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium mb-1",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Resposta
                          </p>
                          <pre className={cn(
                            "text-xs p-2 rounded border overflow-auto",
                            theme === 'dark'
                              ? "bg-black/50 border-white/10 text-gray-300"
                              : "bg-gray-100 border-gray-300 text-gray-800"
                          )}>
                            {JSON.stringify(resposta.respostas, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Modal>
  )
}


