'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

function NorteTechContent() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [currentSlide, setCurrentSlide] = useState(0)
  const searchParams = useSearchParams()

  const carouselImages = [
    '/images/norte0.png',
    '/images/norte1.png',
    '/images/norte2.png'
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  // Safe scroll function
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: searchParams.get('source') || 'norte-tech',
          course: 'norte-tech'
        }),
      })

      if (response.ok) {
        // Use router.push for safer navigation
        window.location.href = '/thank-you'
      } else {
        // Remove console.error in production
        // console.error('Form submission failed')
      }
    } catch (error) {
      // Remove console.error in production
      // console.error('Error submitting form:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
       {/* Background Gradient */}
       <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-yellow-600/20"></div>
        
        {/* Geometric Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  Descubra se programação
                </span>
                <br />
                <span className="text-white">
                  realmente é para você.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-lg">
                Um curso acessível, feito para quem quer dar o primeiro passo na programação sem gastar milhares de reais.
              </p>

              {/* Call to Action */}
              <div className="space-y-4 text-center lg:text-left">
                <p className="text-lg text-yellow-400 font-medium">
                  👉 Coloque a mão no código, experimente as principais áreas e descubra qual combina com você.
                </p>
                
                <div className="flex justify-center lg:justify-start">
                  <button
                    onClick={() => scrollToElement('pricing')}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/25"
                  >
                    <span className="relative z-10">Quero começar agora</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Header Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg">
                                {/* Futuristic Container */}
                <div className="relative bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 border border-yellow-400/20 rounded-2xl p-6 shadow-2xl">
                  {/* Main Image */}
                  <Image
                    src="/images/norte-tech-header-image.png"
                    alt="Norte Tech Header Image"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-xl object-contain"
                    priority
                  />
                  
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Problema Section */}
      <section className="relative py-20 px-4 bg-black overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              O problema
            </h2>
            <p className="text-xl text-gray-300">
              A maioria das pessoas que querem aprender programação já passaram por alguma dessas situações.
              Levante um dedo se você já sentiu algum dos problemas abaixo:
            </p>
          </div>

          {/* Problems List */}
          <div className="space-y-6 mb-12">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Quer estudar <span className="text-yellow-400 font-semibold">programação</span> mas não sabe por onde começar?
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Já pesquisou na <span className="text-yellow-400 font-semibold">internet</span> e ficou confuso com tanta informação?
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Começou a estudar, mas não conseguiu <span className="text-yellow-400 font-semibold">aprender</span> e se perdeu?
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Encontrou apenas cursos <span className="text-yellow-400 font-semibold">caros</span> que nem explicam direito?
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Não entende muito de <span className="text-yellow-400 font-semibold">computador</span> e tem medo se realmente programação é para você?
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Pensa que talvez a <span className="text-yellow-400 font-semibold">idade</span> seja um impeditivo?
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-lg text-white leading-relaxed">
                Tem medo de dar esse passo porque tudo é <span className="text-yellow-400 font-semibold">novo</span> demais?
              </p>
            </div>
          </div>

          {/* Solution Box */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-2xl p-8 text-center shadow-2xl shadow-yellow-400/25 border border-yellow-400/50">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-black mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-2xl font-bold text-black">SOLUÇÃO</span>
            </div>
            <p className="text-xl font-bold text-black leading-relaxed">
              ➡️ A única forma de resolver esses problemas é através do <span className="text-black font-extrabold">conhecimento</span>. Só entendendo as principais áreas da programação você conseguirá dar esse primeiro passo com <span className="text-black font-extrabold">segurança</span>. Por isso criamos o <span className="text-black font-extrabold">Norte Tech</span>.
            </p>
          </div>
        </div>
      </section>

      {/* O que você vai aprender */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-yellow-900/30"></div>
        
        {/* Geometric Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              O que você vai aprender
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Você vai aprender do absoluto zero:
            </p>
          </div>

                    {/* Learning Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            
            {/* Card 1 - Primeira Aula */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
              {/* Image Section */}
              <div className="h-48 bg-zinc-800 relative">
                <Image
                  src="/images/problema1.png"
                  alt="Introdução à programação"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Content Section */}
              <div className="p-6">
                {/* Numbered Circle and Line */}
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">
                  Introdução à Programação
                </h3>
                
                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed">
                  Entenda o que é programação, como funciona uma linguagem, quais as principais linguagens e como elas funcionam.
                </p>
              </div>
            </div>

            {/* Card 2 - Segunda Aula */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
              {/* Image Section */}
              <div className="h-48 bg-zinc-800 relative">
                <Image
                  src="/images/problema3.png"
                  alt="Lógica e algoritmos"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Content Section */}
              <div className="p-6">
                {/* Numbered Circle and Line */}
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">2</span>
                  </div>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">
                  Desenvolvimento de Aplicativos
                </h3>
                
                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed">
                  Aprenda a desenvolver aplicativos para Android com Kotlin Mobile.
                </p>
              </div>
            </div>

            {/* Card 3 - Terceira Aula */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
              {/* Image Section */}
              <div className="h-48 bg-zinc-800 relative">
                <Image
                  src="/images/problema2.png"
                  alt="Áreas da programação"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Content Section */}
              <div className="p-6">
                {/* Numbered Circle and Line */}
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">3</span>
                  </div>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">
                  Desenvolvimento de Sites
                </h3>
                
                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed">
                  Conheça as linguagens de programação para desenvolver sites: HTML, CSS e JavaScript.
                </p>
              </div>
            </div>

            {/* Card 4 - Quarta Aula */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
              {/* Image Section */}
              <div className="h-48 bg-zinc-800 relative">
                <Image
                  src="/images/problema4.png"
                  alt="Primeiro projeto web"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Content Section */}
              <div className="p-6">
                {/* Numbered Circle and Line */}
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">4</span>
                  </div>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">
                  Carreira na Tecnologia
                </h3>
                
                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed">
                  Aprenda sobre a carreira em tecnologia, como conseguir um emprego, como lidar com a pressão do mercado e como se manter atualizado.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-lg text-yellow-400 font-medium mb-6">
              👉 Coloque a mão no código desde a primeira semana e descubra qual área você mais gosta.
            </p>
            
            <button
              onClick={() => scrollToElement('pricing')}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/25"
            >
              <span className="relative z-10">Quero começar agora</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

        {/* Aulas Gravadas - Seção Tecnológica */}
        <section className="py-24 px-4 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-yellow-600/20"></div>
        
        {/* Geometric Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              {/* Aulas gravadas */}
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-yellow-400/25 border border-yellow-400/50">
                  <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Aulas Gravadas
                  </h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    e atualizações constantes no conteúdo com professores especialistas de mercado
                  </p>
                </div>
              </div>

              {/* Comunidade Discord */}
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-indigo-500/25 border border-indigo-400/50">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Comunidade Discord
                  </h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    alunos ativos, networking e suporte direto dos professores em tempo real
                  </p>
                </div>
              </div>

              {/* Plano de Estudos */}
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-green-500/25 border border-green-400/50">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Plano de Estudos
                  </h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Roadmap estruturado do zero ao avançado, respeitando o seu ritmo de aprendizado.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Laptop Mockup */}
            <div className="relative">
              {/* Laptop Frame with Perspective */}
              <div className="relative mx-auto w-full max-w-lg transform perspective-1000">
                {/* Laptop Base */}
                <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-6 shadow-2xl transform rotate-y-3">
                  {/* Screen with Neon Glow */}
                  <div className="bg-black rounded-lg overflow-hidden border-2 border-yellow-400/50 shadow-2xl shadow-yellow-400/25">
                    {/* Screen Content */}
                    <div className="relative">
                      <Image
                        src="/images/norte-tech-discord.png"
                        alt="Área de membros do Norte Tech"
                        width={600}
                        height={400}
                        className="w-full h-auto rounded-lg"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-yellow-400 rounded-full opacity-20 blur-sm"></div>
              <div className="absolute -bottom-6 -left-6 w-8 h-8 bg-yellow-400 rounded-full opacity-20 blur-sm"></div>
            </div>
          </div>
        </div>
      </section>

    
      {/* Oferta Reforço */}
      <section id="pricing" className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
          Acesse agora a Escola Nova Era Tech
          </h2>
          <p className="text-yellow-400 text-lg mb-12">
          Comece sua carreira em tecnologia com nosso programa completo.
          Invista no seu futuro e entre para a comunidade que vai transformar sua jornada na programação!
          </p>

          <div className="flex justify-center max-w-4xl mx-auto">
            {/* Template + Curso */}
            <div className="bg-zinc-900 border border-yellow-400 rounded-lg p-8 relative w-full max-w-md">

              <div className="mb-6">
                <p className="text-3xl font-bold text-white">12x R$ 30,70</p>
                <p className="text-white text-sm">ou 297 à vista</p>
              </div>

              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Curso completo</span>
                </li>
                
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Comunidade no discord</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Plano de estudos</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Roadmap de carreira</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Todas as novas atualizações</span>
                </li>
              </ul>

              <button
                onClick={() => {
                  const url = 'https://pay.kiwify.com.br/9KCFZO6'
                  const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
                  if (newWindow) {
                    newWindow.opener = null
                  }
                }}
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
              >
                Adquirir agora
              </button>
            </div>
          </div>

         
        </div>
      </section>

      {/* Bônus Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-yellow-400 to-yellow-300 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              🎁 Bônus Exclusivos
            </h2>
            <p className="text-xl text-black/80 max-w-3xl mx-auto">
              Em nossos cursos você sempre irá receber bônus exclusivos para acelerar seu aprendizado.
            </p>
          </div>

          {/* Bonus Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Bônus 1 - IA */}
            <div className="relative bg-black/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300">
              {/* Free Badge */}
              <div className="absolute -top-3 -right-3 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                Grátis para alunos
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd"/>
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                Bônus 1 – Inteligência Artificial
              </h3>
              
              {/* Description */}
              <p className="text-gray-300 text-center leading-relaxed">
                Aprenda como usar IA para acelerar seus estudos e projetos. Descubra ferramentas e técnicas que vão revolucionar sua forma de programar.
              </p>
            </div>

            {/* Bônus 2 - Carreira */}
            <div className="relative bg-black/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300">
              {/* Free Badge */}
              <div className="absolute -top-3 -right-3 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                Grátis para alunos
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                Bônus 2 – Carreira
              </h3>
              
              {/* Description */}
              <p className="text-gray-300 text-center leading-relaxed">
                Um guia completo para começar sua jornada profissional com mais clareza. Aprenda estratégias para conseguir seu primeiro emprego na tecnologia.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-lg text-black font-medium mb-6">
              🚀 Esses bônus valem mais de R$ 500, mas são seus gratuitamente!
            </p>
            
            <button
              onClick={() => scrollToElement('pricing')}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-yellow-400 bg-black rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/25 border border-yellow-400/30"
            >
              <span className="relative z-10">Garantir meus bônus</span>
              <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

        {/* Antes vs Depois Section */}
        <section className="relative py-20 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Antes vs Depois
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Veja a transformação que o Norte Tech pode trazer para sua jornada na programação
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Antes - Left Column */}
            <div className="bg-black border border-red-500/30 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-300">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-red-400 mb-2">
                  Antes do Norte Tech
                </h3>
                <div className="w-16 h-1 bg-red-500 mx-auto"></div>
              </div>
              
              {/* Negative Points */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-red-400 font-semibold">Perdido</span> entre tantas informações soltas.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Sem saber qual <span className="text-red-400 font-semibold">área seguir</span>.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Sem <span className="text-red-400 font-semibold">confiança</span> para dar o primeiro passo.
                  </p>
                </div>
              </div>
            </div>

            {/* Depois - Right Column */}
            <div className="bg-gradient-to-br from-black via-black to-yellow-600/20 border border-yellow-500/30 rounded-2xl p-8 hover:border-yellow-400/50 transition-all duration-300">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-400/25">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                  Depois do Norte Tech
                </h3>
                <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 mx-auto"></div>
              </div>
              
              {/* Positive Points */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-yellow-400 font-semibold">Clareza</span> sobre as áreas da programação.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-yellow-400 font-semibold">Confiança</span> para escolher seu caminho.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Base <span className="text-yellow-400 font-semibold">sólida</span> para construir sua carreira naquilo que você realmente gosta.
                  </p>
                </div>
              </div>
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
              O que os alunos estão dizendo?
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Nossa didática sempre é muito bem avaliada pelos alunos. Isso é fundamental para seu aprendizado.
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

      {/* Garantia Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-yellow-600/30"></div>
        
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Guarantee Text */}
          <div className="space-y-6 mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Garantia Incondicional de 7 Dias
            </h3>
            
            <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Nós confiamos tanto no <span className="text-yellow-400 font-semibold">Norte Tech</span> que o risco é todo nosso.
              Assista, teste e programe. Se não gostar, devolvemos <span className="text-yellow-400 font-semibold">100%</span> do seu dinheiro.
              Você só decide se fica depois de experimentar.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => scrollToElement('pricing')}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/25"
            >
              <span className="relative z-10">Quero começar sem risco</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Course Platform Preview */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Conheça nossa plataforma
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Uma experiência de aprendizado moderna e intuitiva, projetada para acelerar sua jornada na tecnologia.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8">
            <div className="w-full rounded-lg overflow-hidden">
              <Image
                src="/images/norte-tech-course.png"
                alt="Plataforma do curso Norte Tech"
                width={1200}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div className="bg-zinc-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">
                Esse curso é para quem?
              </h3>
              <p className="text-gray-300">
                Para quem nunca trabalhou com TI e quer descobrir a área ideal.
              </p>
            </div>

            <div className="bg-zinc-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">
                Preciso de conhecimento prévio?
              </h3>
              <p className="text-gray-300">
                Não.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-yellow-400 text-2xl font-bold">
                Nova Era Tech
              </div>
              <p className="text-gray-400 text-sm mt-2">
                © 2024 Nova Era Tech. Todos os direitos reservados.
              </p>
            </div>
            
            <div className="flex gap-6">
              <Link href="/termos" className="text-gray-400 hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="text-gray-400 hover:text-white transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-yellow-400 rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Garanta seu acesso</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  pattern="[A-Za-zÀ-ÿ\s]+"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  pattern="[\+]?[0-9\s\-\(\)]{10,}"
                  minLength={10}
                  maxLength={20}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
              >
                Quero meu acesso e meu crédito agora!
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NorteTechPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NorteTechContent />
    </Suspense>
  )
} 