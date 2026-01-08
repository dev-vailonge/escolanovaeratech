'use client'

import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'
import { HelpCircle, Trophy, MessageCircle, User, BookOpen, Target, Bell, Sparkles, ChevronDown, Send, Lightbulb, Bug, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import QuestionImageUpload from '@/components/comunidade/QuestionImageUpload'
import { supabase } from '@/lib/supabase'

const sections = [
  {
    id: 'inicio',
    title: 'Início',
    icon: Sparkles,
    summary: 'Seu ponto de partida! Veja como você está evoluindo.',
    points: [
      '📊 Acompanhe seu progresso em aulas, quizzes e desafios — tudo num só lugar!',
      '📢 Fique de olho nos avisos da escola — são comunicados importantes pra você.',
      '⚡ Atalhos rápidos: acesse a comunidade, faça um quiz ou inicie um desafio com um clique.',
      '🎯 Dica: quanto mais você participa, mais XP você ganha e sobe no ranking!',
    ],
  },
  {
    id: 'ranking',
    title: 'Ranking',
    icon: Trophy,
    summary: 'Veja sua posição e mostre suas conquistas pro mundo!',
    points: [
      '📈 Escolha entre "Mês" (XP do mês atual) ou "Geral" (todo seu XP acumulado).',
      '🌟 No Mural dos Campeões, cada mês tem seu destaque — será que você é o próximo?',
      '📲 Clique em "Compartilhar" e poste sua conquista no Instagram, LinkedIn ou onde quiser, e não esqueça de mencionar a @/escolanovaeratech/!',
      '🎉 Ao clicar num campeão, aparece um card especial — dá pra compartilhar também!',
      '⏳ A contagem regressiva mostra quanto falta pro próximo mês. Corre que dá tempo!',
    ],
  },
  {
    id: 'comunidade',
    title: 'Comunidade',
    icon: MessageCircle,
    summary: 'Tire dúvidas, ajude colegas e ganhe XP colaborando!',
    points: [
      '❓ Tem uma dúvida? Clique em "Fazer Pergunta" e descreva o que precisa. Pode colocar imagem também!',
      '💡 Sabe a resposta de alguém? Manda ver! Cada resposta ajuda a comunidade crescer.',
      '✅ Quando sua dúvida for resolvida, a melhor resposta fica em destaque com um selo verde.',
      '🖱️ Dica: clique no título da pergunta ou em "Contribuir" pra abrir a conversa completa.',
      '📣 Quer mencionar alguém? Digite @nome do aluno na resposta.',
    ],
  },
  {
    id: 'perfil',
    title: 'Perfil',
    icon: User,
    summary: 'Suas informações, seu histórico de XP e como você evoluiu.',
    points: [
      '📜 Veja todo seu histórico de XP: de onde veio cada ponto que você conquistou.',
      '🎖️ Clique no seu nível pra ver os detalhes e entender o que falta pro próximo.',
      '📸 Sua foto aparece com uma borda colorida do seu nível — personalize seu perfil!',
    ],
  },
  {
    id: 'quiz',
    title: 'Quiz',
    icon: HelpCircle,
    summary: 'Teste seus conhecimentos e ganhe XP respondendo!',
    points: [
      '🆕 Primeira vez aqui? Clique em "Fazer Quiz" pra começar — é rápido e divertido!',
      '📝 Escolha a tecnologia e o nível que você quer praticar.',
      '🎯 Ao terminar, seu XP já entra na conta e você sobe no ranking automaticamente.',
      '📚 Seus quizzes concluídos ficam salvos — dá pra revisar quando quiser até alcançar o máximo de XP possível por quiz.',
    ],
  },
  {
    id: 'desafios',
    title: 'Desafios',
    icon: Target,
    summary: 'Desafios práticos que valem 50 XP cada. Bora encarar?',
    points: [
      '🚀 Cada desafio concluído te dá 50 XP — é uma ótima forma de subir no ranking!',
      '📋 Você pode ver seus desafios em andamento e os que já completou.',
      '✍️ Envie sua solução e aguarde a revisão — os admins vão avaliar seu trabalho.',
      '💪 Dica: faça um desafio por dia e veja sua evolução disparar!',
    ],
  },
  {
    id: 'plano-estudos',
    title: 'Plano de Estudos',
    icon: BookOpen,
    summary: 'Aulas e conteúdos organizados pra você aprender no seu ritmo.',
    points: [
      '📈 Em breve: novos conteúdos e acompanhamento do seu progresso!',
    ],
  },
  {
    id: 'notificacoes',
    title: 'Notificações',
    icon: Bell,
    summary: 'Fique por dentro de tudo que acontece na escola.',
    points: [
      '🔔 O sininho no topo da tela mostra avisos importantes — clique pra ver!',
      '💡 Dica: dá uma olhada nas notificações sempre que entrar — pode ter novidade boa!',
    ],
  },
]

export default function CentralDeAjudaPage() {
  const { theme } = useTheme()
  const { user: authUser } = useAuth()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  // Estados para modal de sugestões
  const [sugestaoModalOpen, setSugestaoModalOpen] = useState(false)
  const [sugestaoTexto, setSugestaoTexto] = useState('')
  const [tipoSugestao, setTipoSugestao] = useState<'melhoria' | 'bug'>('melhoria')
  const [sugestaoErro, setSugestaoErro] = useState('')
  const [sugestaoSucesso, setSugestaoSucesso] = useState('')
  const [enviandoSugestao, setEnviandoSugestao] = useState(false)
  const [sugestaoImagem, setSugestaoImagem] = useState<File | null>(null)
  const [sugestaoImagemResetTrigger, setSugestaoImagemResetTrigger] = useState(0)

  const toggleSection = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSendSugestao = async () => {
    if (!authUser?.id) {
      setSugestaoErro('Você precisa estar logado para enviar sugestões.')
      return
    }

    const textoLimpo = sugestaoTexto.trim()
    if (textoLimpo.length < 10) {
      setSugestaoErro('Por favor, descreva melhor sua sugestão ou bug (mínimo 10 caracteres).')
      return
    }

    setSugestaoErro('')
    setSugestaoSucesso('')
    setEnviandoSugestao(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Não autenticado')
      }

      const res = await fetch('/api/sugestoes/enviar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: tipoSugestao,
          mensagem: textoLimpo
        })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao enviar sugestão')
      }

      // Upload de imagem se houver
      if (sugestaoImagem && json.id) {
        try {
          const formData = new FormData()
          formData.append('imagem', sugestaoImagem)
          
          const resImagem = await fetch(`/api/sugestoes/${json.id}/imagem`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })
          
          const jsonImagem = await resImagem.json()
          
          if (!resImagem.ok) {
            console.error('Erro ao fazer upload de imagem:', jsonImagem)
            setSugestaoErro(`Sugestão enviada, mas houve erro ao fazer upload da imagem: ${jsonImagem.error || 'Erro desconhecido'}`)
            setSugestaoSucesso('✅ Sugestão enviada com sucesso!')
          } else if (jsonImagem.success && jsonImagem.imagem_url) {
            console.log('✅ Imagem enviada com sucesso:', jsonImagem.imagem_url)
            setSugestaoSucesso('✅ Sugestão enviada com imagem com sucesso!')
          } else {
            console.warn('Upload de imagem retornou sucesso mas sem URL:', jsonImagem)
            setSugestaoSucesso('✅ Sugestão enviada! (A imagem pode não ter sido enviada)')
          }
        } catch (imgError: any) {
          console.error('Erro ao fazer upload de imagem:', imgError)
          setSugestaoErro(`Sugestão enviada, mas houve erro ao fazer upload da imagem: ${imgError.message || 'Erro desconhecido'}`)
          setSugestaoSucesso('✅ Sugestão enviada com sucesso!')
        }
      } else {
        setSugestaoSucesso('✅ Sugestão enviada com sucesso! Obrigado pelo feedback.')
      }

      setSugestaoTexto('')
      setSugestaoImagem(null)
      setSugestaoImagemResetTrigger(prev => prev + 1)
      
      setTimeout(() => {
        setSugestaoModalOpen(false)
        setSugestaoSucesso('')
        setSugestaoErro('')
        setTipoSugestao('melhoria')
      }, 2000)
    } catch (error: any) {
      setSugestaoErro(error?.message || 'Erro ao enviar sugestão. Tente novamente.')
    } finally {
      setEnviandoSugestao(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          👋 Bem-vindo à Central de Ajuda!
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-700"
        )}>
          Aqui você descobre como aproveitar ao máximo o portal, ganhar XP, subir no ranking e participar da comunidade. Clique em cada seção abaixo pra saber mais!
        </p>
      </div>

      {/* Seções */}
      <div className="flex flex-col gap-4 md:gap-6">
        {sections.map((section) => {
          const Icon = section.icon || HelpCircle
          const isOpen = openIds.has(section.id)
          return (
            <div
              key={section.id}
              id={section.id}
              className={cn(
                "backdrop-blur-md border rounded-xl transition-colors duration-300",
                theme === 'dark'
                  ? "bg-gray-800/30 border-white/10"
                  : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
              )}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 md:p-5 text-left transition-colors",
                  theme === 'dark' ? "hover:bg-white/5" : "hover:bg-yellow-500/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  theme === 'dark'
                    ? "bg-white/5 border border-white/10"
                    : "bg-yellow-500/20 border border-yellow-500/40"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className={cn(
                        "text-lg font-bold",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {section.title}
                      </h2>
                      <p className={cn(
                        "text-sm mt-1",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}>
                        {section.summary}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 mt-1 transition-transform",
                        isOpen ? "rotate-180" : "rotate-0",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}
                    />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 md:px-5 md:pb-5">
                  <ul className="space-y-2 list-none text-sm md:text-base mt-2 md:mt-3">
                    {section.points.map((point, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          "pl-1",
                          theme === 'dark' ? "text-gray-300" : "text-gray-800"
                        )}
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Card de Sugestões/Bugs */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <div className="mb-4">
          <h2 className={cn(
            "text-lg md:text-xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Sugestões e Bugs
          </h2>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Encontrou algo errado ou tem uma ideia pra melhorar o portal? Conta pra gente! Seu feedback é super importante.
          </p>
        </div>
        <button
          onClick={() => setSugestaoModalOpen(true)}
          className={cn(
            "w-full px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2",
            theme === 'dark'
              ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/30"
              : "bg-yellow-500 text-white hover:bg-yellow-600"
          )}
        >
          <Send className="w-4 h-4" />
          Enviar Sugestão ou Relatar Bug
        </button>
      </div>

      {/* Modal de Sugestões/Bugs */}
      <Modal
        isOpen={sugestaoModalOpen}
        onClose={() => {
          setSugestaoModalOpen(false)
          setSugestaoTexto('')
          setSugestaoImagem(null)
          setSugestaoImagemResetTrigger(prev => prev + 1)
          setTipoSugestao('melhoria')
          setSugestaoErro('')
          setSugestaoSucesso('')
        }}
        title={
          <div className="flex items-center gap-2">
            {tipoSugestao === 'melhoria' ? (
              <Lightbulb className={cn("w-5 h-5", theme === 'dark' ? "text-yellow-400" : "text-yellow-600")} />
            ) : (
              <Bug className={cn("w-5 h-5", theme === 'dark' ? "text-red-400" : "text-red-600")} />
            )}
            <span className={cn(theme === 'dark' ? "text-white" : "text-gray-900")}>
              {tipoSugestao === 'melhoria' ? 'Sugestão de Melhoria' : 'Relato de Bug'}
            </span>
          </div>
        }
        size="md"
      >
        <div className="space-y-4">
          {/* Seletor de tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setTipoSugestao('melhoria')}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 border",
                tipoSugestao === 'melhoria'
                  ? theme === 'dark'
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-yellow-500 text-white border-yellow-500"
                  : theme === 'dark'
                  ? "bg-black/50 border-white/10 text-gray-400 hover:text-white hover:bg-black/70"
                  : "bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Lightbulb className="w-4 h-4" />
              Melhoria
            </button>
            <button
              onClick={() => setTipoSugestao('bug')}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 border",
                tipoSugestao === 'bug'
                  ? theme === 'dark'
                    ? "bg-red-400 text-white border-red-400"
                    : "bg-red-500 text-white border-red-500"
                  : theme === 'dark'
                  ? "bg-black/50 border-white/10 text-gray-400 hover:text-white hover:bg-black/70"
                  : "bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Bug className="w-4 h-4" />
              Bug
            </button>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label className={cn(
              "block text-sm font-medium",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              {tipoSugestao === 'melhoria' ? 'Descreva sua sugestão de melhoria' : 'Descreva o bug encontrado'}
            </label>
            <textarea
              value={sugestaoTexto}
              onChange={(e) => setSugestaoTexto(e.target.value)}
              placeholder={tipoSugestao === 'melhoria' 
                ? 'Ex: Seria interessante adicionar um filtro de busca na página de aulas...'
                : 'Ex: Ao clicar no botão X, a página não atualiza corretamente...'}
              className={cn(
                "w-full px-4 py-2 rounded-lg border text-sm min-h-[120px] focus:outline-none focus:ring-2 transition-colors resize-none",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              maxLength={1000}
            />
            <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
              {sugestaoTexto.length}/1000
            </p>
          </div>

          {/* Upload de Imagem */}
          <QuestionImageUpload
            onImageChange={setSugestaoImagem}
            currentImageUrl={null}
            resetTrigger={sugestaoImagemResetTrigger}
          />

          {/* Mensagens de erro/sucesso */}
          {sugestaoErro && (
            <div className={cn(
              "p-3 rounded-lg border text-sm",
              theme === 'dark'
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-red-50 border-red-200 text-red-700"
            )}>
              {sugestaoErro}
            </div>
          )}

          {sugestaoSucesso && (
            <div className={cn(
              "p-3 rounded-lg border text-sm",
              theme === 'dark'
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-green-50 border-green-200 text-green-700"
            )}>
              {sugestaoSucesso}
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
          }}>
            <button
              type="button"
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                theme === 'dark'
                  ? "bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              )}
              onClick={() => {
                setSugestaoModalOpen(false)
                setSugestaoTexto('')
                setTipoSugestao('melhoria')
                setSugestaoErro('')
                setSugestaoSucesso('')
              }}
              disabled={enviandoSugestao}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors",
                theme === 'dark'
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
                  : "bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50",
                enviandoSugestao && "cursor-not-allowed"
              )}
              onClick={handleSendSugestao}
              disabled={enviandoSugestao}
            >
              {enviandoSugestao ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
