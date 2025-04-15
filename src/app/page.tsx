'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get source from URL parameters
    const params = new URLSearchParams(window.location.search)
    const sourceParam = params.get('source')
    if (sourceParam) {
      setSource(sourceParam)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const formData = {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        source: source || undefined
      }

      const { error: supabaseError } = await supabase
        .from('waiting_list')
        .insert([formData])
      
      if (supabaseError) throw supabaseError
      
      // Redirect to thank you page
      window.location.href = '/thank-you'
    } catch (err: any) {
      console.error('Error:', err)
      if (err?.message?.includes('duplicate')) {
        setError('Este e-mail já está cadastrado na lista de espera.')
      } else {
        setError('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)
  }

  const courses = [
    {
      type: 'SaaS',
      title: 'MVP - Espresso',
      description: 'Lance suas ideias no mercado em poucos dias com um template pronto para você.',
      image: '/images/mvp.png',
      isAvailable: true,
      link: 'https://www.mvpespresso.dev/'
    },
    {
      type: 'Programação',
      title: 'Lógica de Programação',
      description: 'Aprenda a programar do absuluto zero com exemplos práticos e exercídios de fixação.',
      image: '/images/tech.png',
      isAvailable: true,
      link: '/logica'
    },
    {
      type: 'Programação',
      title: 'Mobile',
      description: 'Desenvolva apps para Android e iOS com Kotlin Multiplatform Mobile.',
      image: '/images/mobile.png',
      isAvailable: false,
      link: ''
    },
    {
      type: 'Programação',
      title: 'Web',
      description: 'Aprenda os fundamentos da web com HTML, CSS e JavaScript.',
      image: '/images/web.png',
      isAvailable: false,
      link: ''
    }
  ]

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <nav className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Nova Era</h1>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold text-white leading-tight"
              >
                Aprenda programação com estratégia.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-400"
              >
                Em breve lançaremos nosso primeiro curso de lógica de programação{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">100% grátis por tempo limitado</span>
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-yellow-400"></span>
                </span>
                .
              </motion.p>
            </div>

            {/* Right side - Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto w-full border border-white/10"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
                    Nome completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu melhor e-mail"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm text-gray-400 mb-2">
                    Celular
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 11 98765-4321"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Exemplo: +55 para Brasil, +1 para EUA/Canadá
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-400 text-black font-semibold py-3 px-6 rounded-xl hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Enviando...' : 'Quero ser avisado'}
                </button>

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                {success && (
                  <p className="text-green-400 text-sm text-center">
                    Cadastro realizado com sucesso! Em breve você receberá novidades.
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 bg-gradient-to-b from-black to-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 3.516L20.297 19H3.703L12 5.516zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z"/>
                </svg>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-extrabold text-white tracking-tight"
              >
                A Nova Era chegou.
              </motion.h2>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-12 text-gray-300 text-lg md:text-xl leading-relaxed"
            >
              <div className="space-y-8">
                <p className="relative pl-6 border-l-2 border-yellow-400">
                  Acreditamos que os estudos abrem portas, e por isso criamos a Nova Era. Uma escola de programação com foco em IA e empreendedorismo.
                </p>
                <p>
                  Chega de enrolação. Vamos direto ao ponto: te ensinamos a programar com propósito, 
                  aplicar seus aprendizados em projetos reais e usar a{' '}
                  <span className="text-white font-medium relative">
                    inteligência artificial ao seu favor
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400/50"></span>
                  </span>{' '}
                  seja para conquistar sua primeira vaga na área ou para construir sua independência com programação.
                </p>
                <p className="text-gray-400 text-center">Através dos nossos 4 pilares você irá aprender com estratégia.</p>
              </div>
              <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-screen-2xl mx-auto px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-zinc-900/50 p-6 rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Negócios</h3>
                  <p className="text-gray-400">Na Nova Era, programadores também criam seus próprios negócios.</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-zinc-900/50 p-6 rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Programação</h3>
                  <p className="text-gray-400">Sim, hoje muito se pode fazer com IA, mas aprender fundamentos é muito importante.</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-zinc-900/50 p-6 rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Inovação</h3>
                  <p className="text-gray-400">Continuar inovando com inteligência artificial para te dar mais velocidade.</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-zinc-900/50 p-6 rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Networking</h3>
                  <p className="text-gray-400">Se conectar com pessoas que estão onde você quer chegar pode te economizar muito tempo.</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12">
            Conheça nossos cursos
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-black border border-white/10 rounded-lg overflow-hidden group">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <div className="absolute inset-0"></div>
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  {!course.isAvailable && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-[#FFD700] text-black text-xs font-medium px-3 py-1 rounded-full">
                        Em breve
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{course.type}</span>
                    {!course.isAvailable && (
                      <span className="text-[#FFD700] text-sm">Em breve</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-6">{course.description}</p>
                  <button 
                    className={`w-full px-6 py-3 rounded-full font-medium transition-all ${
                      course.isAvailable 
                        ? 'bg-[#FFD700] text-black hover:bg-opacity-90' 
                        : 'bg-white/5 text-white/50 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (course.isAvailable && course.link) {
                        window.location.href = course.link
                      }
                    }}
                    disabled={!course.isAvailable}
                  >
                    {course.isAvailable ? 'Acessar curso' : 'Em breve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

