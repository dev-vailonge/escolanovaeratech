'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function AndroidCoursePage() {
  
  const carouselViewportRef = useRef<HTMLDivElement | null>(null)
  const carouselTrackRef = useRef<HTMLDivElement | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [itemWidth, setItemWidth] = useState(0)
  const [visibleCount, setVisibleCount] = useState(1)
  // Student projects carousel
  const projectsViewportRef = useRef<HTMLDivElement | null>(null)
  const projectsTrackRef = useRef<HTMLDivElement | null>(null)
  const [projectsIndex, setProjectsIndex] = useState(0)
  const [projectsItemWidth, setProjectsItemWidth] = useState(0)
  const [projectsVisibleCount, setProjectsVisibleCount] = useState(1)
  const projectsTotal = 17

  const cards = [
    { name: '10D Challenge', person: '', img: '/images/android-10d.png' },
    { name: 'Ecosistema Android', person: '', img: '/images/android-ecossistema.png' },
    { name: 'Android User Interface', person: '', img: '/images/android-interface.png' },
    { name: 'Android Compose', person: '', img: '/images/android-compose.png' },
    { name: 'Git & Github', person: '', img: '/images/android-git.png' },
    { name: 'Android Listas', person: '', img: '/images/android-listas.png' },
    { name: 'Android APIs', person: '', img: '/images/android-apis.png' },
    { name: 'Android Dados', person: '', img: '/images/android-dados.png' },
    { name: 'Android Arquitetura', person: '', img: '/images/android-arquitetura.png' },
    { name: 'Android Testes', person: '', img: '/images/android-testes.png' },
    { name: 'Code Challenges', person: '', img: '/images/android-codechallenge.png' },
    { name: 'Aplicativo iFood', person: '', img: '/images/android-ifood.png' },
    { name: 'Aplicativo Whatsapp', person: '', img: '/images/android-wpp.png' },
    { name: 'Vibe Coding', person: '', img: '/images/android-vibecoding.png' },
  ]

  

  const recalcCarouselMetrics = () => {
    const viewport = carouselViewportRef.current
    const track = carouselTrackRef.current
    if (!viewport || !track) return
    const firstChild = track.children.item(0) as HTMLElement | null
    if (!firstChild) return
    const rect = firstChild.getBoundingClientRect()
    const computedItemWidth = Math.ceil(rect.width + 24) // includes gap-6 ~ 24px
    const computedVisible = Math.max(1, Math.floor(viewport.clientWidth / computedItemWidth))
    setItemWidth(computedItemWidth)
    setVisibleCount(computedVisible)
  }

  useEffect(() => {
    recalcCarouselMetrics()
    const onResize = () => recalcCarouselMetrics()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const nextCarousel = () => {
    const itemsLength = cards.length
    const maxIndex = Math.max(0, itemsLength - visibleCount)
    setCarouselIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  const prevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1))
  }

  // Recalc student projects metrics
  const recalcProjectsMetrics = () => {
    const viewport = projectsViewportRef.current
    const track = projectsTrackRef.current
    if (!viewport || !track) return
    const firstChild = track.children.item(0) as HTMLElement | null
    if (!firstChild) return
    let rectWidth = firstChild.offsetWidth || firstChild.getBoundingClientRect().width || 0
    // Fallback to CSS width when not measured yet (images not loaded)
    if (!rectWidth) {
      rectWidth = 360
    }
    const computed = Math.ceil(rectWidth + 24) // includes gap-6 ~ 24px
    const visible = Math.max(1, Math.floor(viewport.clientWidth / computed))
    setProjectsItemWidth(computed)
    setProjectsVisibleCount(visible)
  }

  useEffect(() => {
    recalcProjectsMetrics()
    const onResize = () => recalcProjectsMetrics()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Clamp index whenever metrics change
  useEffect(() => {
    const maxIdx = Math.max(0, projectsTotal - projectsVisibleCount)
    setProjectsIndex((prev) => Math.min(prev, maxIdx))
  }, [projectsVisibleCount])

  const nextProjects = () => {
    const maxIdx = Math.max(0, projectsTotal - projectsVisibleCount)
    setProjectsIndex((prev) => Math.min(maxIdx, prev + 1))
  }

  const prevProjects = () => {
    setProjectsIndex((prev) => Math.max(0, prev - 1))
  }

  

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <nav className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Nova Era</h1>
        </nav>
      </header>

      {/* Hero (inspired by Norte Tech) */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-yellow-600/20"></div>
        {/* Geometric Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px) ',
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Crie mais de{' '}
                <span className="text-yellow-400">15 aplicativos Android</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-gray-300 mb-8 max-w-xl"
              >
                Aprenda do zero ao avançado e construa projetos reais para seu portfólio com base em requisitos de vagas.
              </motion.p>

              <div>
                <button
                  onClick={() => {
                    const el = document.getElementById('price')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold shadow-md transition-colors"
                >
                  Ver preço e garantir minha vaga
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
            >
              <div className="relative w-full">
                <img
                  src="/images/android-hero-img.png"
                  alt="Projeto Android Preview"
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Veja essa oportunidade</h2>
            <p className="text-lg text-gray-300 mb-8">Assista essa vídeo para entender o que tem dentro do curso e a oportunidade que está na sua frente.</p>

            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="https://www.youtube.com/embed/tI3FAnzXYOY"
                title="Veja essa oportunidade"
                className="absolute top-0 left-0 w-full h-full rounded-xl border border-white/10"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>


      {/* Big Numbers (course stats) */}
      <section className="py-12 bg-yellow-400/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">O que está incluído?</h2>
            <p className="text-lg text-white/80 mt-2">Conteúdo completo, projetos práticos e um roadmap estruturado para você dominar Android.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {[
              { n: '+440', label: 'aulas gravadas' },
              { n: '+15', label: 'projetos' },
              { n: '+16', label: 'módulos' }
            ].map((item, i) => (
              <div key={i} className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-yellow-400 tracking-tight">
                  {item.n}
                </div>
                <div className="mt-2 text-gray-300 uppercase tracking-wide text-sm md:text-base">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Title above feature sections */}
      <section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nossas ferramentas seu progresso!
            </h2>
            <p className="text-lg md:text-xl text-gray-300">
              Aulas gravadas, comunidade para suporte diário e um plano de estudos
              prático, orientado a projetos reais.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Card Section (two grids) */}
      <section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto bg-zinc-900/50 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-400/10">
            <div className="grid lg:grid-cols-2">
              {/* Left content */}
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <div className="w-12 h-1 bg-yellow-400 rounded-full"></div>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Aulas gravadas</h3>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                    <span className="text-white font-semibold">+ de 440 aulas gravadas</span> e atualizações constantes
                    no conteúdo com professores especialistas de mercado.
                  </p>
                </div>
              </div>

              {/* Right image */}
              <div className="relative bg-black p-3 md:p-6">
                <div className="rounded-xl overflow-hidden bg-black">
                  <img
                    src="/images/android-aulas-gravadas.png"
                    alt="Prévia das aulas"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Study Plan Section */}
      <section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto bg-zinc-900/50 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-400/10">
            <div className="grid lg:grid-cols-2">
              {/* Left image (alternate layout) */}
              <div className="order-2 lg:order-1 relative bg-black p-3 md:p-6">
                <div className="rounded-xl overflow-hidden bg-black">
                  <img
                    src="/images/android-plano.png"
                    alt="Plano de Estudos"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              {/* Right content */}
              <div className="order-1 lg:order-2 p-6 md:p-8">
                <div className="mb-6">
                  <div className="w-12 h-1 bg-yellow-400 rounded-full"></div>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Plano de Estudos</h3>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                    Roadmap estruturado do zero ao avançado, com módulos e projetos que
                    te preparam para os requisitos reais das vagas Android.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

 {/* Discord Community Section */}
<section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto bg-zinc-900/50 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-400/10">
            <div className="grid lg:grid-cols-2">
              {/* Left content */}
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <div className="w-12 h-1 bg-yellow-400 rounded-full"></div>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Comunidade no Discord</h3>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                    Participe de uma comunidade ativa para tirar dúvidas, fazer networking e
                    receber feedbacks nos seus projetos Android.
                  </p>
                </div>
              </div>

              {/* Right image */}
              <div className="relative bg-black p-3 md:p-6">
                <div className="rounded-xl overflow-hidden bg-black">
                  <img
                    src="/images/android-discord.png"
                    alt="Comunidade no Discord"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


        {/* What you'll learn */}
        <section className="py-8 my-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">O que você vai aprender?</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Column 1 */}
              <ul className="space-y-4">
                {[
                  'Kotlin moderno: coroutines, Flow, extension functions e boas práticas',
                  'Arquitetura: MVVM, Clean Architecture e separação de camadas',
                  'Interface de usuário: Compose avançado, Material 3, animações e acessibilidade',
                  'Testes: Unitários com JUnit/Mockito e instrumentados com Espresso/UI Testing',
                  'Gerenciamento de dependências: Gradle Kotlin DSL, buildTypes e flavors',
                  'Navegação: Graph, Safe Args, ViewModel e ciclo de vida'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex w-4 h-4 rounded-full bg-yellow-400"></span>
                    <span className="text-gray-300">{text}</span>
                  </li>
                ))}
              </ul>

              {/* Column 2 */}
              <ul className="space-y-4">
                {[
                  'Injeção de dependência: Hilt e boas práticas de modularização',
                  'Persistência de dados: Room, DataStore e cache offline',
                  'Consumo de APIs: Retrofit, coroutines e tratamento de erros',
                  'Internacionalização: suporte a múltiplos idiomas e dimensões responsivas',
                  'Projetos práticos: Clone do iFood e do WhatsApp para portfólio'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex w-4 h-4 rounded-full bg-yellow-400"></span>
                    <span className="text-gray-300">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

       {/* Companies hiring Kotlin/Android */}
       <section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">80% dos apps Android usam Kotlin</h2>
            <p className="text-lg text-gray-300 mb-8">
              As maiores empresas do mundo utilizam Kotlin em Android. Seu conhecimento é valioso no mercado.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { name: 'Google', slug: 'google' },
                { name: 'Spotify', slug: 'spotify' },
                { name: 'iFood', slug: 'ifood' },
                { name: 'Nubank', slug: 'nubank' }
              ].map((brand) => (
                <div key={brand.slug} className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-6 flex items-center justify-center hover:border-yellow-400/40 transition-colors">
                  <img
                    src={`https://cdn.simpleicons.org/${brand.slug}/FFFFFF`}
                    alt={brand.name}
                    className="h-8 md:h-10 w-auto opacity-90"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <section id="price" className="py-14 bg-gradient-to-br from-black via-[#0b0b12] to-black relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-tr from-green-500/20 to-yellow-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-yellow-400/20 to-green-500/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_0_80px_-20px_rgba(234,179,8,0.35)] relative">
            {/* Corner Stamp */}
            <div className="absolute -top-6 -right-6 rotate-6">
              <div className="px-5 py-3 rounded-md bg-yellow-400 text-black font-extrabold text-sm md:text-base shadow-[0_15px_35px_-10px_rgba(234,179,8,0.6)] border-2 border-yellow-500 select-none">
                Somente até dia 28/09
              </div>
            </div>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 rounded-full bg-gradient-to-r from-green-500/15 to-yellow-400/15 border border-white/10 text-yellow-400 text-base md:text-lg font-semibold mb-5 shadow-[0_0_30px_-10px_rgba(234,179,8,0.35)]">
                <span className="inline-block w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-yellow-400" /> Oferta Imperdível
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Oferta Exclusiva para Membros Fundadores</h2>
              <p className="text-gray-300 text-lg">Tudo o que você vai receber para se tornar um desenvolvedor Android</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Benefits */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                {[
                  '+440 aulas gravadas',
                  'Comunidade exclusiva no Discord',
                  '+15 projetos práticos - Faça o clone do iFood e do WhatsApp',
                  '+16 módulos',
                  'Desconto de R$400,00'
                ].map((item, i) => (
                  <div key={i} className="w-full flex items-start gap-3 bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <p className="text-white/90 font-medium">{item}</p>
                  </div>
                ))}
              </div>

              {/* Price Box */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 text-center">
                <div className="text-gray-400 line-through mb-1">De R$ 997</div>
                <div className="text-4xl md:text-5xl font-extrabold text-white">R$ 597</div>
                <div className="text-white/80 mt-1">à vista</div>
                <div className="text-sm text-gray-300 mt-2">ou 12x de R$ 61,70 no cartão</div>

                <button
                  onClick={() => {
                    const url = 'https://pay.kiwify.com.br/D4fz6QE'
                    const win = window.open(url, '_blank', 'noopener,noreferrer')
                    if (win) win.opener = null
                  }}
                  className="mt-6 w-full py-4 rounded-xl font-bold text-black bg-yellow-400 hover:bg-yellow-300 transition-all duration-200 ease-out transform-gpu shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black"
                >
                  Garantir minha vaga
                </button>

                <div className="mt-4 text-xs text-gray-400">
                  Acesso imediato • Garantia de 7 dias • Pagamento seguro
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Carousel Section */}
      <section className="py-20 bg-black">
        <div className="w-full">
          <div className="text-center px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Aprenda construindo projetos de verdade.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto"
            >
              Nosso curso é 100% focado em requisitos de vagas, para te ajudar a conseguir a sua primeira vaga.
            </motion.p>

            <div className="relative px-4 md:px-8">
              <div
                ref={carouselViewportRef}
                className="overflow-hidden pb-4 w-full"
              >
                <div
                  ref={carouselTrackRef}
                  className="flex gap-6 transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${carouselIndex * itemWidth}px)` }}
                >
                {cards.map((card, i) => (
                  <div key={i} className="shrink-0">
                    <img
                      src={card.img}
                      alt={card.name}
                      className="block rounded-xl w-full h-auto"
                    />
                  </div>
                ))}
                </div>
              </div>

              {/* Navigation */}
              <button
                onClick={prevCarousel}
                className="flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full items-center justify-center border border-white/10 z-10"
                aria-label="Anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextCarousel}
                className="flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full items-center justify-center border border-white/10 z-10"
                aria-label="Próximo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.max(1, cards.length - visibleCount + 1) }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i === carouselIndex ? 'bg-yellow-400' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

       {/* Student Projects Carousel */}
       <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Projetos de Alunos</h2>
          </div>
          <div className="relative px-4 md:px-8">
            <div ref={projectsViewportRef} className="overflow-hidden w-full">
              <div
                ref={projectsTrackRef}
                className="flex items-start gap-6 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${projectsIndex * projectsItemWidth}px)` }}
              >
                {Array.from({ length: projectsTotal }).map((_, i) => {
                  const src = `/images/app${i + 1}.png`
                  return (
                    <div key={i} className="shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img
                        src={src}
                        alt={`Projeto app ${i + 1}`}
                        className="block h-auto max-w-full w-auto max-h-[520px] object-contain mx-auto"
                        loading="lazy"
                        onLoad={recalcProjectsMetrics}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation */}
            <button onClick={prevProjects} disabled={projectsIndex === 0} className="flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full items-center justify-center border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed z-10" aria-label="Anterior">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextProjects} disabled={projectsIndex >= Math.max(0, projectsTotal - projectsVisibleCount)} className="flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full items-center justify-center border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed z-10" aria-label="Próximo">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Page Counter */}
            <div className="mt-4 text-center text-gray-400">
              {(() => {
                const totalPages = Math.max(1, projectsTotal - projectsVisibleCount + 1)
                const currentPage = Math.min(totalPages, projectsIndex + 1)
                return <span className="text-sm">{currentPage} / {totalPages}</span>
              })()}
            </div>
          </div>
        </div>
      </section>

   
     {/* FAQ Section - Bottom */}
     <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">Perguntas Frequentes</h2>

            <div className="space-y-4">
              {[
                {
                  q: 'Preciso saber programar antes de entrar no curso?',
                  a: 'Não! O curso foi feito para iniciantes. Você vai aprender desde os primeiros passos até publicar seus próprios apps.'
                },
                {
                  q: 'Quanto tempo leva para eu começar a criar meus primeiros aplicativos?',
                  a: 'Nas primeiras semanas você já terá condições de criar apps simples e funcionais, colocando em prática o que aprendeu.'
                },
                {
                  q: 'O curso cobre apenas teoria ou também prática?',
                  a: 'Totalmente prático. Você vai criar projetos reais, exercitar lógica e aprender a construir apps que funcionam no seu celular.'
                },
                {
                  q: 'Vou ter suporte se ficar com dúvidas?',
                  a: 'Sim! Você terá acesso à nossa comunidade exclusiva, onde poderá trocar experiências, tirar dúvidas e receber feedback.'
                },
                {
                  q: 'Esse curso realmente pode me ajudar a conseguir um emprego?',
                  a: 'Com certeza. O mercado está aquecido com milhares de vagas para Android/Kotlin. Esse curso te dá a base para disputar essas oportunidades.'
                }
              ].map((item, i) => (
                <details key={i} className="group bg-zinc-900/60 border border-white/10 rounded-xl p-4 md:p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <span className="text-white font-semibold">{item.q}</span>
                    <span className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md bg-yellow-400 text-black group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="mt-3 text-gray-300 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

        {/* Support CTA Section (WhatsApp) */}
        <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-center shadow-lg">
            <div className="mx-auto mb-6 w-10 h-10 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 22h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374A9.86 9.86 0 012.166 12c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z"/>
              </svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ficou alguma dúvida?
            </h3>
            <p className="text-gray-300 mb-8">
              Entre agora em contato com o nosso suporte pelo whatsapp.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const url = 'https://api.whatsapp.com/send/?phone=553484136388&text&type=phone_number&app_absent=0'
                  const win = window.open(url, '_blank', 'noopener,noreferrer')
                  if (win) win.opener = null
                }}
                className="inline-flex items-center gap-3 px-6 md:px-10 py-4 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold shadow-[0_20px_40px_-15px_rgba(16,185,129,0.5)] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 22h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374A9.86 9.86 0 012.166 12c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z"/>
                </svg>
                ENTRAR EM CONTATO COM O SUPORTE
              </button>
            </div>
          </div>
        </div>
      </section>

         {/* Footnote */}
         <section className="pt-6 pb-12 bg-black border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-gray-400">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} Nova Era Tech — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="/privacidade" className="hover:text-yellow-400 transition-colors">Política de Privacidade</a>
              <a href="/termos" className="hover:text-yellow-400 transition-colors">Termos de Uso</a>
              <a href="mailto:contato@escolanovaeratech.com.br" className="hover:text-yellow-400 transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}


