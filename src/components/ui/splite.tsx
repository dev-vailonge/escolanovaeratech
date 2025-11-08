'use client'

import { useEffect, useState } from 'react'

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [SplineComponent, setSplineComponent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadSpline = async () => {
      try {
        const Spline = (await import('@splinetool/react-spline')).default
        if (mounted) {
          setSplineComponent(() => Spline)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to load Spline:', error)
        if (mounted) {
          setHasError(true)
          setIsLoading(false)
        }
      }
    }

    loadSpline()

    return () => {
      mounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (hasError || !SplineComponent) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#000' }}>
        <div className="text-white text-center">
          <p className="text-sm">Carregando cena 3D...</p>
        </div>
      </div>
    )
  }

  return <SplineComponent scene={scene} className={className} />
}

