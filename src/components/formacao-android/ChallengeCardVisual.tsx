import type { CSSProperties } from 'react'
import type { ChallengeVisual } from '@/data/formacao-android-desafios'
import { cn } from '@/lib/utils'

/** Área de preview: mesma proporção dos cards da formação Android */
export const CHALLENGE_COVER_WIDTH = 280
export const CHALLENGE_COVER_HEIGHT = 360

export const challengePreviewFrameStyle: CSSProperties = {
  maxWidth: CHALLENGE_COVER_WIDTH,
  aspectRatio: `${CHALLENGE_COVER_WIDTH} / ${CHALLENGE_COVER_HEIGHT}`,
}

function challengePreviewShell(className: string) {
  return {
    className: cn('relative mx-auto w-full overflow-hidden', className),
    style: challengePreviewFrameStyle,
  }
}

export function ChallengeCardVisual({ visual, isDark }: { visual: ChallengeVisual; isDark: boolean }) {
  switch (visual) {
    case 'phone':
      return (
        <div
          {...challengePreviewShell(
            'flex h-full min-h-0 items-center justify-center bg-gradient-to-b from-sky-400/25 to-blue-700/40'
          )}
        >
          <div className="h-[7.5rem] w-24 rounded-2xl border-2 border-white/50 bg-gradient-to-b from-sky-300/90 to-blue-600/90 shadow-lg" />
        </div>
      )
    case 'wireframe':
      return (
        <div {...challengePreviewShell('bg-gray-100 p-4 flex h-full min-h-0 flex-col gap-2')}>
          <div className="h-3 rounded bg-gray-300/90 w-4/5" />
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
            <div className="rounded-lg bg-white border border-gray-300 shadow-sm" />
            <div className="rounded-lg bg-white border border-gray-300 shadow-sm" />
          </div>
          <div className="h-8 rounded bg-gray-200" />
        </div>
      )
    case 'chart':
      return (
        <div
          {...challengePreviewShell(
            'bg-[#0f172a] px-4 pb-4 pt-6 flex h-full min-h-0 items-end justify-center gap-1.5'
          )}
        >
          {[40, 68, 48, 82, 56, 72].map((h, i) => (
            <div
              key={i}
              className="w-5 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-300/90"
              style={{ height: `${h}%`, maxHeight: '85%' }}
            />
          ))}
        </div>
      )
    case 'map':
      return (
        <div
          {...challengePreviewShell(
            'bg-gradient-to-br from-emerald-900/40 to-slate-900 flex h-full min-h-0 items-center justify-center p-4'
          )}
        >
          <div className="grid grid-cols-3 gap-1 w-28 opacity-90">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-6 rounded-sm bg-emerald-500/40 border border-emerald-400/30" />
            ))}
          </div>
        </div>
      )
    case 'crypto':
      return (
        <div
          {...challengePreviewShell(
            'bg-gradient-to-br from-amber-900/30 to-zinc-900 flex h-full min-h-0 items-center justify-center'
          )}
        >
          <div className="flex gap-2 items-end h-24">
            {[30, 55, 40, 70, 45].map((h, i) => (
              <div key={i} className="w-4 rounded-t bg-amber-400/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )
    case 'media':
      return (
        <div
          {...challengePreviewShell(
            'bg-gradient-to-br from-violet-900/35 to-indigo-950 flex h-full min-h-0 items-center justify-center gap-3'
          )}
        >
          <div className="h-16 w-12 rounded-lg bg-white/10 border border-white/20" />
          <div className="h-20 w-20 rounded-full border-4 border-violet-400/50 bg-violet-500/20" />
        </div>
      )
    default:
      return <div {...challengePreviewShell(isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200')} />
  }
}
