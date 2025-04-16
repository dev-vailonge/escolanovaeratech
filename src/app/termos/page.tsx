'use client'

import { motion } from 'framer-motion'

export default function TermsOfUse() {
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
                Termos de Uso
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
                  <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Ao acessar e usar a plataforma Nova Era Tech, você concorda com estes Termos de Uso. 
                    Se você não concordar com qualquer parte destes termos, pedimos que não utilize nossos serviços.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. Serviços Oferecidos</h2>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    A Nova Era Tech oferece uma plataforma de ensino online focada em programação e tecnologia, incluindo:
                  </p>
                  <ul className="list-disc pl-6 text-gray-400 space-y-2">
                    <li>Cursos de programação online</li>
                    <li>Material didático digital</li>
                    <li>Exercícios práticos e projetos</li>
                    <li>Comunidade de suporte</li>
                    <li>Certificados de conclusão</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. Contas e Responsabilidades</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">3.1. Sua Conta</h3>
                    <ul className="list-disc pl-6 text-gray-400 space-y-2">
                      <li>Você é responsável por manter a confidencialidade de sua conta</li>
                      <li>As informações fornecidas devem ser precisas e atualizadas</li>
                      <li>Uma conta só pode ser utilizada por uma única pessoa</li>
                      <li>Você deve notificar imediatamente qualquer uso não autorizado</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white">3.2. Conduta do Usuário</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Ao usar nossa plataforma, você concorda em não:
                    </p>
                    <ul className="list-disc pl-6 text-gray-400 space-y-2">
                      <li>Violar direitos de propriedade intelectual</li>
                      <li>Compartilhar conteúdo inadequado ou ofensivo</li>
                      <li>Tentar acessar áreas restritas da plataforma</li>
                      <li>Revender ou distribuir o conteúdo dos cursos</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. Propriedade Intelectual</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Todo o conteúdo disponibilizado na plataforma - incluindo mas não limitado a vídeos, textos, 
                    códigos, exercícios e materiais complementares - é de propriedade exclusiva da Nova Era Tech 
                    ou licenciado para uso. A reprodução, distribuição ou modificação deste conteúdo sem autorização 
                    expressa é estritamente proibida.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Pagamentos e Reembolsos</h2>
                  <div className="space-y-4">
                    <p className="text-gray-400 leading-relaxed">
                      Política de pagamentos e reembolsos:
                    </p>
                    <ul className="list-disc pl-6 text-gray-400 space-y-2">
                      <li>Os preços são apresentados em Reais (BRL) e incluem impostos aplicáveis</li>
                      <li>Oferecemos garantia de 7 dias para reembolso total</li>
                      <li>O reembolso deve ser solicitado dentro do período de garantia</li>
                      <li>Após o período de garantia, reembolsos serão analisados caso a caso</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Disponibilidade e Modificações</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Nos esforçamos para manter a plataforma disponível 24/7, mas não podemos garantir disponibilidade 
                    ininterrupta. Reservamos o direito de modificar, suspender ou descontinuar qualquer aspecto do 
                    serviço a qualquer momento, com ou sem aviso prévio.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Limitação de Responsabilidade</h2>
                  <p className="text-gray-400 leading-relaxed">
                    A Nova Era Tech não será responsável por danos indiretos, incidentais ou consequenciais 
                    resultantes do uso ou impossibilidade de uso da plataforma. Nossa responsabilidade está 
                    limitada ao valor pago pelo serviço em questão.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Contato</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco em:{' '}
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