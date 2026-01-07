'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { Edit2, Trophy, Lock, HelpCircle } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/features'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLevelBorderColor, getLevelRequirements, getXPForNextLevel, getLevelCategory, calculateLevel } from '@/lib/gamification'

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

  const [editOpen, setEditOpen] = useState(false)
  const [niveisModalOpen, setNiveisModalOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio || '') // Estado do formulário - pode estar vazio
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const cropAvatarToFile = async (): Promise<File | null> => {
    try {
      if (!avatarFile) return null
      
      // Se não há dados de crop, retornar o arquivo original
      if (!imgNatural || cropBoxSize <= 0) {
        return avatarFile
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
        try {
          const cropped = await cropAvatarToFile()
          if (cropped) {
            form.set('avatar', cropped)
          }
        } catch (cropError: any) {
          console.error('Erro ao processar avatar:', cropError)
          // Continuar sem avatar se houver erro no processamento
          if (cropError?.message?.includes('Timeout')) {
            setError('O processamento da imagem demorou demais. Tente com uma imagem menor.')
            return
          }
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

      // Atualizar sessão com timeout
      try {
        await Promise.race([
          refreshSession(),
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao atualizar sessão')), 5000)
          )
        ])
      } catch (refreshError: any) {
        console.warn('Erro ao atualizar sessão (continuando):', refreshError)
        // Continuar mesmo se o refresh falhar
      }

      setSuccess('✅ Perfil atualizado com sucesso.')
      setAvatarFile(null)
      // fechar depois de um pequeno delay para o usuário perceber o feedback
      setTimeout(() => setEditOpen(false), 350)
    } catch (e: any) {
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
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
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
      </div>

      {/* Modal de Níveis */}
      <Modal
        isOpen={niveisModalOpen}
        onClose={() => setNiveisModalOpen(false)}
        title=""
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

