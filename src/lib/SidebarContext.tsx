'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Carregar preferência do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded')
    if (savedState !== null) {
      setIsExpanded(savedState === 'true')
    }
  }, [])

  // Salvar preferência no localStorage
  const handleSetExpanded = (expanded: boolean) => {
    setIsExpanded(expanded)
    localStorage.setItem('sidebar-expanded', String(expanded))
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded: handleSetExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

