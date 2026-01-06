'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  label?: string
  required?: boolean
  minDate?: string
  maxDate?: string
  placeholder?: string
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function DatePicker({
  value,
  onChange,
  label,
  required = false,
  minDate,
  maxDate,
  placeholder = 'Selecione uma data'
}: DatePickerProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00')
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atualizar mês quando value muda
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00')
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }, [value])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: (number | null)[] = []
    
    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = selectedDate.toISOString().split('T')[0]
    onChange(dateStr)
    setIsOpen(false)
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    
    return false
  }

  const isSelectedDate = (day: number) => {
    if (!value) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === value
  }

  const isToday = (day: number) => {
    const today = new Date()
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === today.toDateString()
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className={cn(
          "block text-sm font-medium mb-2",
          theme === 'dark' ? "text-gray-300" : "text-gray-700"
        )}>
          {label} {required && '*'}
        </label>
      )}
      
      {/* Input Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors text-left flex items-center justify-between",
          theme === 'dark'
            ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
            : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
        )}
      >
        <span className={!value ? (theme === 'dark' ? 'text-gray-500' : 'text-gray-400') : ''}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <Calendar className={cn(
          "w-4 h-4",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )} />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-2 p-4 rounded-xl border shadow-xl",
          theme === 'dark'
            ? "bg-gray-900 border-white/10"
            : "bg-white border-gray-200"
        )} style={{ minWidth: '280px' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={cn(
                "p-1 rounded-lg transition-colors",
                theme === 'dark'
                  ? "hover:bg-white/10 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={cn(
              "font-semibold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className={cn(
                "p-1 rounded-lg transition-colors",
                theme === 'dark'
                  ? "hover:bg-white/10 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className={cn(
                  "text-center text-xs font-medium py-1",
                  theme === 'dark' ? "text-gray-500" : "text-gray-500"
                )}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null ? (
                  <button
                    type="button"
                    onClick={() => !isDateDisabled(day) && handleSelectDay(day)}
                    disabled={isDateDisabled(day)}
                    className={cn(
                      "w-full h-full rounded-lg text-sm font-medium transition-all flex items-center justify-center",
                      isSelectedDate(day) && (
                        theme === 'dark'
                          ? "bg-yellow-400 text-black"
                          : "bg-yellow-500 text-white"
                      ),
                      !isSelectedDate(day) && isToday(day) && (
                        theme === 'dark'
                          ? "border border-yellow-400/50 text-yellow-400"
                          : "border border-yellow-500 text-yellow-600"
                      ),
                      !isSelectedDate(day) && !isToday(day) && !isDateDisabled(day) && (
                        theme === 'dark'
                          ? "text-gray-300 hover:bg-white/10"
                          : "text-gray-700 hover:bg-gray-100"
                      ),
                      isDateDisabled(day) && (
                        theme === 'dark'
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-300 cursor-not-allowed"
                      )
                    )}
                  >
                    {day}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {/* Footer - Botão Hoje */}
          <div className="mt-3 pt-3 border-t flex justify-center" style={{
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }}>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                onChange(today)
                setIsOpen(false)
              }}
              className={cn(
                "px-3 py-1 text-sm rounded-lg transition-colors",
                theme === 'dark'
                  ? "text-yellow-400 hover:bg-yellow-400/10"
                  : "text-yellow-600 hover:bg-yellow-50"
              )}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}






