'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function ThankYouMaterialContent() {
  const searchParams = useSearchParams()
  const [materialLink, setMaterialLink] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')

  useEffect(() => {
    // Get the material type from URL parameters
    const materialType = searchParams.get('material') || ''
    
    // Set material details based on the type
    switch(materialType) {
      case 'fiveerrors':
        setMaterialLink('https://drive.google.com/uc?export=download&id=1jLDmi60wZS0LqTOsQg4WKIV3vF-oL9Sf')
        setMaterialTitle('5 Erros Que Todo Iniciante Comete na Programação')
        break
      // Add more cases for other materials
      default:
        // Default if material type not specified
        setMaterialLink('https://drive.google.com/uc?export=download&id=1jLDmi60wZS0LqTOsQg4WKIV3vF-oL9Sf')
        setMaterialTitle('Seu material')
    }
  }, [searchParams])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
          Seu material está pronto!
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">
          Obrigado por se inscrever! Seu e-book <span className="font-semibold text-yellow-400">{materialTitle}</span> está disponível para download.
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <a
            href={materialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg"
          >
            <svg 
              className="w-6 h-6 mr-2" 
              xmlns="http://www.w3.org/2000/svg"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar E-book
            <span className="ml-2">→</span>
          </a>

          <div className="pt-8">
            <div className="mb-6">
              <p className="text-gray-400 mb-4">
                Aproveite para entrar no nosso grupo do WhatsApp para tirar dúvidas e receber mais conteúdos!
              </p>
              <a
                href="https://chat.whatsapp.com/E2q04eXAR7PLDf1J1KTPMw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
                Grupo do WhatsApp
              </a>
            </div>
            
            <Link
              href="/"
              className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </main>
  )
}

export default function ThankYouMaterial() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse">Carregando...</div>
      </div>
    }>
      <ThankYouMaterialContent />
    </Suspense>
  )
} 