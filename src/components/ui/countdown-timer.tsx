'use client'

import React, { useEffect, useRef, useState } from "react"
import { useAnimate } from "framer-motion"
import { cn } from "@/lib/utils"

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

interface CountdownTimerProps {
  targetDate: Date
  theme?: 'dark' | 'light'
}

export default function CountdownTimer({ targetDate, theme = 'dark' }: CountdownTimerProps) {
  return (
    <div className="flex w-full flex-nowrap items-center justify-evenly gap-1 md:gap-2">
      <CountdownItem unit="Day" label="Dias" targetDate={targetDate} theme={theme} />
      <CountdownItem unit="Hour" label="Horas" targetDate={targetDate} theme={theme} />
      <CountdownItem unit="Minute" label="Minutos" targetDate={targetDate} theme={theme} />
      <CountdownItem unit="Second" label="Segundos" targetDate={targetDate} theme={theme} />
    </div>
  )
}

function CountdownItem({ unit, label, targetDate, theme }: { unit: string; label: string; targetDate: Date; theme: 'dark' | 'light' }) {
  const { ref, time } = useTimer(unit, targetDate)
  const display = unit === "Second" ? String(time).padStart(2, '0') : String(time).padStart(2, '0')

  const isDay = unit === "Day"

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-1 md:gap-2",
      "px-2 md:px-3 py-2 md:py-4",
      "flex-1 min-w-[60px] md:min-w-[80px]"
    )}>
      <div className="relative w-full overflow-hidden text-center">
        <span
          ref={ref}
          className={cn(
            "block font-mono font-bold transition-colors duration-500",
            theme === 'dark'
              ? "text-3xl md:text-5xl lg:text-6xl text-yellow-400"
              : "text-3xl md:text-5xl lg:text-6xl text-yellow-600"
          )}
        >
          {display}
        </span>
      </div>
      <span className={cn(
        "font-medium transition-colors duration-500 text-center",
        theme === 'dark' ? "text-xs md:text-sm text-gray-400" : "text-xs md:text-sm text-gray-600"
      )}>
        {label}
      </span>
      <div className={cn(
        "h-px w-full mt-1 md:mt-2 transition-colors duration-500",
        theme === 'dark' ? "bg-gray-700" : "bg-gray-300"
      )}></div>
    </div>
  )
}

function useTimer(unit: string, targetDate: Date) {
  const [scope, animate] = useAnimate()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeRef = useRef(0)
  const [time, setTime] = useState(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    const handleCountdown = async () => {
      if (!isMountedRef.current) return
      
      const end = targetDate
      const now = new Date()
      const distance = end.getTime() - now.getTime()

      if (distance < 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        return
      }

      let newTime = 0
      switch (unit) {
        case "Day":
          newTime = Math.max(0, Math.floor(distance / DAY))
          break
        case "Hour":
          newTime = Math.max(0, Math.floor((distance % DAY) / HOUR))
          break
        case "Minute":
          newTime = Math.max(0, Math.floor((distance % HOUR) / MINUTE))
          break
        default:
          newTime = Math.max(0, Math.floor((distance % MINUTE) / SECOND))
      }

      if (newTime !== timeRef.current) {
        timeRef.current = newTime
        setTime(newTime)

        // Tentar animar apenas se o elemento estiver montado e animate estiver disponível
        if (scope.current && animate && typeof animate === 'function') {
          try {
            await animate(
              scope.current,
              { y: ["0%", "-50%"], opacity: [1, 0] },
              { duration: 0.35 }
            )

            if (!isMountedRef.current) return

            await animate(
              scope.current,
              { y: ["50%", "0%"], opacity: [0, 1] },
              { duration: 0.35 }
            )
          } catch (error) {
            // Se animação falhar, ignorar (valor já foi atualizado)
            console.warn('Erro na animação do countdown:', error)
          }
        }
      }
    }

    // Calcular valor inicial
    const end = targetDate
    const now = new Date()
    const distance = end.getTime() - now.getTime()
    
    if (distance >= 0) {
      let initialTime = 0
      switch (unit) {
        case "Day":
          initialTime = Math.max(0, Math.floor(distance / DAY))
          break
        case "Hour":
          initialTime = Math.max(0, Math.floor((distance % DAY) / HOUR))
          break
        case "Minute":
          initialTime = Math.max(0, Math.floor((distance % HOUR) / MINUTE))
          break
        default:
          initialTime = Math.max(0, Math.floor((distance % MINUTE) / SECOND))
      }
      timeRef.current = initialTime
      setTime(initialTime)
    }

    handleCountdown()
    intervalRef.current = setInterval(handleCountdown, 1000)
    
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [unit, targetDate, animate, scope])

  return { ref: scope, time }
}

