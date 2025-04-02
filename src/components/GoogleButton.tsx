'use client'

import Image from 'next/image'

interface GoogleButtonProps {
  onClick: () => void
}

export function GoogleButton({ onClick }: GoogleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] text-white py-3 px-4 rounded-lg hover:bg-[#1a1a1a] transition-colors"
    >
      <Image
        src="/google.svg"
        alt="Logo do Google"
        width={20}
        height={20}
      />
      Continuar com Google
    </button>
  )
} 