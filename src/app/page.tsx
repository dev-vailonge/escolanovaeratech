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
  const [selectedType, setSelectedType] = useState('Todos')

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
      type: 'Negócios',
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
      isAvailable: true,
      link: '/mobile'
    },
    {
      type: 'Programação',
      title: 'Web',
      description: 'Aprenda os fundamentos da web com HTML, CSS e JavaScript.',
      image: '/images/web.png',
      isAvailable: true,
      link: '/web'
    }
    ,
    {
      type: 'Inovação',
      title: 'Inteligência Artificial',
      description: 'Domine Inteligência Artificial desde o zero com exemplos práticos e exercídios.',
      image: '/images/ai.png',
      isAvailable: false,
      link: '/ai'
    }
    ,
    {
      type: 'Negócios',
      title: 'Negócio Independente',
      description: 'Aprenda a criar uma empresa de uma pessoa só com muita tecnologia.',
      image: '/images/onepersoncompany.png',
      isAvailable: false,
      link: '/onepersoncompany'
    }
    ,
    {
      type: 'Inovação',
      title: 'Criação de Audiência',
      description: 'Aprenda a criar seus projetos em público e construir uma audiência para seu negócio.',
      image: '/images/maker.png',
      isAvailable: false,
      link: '/maker'
    }
    ,
    {
      type: 'Inovação',
      title: 'Automação de Processos com IA',
      description: 'Aprenda a automatizar seus processos com IA, economizando tempo e aumentando a eficiência.',
      image: '/images/automation.png',
      isAvailable: false,
      link: '/automation'
    }
    ,
    {
      type: 'Programação',
      title: 'Orientação a Objetos',
      description: 'Aprenda a programar orientado a objetos com Java, uma das linguagens mais usadas no mundo.',
      image: '/images/oop.png',
      isAvailable: false,
      link: '/oop'
    }
    ,
    {
      type: 'Programação',
      title: 'Estrutura de dados e algoritmos',
      description: 'Fundamental para quem busca emprego fora do Brasil ou em big techs.',
      image: '/images/dsa.png',
      isAvailable: false,
      link: '/dsa'
    }
    ,
    {
      type: 'Programação',
      title: 'Freelancer',
      description: 'Aprenda a ser um freelancer de sucesso com estratégia e tenha clientes sempre.',
      image: '/images/freelancer.png',
      isAvailable: false,
      link: '/freelancer'
    }
    ,
    {
      type: 'Programação',
      title: 'Carreira Global',
      description: 'Aprenda a ter uma carreira global com estratégia e destrave processos seletivos ao redor do mundo.',
      image: '/images/global.png',
      isAvailable: false,
      link: '/global'
    }
    
  ]

  const courseTypes = ['Todos', ...new Set(courses.map(course => course.type))]
  const filteredCourses = selectedType === 'Todos' 
    ? courses 
    : courses.filter(course => course.type === selectedType)

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
          
          {/* Type Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {courseTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedType === type
                    ? 'bg-yellow-400 border-yellow-400 text-black font-medium'
                    : 'border-white/10 text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course, index) => (
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

        {/* Methodology Section */}
        <section className="py-32 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Nossa Metodologia
              </h2>
              <p className="text-xl text-gray-400">
                Aprenda fazendo, não apenas assistindo.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left side - Progress bars */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Assistindo aulas</span>
                    <span className="text-yellow-400">20%</span>
                  </div>
                  <div className="h-4 bg-zinc-900/50 rounded-full overflow-hidden">
                    <div className="h-full w-[20%] bg-yellow-400 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Praticando e construindo</span>
                    <span className="text-yellow-400">80%</span>
                  </div>
                  <div className="h-4 bg-zinc-900/50 rounded-full overflow-hidden">
                    <div className="h-full w-[80%] bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
              </motion.div>

              {/* Right side - Features */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Aprendizado Prático</h3>
                    <p className="text-gray-400">Foco em projetos reais e desafios práticos que simulam o dia a dia do mercado.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Autonomia</h3>
                    <p className="text-gray-400">Aprenda a resolver problemas com ajuda de IA e nossos softwares, desenvolvendo independência técnica.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Comunidade Ativa</h3>
                    <p className="text-gray-400">Acesso a uma comunidade de desenvolvedores prontos para ajudar quando necessário.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {/* Logo and Description */}
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold text-white mb-4">Nova Era</h3>
                <p className="text-gray-400 mb-6">
                  Uma escola de programação focada em resultados, onde você aprende fazendo e com suporte da comunidade.
                </p>
                <div className="flex gap-4">
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
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Links Rápidos</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="/logica" className="text-gray-400 hover:text-yellow-400 transition-colors">Lógica de Programação</a>
                  </li>
                  <li>
                    <a href="/web" className="text-gray-400 hover:text-yellow-400 transition-colors">Desenvolvimento Web</a>
                  </li>
                  <li>
                    <a href="/mobile" className="text-gray-400 hover:text-yellow-400 transition-colors">Desenvolvimento Mobile</a>
                  </li>
                  <li>
                    <a href="https://www.mvpespresso.dev/" className="text-gray-400 hover:text-yellow-400 transition-colors">MVP Espresso</a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Contato</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="mailto:contato@escolanovaeratech.com.br" className="text-gray-400 hover:text-yellow-400 transition-colors">
                      contato@escolanovaeratech.com.br
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} Nova Era Tech. Todos os direitos reservados.
                </p>
                <div className="flex gap-6">
                  <a href="/privacidade" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                    Política de Privacidade
                  </a>
                  <a href="/termos" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                    Termos de Uso
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}

