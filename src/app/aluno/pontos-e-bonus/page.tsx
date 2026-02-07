'use client'

import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import {
  Award,
  MessageSquare,
  CheckCircle,
  Target,
  FileText,
  Calendar,
  Trophy,
  Plane,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import Image from 'next/image'

// Links de CTA (podem ser movidos para .env depois)
const LINK_WHATSAPP_COMERCIAL = 'https://wa.me/5534984136388'
const LINK_COMPRA_FORMACAO = 'https://escolanovaeratech.com.br' // placeholder
// Links das formações (Hotmart)
const LINKS_FORMACOES = {
  android: 'https://pay.hotmart.com/A102787902R?bid=1769602808367',
  web: 'https://pay.hotmart.com/U102787997Q?bid=1769602851992',
  backend: 'https://pay.hotmart.com/K102792839B?bid=1769602889517',
  ios: 'https://pay.hotmart.com/W102792939J?bid=1769602931930',
} as const

export default function PontosEBonusPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Hero */}
      <section className="text-center">
        <h1
          className={cn(
            'text-2xl md:text-3xl font-bold mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          Pontos e Bônus
        </h1>
        <p
          className={cn(
            'text-sm md:text-base max-w-2xl mx-auto',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Entenda como ganhar XP e concorra aos prêmios da escola.
        </p>
      </section>

      {/* Como funcionam os pontos */}
      <section>
        <h2
          className={cn(
            'text-lg md:text-xl font-bold mb-4 flex items-center gap-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          <Award className={cn('w-5 h-5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
          Como funcionam os pontos?
        </h2>
        <p
          className={cn(
            'text-sm mb-4',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          Você ganha XP (pontos de experiência) em várias atividades. Quanto mais participar, mais sobe no ranking.
        </p>

        <div
          className={cn(
            'rounded-xl border overflow-hidden',
            isDark ? 'bg-black/30 border-white/10' : 'bg-yellow-500/10 border-yellow-400/30'
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn(
                  'border-b',
                  isDark ? 'border-white/10 bg-white/5' : 'border-yellow-400/30 bg-yellow-500/20'
                )}>
                  <th className={cn('text-left py-3 px-4 font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    Tipo
                  </th>
                  <th className={cn('text-right py-3 px-4 font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-yellow-400/20')}>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Participar de evento
                  </td>
                  <td className="py-3 px-4 text-right font-medium">300 XP</td>
                </tr>
                <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-yellow-400/20')}>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Target className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Desafio concluído
                  </td>
                  <td className="py-3 px-4 text-right font-medium">150 XP</td>
                </tr>
                <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-yellow-400/20')}>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Comunidade: resposta certa
                  </td>
                  <td className="py-3 px-4 text-right font-medium">30 XP</td>
                </tr>
                <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-yellow-400/20')}>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Quiz
                  </td>
                  <td className="py-3 px-4 text-right font-medium">até 10 XP (proporcional ao acerto)</td>
                </tr>
                <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-yellow-400/20')}>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Comunidade: pergunta
                  </td>
                  <td className="py-3 px-4 text-right font-medium">5 XP</td>
                </tr>
                <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-yellow-400/20')}>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Comunidade: resposta
                  </td>
                  <td className="py-3 px-4 text-right font-medium">1 XP</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    Formulário preenchido
                  </td>
                  <td className="py-3 px-4 text-right font-medium">1 XP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bônus 1: Placa */}
      <section>
        <h2
          className={cn(
            'text-lg md:text-xl font-bold mb-4 flex items-center gap-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          <Trophy className={cn('w-5 h-5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
          Bônus 1: Placa do Campeão do Mês
        </h2>
        <div
          className={cn(
            'rounded-xl border overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0',
            isDark ? 'bg-black/30 border-white/10' : 'bg-yellow-500/10 border-yellow-400/30'
          )}
        >
          <div className="relative w-full h-80 md:h-96 overflow-hidden rounded-lg md:rounded-l-xl">
            <Image
              src="/images/placa.jpeg"
              alt="Placa do Campeão do Mês"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center space-y-4">
            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Como ganhar uma placa?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Todo mês o aluno que mais pontuar ganha esta placa. <strong>Todos os alunos da escola podem ganhar</strong> — basta ser o primeiro no ranking do mês. Participe das aulas, quizzes, desafios e comunidade para acumular XP e concorrer.
              </p>
            </div>
            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Onde posso receber?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                As placas são enviadas atualmente apenas para endereços no Brasil. Se você mora fora do país, pode informar o endereço de alguém no Brasil que possa receber a placa por você. Estamos trabalhando para viabilizar envios internacionais em breve.
              </p>
            </div>
            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Posso receber mais do que uma?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Sim. Se você for o campeão no ranking em mais de um mês, receberá uma placa por cada mês em que ficar em primeiro lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bônus 2: Viagem + evento */}
      <section>
        <h2
          className={cn(
            'text-lg md:text-xl font-bold mb-4 flex items-center gap-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          <Plane className={cn('w-5 h-5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
          Bônus 2: Viagem + Evento de Tecnologia com o Roque
        </h2>
        <div
          className={cn(
            'rounded-xl border overflow-hidden',
            isDark ? 'bg-black/30 border-white/10' : 'bg-yellow-500/10 border-yellow-400/30'
          )}
        >
          {/* Imagem 1200x300 */}
          <div className="relative w-full aspect-[4/1] min-h-[120px] bg-gray-800">
            <Image
              src="/images/card_viagem.png"
              alt="Viagem + Evento de Tecnologia"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>

          <div className="p-4 md:p-6 space-y-5">
            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Como ganhar a viagem?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                O vencedor é o aluno que estiver em primeiro lugar no <strong>ranking geral</strong> ao final do ano. A contabilização dos pontos é fechada no dia 31 de dezembro e quem tiver acumulado mais XP no ano leva o prêmio. Por isso, <strong>constância</strong> é fundamental: quanto mais você participar ao longo do ano, maiores suas chances.
              </p>
            </div>

            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Quem pode ganhar?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                A viagem internacional é disputada apenas por alunos <strong>matriculados em nossas formações</strong> (Android, iOS, Web ou Backend). Os cursos Norte Tech e MVP Espresso não entram nessa categoria, mas seus alunos continuam concorrendo às <strong>placas do campeão do mês</strong> — basta ficar em primeiro no ranking mensal.
              </p>
            </div>

            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Quando será a viagem?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                A data da viagem é definida em conjunto com o(a) aluno(a) vencedor(a), sempre no ano seguinte à conquista. Exemplo: quem vencer em 2026 realiza a viagem em 2027.
              </p>
            </div>

            <div>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                O que está incluso na viagem?
              </h3>
              <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
                O bônus inclui <strong>passagem aérea de até R$ 10.000,00</strong> e <strong>ingresso para evento de tecnologia de até R$ 5.000,00</strong>, totalizando <strong>R$ 15.000,00</strong> em prêmio.
              </p>
            </div>

            <div className={cn('rounded-lg border p-4', isDark ? 'bg-black/40 border-white/10' : 'bg-yellow-500/15 border-yellow-400/30')}>
              <h3 className={cn('text-sm font-bold mb-1.5', isDark ? 'text-white' : 'text-gray-900')}>
                Não sou aluno da formação. O que posso fazer?
              </h3>
              <p className={cn('text-sm md:text-base mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Quem já faz o Norte Tech pode dar o próximo passo: entrar em uma formação do zero ao avançado na área em que mais se identificou. Assim você passa a concorrer à viagem e aprofunda no caminho que escolheu. Escolha uma das formações abaixo:
              </p>
              <ul className="flex flex-wrap gap-2 mb-4">
                {(['android', 'ios', 'web', 'backend'] as const).map((key) => (
                  <li key={key}>
                    <a
                      href={LINKS_FORMACOES[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-500/30 text-yellow-800 hover:bg-yellow-500/50'
                      )}
                    >
                      {key === 'android' ? 'Android' : key === 'ios' ? 'iOS' : key === 'web' ? 'Web' : 'Backend'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className={cn('text-sm mb-3', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Ou, se tiver dúvidas, fale com nosso time comercial:
              </p>
              <a
                href={LINK_WHATSAPP_COMERCIAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-700 text-white transition-colors w-fit"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
