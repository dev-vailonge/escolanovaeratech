'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  CodeBracketIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  CommandLineIcon,
  GlobeAltIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

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
      }

      // Add phone if it exists (no validation)
      if (phone.trim()) {
        Object.assign(formData, { phone: phone.trim() })
      }

      // Add source if it exists
      if (source) {
        Object.assign(formData, { source })
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

  const keywords = [
    { icon: CommandLineIcon, text: 'Código' },
    { icon: GlobeAltIcon, text: 'Remoto' },
    { icon: UserGroupIcon, text: 'Comunidade' },
    { icon: SparklesIcon, text: 'Futuro' },
    { icon: ChartBarIcon, text: 'Carreira' },
    { icon: RocketLaunchIcon, text: 'Liberdade' },
  ]

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
      isAvailable: false,
      link: 'https://logica.escolanovaeratech.com.br'
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">Nova Era</h1>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-left">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                Uma nova era na programação.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-400 mb-12"
              >
                Em breve lançaremos nosso primeiro curso de lógica de programação{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">100% grátis por tempo limitado</span>
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#FFD700] opacity-100"></span>
                </span>
                .
              </motion.p>
            </div>

            {/* Right side - Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#111111] rounded-3xl p-8 max-w-md"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                    required
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    Exemplo: +55 para Brasil, +1 para EUA/Canadá
                  </span>
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FFD700] text-black px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Enviando...' : 'Quero ser avisado'}
                </button>
                
                {success && (
                  <p className="mt-4 text-green-400 text-sm text-center">
                    Obrigado! Você foi adicionado à lista de espera.
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-1 h-8 bg-[#FFD700]"></div>
            <h2 className="text-4xl font-bold">Conheça nossos cursos</h2>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    {course.isAvailable ? (
                      <a 
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-6 py-3 rounded-full font-medium transition-all bg-[#FFD700] text-black hover:bg-opacity-90 text-center"
                      >
                        SAIBA MAIS
                      </a>
                    ) : (
                      <button 
                        className="w-full px-6 py-3 rounded-full font-medium transition-all bg-white/5 text-white/50 cursor-not-allowed"
                        disabled
                      >
                        EM BREVE
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
