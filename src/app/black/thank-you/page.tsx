'use client'

import Script from 'next/script'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function BlackThankYouPage() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate progress bar to 90%
    const timer = setTimeout(() => {
      setProgress(90)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
     <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '394878869825377');
          fbq('track', 'PageView');
        `}
      </Script>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=394878869825377&ev=PageView&noscript=1"
          alt="facebook pixel"
        />
      </noscript>

    <main className="min-h-screen bg-black text-white flex items-center justify-center relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-yellow-500/10"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="text-yellow-400 text-sm font-semibold mb-4">
              Progresso do seu cadastro
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <div className="text-yellow-400 text-sm font-semibold mt-2">
              {progress}% concluído
            </div>
          </div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
          >
            Parabéns, você deu o primeiro passo para mudar sua vida através da programação.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-gray-300 leading-relaxed"
          >
            Falta apenas mais um passo, entre para o grupo do WhatsApp para não perder nenhuma atualização.
          </motion.p>

          {/* WhatsApp Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-4"
          >
            <a
              href="https://chat.whatsapp.com/CuZ45ZDhpYp5CNkabJ0gWI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Entrar para o grupo
            </a>
          </motion.div>

          {/* Final Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="pt-8"
          >
            <p className="text-yellow-400 text-lg font-semibold">
              Dia 09.11 temos um compromisso, te vejo lá.
            </p>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-yellow-400/30 to-yellow-300/20 rounded-full blur-2xl"></div>
        </motion.div>
      </div>
    </main>
    </>
  )
}
