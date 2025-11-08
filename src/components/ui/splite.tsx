'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

interface SplineSceneProps {
  scene: string
  className?: string
}

// Use Next.js dynamic import with no SSR
const SplineSceneComponent = dynamic(
  () => import('@splinetool/react-spline/next').then((mod) => {
    const Spline = mod.default || mod
    return Spline as ComponentType<SplineSceneProps>
  }).catch(() => {
    // Fallback to regular import
    return import('@splinetool/react-spline').then((mod) => {
      const Spline = mod.default || mod
      return Spline as ComponentType<SplineSceneProps>
    })
  }),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
)

export function SplineScene({ scene, className }: SplineSceneProps) {
  return <SplineSceneComponent scene={scene} className={className} />
}

