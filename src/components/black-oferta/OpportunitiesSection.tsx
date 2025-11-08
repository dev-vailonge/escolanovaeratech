'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import opportunitiesData from '@/data/black-oferta-opportunities.json'

interface Opportunity {
  id: string
  image: string
  imageLabel: string
  badge: {
    text: string
    icon: string
  }
  title: string
  description: string
}

export default function OpportunitiesSection() {
  const { title, opportunities } = opportunitiesData

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-12 text-center"
          >
            {title.split('para quem comprar agora')[0]}
            <span className="text-yellow-400"> para quem comprar agora</span>
          </motion.h2>

          {/* Opportunities Grid */}
          <div className="space-y-8">
            {opportunities.map((opportunity: Opportunity, index: number) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-yellow-400/50 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="relative w-full md:w-1/2 h-64 md:h-auto min-h-[300px]">
                    <Image
                      src={opportunity.image}
                      alt={opportunity.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Image Label */}
                    <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                      <span className="text-white text-xs font-semibold uppercase tracking-wide">
                        {opportunity.imageLabel}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="w-full md:w-1/2 p-6 md:p-8 bg-black flex flex-col justify-center">
                    {/* Badge */}
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/50 px-3 py-1.5 rounded-full">
                        <svg
                          className="w-4 h-4 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-red-400 text-xs font-bold uppercase tracking-wide">
                          {opportunity.badge.text}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {opportunity.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                      {opportunity.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

