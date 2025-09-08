'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function FiveErrorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
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
    
    try {
      const { error: supabaseError } = await supabase
        .from('iscas')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || undefined,
          source: urlParams.source || undefined,
          affiliate: urlParams.affiliate || undefined,
          isca: 'fiveerrors'
        }])
      
      if (supabaseError) throw supabaseError

      // Redirect to thank you material page
      window.location.href = '/thank-you-material?material=fiveerrors'
    } catch (err: any) {
      // console.error('Error:', err) // Removed for security
      if (err?.message?.includes('duplicate')) {
        setError('Este e-mail já está cadastrado.')
      } else {
        setError('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/50 backdrop-blur-sm border-b border-yellow-500/20 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-yellow-500">
            Nova Era
          </Link>
        </div>
      </header>

      {/* Hero Section with Ebook Preview */}
      <section className="py-20 md:py-32 min-h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="pr-0 md:pr-12">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                <span className="text-yellow-500">Não</span> cometa esses erros se quiser aprender da forma certa!
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-300 mb-8"
              >
                Um ebook simples, mas com conteúdo que com certeza vai fazer toda diferença no seu aprendizado. Leia com atenção e aplique o que aprendeu.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <button 
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-colors mb-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Download Agora!
                </button>
                <p className="text-sm text-gray-400">*Disponível em PDF, compatível com todos os dispositivos.</p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-[400px] md:h-[500px] flex justify-center items-center"
            >
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full opacity-30"></div>
              <div className="relative z-10 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/images/ebook-fireerrors-preview.png"
                  alt="Ebook: 5 Erros Que Todo Iniciante Comete na Programação"
                  width={350}
                  height={500}
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Form Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-yellow-500/20 relative"
          >
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setIsDialogOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">
              Preencha para receber o E-book
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                className="w-full bg-yellow-500 text-black font-semibold py-3 px-6 rounded-xl hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Enviando...' : 'Receber E-book Agora'}
              </button>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </main>
  )
} 