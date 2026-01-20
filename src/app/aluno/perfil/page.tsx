'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { Edit2, Trophy, Lock, HelpCircle, BookOpen, Target, MessageCircle, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/features'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLevelBorderColor, getLevelRequirements, getXPForNextLevel, getLevelCategory, calculateLevel } from '@/lib/gamification'
import type { DatabaseUserXpHistory } from '@/types/database'
import { safeFetch } from '@/lib/utils/safeSupabaseQuery'

export default function PerfilPage() {
  const { user: authUser, refreshSession } = useAuth()
  // Usar usuário autenticado se disponível, senão usar mockUser como fallback
  const user = authUser ? {
    ...mockUser,
    name: authUser.name,
    email: authUser.email,
    level: authUser.level ?? mockUser.level,
    xp: authUser.xp ?? mockUser.xp,
    coins: authUser.coins ?? mockUser.coins,
    streak: authUser.streak ?? mockUser.streak,
    avatarUrl: authUser.avatarUrl ?? null,
    bio: authUser.bio ?? null, // Não usar mockUser.bio como fallback - deixar null para novos usuários
    joinDate: authUser.createdAt ?? mockUser.joinDate,
  } : mockUser
  const { theme } = useTheme()

  // Helper para obter avatarUrl corretamente (mockUser usa 'avatar', authUser usa 'avatarUrl')
  const getAvatarUrl = (): string | null => {
    if (authUser) {
      return authUser.avatarUrl ?? null
    }
    return mockUser.avatar ?? null
  }

  const avatarUrl = getAvatarUrl()

  // Calcular nível baseado no XP atual (pode ser diferente do user.level se estiver desatualizado)
  const currentLevel = calculateLevel(user.xp || 0)
  const currentLevelCategory = getLevelCategory(currentLevel)

  // Função para limpar descrição removendo níveis de dificuldade
  const limparDescricao = (descricao: string | null | undefined): string => {
    if (!descricao) return ''
    return descricao
      // Remove padrão: " - Avancado" ou " - Avançado" em qualquer lugar
      .replace(/\s*-\s*(Iniciante|Intermediário|Intermediario|Avançado|Avancado)\s*/gi, ' ')
      // Remove entre parênteses: "(Avancado)"
      .replace(/\s*\(Iniciante|Intermediário|Intermediario|Avançado|Avancado\)/gi, '')
      // Remove espaços duplicados
      .replace(/\s+/g, ' ')
      .trim()
  }

  const [editOpen, setEditOpen] = useState(false)
  const [niveisModalOpen, setNiveisModalOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio || '') // Estado do formulário - pode estar vazio
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [xpHistory, setXpHistory] = useState<DatabaseUserXpHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Crop state (zoom + mover)
  const cropBoxRef = useRef<HTMLDivElement | null>(null)
  const [cropBoxSize, setCropBoxSize] = useState(0)
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [cropZoom, setCropZoom] = useState(1.2)
  const [cropOffset, setCropOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const draggingRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; pointerId: number } | null>(null)

  useEffect(() => {
    setName(user.name)
    setAvatarPreview(avatarUrl)
    setBio(user.bio || '')
  }, [user.name, avatarUrl, user.bio])

  // Buscar histórico de XP
  useEffect(() => {
    const fetchXpHistory = async () => {
      if (!authUser?.id) return

      setLoadingHistory(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setLoadingHistory(false)
          return
        }

        const res = await safeFetch('/api/users/me/xp-history', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          retry: true,
          retryAttempts: 2
        })

        if (!res.ok) {
          throw new Error('Erro ao buscar histórico de XP')
        }

        const json = await res.json()
        if (json.success && json.history) {
          setXpHistory(json.history)
        }
      } catch (error) {
        console.error('Erro ao buscar histórico de XP:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchXpHistory()
  }, [authUser?.id])

  const canEdit = !!authUser?.id

  // medir área de recorte
  useEffect(() => {
    if (!editOpen) return
    const el = cropBoxRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setCropBoxSize(Math.round(Math.min(rect.width, rect.height)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [editOpen])

  // carregar dimensões naturais do arquivo
  useEffect(() => {
    if (!avatarFile || !avatarPreview) {
      setImgNatural(null)
      setCropOffset({ x: 0, y: 0 })
      setCropZoom(1.2)
      return
    }
    const url = avatarPreview
    const img = new Image()
    img.onload = () => setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }, [avatarFile, avatarPreview])

  const clampOffset = (next: { x: number; y: number }) => {
    if (!imgNatural || cropBoxSize <= 0) return next
    const S = cropBoxSize
    const baseScale = Math.max(S / imgNatural.w, S / imgNatural.h)
    const scale = baseScale * cropZoom
    const drawW = imgNatural.w * scale
    const drawH = imgNatural.h * scale
    const maxX = Math.max(0, (drawW - S) / 2)
    const maxY = Math.max(0, (drawH - S) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    }
  }

  useEffect(() => {
    setCropOffset((prev) => clampOffset(prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropZoom, cropBoxSize, imgNatural?.w, imgNatural?.h])

  const handlePickFile = (file: File | null) => {
    setAvatarFile(file)
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
      setCropOffset({ x: 0, y: 0 })
      setCropZoom(1.2)
    } else {
      setAvatarPreview(avatarUrl)
    }
  }

  const onCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!avatarFile || !avatarPreview) return
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: cropOffset.x,
      baseY: cropOffset.y,
      pointerId: e.pointerId,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setCropOffset(clampOffset({ x: drag.baseX + dx, y: drag.baseY + dy }))
  }

  const onCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    draggingRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // Função para comprimir imagem se for maior que 5MB
  const compressImageIfNeeded = async (file: File): Promise<File> => {
    const maxBytes = 5 * 1024 * 1024 // 5MB
    
    // Se o arquivo já é menor que 5MB, retornar como está
    if (file.size <= maxBytes) {
      return file
    }

    try {
      // Carregar imagem usando createImageBitmap ou Image como fallback
      let width: number = 0
      let height: number = 0
      let imageSource: ImageBitmap | HTMLImageElement | null = null
      
      if ('createImageBitmap' in window) {
        try {
          const bitmap = await createImageBitmap(file)
          width = bitmap.width
          height = bitmap.height
          imageSource = bitmap
        } catch {
          // Fallback para Image se createImageBitmap falhar
          imageSource = null
        }
      }
      
      // Se não conseguiu com createImageBitmap, usar Image
      if (!imageSource) {
        const url = URL.createObjectURL(file)
        try {
          const img = new Image()
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('Falha ao carregar imagem'))
            img.src = url
          })
          width = img.width
          height = img.height
          imageSource = img
        } finally {
          // Não revogar URL ainda, vamos usar a imagem
        }
      }
      
      if (!imageSource || width === 0 || height === 0) {
        if (imageSource instanceof ImageBitmap) {
          imageSource.close()
        } else if (imageSource instanceof HTMLImageElement) {
          URL.revokeObjectURL(imageSource.src)
        }
        return file // Retornar original se não conseguir carregar
      }
      
      // Calcular nova dimensão mantendo aspect ratio
      // Reduzir para no máximo 2048x2048 (ou menor se necessário para ficar < 5MB)
      const maxDimension = 2048
      let targetWidth = width
      let targetHeight = height
      
      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        const ratio = Math.min(maxDimension / targetWidth, maxDimension / targetHeight)
        targetWidth = Math.round(targetWidth * ratio)
        targetHeight = Math.round(targetHeight * ratio)
      }
      
      // Criar canvas e redimensionar
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        if (imageSource instanceof ImageBitmap) {
          imageSource.close()
        } else if (imageSource instanceof HTMLImageElement) {
          URL.revokeObjectURL(imageSource.src)
        }
        return file // Retornar original se não conseguir comprimir
      }
      
      ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight)
      
      // Limpar recursos
      if (imageSource instanceof ImageBitmap) {
        imageSource.close()
      } else if (imageSource instanceof HTMLImageElement) {
        URL.revokeObjectURL(imageSource.src)
      }
      
      // Tentar diferentes níveis de qualidade até ficar < 5MB
      let quality = 0.9
      let blob: Blob | null = null
      
      for (let attempt = 0; attempt < 5; attempt++) {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
        })
        
        if (blob && blob.size <= maxBytes) {
          break
        }
        
        // Reduzir qualidade para próxima tentativa
        quality -= 0.15
        if (quality < 0.3) {
          // Se qualidade muito baixa, reduzir dimensão
          targetWidth = Math.round(targetWidth * 0.8)
          targetHeight = Math.round(targetHeight * 0.8)
          canvas.width = targetWidth
          canvas.height = targetHeight
          ctx.clearRect(0, 0, targetWidth, targetHeight)
          
          // Recarregar imagem para redimensionar
          const url2 = URL.createObjectURL(file)
          try {
            const img2 = new Image()
            await new Promise<void>((resolve, reject) => {
              img2.onload = () => resolve()
              img2.onerror = () => reject(new Error('Falha ao carregar imagem'))
              img2.src = url2
            })
            ctx.drawImage(img2, 0, 0, targetWidth, targetHeight)
          } finally {
            URL.revokeObjectURL(url2)
          }
          quality = 0.7
        }
      }
      
      if (blob && blob.size <= maxBytes) {
        return new File([blob], file.name, { type: 'image/jpeg' })
      }
      
      // Se ainda não conseguiu, retornar original (vai dar erro na API)
      return file
    } catch (error) {
      console.warn('Erro ao comprimir imagem:', error)
      return file // Retornar original se falhar
    }
  }

  const cropAvatarToFile = async (): Promise<File | null> => {
    try {
      if (!avatarFile) return null
      
      // Comprimir imagem se necessário antes de processar
      const compressedFile = await compressImageIfNeeded(avatarFile)
      
      // Se não há dados de crop, retornar o arquivo comprimido
      if (!imgNatural || cropBoxSize <= 0) {
        return compressedFile
      }

      const S = cropBoxSize
      const baseScale = Math.max(S / imgNatural.w, S / imgNatural.h)
      const scale = baseScale * cropZoom
      const drawW = imgNatural.w * scale
      const drawH = imgNatural.h * scale

      // posição do canto superior esquerdo do image no box
      const imgLeft = (S - drawW) / 2 + cropOffset.x
      const imgTop = (S - drawH) / 2 + cropOffset.y

      let srcX = (0 - imgLeft) / scale
      let srcY = (0 - imgTop) / scale
      const srcSize = S / scale

      // clamp na imagem
      srcX = Math.max(0, Math.min(imgNatural.w - srcSize, srcX))
      srcY = Math.max(0, Math.min(imgNatural.h - srcSize, srcY))

      const outSize = 512
      const canvas = document.createElement('canvas')
      canvas.width = outSize
      canvas.height = outSize
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn('Não foi possível obter contexto 2D do canvas')
        return avatarFile
      }

      // Criar máscara circular
      ctx.beginPath()
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2)
      ctx.clip()

      // load image com timeout
      let bitmap: ImageBitmap | null = null
      if ('createImageBitmap' in window) {
        try {
          bitmap = await Promise.race([
            createImageBitmap(avatarFile),
            new Promise<ImageBitmap>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 5000)
            )
          ])
        } catch (err) {
          console.warn('Erro ao criar ImageBitmap:', err)
          bitmap = null
        }
      }

      if (bitmap) {
        ctx.drawImage(bitmap, srcX, srcY, srcSize, srcSize, 0, 0, outSize, outSize)
        bitmap.close()
      } else {
        const url = URL.createObjectURL(avatarFile)
        try {
          const img = new Image()
          await Promise.race([
            new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error('Falha ao carregar imagem'))
              img.src = url
            }),
            new Promise<void>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 5000)
            )
          ])
          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outSize, outSize)
        } finally {
          URL.revokeObjectURL(url)
        }
      }

      const blob: Blob = await Promise.race([
        new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b)
            else reject(new Error('Falha ao converter canvas para blob'))
          }, 'image/jpeg', 0.9)
        }),
        new Promise<Blob>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao converter canvas')), 5000)
        )
      ])
      
      return new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    } catch (error) {
      console.error('Erro ao processar avatar:', error)
      // Em caso de erro, retornar o arquivo original ou null
      return avatarFile || null
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    if (!authUser?.id) {
      setError('Você precisa estar logado para editar o perfil.')
      return
    }

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError('Nome muito curto.')
      return
    }

    setSaving(true)
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Não autenticado')
      }

      const form = new FormData()
      form.set('name', trimmedName)
      form.set('bio', bio.trim())
      
      // Processar avatar apenas se houver arquivo
      if (avatarFile) {
        setProcessingImage(true)
        try {
          const cropped = await cropAvatarToFile()
          if (cropped) {
            // Verificar tamanho final após compressão/crop
            const maxBytes = 5 * 1024 * 1024 // 5MB
            if (cropped.size > maxBytes) {
              setProcessingImage(false)
              setSaving(false)
              setError('A imagem ainda está muito grande após compressão. Tente com uma imagem menor.')
              return
            }
            form.set('avatar', cropped)
          }
        } catch (cropError: any) {
          console.error('Erro ao processar avatar:', cropError)
          // Continuar sem avatar se houver erro no processamento
          if (cropError?.message?.includes('Timeout')) {
            setProcessingImage(false)
            setSaving(false)
            setError('O processamento da imagem demorou demais. Tente com uma imagem menor.')
            return
          }
        } finally {
          setProcessingImage(false)
        }
      }

      const controller = new AbortController()
      timeoutId = setTimeout(() => {
        controller.abort()
      }, 30_000)

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: controller.signal,
      })
      
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao atualizar perfil')
      }

      // Atualizar estado do botão IMEDIATAMENTE após sucesso
      // Isso dá feedback visual rápido ao usuário
      setSaving(false)

      // Atualizar dados do usuário localmente sem chamar refreshSession
      // Isso evita problemas de logout se refreshSession falhar
      if (json?.user && authUser) {
        // Atualizar apenas os campos que foram modificados
        const updatedUser = {
          ...authUser,
          name: json.user.name || authUser.name,
          avatarUrl: json.user.avatar_url || authUser.avatarUrl,
          bio: json.user.bio !== undefined ? json.user.bio : authUser.bio,
        }
        // Disparar evento customizado para atualizar o AuthContext sem fazer refresh completo
        // Fazer de forma não-bloqueante para não afetar feedback visual
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }))
        }, 0)
      }

      setSuccess('✅ Perfil atualizado com sucesso.')
      setAvatarFile(null)
      // fechar depois de um pequeno delay para o usuário perceber o feedback
      setTimeout(() => setEditOpen(false), 350)
    } catch (e: any) {
      // Resetar estado de salvamento imediatamente em caso de erro
      setSaving(false)
      
      if (e?.name === 'AbortError' || e?.message?.includes('Timeout')) {
        setError('O salvamento demorou demais. Verifique sua conexão e tente novamente.')
      } else {
        setError(e?.message || 'Erro ao atualizar perfil')
      }
      console.error('Erro ao salvar perfil:', e)
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      // Garantir que saving seja false mesmo se houver algum problema
      // (mas já deve estar false nos casos normais)
      setSaving(false)
    }
  }

  // TODO: Futuramente exibir badges conquistados pelo aluno.
  // A API ainda não está definida.

  return (
    <div className="space-y-4 md:space-y-6">
      {(error || success) && (
        <div
          className={cn(
            'border rounded-lg p-3 text-sm',
            error
              ? theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
              : theme === 'dark'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-green-50 border-green-200 text-green-700'
          )}
        >
          {error || success}
        </div>
      )}

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full overflow-hidden border flex items-center justify-center flex-shrink-0",
              theme === 'dark' ? "border-white/10" : "border-gray-200"
            )}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview avatar" className="w-full h-full object-cover" />
              ) : (
                <div className={cn(
                  "w-full h-full flex items-center justify-center font-bold text-2xl",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                )}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>Foto</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
                className={cn(
                  "mt-1 block w-full text-sm",
                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                )}
              />
              <p className={cn("text-xs mt-1", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                PNG/JPG/WEBP • até 5MB
              </p>
            </div>
          </div>

          {/* Cropper (zoom + mover) */}
          {avatarFile && avatarPreview && (
            <div className="space-y-2">
              <p className={cn("text-sm font-medium", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>
                Ajustar foto (arraste para mover • use o zoom)
              </p>
              <div
                ref={cropBoxRef}
                className={cn(
                  "relative w-full max-w-[320px] mx-auto aspect-square rounded-full overflow-hidden border touch-none select-none",
                  theme === 'dark' ? "border-white/10 bg-black/30" : "border-yellow-400/50 bg-yellow-500/10"
                )}
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
              >
                <img
                  src={avatarPreview}
                  alt="Crop"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 will-change-transform"
                  style={{
                    transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                    transformOrigin: 'center',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
                {/* Overlay circular para indicar área de crop */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    borderRadius: '50%',
                    boxShadow: 'inset 0 0 0 2px rgba(234,179,8,0.75)',
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className={cn("text-sm font-medium", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>
              Nome
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white"
                  : "bg-yellow-500/10 border-yellow-400/50 text-gray-900"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className={cn("text-sm font-medium", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>
              Frase de status
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              placeholder="Ex: Desenvolvedor em formação, apaixonado por tecnologia!"
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm min-h-[80px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white placeholder-gray-500"
                  : "bg-yellow-500/10 border-yellow-400/50 text-gray-900 placeholder-gray-400"
              )}
            />
            <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
              {bio.trim().length}/160
            </p>
          </div>

          {/* Feedback agora aparece fora do modal (topo da página) */}

          <div className="flex items-center justify-end gap-2">
            <button
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium",
                theme === 'dark'
                  ? "border-white/10 text-gray-300 hover:bg-white/5"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => setEditOpen(false)}
              disabled={saving || processingImage}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || processingImage}>
              {processingImage ? 'Processando imagem...' : saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Meu Perfil
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Gerencie suas informações e acompanhe seu progresso
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Informações do Usuário */}
        <div className="space-y-4 md:space-y-6">
          {/* Card de Perfil */}
          <div className={cn(
            "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
            theme === 'dark'
              ? "bg-gray-800/30 border-white/10"
              : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-6">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[3px] flex-shrink-0",
                      getLevelBorderColor(currentLevel, theme === 'dark')
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold text-2xl md:text-3xl flex-shrink-0 border-[3px]",
                    theme === 'dark'
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                      : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                    getLevelBorderColor(currentLevel, theme === 'dark')
                  )}>
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className={cn(
                    "text-xl md:text-2xl font-bold truncate",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {user.name}
                  </h2>
                  <p className={cn(
                    "text-sm md:text-base truncate",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {user.email}
                  </p>
                  <p className={cn(
                    "text-xs md:text-sm mt-1",
                    theme === 'dark' ? "text-gray-500" : "text-gray-500"
                  )}>
                    Membro desde {new Date(user.joinDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200",
                  "flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0",
                  theme === 'dark'
                    ? "border border-yellow-400 bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30 hover:border-yellow-500"
                    : "border border-yellow-600 bg-yellow-400/30 text-yellow-700 hover:bg-yellow-400/40 hover:border-yellow-700",
                  !canEdit && "opacity-60 cursor-not-allowed",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                onClick={() => canEdit && setEditOpen(true)}
                disabled={!canEdit}
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>

            {user.bio ? (
              <p className={cn(
                "mb-4",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                {user.bio}
              </p>
            ) : (
              <p className={cn(
                "mb-4 italic",
                theme === 'dark' ? "text-gray-500" : "text-gray-400"
              )}>
                Fale mais sobre você...
              </p>
            )}

            <div className={cn(
              "grid gap-3 md:gap-4 pt-4 border-t",
              theme === 'dark' ? "border-white/10" : "border-yellow-400/90",
              // Grid responsivo: 2 colunas se moedas/streak desabilitados, 4 se habilitados
              isFeatureEnabled('coins') || isFeatureEnabled('streak')
                ? "grid-cols-2 md:grid-cols-4"
                : "grid-cols-2"
            )}>
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setNiveisModalOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xs md:text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Nível Atual
                  </p>
                  <HelpCircle className={cn(
                    "w-3 h-3",
                    theme === 'dark' ? "text-gray-500" : "text-gray-400"
                  )} />
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className={cn(
                    "w-5 h-5 md:w-6 md:h-6",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )} />
                <p className={cn(
                  "text-xl md:text-2xl font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {currentLevel}
                </p>
              </div>
                {getXPForNextLevel(user.xp || 0, currentLevel) !== null && (
                  <p className={cn(
                    "text-xs mt-1",
                    theme === 'dark' ? "text-gray-500" : "text-gray-500"
                  )}>
                    {getXPForNextLevel(user.xp || 0, currentLevel)} pontos para subir de nível
                  </p>
                )}
              </div>
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  XP
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.xp.toLocaleString('pt-BR')}
                </p>
              </div>
              {/* Moedas - Oculto no MVP */}
              {isFeatureEnabled('coins') && (
                <div>
                  <p className={cn(
                    "text-xs md:text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Moedas
                  </p>
                  <p className={cn(
                    "text-xl md:text-2xl font-bold",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )}>
                    {user.coins}
                  </p>
                </div>
              )}
              {/* Streak - Oculto no MVP */}
              {isFeatureEnabled('streak') && (
                <div>
                  <p className={cn(
                    "text-xs md:text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Streak
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-orange-500">{user.streak} 🔥</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Card de Histórico de XP */}
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-gray-800/30 border-white/10"
            : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
        )}>
          <div className="mb-4 md:mb-6">
            <h2 className={cn(
              "text-lg md:text-xl font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Histórico de XP
            </h2>
          </div>

          {loadingHistory ? (
            <div className={cn(
              "text-center py-8 text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Carregando histórico...
            </div>
          ) : xpHistory.length === 0 ? (
            <div className={cn(
              "text-center py-8 text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Nenhum histórico de XP ainda
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {xpHistory.map((entry) => {
                // Ícone e cor baseado na origem
                let icon: React.ReactNode
                let iconColor: string
                let sourceLabel: string

                switch (entry.source) {
                  case 'aula':
                    icon = <BookOpen className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    sourceLabel = 'Aula'
                    break
                  case 'quiz':
                    icon = <HelpCircle className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    sourceLabel = 'Quiz'
                    break
                  case 'desafio':
                    icon = <Target className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    sourceLabel = 'Desafio'
                    break
                  case 'comunidade':
                    icon = <MessageCircle className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                    sourceLabel = 'Comunidade'
                    break
                  default:
                    icon = <Trophy className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    sourceLabel = entry.source
                }

                // Formatar data e hora
                const date = new Date(entry.created_at)
                const formattedDate = date.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
                const formattedTime = date.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      theme === 'dark'
                        ? "bg-black/20 border-white/10 hover:bg-black/30"
                        : "bg-yellow-50/50 border-yellow-400/50 hover:bg-yellow-50/70"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 mt-0.5",
                      iconColor
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded",
                              theme === 'dark'
                                ? "bg-white/10 text-gray-300"
                                : "bg-yellow-400/20 text-yellow-700"
                            )}>
                              {sourceLabel}
                            </span>
                            <span className={cn(
                              "text-sm font-bold",
                              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                            )}>
                              +{entry.amount} XP
                            </span>
                          </div>
                          {entry.description && (
                            <p className={cn(
                              "text-sm",
                              theme === 'dark' ? "text-gray-300" : "text-gray-700"
                            )}>
                              {limparDescricao(entry.description)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-xs",
                          theme === 'dark' ? "text-gray-500" : "text-gray-500"
                        )}>
                          {formattedDate} às {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Níveis */}
      <Modal
        isOpen={niveisModalOpen}
        onClose={() => setNiveisModalOpen(false)}
        title="Seu Nível"
        size="lg"
      >
        <div className="space-y-6">
          {/* Informações do Usuário - Simplificado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className={cn(
                      "w-14 h-14 rounded-full object-cover border-[3px]",
                      getLevelBorderColor(currentLevel, theme === 'dark')
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border-[3px]",
                    theme === 'dark'
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                      : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                    getLevelBorderColor(currentLevel, theme === 'dark')
                  )}>
                    {user.name.charAt(0)}
                  </div>
                )}
                {/* Badge do Nível */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  currentLevelCategory === 'iniciante'
                    ? "bg-yellow-500 text-white"
                    : currentLevelCategory === 'intermediario'
                    ? "bg-blue-500 text-white"
                    : "bg-purple-600 text-white"
                )}>
                  {currentLevel}
                </div>
              </div>
              <div>
                <h3 className={cn(
                  "text-base font-semibold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.name}
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  {user.xp} pontos
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <Trophy className={cn(
                  "w-4 h-4",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )} />
                <span className={cn(
                  "text-sm font-semibold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {currentLevel}
                </span>
                <span className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  | Level {currentLevel}
                </span>
              </div>
              {getXPForNextLevel(user.xp || 0, currentLevel) !== null && (
                <p className={cn(
                  "text-xs mt-1 flex items-center gap-1 justify-end",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  <HelpCircle className="w-3 h-3" />
                  {getXPForNextLevel(user.xp || 0, currentLevel)} pontos para subir de nível
                </p>
              )}
            </div>
          </div>

          {/* Grid de Níveis - Simplificado */}
          <div className="grid grid-cols-3 gap-3">
            {getLevelRequirements().map((xpRequired, index) => {
              const level = index + 1
              const isUnlocked = (user.xp || 0) >= xpRequired
              const isCurrent = level === currentLevel
              const category = getLevelCategory(level)
              
              // Cores oficiais (consistentes em ambos os temas)
              let circleBg = ''
              let circleText = ''
              
              if (category === 'iniciante') {
                circleBg = 'bg-yellow-500'
                circleText = 'text-white'
              } else if (category === 'intermediario') {
                circleBg = 'bg-blue-500'
                circleText = 'text-white'
              } else {
                circleBg = 'bg-purple-600'
                circleText = 'text-white'
              }

              return (
                <div
                  key={level}
                  className="text-center"
                >
                  {isUnlocked ? (
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center font-bold text-base mx-auto mb-2",
                      circleBg,
                      circleText
                    )}>
                      {level}
                    </div>
                  ) : (
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2",
                      theme === 'dark' ? "bg-gray-700" : "bg-gray-300"
                    )}>
                      <Lock className={cn(
                        "w-6 h-6",
                        theme === 'dark' ? "text-gray-500" : "text-gray-400"
                      )} />
                    </div>
                  )}
                  <p className={cn(
                    "text-sm font-medium mb-0.5",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    Level {level}
                  </p>
                  <p className={cn(
                    "text-xs",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {xpRequired} pontos
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Modal>

    </div>
  )
}

