'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/ThemeContext'
import { compressImage, isValidImageFile, blobToFile } from '@/lib/imageCompression'

interface QuestionImageUploadProps {
  onImageChange: (file: File | null) => void
  currentImageUrl?: string | null
  resetTrigger?: number // Prop para forçar reset do componente
}

export default function QuestionImageUpload({
  onImageChange,
  currentImageUrl,
  resetTrigger,
}: QuestionImageUploadProps) {
  const { theme } = useTheme()
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Atualizar preview quando currentImageUrl mudar
  useEffect(() => {
    setPreview(currentImageUrl || null)
  }, [currentImageUrl])

  // Reset quando resetTrigger mudar (apenas se não houver currentImageUrl para manter)
  useEffect(() => {
    if (resetTrigger !== undefined && !currentImageUrl) {
      handleRemove()
    }
  }, [resetTrigger, currentImageUrl])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // Validar arquivo
    if (!isValidImageFile(file)) {
      setError('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (antes da compressão)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('Imagem muito grande. Máximo: 5MB')
      return
    }

    try {
      setUploading(true)

      // Comprimir imagem
      const compressedBlob = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        maxSizeMB: 1,
        format: 'webp',
      })

      // Converter para File
      const compressedFile = blobToFile(
        compressedBlob,
        file.name.replace(/\.[^/.]+$/, '.webp'),
        'image/webp'
      )

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(compressedFile)

      // Notificar componente pai
      onImageChange(compressedFile)
      setUploading(false)
    } catch (err: any) {
      console.error('Erro ao comprimir imagem:', err)
      setError(err.message || 'Erro ao processar imagem')
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError('')
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className={cn('text-sm font-medium block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
        Imagem (opcional)
      </label>

      {error && (
        <div
          className={cn(
            'border rounded-lg p-2 text-xs',
            theme === 'dark'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          )}
        >
          {error}
        </div>
      )}

      {preview ? (
        <div className="relative">
          <div 
            className={cn(
              'relative rounded-lg border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity',
              theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-gray-50'
            )}
            onClick={handleClick}
          >
            <div className="w-full max-h-96 flex items-center justify-center p-2">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-96 h-auto object-contain rounded"
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm border transition-colors',
                theme === 'dark'
                  ? 'bg-black/50 border-white/20 text-white hover:bg-black/70'
                  : 'bg-white/90 border-gray-300 text-gray-700 hover:bg-white'
              )}
              aria-label="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className={cn('text-xs mt-1 text-center', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
            Clique na imagem para trocar ou no X para remover
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className={cn(
            'w-full p-4 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center justify-center gap-2',
            theme === 'dark'
              ? 'border-white/10 bg-black/30 hover:border-yellow-400/50 hover:bg-black/50'
              : 'border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-50/50',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {uploading ? (
            <>
              <div className={cn(
                'animate-spin rounded-full h-6 w-6 border-b-2',
                theme === 'dark' ? 'border-yellow-400' : 'border-yellow-600'
              )} />
              <span className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                Comprimindo...
              </span>
            </>
          ) : (
            <>
              <ImageIcon className={cn(
                'w-6 h-6',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )} />
              <span className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                Adicionar imagem
              </span>
              <span className={cn('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                Máx. 5MB (será comprimida para 1MB)
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

