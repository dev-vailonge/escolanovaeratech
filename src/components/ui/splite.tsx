'use client'

import { useEffect, useState } from 'react'

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [SplineComponent, setSplineComponent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadSpline = async () => {
      try {
        // Use Next.js specific export
        const splineModule = await import('@splinetool/react-spline/next')
        const Spline = splineModule.default || splineModule
        
        if (!Spline) {
          throw new Error('Spline component not found in module')
        }

        if (mounted) {
          setSplineComponent(() => Spline)
          setIsLoading(false)
          setError(null)
        }
      } catch (err: any) {
        console.error('Failed to load Spline:', err)
        // Fallback to regular import if next export fails
        try {
          const splineModule = await import('@splinetool/react-spline')
          const Spline = splineModule.default || splineModule
          if (mounted && Spline) {
            setSplineComponent(() => Spline)
            setIsLoading(false)
            setError(null)
          }
        } catch (fallbackErr: any) {
          console.error('Fallback import also failed:', fallbackErr)
          if (mounted) {
            setError(fallbackErr?.message || 'Failed to load 3D scene')
            setIsLoading(false)
          }
        }
      }
    }

    // Only load on client side
    if (typeof window !== 'undefined') {
      loadSpline()
    }

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

  if (error || !SplineComponent) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#000' }}>
        <div className="text-white text-center">
          <p className="text-sm mb-2">Carregando cena 3D...</p>
          {error && <p className="text-xs text-gray-400">{error}</p>}
        </div>
      </div>
    )
  }

  return <SplineComponent scene={scene} className={className} />
}

