'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { FileText, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { FormularioPergunta } from '@/types/database'

interface Formulario {
  id: string
  nome: string
  tipo: string
  ativo: boolean
  perguntas?: FormularioPergunta[]
  created_at: string
  updated_at: string
}

interface FormData {
  nome: string
  email: string
  telefone: string
  mensagem: string
  respostasPerguntas?: Record<string, any> // ID da pergunta -> resposta
}

export default function FormularioPage() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const { user, refreshSession } = useAuth()
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [jaRespondido, setJaRespondido] = useState(false)
  const [pontosGanhos, setPontosGanhos] = useState(0)
  
  const [formData, setFormData] = useState<FormData>({
    nome: user?.name || '',
    email: user?.email || '',
    telefone: '',
    mensagem: '',
    respostasPerguntas: {}
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
          mensagem: respostas.mensagem || '',
          respostasPerguntas: respostas.respostasPerguntas || {}
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

    // Validação básica (só se não houver perguntas customizadas)
    const temPerguntasCustomizadas = formulario?.perguntas && formulario.perguntas.length > 0
    
    if (!temPerguntasCustomizadas) {
      if (!formData.nome.trim() || !formData.email.trim() || !formData.mensagem.trim()) {
        setError('Por favor, preencha todos os campos obrigatórios.')
        setSubmitting(false)
        return
      }
    } else {
      // Validar campos básicos
      if (!formData.nome.trim() || !formData.email.trim()) {
        setError('Por favor, preencha nome e e-mail.')
        setSubmitting(false)
        return
      }

      // Validar perguntas obrigatórias
      const perguntasObrigatorias = (formulario.perguntas || []).filter(p => p.obrigatoria)
      for (const pergunta of perguntasObrigatorias) {
        const resposta = formData.respostasPerguntas?.[pergunta.id]
        if (!resposta || (Array.isArray(resposta) && resposta.length === 0) || (typeof resposta === 'string' && !resposta.trim())) {
          setError(`Por favor, responda a pergunta obrigatória: "${pergunta.texto}"`)
          setSubmitting(false)
          return
        }
      }
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

      // Usar valor oficial de XP para formulários (1 XP)
      // Independente do número de perguntas, sempre 1 XP
      const XP_FORMULARIO = 1
      const pontosGanhos = XP_FORMULARIO
      console.log(`💰 XP a ganhar por preencher formulário: ${pontosGanhos} XP (valor oficial)`)

      // Verificar se já existe resposta
      const { data: respostaExistente } = await supabase
        .from('formulario_respostas')
        .select('id, respostas')
        .eq('formulario_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      const respostasData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim() || null,
        mensagem: temPerguntasCustomizadas ? (formData.mensagem?.trim() || '') : formData.mensagem.trim(),
        respostasPerguntas: formData.respostasPerguntas || {},
        pontosGanhos: pontosGanhos
      }

      // Verificar se já ganhou XP para este formulário
      let jaGanhouXP = false
      if (respostaExistente?.respostas?.pontosGanhos) {
        // Se já tinha pontos ganhos, não adiciona novamente
        console.log('ℹ️ Resposta existente já tinha pontos ganhos:', respostaExistente.respostas.pontosGanhos)
        jaGanhouXP = true
      } else {
        // Verificar no histórico de XP se já ganhou pontos para este formulário
        const { data: xpHistory } = await supabase
          .from('user_xp_history')
          .select('id, amount')
          .eq('user_id', user.id)
          .eq('source', 'comunidade')
          .eq('source_id', formulario?.id)
          .maybeSingle()
        
        if (xpHistory) {
          console.log('ℹ️ Já existe registro de XP para este formulário:', xpHistory.amount, 'pontos')
          jaGanhouXP = true
        } else {
          console.log('✅ Não há registro de XP para este formulário - pode adicionar')
        }
      }

      if (respostaExistente) {
        // Atualizar resposta existente
        const { error } = await supabase
          .from('formulario_respostas')
          .update({ respostas: respostasData })
          .eq('id', respostaExistente.id)
        
        if (error) throw error

        // Adicionar XP apenas se ainda não ganhou e há pontos
        if (pontosGanhos > 0 && !jaGanhouXP) {
          console.log(`💰 Adicionando ${pontosGanhos} XP ao usuário por responder formulário`)
          
          // Tentar usar API route primeiro (bypassa RLS)
          let sucesso = false
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              const res = await fetch('/api/xp/add', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  amount: pontosGanhos,
                  source: 'comunidade',
                  sourceId: formulario?.id,
                  description: `Formulário: ${formulario?.nome} (${pontosGanhos} pontos)`
                })
              })
              
              if (res.ok) {
                sucesso = true
                console.log('✅ XP adicionado via API route')
              } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('❌ Erro na API route:', errorData)
              }
            }
          } catch (apiError) {
            console.error('❌ Erro ao chamar API route:', apiError)
          }
          
          // Fallback para método direto
          if (!sucesso) {
            const { addXP } = await import('@/lib/database')
            sucesso = await addXP(
              user.id,
              pontosGanhos,
              'comunidade',
              formulario?.id,
              `Formulário: ${formulario?.nome} (${pontosGanhos} pontos)`
            )
          }
          if (sucesso) {
            console.log('✅ XP adicionado ao histórico com sucesso')
            setPontosGanhos(pontosGanhos)
            
            // Aguardar mais tempo para o trigger do banco processar a atualização
            console.log('⏳ Aguardando trigger do banco processar...')
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Verificar diretamente no banco se o XP foi atualizado
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('xp, xp_mensal, level')
              .eq('id', user.id)
              .single()
            
            if (userError) {
              console.error('❌ Erro ao verificar XP do usuário:', userError)
            } else if (userData) {
              console.log(`📊 XP atualizado no banco: ${userData.xp} XP (esperado: ${(user.xp || 0) + pontosGanhos}), Nível ${userData.level}`)
              
              // Atualizar dados do usuário no contexto para refletir o novo XP
              console.log('🔄 Atualizando dados do usuário no contexto...')
              await refreshSession()
              
              // Verificar novamente após refresh
              const { data: userDataAfterRefresh } = await supabase
                .from('users')
                .select('xp, level')
                .eq('id', user.id)
                .single()
              
              if (userDataAfterRefresh) {
                console.log(`✅ XP após refresh: ${userDataAfterRefresh.xp} XP, Nível ${userDataAfterRefresh.level}`)
              }
            }
          } else {
            console.error('❌ Erro ao adicionar XP')
          }
        } else if (jaGanhouXP) {
          console.log('ℹ️ Usuário já ganhou XP para este formulário anteriormente')
        }
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

        // Adicionar XP se houver pontos ganhos (sempre adiciona para nova resposta)
        if (pontosGanhos > 0) {
          console.log(`💰 Adicionando ${pontosGanhos} XP ao usuário por responder formulário`)
          
          // Tentar usar API route primeiro (bypassa RLS)
          let sucesso = false
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              const res = await fetch('/api/xp/add', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  amount: pontosGanhos,
                  source: 'comunidade',
                  sourceId: formulario?.id,
                  description: `Formulário: ${formulario?.nome} (${pontosGanhos} pontos)`
                })
              })
              
              if (res.ok) {
                sucesso = true
                console.log('✅ XP adicionado via API route')
              } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('❌ Erro na API route:', errorData)
              }
            }
          } catch (apiError) {
            console.error('❌ Erro ao chamar API route:', apiError)
          }
          
          // Fallback para método direto
          if (!sucesso) {
            const { addXP } = await import('@/lib/database')
            sucesso = await addXP(
              user.id,
              pontosGanhos,
              'comunidade',
              formulario?.id,
              `Formulário: ${formulario?.nome} (${pontosGanhos} pontos)`
            )
          }
          if (sucesso) {
            console.log('✅ XP adicionado ao histórico com sucesso')
            setPontosGanhos(pontosGanhos)
            
            // Aguardar mais tempo para o trigger do banco processar a atualização
            console.log('⏳ Aguardando trigger do banco processar...')
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Verificar diretamente no banco se o XP foi atualizado
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('xp, xp_mensal, level')
              .eq('id', user.id)
              .single()
            
            if (userError) {
              console.error('❌ Erro ao verificar XP do usuário:', userError)
            } else if (userData) {
              console.log(`📊 XP atualizado no banco: ${userData.xp} XP (esperado: ${(user.xp || 0) + pontosGanhos}), Nível ${userData.level}`)
              
              // Atualizar dados do usuário no contexto para refletir o novo XP
              console.log('🔄 Atualizando dados do usuário no contexto...')
              await refreshSession()
              
              // Verificar novamente após refresh
              const { data: userDataAfterRefresh } = await supabase
                .from('users')
                .select('xp, level')
                .eq('id', user.id)
                .single()
              
              if (userDataAfterRefresh) {
                console.log(`✅ XP após refresh: ${userDataAfterRefresh.xp} XP, Nível ${userDataAfterRefresh.level}`)
              }
            }
          } else {
            console.error('❌ Erro ao adicionar XP')
          }
        }
      }

      setSuccess(true)
      setJaRespondido(true)
      
      // Redirecionar para página inicial após 2 segundos
      setTimeout(() => {
        router.push('/aluno')
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao salvar resposta:', error)
      setError(error.message || 'Erro ao salvar resposta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const atualizarRespostaPergunta = (perguntaId: string, valor: any) => {
    setFormData({
      ...formData,
      respostasPerguntas: {
        ...formData.respostasPerguntas,
        [perguntaId]: valor
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-[#FFF420]/90 shadow-md"
        )}>
          <Loader2 className={cn(
            "w-8 h-8 mx-auto mb-4 animate-spin",
            theme === 'dark' ? "text-[#FFF420]" : "text-[#FFF420]"
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
              ? "text-[#FFF420] hover:text-[#FFF420]"
              : "text-[#FFF420] hover:text-[#FFF420]"
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
          {pontosGanhos > 0 && (
            <div className={cn(
              "mb-4 p-4 rounded-lg border mx-auto max-w-md",
              theme === 'dark'
                ? "bg-[#FFF420]/20 border-[#FFF420]/50 text-[#FFF420]"
                : "bg-[#FFF420] border-[#FFF420] text-[#FFF420]"
            )}>
              <p className="text-lg font-semibold">
                🎉 Você ganhou {pontosGanhos} pontos de XP!
              </p>
              <p className="text-sm mt-1">
                Seus pontos foram adicionados ao seu perfil.
              </p>
            </div>
          )}
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
          : "bg-white border-[#FFF420]/90 shadow-md"
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
                  ? "bg-black/50 border-white/10 text-white focus:border-[#FFF420] focus:ring-[#FFF420]/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-[#FFF420] focus:ring-[#FFF420]/20"
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
                  ? "bg-black/50 border-white/10 text-white focus:border-[#FFF420] focus:ring-[#FFF420]/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-[#FFF420] focus:ring-[#FFF420]/20"
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
                  ? "bg-black/50 border-white/10 text-white focus:border-[#FFF420] focus:ring-[#FFF420]/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-[#FFF420] focus:ring-[#FFF420]/20"
              )}
              placeholder="(00) 00000-0000"
              disabled={submitting}
            />
          </div>

          {/* Perguntas Customizadas */}
          {formulario?.perguntas && formulario.perguntas.length > 0 && (() => {
            const totalPontos = formulario.perguntas.reduce((acc, p) => acc + (p.pontos || 0), 0)
            
            return (
            <div className="space-y-4 pt-4 border-t" style={{
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
            }}>
              <h3 className={cn(
                "text-lg font-semibold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Perguntas
              </h3>
              {formulario.perguntas.map((pergunta, index) => {
                const respostaAtual = formData.respostasPerguntas?.[pergunta.id]

                return (
                  <div key={pergunta.id} className={cn(
                    "p-4 rounded-lg border",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10"
                      : "bg-gray-50 border-gray-200"
                  )}>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      theme === 'dark' ? "text-gray-300" : "text-gray-700"
                    )}>
                      {pergunta.texto}
                      {pergunta.obrigatoria && <span className="text-red-500 ml-1">*</span>}
                      {pergunta.pontos && (
                        <span className={cn(
                          "ml-2 text-xs px-2 py-0.5 rounded-full",
                          theme === 'dark'
                            ? "bg-[#FFF420]/20 text-[#FFF420]"
                            : "bg-[#FFF420] text-[#FFF420]"
                        )}>
                          +{pergunta.pontos} pontos
                        </span>
                      )}
                    </label>

                    {/* Tipo: Texto */}
                    {pergunta.tipo === 'texto' && (
                      <textarea
                        value={typeof respostaAtual === 'string' ? respostaAtual : ''}
                        onChange={(e) => atualizarRespostaPergunta(pergunta.id, e.target.value)}
                        rows={4}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none",
                          theme === 'dark'
                            ? "bg-black/50 border-white/10 text-white focus:border-[#FFF420] focus:ring-[#FFF420]/20"
                            : "bg-white border-gray-300 text-gray-900 focus:border-[#FFF420] focus:ring-[#FFF420]/20"
                        )}
                        placeholder="Digite sua resposta aqui..."
                        required={pergunta.obrigatoria}
                        disabled={submitting}
                      />
                    )}

                    {/* Tipo: Múltipla Escolha */}
                    {pergunta.tipo === 'multipla_escolha' && (
                      <div className="space-y-2">
                        {pergunta.opcoes?.map((opcao, opcaoIndex) => (
                          <label
                            key={opcaoIndex}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              theme === 'dark'
                                ? respostaAtual === opcao
                                  ? "bg-[#FFF420]/20 border-[#FFF420]/50"
                                  : "bg-black/50 border-white/10 hover:bg-black/70"
                                : respostaAtual === opcao
                                  ? "bg-[#FFF420] border-[#FFF420]"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            <input
                              type="radio"
                              name={`pergunta-${pergunta.id}`}
                              value={opcao}
                              checked={respostaAtual === opcao}
                              onChange={(e) => atualizarRespostaPergunta(pergunta.id, e.target.value)}
                              required={pergunta.obrigatoria}
                              disabled={submitting}
                              className="w-4 h-4 text-[#FFF420] focus:ring-[#FFF420]"
                            />
                            <span className={cn(
                              "flex-1",
                              theme === 'dark' ? "text-gray-300" : "text-gray-700"
                            )}>
                              {opcao}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Tipo: Checkbox */}
                    {pergunta.tipo === 'checkbox' && (
                      <div className="space-y-2">
                        {pergunta.opcoes?.map((opcao, opcaoIndex) => {
                          const respostasArray = Array.isArray(respostaAtual) ? respostaAtual : []
                          const estaSelecionada = respostasArray.includes(opcao)
                          
                          return (
                            <label
                              key={opcaoIndex}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                theme === 'dark'
                                  ? estaSelecionada
                                    ? "bg-[#FFF420]/20 border-[#FFF420]/50"
                                    : "bg-black/50 border-white/10 hover:bg-black/70"
                                  : estaSelecionada
                                    ? "bg-[#FFF420] border-[#FFF420]"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionada}
                                onChange={(e) => {
                                  const respostasArray = Array.isArray(respostaAtual) ? respostaAtual : []
                                  if (e.target.checked) {
                                    atualizarRespostaPergunta(pergunta.id, [...respostasArray, opcao])
                                  } else {
                                    atualizarRespostaPergunta(pergunta.id, respostasArray.filter(r => r !== opcao))
                                  }
                                }}
                                disabled={submitting}
                                className="w-4 h-4 rounded border-gray-300 text-[#FFF420] focus:ring-[#FFF420]"
                              />
                              <span className={cn(
                                "flex-1",
                                theme === 'dark' ? "text-gray-300" : "text-gray-700"
                              )}>
                                {opcao}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* Tipo: Escala */}
                    {pergunta.tipo === 'escala' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>1</span>
                          <div className="flex-1 flex items-center justify-center gap-2 mx-4">
                            {[1, 2, 3, 4, 5].map((valor) => (
                              <label
                                key={valor}
                                className={cn(
                                  "flex items-center justify-center w-12 h-12 rounded-lg border cursor-pointer transition-colors",
                                  theme === 'dark'
                                    ? respostaAtual === valor.toString()
                                      ? "bg-[#FFF420]/20 border-[#FFF420]/50 text-[#FFF420]"
                                      : "bg-black/50 border-white/10 text-gray-400 hover:bg-black/70"
                                    : respostaAtual === valor.toString()
                                      ? "bg-[#FFF420] border-[#FFF420] text-[#FFF420]"
                                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`pergunta-escala-${pergunta.id}`}
                                  value={valor}
                                  checked={respostaAtual === valor.toString()}
                                  onChange={(e) => atualizarRespostaPergunta(pergunta.id, e.target.value)}
                                  required={pergunta.obrigatoria}
                                  disabled={submitting}
                                  className="sr-only"
                                />
                                <span className="font-semibold">{valor}</span>
                              </label>
                            ))}
                          </div>
                          <span className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>5</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {totalPontos > 0 && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  theme === 'dark'
                    ? "bg-[#FFF420]/10 border-[#FFF420]/30 text-[#FFF420]"
                    : "bg-[#FFF420] border-rgba(255, 244, 32, 0.4) text-[#FFF420]"
                )}>
                  <p className="text-sm font-medium">
                    💰 Respondendo todas as perguntas, você pode ganhar até {totalPontos} pontos!
                  </p>
                </div>
              )}
            </div>
            )
          })()}

          {/* Mensagem (só aparece se não houver perguntas customizadas) */}
          {(!formulario?.perguntas || formulario.perguntas.length === 0) && (
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
                    ? "bg-black/50 border-white/10 text-white focus:border-[#FFF420] focus:ring-[#FFF420]/20"
                    : "bg-white border-gray-300 text-gray-900 focus:border-[#FFF420] focus:ring-[#FFF420]/20"
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
          )}

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
                  ? "bg-[#FFF420] text-black hover:bg-[#FFF420] disabled:opacity-50"
                  : "bg-[#FFF420] text-white hover:bg-[#FFF420] disabled:opacity-50"
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

