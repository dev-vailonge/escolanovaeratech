'use client'

import Script from 'next/script'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

// Declaração global para o TypeScript reconhecer o fbq
declare global {
  interface Window {
    fbq: (...args: any[]) => void
  }
}

export default function BlackThankYouPage() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(90), 500)
    return () => clearTimeout(timer)
  }, [])

  // Dispara o evento Lead ao clicar no botão do WhatsApp
  const handleWhatsAppClick = () => {
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'Lead')
    }
  }

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
        {/* ... resto do conteúdo */}
        <a
          href="https://chat.whatsapp.com/CuZ45ZDhpYp5CNkabJ0gWI"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl"
        >
          Entrar para o grupo
        </a>
      </main>
    </>
  )
}
