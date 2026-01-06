/**
 * Utilitário para compressão de imagens no cliente
 * Configuração: max 1MB, qualidade 80%, redimensionar se necessário (max 1920px largura)
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
  format?: 'webp' | 'jpeg' | 'png'
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 1,
  format: 'webp',
}

/**
 * Comprime uma imagem usando Canvas API
 * @param file Arquivo de imagem original
 * @param options Opções de compressão
 * @returns Blob comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        try {
          // Calcular dimensões mantendo proporção
          let { width, height } = img
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
          
          if (ratio < 1) {
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }

          // Criar canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Não foi possível obter contexto do canvas'))
            return
          }

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height)

          // Tentar comprimir
          const attemptCompress = (quality: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Erro ao comprimir imagem'))
                  return
                }

                // Se o tamanho está OK ou qualidade já é muito baixa, retornar
                if (blob.size <= maxSizeBytes || quality <= 0.3) {
                  resolve(blob)
                  return
                }

                // Reduzir qualidade e tentar novamente
                attemptCompress(quality - 0.1)
              },
              `image/${opts.format}`,
              quality
            )
          }

          // Começar com qualidade especificada
          attemptCompress(opts.quality)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'))
      }

      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Verifica se o arquivo é uma imagem válida
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/') && file.size > 0
}

/**
 * Converte Blob para File
 */
export function blobToFile(blob: Blob, fileName: string, mimeType: string): File {
  return new File([blob], fileName, { type: mimeType })
}





