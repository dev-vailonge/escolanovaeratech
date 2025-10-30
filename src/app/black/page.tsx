'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Black2026Page() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+55'
  })

  const countryCodes = [
    { code: '+55', country: 'Brasil', flag: '🇧🇷' },
    { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
    { code: '+1', country: 'Canadá', flag: '🇨🇦' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'Colômbia', flag: '🇨🇴' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+598', country: 'Uruguai', flag: '🇺🇾' },
    { code: '+591', country: 'Bolívia', flag: '🇧🇴' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+593', country: 'Equador', flag: '🇪🇨' },
    { code: '+595', country: 'Paraguai', flag: '🇵🇾' },
    { code: '+34', country: 'Espanha', flag: '🇪🇸' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+39', country: 'Itália', flag: '🇮🇹' },
    { code: '+33', country: 'França', flag: '🇫🇷' },
    { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
    { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
    { code: '+7', country: 'Rússia', flag: '🇷🇺' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japão', flag: '🇯🇵' },
    { code: '+82', country: 'Coreia do Sul', flag: '🇰🇷' },
    { code: '+91', country: 'Índia', flag: '🇮🇳' },
    { code: '+61', country: 'Austrália', flag: '🇦🇺' },
    { code: '+27', country: 'África do Sul', flag: '🇿🇦' },
    { code: '+52', country: 'México', flag: '🇲🇽' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+505', country: 'Nicarágua', flag: '🇳🇮' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+507', country: 'Panamá', flag: '🇵🇦' },
    { code: '+30', country: 'Grécia', flag: '🇬🇷' },
    { code: '+31', country: 'Holanda', flag: '🇳🇱' },
    { code: '+32', country: 'Bélgica', flag: '🇧🇪' },
    { code: '+41', country: 'Suíça', flag: '🇨🇭' },
    { code: '+43', country: 'Áustria', flag: '🇦🇹' },
    { code: '+45', country: 'Dinamarca', flag: '🇩🇰' },
    { code: '+46', country: 'Suécia', flag: '🇸🇪' },
    { code: '+47', country: 'Noruega', flag: '🇳🇴' },
    { code: '+48', country: 'Polônia', flag: '🇵🇱' },
    { code: '+90', country: 'Turquia', flag: '🇹🇷' },
    { code: '+92', country: 'Paquistão', flag: '🇵🇰' },
    { code: '+93', country: 'Afeganistão', flag: '🇦🇫' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
    { code: '+98', country: 'Irã', flag: '🇮🇷' },
    { code: '+212', country: 'Marrocos', flag: '🇲🇦' },
    { code: '+213', country: 'Argélia', flag: '🇩🇿' },
    { code: '+216', country: 'Tunísia', flag: '🇹🇳' },
    { code: '+218', country: 'Líbia', flag: '🇱🇾' },
    { code: '+220', country: 'Gâmbia', flag: '🇬🇲' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+222', country: 'Mauritânia', flag: '🇲🇷' },
    { code: '+223', country: 'Mali', flag: '🇲🇱' },
    { code: '+224', country: 'Guiné', flag: '🇬🇳' },
    { code: '+225', country: 'Costa do Marfim', flag: '🇨🇮' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+227', country: 'Níger', flag: '🇳🇪' },
    { code: '+228', country: 'Togo', flag: '🇹🇬' },
    { code: '+229', country: 'Benin', flag: '🇧🇯' },
    { code: '+230', country: 'Maurício', flag: '🇲🇺' },
    { code: '+231', country: 'Libéria', flag: '🇱🇷' },
    { code: '+232', country: 'Serra Leoa', flag: '🇸🇱' },
    { code: '+233', country: 'Gana', flag: '🇬🇭' },
    { code: '+234', country: 'Nigéria', flag: '🇳🇬' },
    { code: '+235', country: 'Chade', flag: '🇹🇩' },
    { code: '+236', country: 'República Centro-Africana', flag: '🇨🇫' },
    { code: '+237', country: 'Camarões', flag: '🇨🇲' },
    { code: '+238', country: 'Cabo Verde', flag: '🇨🇻' },
    { code: '+239', country: 'São Tomé e Príncipe', flag: '🇸🇹' },
    { code: '+240', country: 'Guiné Equatorial', flag: '🇬🇶' },
    { code: '+241', country: 'Gabão', flag: '🇬🇦' },
    { code: '+242', country: 'República do Congo', flag: '🇨🇬' },
    { code: '+243', country: 'República Democrática do Congo', flag: '🇨🇩' },
    { code: '+244', country: 'Angola', flag: '🇦🇴' },
    { code: '+245', country: 'Guiné-Bissau', flag: '🇬🇼' },
    { code: '+246', country: 'Território Britânico do Oceano Índico', flag: '🇮🇴' },
    { code: '+248', country: 'Seicheles', flag: '🇸🇨' },
    { code: '+249', country: 'Sudão', flag: '🇸🇩' },
    { code: '+250', country: 'Ruanda', flag: '🇷🇼' },
    { code: '+251', country: 'Etiópia', flag: '🇪🇹' },
    { code: '+252', country: 'Somália', flag: '🇸🇴' },
    { code: '+253', country: 'Djibuti', flag: '🇩🇯' },
    { code: '+254', country: 'Quênia', flag: '🇰🇪' },
    { code: '+255', country: 'Tanzânia', flag: '🇹🇿' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+258', country: 'Moçambique', flag: '🇲🇿' },
    { code: '+260', country: 'Zâmbia', flag: '🇿🇲' },
    { code: '+261', country: 'Madagáscar', flag: '🇲🇬' },
    { code: '+262', country: 'Reunião', flag: '🇷🇪' },
    { code: '+263', country: 'Zimbábue', flag: '🇿🇼' },
    { code: '+264', country: 'Namíbia', flag: '🇳🇦' },
    { code: '+265', country: 'Malawi', flag: '🇲🇼' },
    { code: '+266', country: 'Lesoto', flag: '🇱🇸' },
    { code: '+267', country: 'Botswana', flag: '🇧🇼' },
    { code: '+268', country: 'Suazilândia', flag: '🇸🇿' },
    { code: '+269', country: 'Comores', flag: '🇰🇲' },
    { code: '+290', country: 'Santa Helena', flag: '🇸🇭' },
    { code: '+291', country: 'Eritreia', flag: '🇪🇷' },
    { code: '+297', country: 'Aruba', flag: '🇦🇼' },
    { code: '+298', country: 'Ilhas Faroé', flag: '🇫🇴' },
    { code: '+299', country: 'Groenlândia', flag: '🇬🇱' },
    { code: '+350', country: 'Gibraltar', flag: '🇬🇮' },
    { code: '+352', country: 'Luxemburgo', flag: '🇱🇺' },
    { code: '+353', country: 'Irlanda', flag: '🇮🇪' },
    { code: '+354', country: 'Islândia', flag: '🇮🇸' },
    { code: '+355', country: 'Albânia', flag: '🇦🇱' },
    { code: '+356', country: 'Malta', flag: '🇲🇹' },
    { code: '+357', country: 'Chipre', flag: '🇨🇾' },
    { code: '+358', country: 'Finlândia', flag: '🇫🇮' },
    { code: '+359', country: 'Bulgária', flag: '🇧🇬' },
    { code: '+370', country: 'Lituânia', flag: '🇱🇹' },
    { code: '+371', country: 'Letônia', flag: '🇱🇻' },
    { code: '+372', country: 'Estônia', flag: '🇪🇪' },
    { code: '+373', country: 'Moldávia', flag: '🇲🇩' },
    { code: '+374', country: 'Armênia', flag: '🇦🇲' },
    { code: '+375', country: 'Bielorrússia', flag: '🇧🇾' },
    { code: '+376', country: 'Andorra', flag: '🇦🇩' },
    { code: '+377', country: 'Mônaco', flag: '🇲🇨' },
    { code: '+378', country: 'San Marino', flag: '🇸🇲' },
    { code: '+380', country: 'Ucrânia', flag: '🇺🇦' },
    { code: '+381', country: 'Sérvia', flag: '🇷🇸' },
    { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
    { code: '+383', country: 'Kosovo', flag: '🇽🇰' },
    { code: '+385', country: 'Croácia', flag: '🇭🇷' },
    { code: '+386', country: 'Eslovênia', flag: '🇸🇮' },
    { code: '+387', country: 'Bósnia e Herzegovina', flag: '🇧🇦' },
    { code: '+389', country: 'Macedônia do Norte', flag: '🇲🇰' },
    { code: '+420', country: 'República Tcheca', flag: '🇨🇿' },
    { code: '+421', country: 'Eslováquia', flag: '🇸🇰' },
    { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
    { code: '+500', country: 'Ilhas Malvinas', flag: '🇫🇰' },
    { code: '+501', country: 'Belize', flag: '🇧🇿' },
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+505', country: 'Nicarágua', flag: '🇳🇮' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', country: 'Panamá', flag: '🇵🇦' },
    { code: '+508', country: 'Saint Pierre e Miquelon', flag: '🇵🇲' },
    { code: '+509', country: 'Haiti', flag: '🇭🇹' },
    { code: '+590', country: 'Guadalupe', flag: '🇬🇵' },
    { code: '+591', country: 'Bolívia', flag: '🇧🇴' },
    { code: '+592', country: 'Guiana', flag: '🇬🇾' },
    { code: '+593', country: 'Equador', flag: '🇪🇨' },
    { code: '+594', country: 'Guiana Francesa', flag: '🇬🇫' },
    { code: '+595', country: 'Paraguai', flag: '🇵🇾' },
    { code: '+596', country: 'Martinica', flag: '🇲🇶' },
    { code: '+597', country: 'Suriname', flag: '🇸🇷' },
    { code: '+598', country: 'Uruguai', flag: '🇺🇾' },
    { code: '+599', country: 'Antilhas Holandesas', flag: '🇧🇶' },
    { code: '+670', country: 'Timor-Leste', flag: '🇹🇱' },
    { code: '+672', country: 'Antártica', flag: '🇦🇶' },
    { code: '+673', country: 'Brunei', flag: '🇧🇳' },
    { code: '+674', country: 'Nauru', flag: '🇳🇷' },
    { code: '+675', country: 'Papua Nova Guiné', flag: '🇵🇬' },
    { code: '+676', country: 'Tonga', flag: '🇹🇴' },
    { code: '+677', country: 'Ilhas Salomão', flag: '🇸🇧' },
    { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
    { code: '+679', country: 'Fiji', flag: '🇫🇯' },
    { code: '+680', country: 'Palau', flag: '🇵🇼' },
    { code: '+681', country: 'Wallis e Futuna', flag: '🇼🇫' },
    { code: '+682', country: 'Ilhas Cook', flag: '🇨🇰' },
    { code: '+683', country: 'Niue', flag: '🇳🇺' },
    { code: '+684', country: 'Samoa Americana', flag: '🇦🇸' },
    { code: '+685', country: 'Samoa', flag: '🇼🇸' },
    { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
    { code: '+687', country: 'Nova Caledônia', flag: '🇳🇨' },
    { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
    { code: '+689', country: 'Polinésia Francesa', flag: '🇵🇫' },
    { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
    { code: '+691', country: 'Micronésia', flag: '🇫🇲' },
    { code: '+692', country: 'Ilhas Marshall', flag: '🇲🇭' },
    { code: '+850', country: 'Coreia do Norte', flag: '🇰🇵' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+853', country: 'Macau', flag: '🇲🇴' },
    { code: '+855', country: 'Camboja', flag: '🇰🇭' },
    { code: '+856', country: 'Laos', flag: '🇱🇦' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
    { code: '+960', country: 'Maldivas', flag: '🇲🇻' },
    { code: '+961', country: 'Líbano', flag: '🇱🇧' },
    { code: '+962', country: 'Jordânia', flag: '🇯🇴' },
    { code: '+963', country: 'Síria', flag: '🇸🇾' },
    { code: '+964', country: 'Iraque', flag: '🇮🇶' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+966', country: 'Arábia Saudita', flag: '🇸🇦' },
    { code: '+967', country: 'Iêmen', flag: '🇾🇪' },
    { code: '+968', country: 'Omã', flag: '🇴🇲' },
    { code: '+970', country: 'Palestina', flag: '🇵🇸' },
    { code: '+971', country: 'Emirados Árabes Unidos', flag: '🇦🇪' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+973', country: 'Bahrein', flag: '🇧🇭' },
    { code: '+974', country: 'Catar', flag: '🇶🇦' },
    { code: '+975', country: 'Butão', flag: '🇧🇹' },
    { code: '+976', country: 'Mongólia', flag: '🇲🇳' },
    { code: '+977', country: 'Nepal', flag: '🇳🇵' },
    { code: '+992', country: 'Tajiquistão', flag: '🇹🇯' },
    { code: '+993', country: 'Turcomenistão', flag: '🇹🇲' },
    { code: '+994', country: 'Azerbaijão', flag: '🇦🇿' },
    { code: '+995', country: 'Geórgia', flag: '🇬🇪' },
    { code: '+996', country: 'Quirguistão', flag: '🇰🇬' },
    { code: '+998', country: 'Uzbequistão', flag: '🇺🇿' }
  ].sort((a, b) => a.country.localeCompare(b.country))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [urlParams, setUrlParams] = useState({
    source: '',
    affiliate: '',
    utm_source: '',
    utm_campaign: '',
    utm_medium: '',
    utm_content: '',
    utm_term: ''
  })

  useEffect(() => {
    // Get parameters from URL
    const params = new URLSearchParams(window.location.search)
    setUrlParams({
      source: params.get('source') || '',
      affiliate: params.get('affiliate') || '',
      utm_source: params.get('utm_source') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || ''
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: `${formData.countryCode}${formData.phone.trim()}`,
          source: urlParams.source || 'black',
          course: 'black',
          utm_source: urlParams.utm_source,
          utm_campaign: urlParams.utm_campaign,
          utm_medium: urlParams.utm_medium,
          utm_content: urlParams.utm_content,
          utm_term: urlParams.utm_term
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar formulário')
      }

      // Redirect to thank you page
      window.location.href = '/black/thank-you'
    } catch (err: any) {
      if (err?.message?.includes('duplicate') || err?.message?.includes('already exists')) {
        setError('Este e-mail já está cadastrado na lista VIP.')
      } else {
        setError('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
 {/* Meta Pixel Code */}
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
          alt=""
        />
      </noscript>
      
      
      
      <style jsx>{`
        @keyframes slideRight {
          0% { transform: translateX(-50%) skewY(-2deg); }
          100% { transform: translateX(50%) skewY(-2deg); }
        }
        @keyframes slideLeft {
          0% { transform: translateX(50%) skewY(2deg); }
          100% { transform: translateX(-50%) skewY(2deg); }
        }
      `}</style>
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
      <section className="pt-16 pb-8 bg-gradient-to-b from-black via-black to-yellow-500/5 min-h-[70vh] flex items-center relative" style={{background: 'radial-gradient(ellipse at right, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0.1) 30%, rgba(0, 0, 0, 1) 70%)'}}>
        <div className="container mx-auto px-4 max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Section - Text Only */}
            <div className="text-white ml-0 md:ml-8">
              {/* Date Chip */}
              <div className="flex justify-center md:justify-start mb-6">
                <div className="inline-flex items-center bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2">
                  <span className="text-yellow-400 font-semibold text-sm">09/11 às 17h 🇧🇷</span>
                </div>
              </div>
              
              {/* Headline */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Entre nas áreas mais  <span className="text-yellow-400">bem pagas</span> da programação.
              </h2>
              
              {/* Description */}
              <p className="text-lg text-white/90 mb-8">
                Pare de estudar e comece a trabalhar, estudo direcionado com foco em requisitos do mercado, vem ter uma experiência real que já garantiu emprego para centenas de alunos.
              </p>
            </div>

            {/* Right Section - Form */}
            <div className="text-white w-full">
              {/* CTA Form */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full">
                <h3 className="text-lg font-bold mb-3 text-center text-white">
                 Cadastre-se gratuitamente
                </h3>
                
                {success ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-yellow-500 mb-2">Você está na lista VIP!</h4>
                    <p className="text-gray-300 text-xs">Você será notificado sobre o lançamento e receberá benefícios exclusivos.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs text-white mb-1">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Digite seu nome"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm"
                        required
                        minLength={3}
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Digite seu melhor e-mail"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white mb-1">
                        Celular
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* Country Code Dropdown */}
                        <select
                          value={formData.countryCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                          className="px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm w-full sm:min-w-[120px] sm:w-auto"
                        >
                          {countryCodes.map((country, index) => (
                            <option key={index} value={country.code} className="bg-zinc-800 text-white whitespace-nowrap">
                              {country.flag} {country.country} ({country.code})
                            </option>
                          ))}
                        </select>
                        
                        {/* Phone Number Input */}
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="11 98765-4321"
                          className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all text-sm"
                          maxLength={100}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Selecione seu país e digite apenas o número
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isLoading ? 'Enviando...' : 'ME INSCREVER'}
                    </button>

                    {error && (
                      <p className="text-red-400 text-xs text-center">{error}</p>
                    )}
                  </form>
                )}
              </div>
            </div>

          </div>

          {/* Diagonal Banner Ribbons */}
          <div className="mt-12 h-32 -mx-4 overflow-hidden z-10 relative w-screen">
            {/* First Diagonal Ribbon - GRATUITO */}
            <div className="absolute bottom-12 left-0 w-full h-16 transform -skew-y-3"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(100,100,100,0.6) 50%, rgba(0,0,0,0.8) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-lg tracking-[0.2em] whitespace-nowrap uppercase drop-shadow-lg">
                  ✦ GRATUITO ✦ GRATUITO ✦ GRATUITO ✦ GRATUITO ✦ GRATUITO ✦
                </div>
              </div>
            </div>

            {/* Second Diagonal Ribbon - INSCREVA-SE */}
            <div className="absolute bottom-2 left-0 w-full h-14 transform skew-y-3"
              style={{
                background: 'linear-gradient(45deg, rgba(100,100,100,0.6) 0%, rgba(0,0,0,0.8) 50%, rgba(100,100,100,0.6) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-base tracking-[0.3em] whitespace-nowrap uppercase drop-shadow-lg">
                  ✦ INSCREVA-SE ✦ INSCREVA-SE ✦ INSCREVA-SE ✦ INSCREVA-SE ✦
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Learning Modules Section */}
      <section className="py-4 bg-gradient-to-b from-yellow-500/5 via-yellow-900/3 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Veja o que você aprenderá:
            </h2>
            <p className="text-lg text-white/90 max-w-4xl mx-auto">
              Em apenas UMA aula, você aprenderá sobre as áreas mais bem pagas da programação, e entenderá como se posicionar para ser uma pessoa desejada pelo mercado de trabalho, <span className="underline decoration-yellow-400 decoration-2">aumentando seus resultados em 200%</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Module 1 */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-black"></div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-yellow-400 font-bold text-sm">MERCADO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Principais áreas de mercado
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Aprenda quais sao as principais áreas de mercado para se especializar. Quais sao as principais linguagens de programação para cada área.
              </p>
            </div>

            {/* Module 2 */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-black"></div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-yellow-400 font-bold text-sm">PREPARAÇÃO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Plano de estudos com foco em requisitos reais das vagas
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Plano de estudos com foco em requisitos reais das vagas. Você vai aprender a se especializar em uma área e a se tornar um profissional qualificado para o mercado.
              </p>
            </div>

            {/* Module 3 */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-black"></div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-yellow-400 font-bold text-sm">RESULTADO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Tenha resultados reais, trabalhando em projetos.
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Tenha resultados reais, trabalhando em projetos. Você vai aprender a se especializar em uma área e a se tornar um profissional qualificado para o mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

     
      {/* Authority Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src="/images/roque1234.png"
                  alt="Roque - Programador e Educador"
                  width={400}
                  height={400}
                  className="rounded-2xl"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Uma escola criada por quem vive de programação.
                </h2>
                
                <div className="text-lg text-gray-300 space-y-4">
                  <p>Eu sou <span className="text-yellow-500 font-semibold">Roque</span>, programador e educador.</p>
                  <p>Depois de anos ensinando milhares de alunos e trabalhando no <span className="text-yellow-500 font-semibold">Spotify</span>, percebi uma coisa:</p>
                  <p className="text-xl text-yellow-500 font-semibold">👉 As pessoas não precisam de mais cursos,<br />elas precisam de experiência real.</p>
                  <p>E é exatamente isso que a Nova Era vai entregar.</p>
                </div>

                <button
                  onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl transition-all text-lg"
                >
                  🔔 Quero fazer parte da Nova Era
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      
      </main>
    </>
  )
}

