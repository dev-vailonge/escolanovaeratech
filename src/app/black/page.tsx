'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Black2026Page() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [urlParams, setUrlParams] = useState({
    source: '',
    affiliate: ''
  })

  useEffect(() => {
    // Get parameters from URL
    const params = new URLSearchParams(window.location.search)
    setUrlParams({
      source: params.get('source') || '',
      affiliate: params.get('affiliate') || ''
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || '',
          source: urlParams.source || 'black-2026',
          course: 'black-2026'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar formulário')
      }

      setSuccess(true)
    } catch (err: any) {
      if (err?.message?.includes('duplicate') || err?.message?.includes('already exists')) {
        setError('Este e-mail já está cadastrado na lista VIP.')
      } else {
        setError('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideRight {
          0% { transform: translateX(-50%) skewY(-2deg); }
          100% { transform: translateX(50%) skewY(-2deg); }
        }
        @keyframes slideLeft {
          0% { transform: translateX(50%) skewY(2deg); }
          100% { transform: translateX(-50%) skewY(2deg); }
        }
      `}</style>
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
      <section className="pt-16 pb-8 bg-gradient-to-b from-black via-black to-yellow-500/5 min-h-[70vh] flex items-center relative" style={{background: 'radial-gradient(ellipse at right, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0.1) 30%, rgba(0, 0, 0, 1) 70%)'}}>
        <div className="container mx-auto px-4 max-w-none">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Section - Text Only */}
            <div className="text-white ml-8">
              {/* Headline */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Estude <span className="text-yellow-400">trabalhando</span> em projetos reais
              </h2>
              
              {/* Description */}
              <p className="text-lg text-white/90 mb-8">
                Ninguém aguenta mais somente aulas gravadas, o mercado pede por experiência real. Então é isso que você vai aprender. Vem aprender com quem chegou onde você quer chegar.
              </p>
            </div>

            {/* Right Section - Form */}
            <div className="text-white">
              {/* CTA Form */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-bold mb-3 text-center text-white">
                 Cadastre-se gratuitamente
                </h3>
                
                {success ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-green-500 mb-2">Você está na lista VIP!</h4>
                    <p className="text-gray-300 text-xs">Você será notificado sobre o lançamento e receberá benefícios exclusivos.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs text-white mb-1">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Digite seu nome"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm"
                        required
                        minLength={3}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Digite seu melhor e-mail"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white mb-1">
                        Celular
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+55 11 98765-4321"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Exemplo: +55 para Brasil, +1 para EUA/Canadá
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isLoading ? 'Enviando...' : 'ME INSCREVER'}
                    </button>

                    {error && (
                      <p className="text-red-400 text-xs text-center">{error}</p>
                    )}
                  </form>
                )}
              </div>
            </div>

          </div>

          {/* Diagonal Banner Ribbons */}
          <div className="mt-12 h-32 -mx-4 overflow-hidden z-10 relative w-screen">
            {/* First Diagonal Ribbon - GRATUITO */}
            <div className="absolute bottom-12 left-0 w-full h-16 transform -skew-y-3"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(100,100,100,0.6) 50%, rgba(0,0,0,0.8) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-lg tracking-[0.2em] whitespace-nowrap uppercase drop-shadow-lg">
                  ✦ GRATUITO ✦ GRATUITO ✦ GRATUITO ✦ GRATUITO ✦ GRATUITO ✦
                </div>
              </div>
            </div>

            {/* Second Diagonal Ribbon - INSCREVA-SE */}
            <div className="absolute bottom-2 left-0 w-full h-14 transform skew-y-3"
              style={{
                background: 'linear-gradient(45deg, rgba(100,100,100,0.6) 0%, rgba(0,0,0,0.8) 50%, rgba(100,100,100,0.6) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-base tracking-[0.3em] whitespace-nowrap uppercase drop-shadow-lg">
                  ✦ INSCREVA-SE ✦ INSCREVA-SE ✦ INSCREVA-SE ✦ INSCREVA-SE ✦
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Learning Modules Section */}
      <section className="py-4 bg-gradient-to-b from-yellow-500/5 via-yellow-900/3 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Veja o que você aprenderá:
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Module 1 */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-black"></div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-yellow-400 font-bold text-sm">MERCADO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Principais áreas de mercado
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Aprenda quais sao as principais áreas de mercado para se especializar. Quais sao as principais linguagens de programação para cada área.
              </p>
            </div>

            {/* Module 2 */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-black"></div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-yellow-400 font-bold text-sm">PREPARAÇÃO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Plano de estudos com foco em requisitos reais das vagas
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Plano de estudos com foco em requisitos reais das vagas. Você vai aprender a se especializar em uma área e a se tornar um profissional qualificado para o mercado.
              </p>
            </div>

            {/* Module 3 */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-black"></div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-yellow-400 font-bold text-sm">RESULTADO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Tenha resultados reais, trabalhando em projetos.
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Tenha resultados reais, trabalhando em projetos. Você vai aprender a se especializar em uma área e a se tornar um profissional qualificado para o mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

     
      {/* Authority Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src="/images/roque1234.png"
                  alt="Roque - Programador e Educador"
                  width={400}
                  height={400}
                  className="rounded-2xl"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Uma escola criada por quem vive de programação.
                </h2>
                
                <div className="text-lg text-gray-300 space-y-4">
                  <p>Eu sou <span className="text-yellow-500 font-semibold">Roque</span>, programador e educador.</p>
                  <p>Depois de anos ensinando milhares de alunos e trabalhando no <span className="text-green-500 font-semibold">Spotify</span>, percebi uma coisa:</p>
                  <p className="text-xl text-yellow-500 font-semibold">👉 As pessoas não precisam de mais cursos,<br />elas precisam de experiência real.</p>
                  <p>E é exatamente isso que a Nova Era vai entregar.</p>
                </div>

                <button
                  onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl transition-all text-lg"
                >
                  🔔 Quero fazer parte da Nova Era
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      
      </main>
    </>
  )
}

