'use client'

import { useEffect, useState } from 'react'

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [SplineComponent, setSplineComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only load on client side, after component mounts
    // Use Function constructor to create a dynamic import that won't be analyzed at build time
    if (typeof window === 'undefined') return

    let mounted = true

    // Use Function constructor to create import that only executes at runtime
    // This prevents Next.js from trying to resolve the module during build
    const loadSpline = new Function('return import("@splinetool/react-spline/next")')
    
    loadSpline()
      .then((splineModule: any) => {
        if (!mounted) return
        
        const Spline = splineModule.default || splineModule
        if (Spline && typeof Spline === 'function') {
          setSplineComponent(() => Spline)
          setIsLoading(false)
        } else {
          setIsLoading(false)
        }
      })
      .catch((error: any) => {
        console.error('Failed to load Spline:', error)
        if (mounted) {
          setIsLoading(false)
        }
      })

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

  if (!SplineComponent) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#000' }}>
        <div className="text-white text-sm">3D Scene</div>
      </div>
    )
  }

  // Render the Spline component
  const Component = SplineComponent
  return <Component scene={scene} className={className} />
}

