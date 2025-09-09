'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

export default function JornadaZeroDev() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [utmParams, setUtmParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    source: ''
  })

  // Capture UTM parameters from URL
  useEffect(() => {
    const utm_source = searchParams.get('utm_source') || ''
    const utm_medium = searchParams.get('utm_medium') || ''
    const utm_campaign = searchParams.get('utm_campaign') || ''
    const source = searchParams.get('source') || ''
    
    setUtmParams({
      utm_source,
      utm_medium,
      utm_campaign,
      source
    })
  }, [searchParams])

  // Countdown timer - set to September 21st, 2025 at 17:00hrs
  useEffect(() => {
    const targetDate = new Date(Date.UTC(2025, 8, 21, 17, 0, 0)) // Month is 0-indexed, so 8 = September
    
    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        })
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ...utmParams,
          source: utmParams.source || 'jornada-zero-dev'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar formulário')
      }

      // Redirect to thank you page
      router.push('/thank-you')

    } catch (err: any) {
      // console.error('Error:', err) // Removed for security
      if (err?.message?.includes('duplicate') || err?.message?.includes('already exists')) {
        setError('Este e-mail já está cadastrado na jornada.')
      } else {
        setError('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Fixed Countdown Timer */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <div className="flex gap-2">
              <div className="bg-yellow-500/10 rounded px-2 py-1">
                <span className="text-yellow-400 font-bold text-sm">{timeLeft.days}</span>
                <span className="text-gray-400 text-xs block">dias</span>
              </div>
              <div className="bg-yellow-500/10 rounded px-2 py-1">
                <span className="text-yellow-400 font-bold text-sm">{timeLeft.hours}</span>
                <span className="text-gray-400 text-xs block">horas</span>
              </div>
              <div className="bg-yellow-500/10 rounded px-2 py-1">
                <span className="text-yellow-400 font-bold text-sm">{timeLeft.minutes}</span>
                <span className="text-gray-400 text-xs block">min</span>
              </div>
              <div className="bg-yellow-500/10 rounded px-2 py-1">
                <span className="text-yellow-400 font-bold text-sm">{timeLeft.seconds}</span>
                <span className="text-gray-400 text-xs block">seg</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-gradient-to-b from-yellow-500/20 via-yellow-400/10 to-black relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/mobile.png"
            alt="Background"
            fill
            className="object-cover"
            style={{ objectPosition: 'center right' }}
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Title and Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Event Date Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-black/80 to-zinc-900/80 border border-yellow-400/30 rounded-lg px-4 py-3 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-medium">21 de SETEMBRO às</span>
                      <span className="text-yellow-400 font-bold">17:00hrs</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-300 font-medium">EVENTO ONLINE</span>
                    </div>
                  </div>
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                  Jornada do Zero ao {' '}
                  <span className="text-yellow-400">Emprego</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                  <span className="relative inline-block">
                    <span className="relative z-10">Descubra como sair do zero</span>
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-yellow-400"></span>
                  </span>{' '}
                  e construir uma carreira em programação Android, mesmo que você nunca tenha escrito uma linha de código.
                </p>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <p className="text-yellow-400 font-bold">Evento 100% Gratuito</p>
                    <p className="text-gray-400 text-sm">conteúdo exclusivo</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Inscreva-se Agora</h3>
                  <p className="text-gray-400">Garanta sua vaga gratuita na jornada</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                    required
                    minLength={3}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Seu melhor e-mail"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                  >
                    {isLoading ? 'Enviando...' : 'Quero participar grátis'}
                  </button>
                </form>

                {error && (
                  <p className="text-red-400 text-sm text-center mt-4">{error}</p>
                )}

              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* O que você vai descobrir */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Vem aprender com quem chegou lá.
              </h2>
              <p className="text-xl text-gray-300">
                Um dia intensivo para transformar sua vida através da programação Android
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-zinc-700 rounded-xl overflow-hidden"
              >
                <div className="w-full h-48 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
                  <Image
                    src="/images/oqueestudar.png"
                    alt="O que estudar para programação"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">O que estudar.</h3>
                  <p className="text-gray-300 text-sm">Descubra exatamente quais tecnologias e conceitos você precisa dominar para se tornar um desenvolvedor Android.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/50 border border-zinc-700 rounded-xl overflow-hidden"
              >
                <div className="w-full h-48 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
                  <Image
                    src="/images/requisitovaga.png"
                    alt="Como organizar estudos"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Requisitos das vagas</h3>
                  <p className="text-gray-300 text-sm">Aprenda quais são os requisitos das vagas para se tornar um desenvolvedor Android.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/50 border border-zinc-700 rounded-xl overflow-hidden"
              >
                <div className="w-full h-48 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
                  <Image
                    src="/images/cincoerros.png"
                    alt="Carreira internacional"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">5 Erros</h3>
                  <p className="text-gray-300 text-sm">Aprenda quais são os 5 erros que você precisa evitar para se tornar um desenvolvedor Android.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900/50 border border-zinc-700 rounded-xl overflow-hidden"
              >
                <div className="w-full h-48 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
                  <Image
                    src="/images/passoscomecar.png"
                    alt="Passo a passo para carreira"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">3 Passos para começar</h3>
                  <p className="text-gray-300 text-sm">Aprenda quais são os 3 passos para começar a programar Android.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Minha história / Autoridade */}
      <section className="py-20 bg-gradient-to-br from-black via-black to-yellow-600/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">
                  Minha História
                </h2>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  Comecei do zero, sem dinheiro e sem conhecimento técnico. Trabalhei como freelancer para conseguir pagar meus estudos, 
                  construí minha carreira no Spotify e hoje vivo o que sempre sonhei: ser um desenvolvedor Android.
                </p>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  Eu já estive no seu lugar e sei como é começar perdido. Agora quero encurtar seu caminho 
                  e te ajudar a conquistar os mesmos resultados que eu consegui.
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-yellow-400 font-bold">+12 anos de experiência</p>
                    <p className="text-gray-400 text-sm">Desenvolvimento Android</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full flex items-center justify-center">
                    <div className="w-64 h-64 bg-black rounded-full overflow-hidden">
                      <Image
                        src="/images/roque.png"
                        alt="Roque - Instrutor da Jornada"
                        width={256}
                        height={256}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Salários Android */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Salários de Desenvolvedores Android
              </h2>
              <p className="text-xl text-gray-300">
                Veja quanto você pode ganhar em cada nível da carreira
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Junior */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-8 text-center"
              >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-4xl">🌱</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Junior</h3>
                <div className="mb-6">
                  <p className="text-3xl font-bold text-green-400 mb-2">R$ 3.500 - 6.000</p>
                  <p className="text-gray-400 text-sm">por mês</p>
                </div>
                <ul className="text-left space-y-3 text-gray-300 text-sm mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    0-2 anos de experiência
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Conhecimento básico de Kotlin
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Familiaridade com Android Studio
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Primeiros projetos no portfólio
                  </li>
                </ul>
                
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-green-400 text-xl">🎯</span>
                    <span className="text-green-400 font-bold text-sm">Vou te ensinar a chegar aqui!</span>
                  </div>
                  <p className="text-gray-300 text-xs">Do zero absoluto até este nível</p>
                </div>
              </motion.div>

              {/* Pleno */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-8 text-center relative"
              >
                
                <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-4xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Pleno</h3>
                <div className="mb-6">
                  <p className="text-3xl font-bold text-yellow-400 mb-2">R$ 6.000 - 12.000</p>
                  <p className="text-gray-400 text-sm">por mês</p>
                </div>
                <ul className="text-left space-y-3 text-gray-300 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">✓</span>
                    2-5 anos de experiência
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">✓</span>
                    Domínio avançado de Kotlin
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">✓</span>
                    Conhecimento de arquiteturas (MVVM, Clean)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-400">✓</span>
                    Experiência com APIs e bibliotecas
                  </li>
                </ul>
              </motion.div>

              {/* Senior */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-8 text-center"
              >
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-4xl">👑</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Senior</h3>
                <div className="mb-6">
                  <p className="text-3xl font-bold text-purple-400 mb-2">R$ 12.000 - 25.000</p>
                  <p className="text-gray-400 text-sm">por mês</p>
                </div>
                <ul className="text-left space-y-3 text-gray-300 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    5+ anos de experiência
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Liderança técnica e mentoria
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Arquitetura de sistemas complexos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Experiência internacional
                  </li>
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 text-center"
            >
              <p className="text-gray-400 text-sm">
                * Salários baseados em dados do mercado brasileiro de 2024
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Para quem é a Jornada */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Para quem é a Jornada?
              </h2>
              <p className="text-xl text-gray-300">
                Se você se identifica com algum desses perfis, esta jornada é para você
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "🚀",
                  title: "Quem nunca programou e quer começar",
                  description: "Se você está no zero absoluto e quer dar o primeiro passo na programação."
                },
                {
                  icon: "🔄",
                  title: "Quem já tentou aprender mas se perdeu",
                  description: "Se você já começou várias vezes mas sempre desistiu no meio do caminho."
                },
                {
                  icon: "😰",
                  title: "Quem tem medo de não conseguir aprender",
                  description: "Se você acha que programação é muito difícil ou que não tem o perfil certo."
                },
                {
                  icon: "🌍",
                  title: "Quem sonha em trabalhar com tecnologia e morar fora",
                  description: "Se você quer construir uma carreira internacional na área de tecnologia."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios + Bônus */}
      <section className="py-20 bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                O que você vai ganhar participando?
              </h2>
              <p className="text-xl text-gray-300">
                Benefícios exclusivos somente para quem estiver na live!
              </p>
            </motion.div>

            {/* Bônus Destaque */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">🎁</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Bônus Exclusivo</h3>
              <p className="text-lg text-gray-300 mb-6">
                Plano de estudos completo e detalhado para você seguir durante os próximos meses. 
                Um roteiro passo a passo que vai te economizar meses de tempo perdido.
              </p>
              <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
                <span className="text-sm">→ GRÁTIS para participantes</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Antes vs Depois */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Antes vs Depois da Jornada
              </h2>
              <p className="text-xl text-gray-300">
                Veja a transformação que você vai experimentar
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Antes */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">😵</span>
                  </div>
                  <h3 className="text-2xl font-bold text-red-400 mb-4">ANTES</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">❌</span>
                    <span className="text-gray-300">Perdido entre tantas informações soltas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">❌</span>
                    <span className="text-gray-300">Sem saber qual área seguir</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">❌</span>
                    <span className="text-gray-300">Sem confiança para dar o primeiro passo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">❌</span>
                    <span className="text-gray-300">Pulando de tutorial em tutorial</span>
                  </li>
                </ul>
              </motion.div>

              {/* Depois */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-xl p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">DEPOIS</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">✅</span>
                    <span className="text-gray-300">Clareza sobre as áreas da programação</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">✅</span>
                    <span className="text-gray-300">Confiança para escolher seu caminho</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">✅</span>
                    <span className="text-gray-300">Base sólida para construir sua carreira</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">✅</span>
                    <span className="text-gray-300">Plano estruturado e confiança no caminho certo</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="py-20 bg-gradient-to-br from-black via-black to-yellow-600/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Agenda da Jornada
              </h2>
              <p className="text-xl text-gray-300">
                Conteúdo exclusivo para quem estiver na live!
              </p>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  day: "1",
                  title: "Minha Jornada",
                  description: "Como saí do zero e construí uma carreira internacional em desenvolvimento Android."
                },
                {
                  day: "2",
                  title: "O que Estudar",
                  description: "As tecnologias essenciais que você precisa dominar para se tornar um desenvolvedor Android."
                },
                {
                  day: "3",
                  title: "Organização + Bônus",
                  description: "Como organizar seus estudos e receber o plano completo de 3 meses."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400 font-bold">{item.day}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Reforço */}
      <section className="py-20 bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Inscreva-se agora e receba o plano de estudos completo
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Não perca essa oportunidade de transformar sua vida através da programação Android. 
              </p>
              
              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                  required
                  minLength={3}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Seu melhor e-mail"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                >
                  {isLoading ? 'Enviando...' : 'Quero participar grátis agora'}
                </button>
              </form>

              {error && (
                <p className="text-red-400 text-sm text-center mt-4">{error}</p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Perguntas Frequentes
              </h2>
              <p className="text-xl text-gray-300">
                Tire suas dúvidas sobre a jornada
              </p>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  question: "Quanto custa participar?",
                  answer: "Nada! A jornada é 100% gratuita. Você só precisa se inscrever e participar dos 3 dias de evento."
                },
                {
                  question: "Preciso ter experiência em programação?",
                  answer: "Não! A jornada é especificamente para quem está começando do zero. Não é necessário nenhum conhecimento prévio."
                },
                {
                  question: "Como vou receber o plano de estudos?",
                  answer: "O plano de estudos será enviado para o seu e-mail no final do evento, junto com todos os materiais complementares."
                },
               
                {
                  question: "O plano de estudos realmente funciona?",
                  answer: "Sim! É o mesmo método que usei para construir minha carreira. Mesmo que você não continue comigo depois, só esse plano já vai te economizar meses de tempo perdido."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-3">{item.question}</h3>
                  <p className="text-gray-300">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Nova Era</h3>
            <p className="text-gray-400 mb-6">
              Transformando vidas através da programação
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="https://instagram.com/escolanovaeratech" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-400 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Nova Era Tech. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
