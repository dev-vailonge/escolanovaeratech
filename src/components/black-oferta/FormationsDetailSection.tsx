'use client'

import { motion } from 'framer-motion'
import formationsData from '@/data/black-oferta-formations.json'
import CountdownTimer from './CountdownTimer'

interface Course {
  title: string
  price: number
}

interface Formation {
  id: string
  title: string
  description: string
  courses: Course[]
}

interface Bonus {
  title: string
  price: number
  description?: string
}

export default function FormationsDetailSection() {
  const { formations, bonuses, totalPrice, blackFridayPrice, discount } = formationsData

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(price)
  }

  const calculateFormationTotal = (courses: Course[]) => {
    return courses.reduce((sum, course) => sum + course.price, 0)
  }

  const calculateGrandTotal = () => {
    const formationsTotal = formations.reduce((sum, formation) => {
      return sum + calculateFormationTotal(formation.courses)
    }, 0)
    const bonusesTotal = bonuses.reduce((sum, bonus) => sum + bonus.price, 0)
    return formationsTotal + bonusesTotal
  }

  return (
    <section className="py-20 bg-gradient-to-b from-yellow-500/10 via-yellow-400/5 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,204,21,0.05),transparent)]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-12 text-center"
          >
            Sua <span className="text-yellow-400">vaga</span> te espera.
          </motion.h2>

          {/* Intro Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left Side - Description */}
              <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Brasil precisa de profissionais qualificados
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  E nossas formações foram criadas para te ajudar a sair do absoluto zero, mesmo que você não saiba nada de programação, até o avançado, conseguindo seu primeiro emprego nos primeiros 12 meses de estudos.
                </p>
              </div>

              {/* Right Side - Image */}
              <div className="lg:w-1/2 relative h-64 lg:h-auto min-h-[300px]">
                <img
                  src="/images/profissionais-qualificados.png"
                  alt="Profissionais qualificados"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>

          {/* Section Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-12 text-center"
          >
            Detalhes das <span className="text-yellow-400">Formações</span>
          </motion.h2>

          {/* Formations Grid */}
          <div className="space-y-6">
            {formations.map((formation: Formation, index: number) => {
              const formationTotal = calculateFormationTotal(formation.courses)
              
              return (
                <motion.div
                  key={formation.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-black border border-white/10 rounded-xl overflow-hidden hover:border-yellow-400/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Left Side - Title and Description */}
                    <div className="lg:w-1/3 p-6 lg:p-8 bg-zinc-900/50 flex flex-col justify-center">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                        {formation.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {formation.description}
                      </p>
                    </div>

                    {/* Right Side - Courses List */}
                    <div className="lg:w-2/3 p-6 lg:p-8 bg-black">
                      <div className="space-y-2">
                        {formation.courses.map((course: Course, courseIndex: number) => (
                          <div
                            key={courseIndex}
                            className="flex justify-between items-center bg-zinc-900/50 rounded-lg px-4 py-3 border border-white/5"
                          >
                            <span className="text-white font-medium">{course.title}</span>
                            <span className="text-amber-700 font-bold">{formatPrice(course.price)}</span>
                          </div>
                        ))}
                        
                        {/* Total for this formation */}
                        <div className="flex justify-between items-center bg-zinc-800/50 rounded-lg px-4 py-3 border border-white/10 mt-4">
                          <span className="text-gray-400 font-semibold">TOTAL:</span>
                          <span className="text-red-500 text-xl font-bold line-through">{formatPrice(formationTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bonuses Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 bg-black border border-white/10 rounded-xl p-6 lg:p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6">BÔNUS DO MENTOR</h3>
            <div className="space-y-4">
              {bonuses.map((bonus, index) => (
                <div
                  key={index}
                  className="bg-zinc-900/50 rounded-lg px-4 py-4 border border-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-medium">{bonus.title}</span>
                    <span className="text-yellow-400 font-bold">{formatPrice(bonus.price)}</span>
                  </div>
                  {bonus.description && (
                    <p className="text-gray-400 text-sm leading-relaxed mt-2">
                      {bonus.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Total and Black Friday Price Section */}
          <motion.div
            id="pricing"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            {/* Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Preço Black Friday
              </h2>
              <p className="text-gray-400 text-lg">
                Ao invés todos os cursos separados, você terá acesso a todas as formações por um preço especial.
              </p>
            </div>

            {/* Pricing Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row">
                {/* Left Section - Pricing Details */}
                <div className="lg:w-2/5 p-8 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col items-center justify-center text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Todas formações</h3>
                  <p className="text-gray-400 text-sm mb-6">Pelo preço de 1</p>
                  
                  <div className="mb-6">
                    <p className="text-gray-400 text-sm mb-2">Valor Total:</p>
                    <p className="text-2xl line-through text-red-500 font-bold mb-2">
                      {formatPrice(calculateGrandTotal())}
                    </p>
                    <div className="text-yellow-400 font-semibold text-sm mb-2">
                      BLACK FRIDAY 
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-white">R$</span>
                      <span className="text-5xl md:text-6xl font-bold text-white">
                        {formatPrice(1497.00).replace('R$', '').replace(',', '.').trim()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">ou 12x de {formatPrice(1497.00 / 12)}</p>
                  </div>

                  <button
                    data-cta="pricing_card"
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    Garantir minha vaga
                  </button>
                </div>

                {/* Right Section - Features */}
                <div className="lg:w-3/5 p-8">
                  <h4 className="text-xl font-bold text-white mb-4">O que está incluído:</h4>
                  <ul className="space-y-3 mb-6">
                    {[
                      '5 Formações Completas',
                      'Acesso à Comunidade Exclusiva',
                      'Plano de estudos',
                      'Clube do livro',
                      'Encontros mensais',
                      'Certificados de Conclusão'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Somando o valor individual de cada curso você pagaria mais de R$ 11.574,00, mas não na black, vamos lançar um combo nas formações, você pagará apenas <span className="text-yellow-400 font-bold">R$ 1.497,00 SOMENTE ESSA SEMANA</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex justify-center mt-8">
              <CountdownTimer />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
