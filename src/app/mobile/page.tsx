'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function MobilePage() {
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
        .from('waiting_list')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || undefined,
          source: urlParams.source || undefined,
          affiliate: urlParams.affiliate || undefined,
          course: 'mobile'
        }])
      
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

  const modules = [
    {
      title: 'UI Multiplataforma',
      description: 'Crie interfaces modernas para Android e iOS com Compose Multiplatform.',
      topics: [
        'Introdução ao Compose Multiplatform',
        'Estrutura base com @Composable',
        'Navegação entre telas com Navigation',
        'Gerenciamento de estado (remember, StateFlow)',
        'Componentes básicos e adaptação iOS/Android'
      ]
    },
    {
      title: 'Persistência Local',
      description: 'Armazene dados localmente com SQLDelight de forma eficiente.',
      topics: [
        'Configuração do SQLDelight no projeto KMP',
        'Criando schema SQL e gerando interfaces',
        'Operações básicas: CRUD completo',
        'Integração com fluxo de dados (Flow)',
        'Cache local com fallback offline'
      ]
    },
    {
      title: 'Consumindo APIs',
      description: 'Integre seu app com serviços web usando Ktor Client.',
      topics: [
        'Introdução ao cliente HTTP do Ktor',
        'Configuração multiplataforma',
        'Chamadas GET/POST e tratamento',
        'Tratamento de erros e timeouts',
        'Parsing com kotlinx.serialization'
      ]
    },
    {
      title: 'Arquitetura Moderna',
      description: 'Estruture seu app com Clean Architecture e boas práticas.',
      topics: [
        'Clean Architecture simplificada',
        'Injeção de dependência com Koin',
        'Testes unitários com kotlin.test',
        'Testes de camada de dados',
        'Testes de UI com Compose'
      ]
    },
    {
      title: 'Bônus: Read Later IA',
      description: 'Projeto completo integrando IA para resumo de conteúdo.',
      topics: [
        'Tela de input de URL com IA',
        'Geração automática de resumos',
        'Persistência local de links e resumos',
        'Compartilhamento com 1 clique',
        'Feedback com Snackbar e UX'
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <nav className="container mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold text-white hover:text-yellow-400 transition-colors">
            Nova Era
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Desenvolvimento Mobile
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 mb-12"
            >
              Aprenda a criar apps modernos para Android e iOS usando Kotlin Multiplatform.
              Domine as tecnologias mais atuais do desenvolvimento mobile.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <button
                onClick={() => setIsDialogOpen(true)}
                className="px-8 py-4 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-all"
              >
                Quero ser avisado
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Objective and Technologies */}
            <div className="mb-16">
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-4">Objetivo</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Construir apps Android e iOS usando Kotlin Multiplatform com Firebase Studio, 
                  utilizando Compose para UI, SQLDelight para dados locais, Ktor para APIs e 
                  arquitetura moderna com testes.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Tecnologias</h3>
                <div className="flex flex-wrap gap-3">
                  {['Kotlin Multiplatform', 'Compose', 'SQLDelight', 'Ktor', 'Clean Architecture', 'Firebase', 'IA'].map((tech) => (
                    <span 
                      key={tech}
                      className="px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg border border-yellow-400/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-12">Módulos do curso</h2>
            
            <div className="grid gap-8">
              {modules.map((module, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-black border border-white/10 rounded-2xl p-8"
                >
                  <h3 className="text-2xl font-bold text-white mb-4">{module.title}</h3>
                  <p className="text-gray-400 mb-6">{module.description}</p>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {module.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="text-gray-300">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full relative border border-white/10"
          >
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-white mb-6">Garanta sua vaga</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+55 11 98765-4321"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Exemplo: +55 para Brasil, +1 para EUA/Canadá
                </p>
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 text-black font-semibold py-3 px-6 rounded-xl hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Enviando...' : 'Quero ser avisado'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  )
} 