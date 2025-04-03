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
      
      setSuccess(true)
      setEmail('')
      setName('')
      setPhone('')
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
      isAvailable: true
    },
    {
      type: 'Programação',
      title: 'Lógica de Programação',
      description: 'Aprenda a programar do absuluto zero com exemplos práticos e exercídios de fixação.',
      image: '/images/tech.png',
      isAvailable: true
    },
    {
      type: 'Programação',
      title: 'Mobile',
      description: 'Desenvolva apps para Android e iOS com Kotlin Multiplatform Mobile.',
      image: '/images/mobile.png',
      isAvailable: false
    },
    {
      type: 'Programação',
      title: 'Web',
      description: 'Aprenda os fundamentos da web com HTML, CSS e JavaScript.',
      image: '/images/web.png',
      isAvailable: false
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
                Uma nova era na programação.
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
                    Celular (opcional)
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
                  <h3 className="text-xl font-bold mt-2 mb-3">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-6">{course.description}</p>
                  <button 
                    className={`w-full px-6 py-3 rounded-full font-medium transition-all ${
                      course.isAvailable 
                        ? 'bg-[#FFD700] text-black hover:bg-opacity-90' 
                        : 'bg-white/5 text-white/50 cursor-not-allowed'
                    }`}
                    disabled={!course.isAvailable}
                  >
                    {course.isAvailable ? 'SAIBA MAIS' : 'EM BREVE'}
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
