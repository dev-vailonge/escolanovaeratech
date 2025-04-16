'use client'

import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
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

      {/* Content */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Política de Privacidade
              </h1>
              <p className="text-gray-400">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="prose prose-invert max-w-none"
            >
              <div className="space-y-12">
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. Introdução</h2>
                  <p className="text-gray-400 leading-relaxed">
                    A Nova Era Tech está comprometida em proteger sua privacidade. 
                    Esta Política de Privacidade descreve como coletamos, usamos e compartilhamos suas informações 
                    quando você utiliza nossa plataforma de ensino online, incluindo o site escolanovaeratech.com.br 
                    e todos os serviços relacionados.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. Informações que Coletamos</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">2.1. Informações fornecidas por você</h3>
                    <ul className="list-disc pl-6 text-gray-400 space-y-2">
                      <li>Nome completo</li>
                      <li>Endereço de e-mail</li>
                      <li>Número de telefone (opcional)</li>
                      <li>Informações de pagamento (quando aplicável)</li>
                      <li>Conteúdo gerado pelo usuário (comentários, exercícios, projetos)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white">2.2. Informações coletadas automaticamente</h3>
                    <ul className="list-disc pl-6 text-gray-400 space-y-2">
                      <li>Endereço IP</li>
                      <li>Tipo de navegador e dispositivo</li>
                      <li>Páginas visitadas e interações</li>
                      <li>Cookies e tecnologias similares</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. Como Usamos suas Informações</h2>
                  <ul className="list-disc pl-6 text-gray-400 space-y-2">
                    <li>Fornecer e melhorar nossos serviços educacionais</li>
                    <li>Personalizar sua experiência de aprendizado</li>
                    <li>Enviar atualizações sobre cursos e materiais relevantes</li>
                    <li>Processar pagamentos e transações</li>
                    <li>Analisar e melhorar o desempenho da plataforma</li>
                    <li>Cumprir obrigações legais</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. Compartilhamento de Informações</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Não vendemos suas informações pessoais. Compartilhamos suas informações apenas com:
                  </p>
                  <ul className="list-disc pl-6 text-gray-400 space-y-2 mt-4">
                    <li>Provedores de serviços que nos ajudam a operar a plataforma</li>
                    <li>Parceiros de processamento de pagamento</li>
                    <li>Autoridades legais quando exigido por lei</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Seus Direitos</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Você tem direito a:
                  </p>
                  <ul className="list-disc pl-6 text-gray-400 space-y-2 mt-4">
                    <li>Acessar suas informações pessoais</li>
                    <li>Corrigir dados imprecisos</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Optar por não receber comunicações de marketing</li>
                    <li>Exportar seus dados em formato legível</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Segurança</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger 
                    suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Contato</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos, 
                    entre em contato conosco em:{' '}
                    <a 
                      href="mailto:contato@escolanovaeratech.com.br" 
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      contato@escolanovaeratech.com.br
                    </a>
                  </p>
                </section>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <a 
                href="/" 
                className="text-yellow-400 hover:text-yellow-300 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para a página inicial
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
} 