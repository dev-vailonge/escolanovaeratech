'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { FileText, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

interface Formulario {
  id: string
  nome: string
  tipo: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export default function FormulariosPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [loading, setLoading] = useState(true)
  const [respostasStatus, setRespostasStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.id) {
      carregarFormularios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const carregarFormularios = async () => {
    try {
      setLoading(true)
      console.log('Carregando formulários - User:', user)
      
      // Buscar diretamente do Supabase usando o cliente do frontend
      if (!user) {
        console.log('Usuário não autenticado ainda')
        return
      }

      // Importar e usar o cliente Supabase do frontend
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('Sessão não encontrada')
        setLoading(false)
        return
      }

      // Buscar formulários diretamente do Supabase
      const isAdmin = user.role === 'admin'
      
      let query = supabase
        .from('formularios')
        .select('*')
      
      if (!isAdmin) {
        query = query.eq('ativo', true)
      }
      
      const { data: formularios, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar formulários:', error)
        throw error
      }

      console.log('Formulários encontrados:', formularios?.length || 0)
      setFormularios(formularios || [])
      
      if ((formularios || []).length === 0 && user?.role === 'admin') {
        console.warn('⚠️ Admin não encontrou formulários. Verifique se há formulários no banco de dados.')
      }

      // Verificar status de respostas para cada formulário
      if (user?.id && formularios && formularios.length > 0) {
        const statusPromises = formularios.map(async (form: Formulario) => {
          const { data: resposta } = await supabase
            .from('formulario_respostas')
            .select('id')
            .eq('formulario_id', form.id)
            .eq('user_id', user.id)
            .maybeSingle()
          
          return { id: form.id, respondido: !!resposta }
        })

        const statuses = await Promise.all(statusPromises)
        const statusMap: Record<string, boolean> = {}
        statuses.forEach(({ id, respondido }) => {
          statusMap[id] = respondido
        })
        setRespostasStatus(statusMap)
      }
    } catch (error) {
      console.error('Erro ao carregar formulários:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'feedback':
        return theme === 'dark' 
          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-700 border-blue-300'
      case 'depoimento':
        return theme === 'dark'
          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          : 'bg-purple-100 text-purple-700 border-purple-300'
      case 'pesquisa':
        return theme === 'dark'
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-green-100 text-green-700 border-green-300'
      default:
        return theme === 'dark'
          ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
          : 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Carregando formulários...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Formulários
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Preencha os formulários disponíveis e compartilhe seu feedback conosco
        </p>
      </div>

      {/* Lista de Formulários */}
      {formularios.length === 0 ? (
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <FileText className={cn(
            "w-12 h-12 mx-auto mb-4",
            theme === 'dark' ? "text-gray-600" : "text-gray-400"
          )} />
          <h3 className={cn(
            "text-lg md:text-xl font-semibold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Nenhum formulário disponível
          </h3>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Não há formulários disponíveis no momento. Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {formularios.map((formulario) => {
            const respondido = respostasStatus[formulario.id] || false

            return (
              <Link
                key={formulario.id}
                href={`/aluno/formularios/${formulario.id}`}
                className={cn(
                  "block backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all hover:scale-[1.02]",
                  theme === 'dark'
                    ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                    : "bg-gray-50 border-gray-200 hover:border-yellow-400 shadow-sm hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className={cn(
                        "font-semibold text-base md:text-lg",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {formulario.nome}
                      </h3>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border capitalize",
                        getTipoBadgeColor(formulario.tipo)
                      )}>
                        {formulario.tipo}
                      </span>
                      {!formulario.ativo && user?.role === 'admin' && (
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border",
                          theme === 'dark'
                            ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        )}>
                          Inativo
                        </span>
                      )}
                      {respondido && (
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border flex items-center gap-1",
                          theme === 'dark'
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-green-100 text-green-700 border-green-300"
                        )}>
                          <CheckCircle2 className="w-3 h-3" />
                          Respondido
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs md:text-sm mt-2">
                      <div className={cn(
                        "flex items-center gap-1",
                        theme === 'dark' ? "text-gray-500" : "text-gray-500"
                      )}>
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Criado em {formatarData(formulario.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ArrowRight className={cn(
                      "w-5 h-5 md:w-6 md:h-6",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

