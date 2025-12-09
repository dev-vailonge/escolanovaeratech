'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { FileText, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Formulario {
  id: string
  nome: string
  tipo: string
  ativo: boolean
  created_at: string
  updated_at: string
}

interface FormData {
  nome: string
  email: string
  telefone: string
  mensagem: string
}

export default function FormularioPage() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuth()
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [jaRespondido, setJaRespondido] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    nome: user?.name || '',
    email: user?.email || '',
    telefone: '',
    mensagem: ''
  })

  useEffect(() => {
    if (params.id) {
      carregarFormulario(params.id as string)
    }
  }, [params.id])

  const carregarFormulario = async (id: string) => {
    try {
      setLoading(true)
      
      if (!user) {
        setError('Usuário não autenticado')
        setLoading(false)
        return
      }

      // Importar e usar o cliente Supabase do frontend
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Sessão não encontrada')
        setLoading(false)
        return
      }

      // Buscar formulário diretamente do Supabase
      const { data: formulario, error: formularioError } = await supabase
        .from('formularios')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (formularioError || !formulario) {
        setError('Formulário não encontrado')
        setLoading(false)
        return
      }

      // Verificar se está ativo (ou se é admin)
      if (!formulario.ativo && user.role !== 'admin') {
        setError('Formulário não está disponível')
        setLoading(false)
        return
      }

      setFormulario(formulario)

      // Buscar resposta anterior se existir
      const { data: minhaResposta } = await supabase
        .from('formulario_respostas')
        .select('*')
        .eq('formulario_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (minhaResposta) {
        setJaRespondido(true)
        const respostas = minhaResposta.respostas
        setFormData({
          nome: respostas.nome || user?.name || '',
          email: respostas.email || user?.email || '',
          telefone: respostas.telefone || '',
          mensagem: respostas.mensagem || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error)
      setError('Erro ao carregar formulário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validação
    if (!formData.nome.trim() || !formData.email.trim() || !formData.mensagem.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      setSubmitting(false)
      return
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um e-mail válido.')
      setSubmitting(false)
      return
    }

    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      // Importar e usar o cliente Supabase do frontend
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      // Verificar se já existe resposta
      const { data: respostaExistente } = await supabase
        .from('formulario_respostas')
        .select('id')
        .eq('formulario_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      const respostasData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim() || null,
        mensagem: formData.mensagem.trim()
      }

      let result
      if (respostaExistente) {
        // Atualizar resposta existente
        const { error } = await supabase
          .from('formulario_respostas')
          .update({ respostas: respostasData })
          .eq('id', respostaExistente.id)
        
        if (error) throw error
      } else {
        // Criar nova resposta
        const { error } = await supabase
          .from('formulario_respostas')
          .insert({
            formulario_id: params.id as string,
            user_id: user.id,
            respostas: respostasData
          })
        
        if (error) throw error
      }

      setSuccess(true)
      setJaRespondido(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/aluno/formularios')
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao salvar resposta:', error)
      setError(error.message || 'Erro ao salvar resposta. Tente novamente.')
    } finally {
      setSubmitting(false)
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
          <Loader2 className={cn(
            "w-8 h-8 mx-auto mb-4 animate-spin",
            theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
          )} />
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Carregando formulário...
          </p>
        </div>
      </div>
    )
  }

  if (error && !formulario) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Link
          href="/aluno/formularios"
          className={cn(
            "inline-flex items-center gap-2 text-sm md:text-base font-medium transition-colors",
            theme === 'dark'
              ? "text-yellow-400 hover:text-yellow-300"
              : "text-yellow-600 hover:text-yellow-700"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Formulários
        </Link>

        <div className={cn(
          "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
          theme === 'dark'
            ? "bg-red-500/10 border-red-500/30"
            : "bg-red-50 border-red-200"
        )}>
          <p className={cn(
            "text-base md:text-lg font-semibold",
            theme === 'dark' ? "text-red-400" : "text-red-600"
          )}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
          theme === 'dark'
            ? "bg-green-500/10 border-green-500/30"
            : "bg-green-50 border-green-200"
        )}>
          <CheckCircle2 className={cn(
            "w-12 h-12 mx-auto mb-4",
            theme === 'dark' ? "text-green-400" : "text-green-600"
          )} />
          <h2 className={cn(
            "text-xl md:text-2xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Resposta enviada com sucesso!
          </h2>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Obrigado por seu feedback. Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/aluno/formularios"
          className={cn(
            "p-2 rounded-lg transition-colors",
            theme === 'dark'
              ? "hover:bg-white/10 text-gray-400 hover:text-white"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {formulario?.nome}
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {formulario?.tipo === 'feedback' && 'Compartilhe seu feedback e nos ajude a melhorar'}
            {formulario?.tipo === 'depoimento' && 'Conte sua experiência conosco'}
            {formulario?.tipo === 'pesquisa' && 'Sua opinião é muito importante para nós'}
            {!['feedback', 'depoimento', 'pesquisa'].includes(formulario?.tipo || '') && 'Preencha o formulário abaixo'}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        {jaRespondido && (
          <div className={cn(
            "mb-4 p-3 rounded-lg border flex items-center gap-2",
            theme === 'dark'
              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
              : "bg-blue-50 border-blue-200 text-blue-700"
          )}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm md:text-base">
              Você já respondeu este formulário. Pode atualizar sua resposta abaixo.
            </p>
          </div>
        )}

        {error && (
          <div className={cn(
            "mb-4 p-3 rounded-lg border",
            theme === 'dark'
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            <p className="text-sm md:text-base">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Nome */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Nome completo *
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
              placeholder="Seu nome completo"
              required
              disabled={submitting}
            />
          </div>

          {/* Email */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              placeholder="seu@email.com"
              required
              disabled={submitting}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Telefone (opcional)
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              placeholder="(00) 00000-0000"
              disabled={submitting}
            />
          </div>

          {/* Mensagem */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              {formulario?.tipo === 'feedback' && 'Seu feedback *'}
              {formulario?.tipo === 'depoimento' && 'Seu depoimento *'}
              {formulario?.tipo === 'pesquisa' && 'Sua resposta *'}
              {!['feedback', 'depoimento', 'pesquisa'].includes(formulario?.tipo || '') && 'Mensagem *'}
            </label>
            <textarea
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              rows={6}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              placeholder={
                formulario?.tipo === 'feedback' 
                  ? 'Compartilhe sua opinião, sugestões ou críticas...'
                  : formulario?.tipo === 'depoimento'
                  ? 'Conte sua experiência, resultados alcançados...'
                  : 'Escreva sua resposta aqui...'
              }
              required
              disabled={submitting}
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
          }}>
            <Link
              href="/aluno/formularios"
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-white/10 text-gray-300 hover:bg-white/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                theme === 'dark'
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
                  : "bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : jaRespondido ? (
                'Atualizar Resposta'
              ) : (
                'Enviar Resposta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

