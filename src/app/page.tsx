'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Home() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('Todos')
  const [currentSlide, setCurrentSlide] = useState(0)

  const carouselImages = [
    '/images/carrossel1.png',
    '/images/carrossel2.png', 
    '/images/carrossel3.png'
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
        phone: phone.trim() || '',
        source: source || 'landing-page'
      }

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar formulário')
      }

      // Redirect to thank you page
      window.location.href = '/thank-you'

    } catch (err: any) {
      console.error('Error:', err)
      if (err?.message?.includes('duplicate') || err?.message?.includes('already exists')) {
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
      type: 'Programação',
      title: 'Norte Tech',
      description: 'Curso indicado para quem nunca teve contato com programação e precisa ter um norte sobre as principais linguagens e áreas de tecnologia.',
      image: '/images/norte-tech.png',
      isAvailable: true,
      link: '/norte-tech'
    },
    {
      type: 'Negócios',
      title: 'MVP - Espresso',
      description: 'Ganhe dinheiro ainda enquanto estuda, lance suas ideias no mercado em poucos dias com um template pronto para você. Aprenda a validar suas ideias.',
      image: '/images/mvp.png',
      isAvailable: true,
      link: 'https://www.mvpespresso.dev/'
    },
    {
      type: 'Programação',
      title: 'Lógica de Programação',
      description: 'Aprenda a programar em Python do absuluto zero com exemplos práticos e exercídios de fixação. Indicado para quem quer começar a programar.',
      image: '/images/tech.png',
      isAvailable: true,
      link: '/logica'
    },
    {
      type: 'Programação',
      title: 'Mobile',
      description: 'Desenvolva apps para Android e iOS com Kotlin Multiplatform Mobile. Um curso 100% com foco em requisitos do mercado, para te ajudar a criar um portfólio de apps.',
      image: '/images/mobile.png',
      isAvailable: false,
      link: '/mobile'
    },
    {
      type: 'Programação',
      title: 'Web',
      description: 'Aprenda os fundamentos da web com HTML, CSS e JavaScript. Crie sites para seu negócio ou para você mesmo. Monte um portfólio de sites para te ajudar a conseguir um emprego.',
      image: '/images/web.png',
      isAvailable: false,
      link: '/web'
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
      <section className="pt-32 pb-20 bg-gradient-to-b from-yellow-500/20 via-yellow-400/10 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight"
            >
              Aprenda programação e{' '}
              <span className="text-yellow-400">transforme sua vida</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Estude com profissionais experientes que estão no mercado de trabalho, seguem um método comprovado e têm um único objetivo: garantir que você seja contratado e mude de vida,{' '}
              <span className="relative inline-block">
                <span className="relative z-10">mesmo começando do zero.</span>
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-yellow-400"></span>
              </span>
            </motion.p>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative max-w-4xl w-full">
                <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
                  <img 
                    src="/images/landingpage-image.jpeg" 
                    alt="Nova Era Platform Preview" 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

            {/* Beginner Courses Section */}
            <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Cursos para iniciantes
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-300 mb-4"
            >
              Quer começar estudar programação, mas não sabe por onde? Qual linguagem estudar? Qual área seguir?
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-300"
            >
              <span className="text-yellow-400 font-medium">Dê seu primeiro passo com segurança, comece por aqui com cursos que cabem no seu bolso</span> 👇
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {/* Beginner Course 1 */}
              <div className="bg-black border border-white/10 rounded-lg overflow-hidden group">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <div className="absolute inset-0"></div>
                  <img 
                    src="/images/norte-tech.png" 
                    alt="Introdução à Programação"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-500 text-black text-xs font-medium px-2 py-1 rounded-full">
                      Disponível
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Iniciante</span>
                    <span className="text-green-400 text-xs">R$ 147</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-2 mb-2">Norte Tech</h3>
                  <p className="text-gray-400 text-base mb-4">Crie um projeto  para cada área, mobile, web, backend. Você terá contato com as principais linguagens de programação do mercado. Indicado para quem nunca teve contato com programação.</p>
                  <button 
                    className="w-full px-4 py-2 rounded-full font-medium transition-all text-sm bg-yellow-500 text-black hover:bg-yellow-400"
                    onClick={() => window.location.href = '/norte-tech'}
                  >
                    Começar agora
                  </button>
                </div>
              </div>

              {/* Beginner Course 2 */}
              <div className="bg-black border border-white/10 rounded-lg overflow-hidden group">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <div className="absolute inset-0"></div>
                  <img 
                    src="/images/web.png" 
                    alt="Web Development Básico"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-500 text-black text-xs font-medium px-2 py-1 rounded-full">
                      Disponível
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Iniciante</span>
                    <span className="text-green-400 text-xs">R$ 97</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-2 mb-2">Lógica de Programação</h3>
                  <p className="text-gray-400 text-base mb-4">Caso você queira aprender python, comece por aqui, aprenda lógica de programação com exercícios práticos. Indicado para quem quer começar a programar.</p>
                  <button 
                    className="w-full px-4 py-2 rounded-full font-medium transition-all text-sm bg-yellow-500 text-black hover:bg-yellow-400"
                    onClick={() => window.location.href = '/logica'}
                  >
                    Começar agora
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projetos de Alunos Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
          >
            Projetos de Alunos
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1E293B] rounded-xl overflow-hidden"
            >
              <img src="/images/aluno1.png" alt="Projeto de aluno 1" className="w-full" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1E293B] rounded-xl overflow-hidden"
            >
              <img src="/images/aluno2.png" alt="Projeto de aluno 2" className="w-full" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1E293B] rounded-xl overflow-hidden"
            >
              <img src="/images/aluno3.png" alt="Projeto de aluno 3" className="w-full" />
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <div className="absolute top-3 right-3">
                      <span className="bg-[#FFD700] text-black text-xs font-medium px-2 py-1 rounded-full">
                        Em breve
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{course.type}</span>
                    {!course.isAvailable && (
                      <span className="text-[#FFD700] text-xs">Em breve</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-2 mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-base mb-4">{course.description}</p>
                  <button 
                    className={`w-full px-4 py-2 rounded-full font-medium transition-all text-sm ${
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

      {/* Carousel Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Nossa comunidade
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Você não estará sozinho! Aprenda junto com uma comunidade com pessoas de diferentes áreas, países e idades, todas com o mesmo objetivo: dominar a programação e transformar suas vidas.
            </motion.p>

            {/* Carousel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative mb-8"
            >
              <div className="flex overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {carouselImages.map((image, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <img 
                        src={image} 
                        alt={`Projeto ${index + 1}`} 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all" onClick={prevSlide}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all" onClick={nextSlide}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>

            {/* Dot Counter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-2 mb-8"
            >
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? 'bg-yellow-400' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Quer ser avisado quando lançarmos?
                </h2>
                <p className="text-gray-400">
                  Cadastre-se na lista de espera e seja o primeiro a saber sobre nossos cursos
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name2" className="block text-sm text-gray-400 mb-2">
                    Nome completo
                  </label>
                  <input
                    id="name2"
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
                  <label htmlFor="email2" className="block text-sm text-gray-400 mb-2">
                    E-mail
                  </label>
                  <input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu melhor e-mail"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone2" className="block text-sm text-gray-400 mb-2">
                    Celular
                  </label>
                  <input
                    id="phone2"
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
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

      {/* Free Materials Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Materiais Gratuitos
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Comece sua jornada na programação com nossos materiais gratuitos. Aprenda no seu ritmo e descubra se programação é para você.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="max-w-md">
                {/* Free Material 1 */}
                <div className="bg-black border border-white/10 rounded-xl p-6 hover:border-yellow-400/50 transition-all">
                  <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">E-book: 5 Erros Comuns</h3>
                  <p className="text-gray-400 mb-4">
                    Descubra os 5 erros mais comuns que iniciantes cometem ao aprender programação e como evitá-los.
                  </p>
                  <a
                    href="/fiveerrors"
                    className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    Baixar Grátis
                  </a>
                </div>
              </div>
            </motion.div>
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

