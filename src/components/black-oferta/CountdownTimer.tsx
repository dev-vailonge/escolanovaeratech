'use client'

import { useState, useEffect } from 'react'

const calculateTimeLeft = () => {
  const now = new Date()
  
  // 16 de novembro às 23:59:59 (mês 10 porque JavaScript usa 0-11 para meses)
  // Usar horário local para garantir precisão
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  
  // Criar data alvo no horário local
  let targetDate = new Date(currentYear, 10, 16, 23, 59, 59, 999) // 16 de novembro às 23:59:59.999
  
  // Se já passamos de novembro ou já passamos do dia 16 de novembro, usar o próximo ano
  if (currentMonth > 10 || (currentMonth === 10 && currentDay > 16) || targetDate.getTime() <= now.getTime()) {
    targetDate = new Date(currentYear + 1, 10, 16, 23, 59, 59, 999)
  }
  
  const difference = targetDate.getTime() - now.getTime()

  if (difference > 0) {
    const totalSeconds = Math.floor(difference / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return { days, hours, minutes, seconds }
  }
  
  return { days: 0, hours: 0, minutes: 0, seconds: 0 }
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft)

  useEffect(() => {
    // Calcular imediatamente
    setTimeLeft(calculateTimeLeft)
    
    // Atualizar a cada segundo
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Title */}
      <h3 className="text-white text-base md:text-lg font-medium text-center mb-2">
        Oferta termina em: <span className="border-b-2 border-red-500">16/11 às 23:59:59</span>
      </h3>
      
      {/* Description */}
      <p className="text-gray-400 text-sm md:text-base text-center mb-4">
        Garanta sua vaga agora para não perder essa oportunidade.
      </p>
      
      {/* Countdown Modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {/* Days */}
        <div className="bg-zinc-900/80 border border-yellow-400/20 rounded-lg p-3 md:p-4 text-center shadow-lg">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1">
            {timeLeft.days}
          </div>
          <div className="text-yellow-400/80 text-xs font-medium uppercase tracking-wide">
            Dias
          </div>
        </div>

        {/* Hours */}
        <div className="bg-zinc-900/80 border border-yellow-400/20 rounded-lg p-3 md:p-4 text-center shadow-lg">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-yellow-400/80 text-xs font-medium uppercase tracking-wide">
            Horas
          </div>
        </div>

        {/* Minutes */}
        <div className="bg-zinc-900/80 border border-yellow-400/20 rounded-lg p-3 md:p-4 text-center shadow-lg">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-yellow-400/80 text-xs font-medium uppercase tracking-wide">
            Minutos
          </div>
        </div>

        {/* Seconds */}
        <div className="bg-zinc-900/80 border border-yellow-400/20 rounded-lg p-3 md:p-4 text-center shadow-lg">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-yellow-400/80 text-xs font-medium uppercase tracking-wide">
            Segundos
          </div>
        </div>
      </div>
    </div>
  )
}

