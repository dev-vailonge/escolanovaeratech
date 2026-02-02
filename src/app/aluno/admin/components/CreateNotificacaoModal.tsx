'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import DatePicker from '@/components/ui/DatePicker'
import { Loader2, ImagePlus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreateNotificacaoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (notificacao: any) => void
  notificacao?: any // Para edição
}

const getDefaultFormData = () => ({
  titulo: '',
  mensagem: '',
  tipo: 'info',
  dataInicio: new Date().toISOString().split('T')[0],
  dataFim: '',
  publicoAlvo: 'todos',
  imagem_url: '',
  action_url: '',
})

export default function CreateNotificacaoModal({ isOpen, onClose, onSave, notificacao }: CreateNotificacaoModalProps) {
  const { theme } = useTheme()
  const isEditing = !!notificacao
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadImageError, setUploadImageError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  const [formData, setFormData] = useState(getDefaultFormData())

  // Atualiza formData quando a notificação muda ou o modal abre
  useEffect(() => {
    if (isOpen) {
      if (notificacao) {
        // Converter datas ISO para formato de input date
        const dataInicio = notificacao.dataInicio
          ? (notificacao.dataInicio.includes('T')
              ? notificacao.dataInicio.split('T')[0]
              : notificacao.dataInicio)
          : new Date().toISOString().split('T')[0]

        const dataFim = notificacao.dataFim
          ? (notificacao.dataFim.includes('T')
              ? notificacao.dataFim.split('T')[0]
              : notificacao.dataFim)
          : ''

        setFormData({
          titulo: notificacao.titulo || '',
          mensagem: notificacao.mensagem || '',
          tipo: notificacao.tipo || 'info',
          dataInicio,
          dataFim,
          publicoAlvo: notificacao.publicoAlvo || 'todos',
          imagem_url: notificacao.imagem_url ?? '',
          action_url: notificacao.action_url ?? '',
        })
      } else {
        // Reset para valores default ao criar novo
        setFormData(getDefaultFormData())
      }
      setImageFile(null)
      setUploadImageError('')
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
        setImagePreviewUrl(null)
      }
    }
  }, [isOpen, notificacao])

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar datas
    if (!formData.dataInicio) {
      setError('Por favor, selecione a data de início.')
      return
    }
    if (!formData.dataFim) {
      setError('Por favor, selecione a data de fim.')
      return
    }
    if (formData.dataFim < formData.dataInicio) {
      setError('A data de fim deve ser posterior à data de início.')
      return
    }

    // Para tipo "warning" (Aviso), imagem e link são obrigatórios (carrossel na home do aluno)
    if (formData.tipo === 'warning') {
      if (!formData.imagem_url?.trim() && !imageFile) {
        setError('Para avisos, selecione uma imagem para o carrossel.')
        return
      }
      if (!formData.action_url?.trim()) {
        setError('Para avisos, informe o link de ação.')
        return
      }
    }

    setError('')
    setUploadImageError('')
    setIsLoading(true)

    try {
      let imagemUrlFinal = formData.imagem_url?.trim() || ''

      // Upload da imagem só ao salvar (se houver arquivo novo selecionado)
      if (formData.tipo === 'warning' && imageFile) {
        setUploadingImage(true)
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          if (!token) {
            setError('Sessão expirada. Faça login novamente.')
            setIsLoading(false)
            setUploadingImage(false)
            return
          }
          const form = new FormData()
          form.set('imagem', imageFile)
          const res = await fetch('/api/admin/notificacoes/upload-imagem', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            setError(json?.error || 'Falha ao enviar imagem. Tente novamente.')
            setIsLoading(false)
            setUploadingImage(false)
            return
          }
          if (json.imagem_url) imagemUrlFinal = json.imagem_url
        } catch (err: any) {
          setError(err?.message || 'Erro ao enviar imagem.')
          setIsLoading(false)
          setUploadingImage(false)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      const dataToSave = imagemUrlFinal ? { ...formData, imagem_url: imagemUrlFinal } : formData
      await onSave(dataToSave)

      // Limpar arquivo e preview após sucesso (modal pode permanecer aberto)
      setImageFile(null)
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setImagePreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setImageFile(null)
      setImagePreviewUrl(null)
      setFormData(getDefaultFormData())
      setError('')
      setUploadImageError('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      onClose()
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadImageError('Selecione um arquivo de imagem (PNG, JPG ou WEBP).')
      return
    }
    const maxBytes = 2 * 1024 * 1024 // 2MB
    if (file.size > maxBytes) {
      setUploadImageError('Imagem muito grande (máx 2MB).')
      return
    }
    setUploadImageError('')
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setImagePreviewUrl(url)
    setImageFile(file)
    setFormData((prev) => ({ ...prev, imagem_url: '' }))
  }

  const handleRemoveImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setImageFile(null)
    setImagePreviewUrl(null)
    setFormData((prev) => ({ ...prev, imagem_url: '' }))
    setUploadImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Notificação' : 'Criar Nova Notificação'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mensagem de Erro */}
        {error && (
          <div className={cn(
            "p-3 rounded-lg border text-sm",
            theme === 'dark'
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            {error}
          </div>
        )}

        {/* Título */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Título *
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className={cn(
              "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
            required
          />
        </div>

        {/* Mensagem */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Mensagem *
          </label>
          <textarea
            value={formData.mensagem}
            onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
            rows={4}
            className={cn(
              "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors resize-none",
              theme === 'dark'
                ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
            )}
            required
          />
        </div>

        {/* Tipo e Público-alvo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => {
                const newTipo = e.target.value as 'info' | 'update' | 'warning'
                setFormData({
                  ...formData,
                  tipo: newTipo,
                  // Limpar imagem/link ao sair de "warning"
                  ...(newTipo !== 'warning' ? { imagem_url: '', action_url: '' } : {})
                })
                if (newTipo !== 'warning') {
                  setUploadImageError('')
                  setImageFile(null)
                  if (previewUrlRef.current) {
                    URL.revokeObjectURL(previewUrlRef.current)
                    previewUrlRef.current = null
                  }
                  setImagePreviewUrl(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="info">Informação</option>
              <option value="update">Atualização</option>
              <option value="warning">Aviso</option>
            </select>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Público-alvo *
            </label>
            <select
              value={formData.publicoAlvo}
              onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
              className={cn(
                "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
              required
            >
              <option value="todos">Todos</option>
              <option value="alunos-full">Alunos Ilimitados</option>
              <option value="alunos-limited">Alunos Limitados</option>
            </select>
          </div>
        </div>

        {/* Campos para tipo "warning": upload de imagem e link (obrigatórios no carrossel) */}
        {formData.tipo === 'warning' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Imagem do carrossel *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                disabled={isLoading}
                className={cn(
                  "block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:cursor-pointer",
                  theme === 'dark'
                    ? "text-gray-300 file:bg-yellow-500/20 file:text-yellow-400"
                    : "text-gray-700 file:bg-yellow-100 file:text-yellow-800"
                )}
              />
              <p className={cn("text-xs mt-1", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                PNG, JPG ou WEBP • até 2MB. Exibida no carrossel da home do aluno.
              </p>
              {uploadImageError && (
                <p className={cn("text-xs mt-1", theme === 'dark' ? "text-red-400" : "text-red-600")}>
                  {uploadImageError}
                </p>
              )}
              {(formData.imagem_url || imagePreviewUrl || uploadingImage) && (
                <div className="mt-3 flex items-start gap-3">
                  <div className={cn(
                    "relative w-24 h-16 rounded-lg overflow-hidden border flex-shrink-0",
                    theme === 'dark' ? "border-white/10 bg-black/30" : "border-gray-200 bg-gray-100"
                  )}>
                    {uploadingImage ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className={cn("w-6 h-6 animate-spin", theme === 'dark' ? "text-yellow-400" : "text-yellow-600")} />
                      </div>
                    ) : (formData.imagem_url || imagePreviewUrl) ? (
                      <img
                        src={formData.imagem_url || imagePreviewUrl || ''}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus className={cn("w-6 h-6", theme === 'dark' ? "text-gray-500" : "text-gray-400")} />
                      </div>
                    )}
                  </div>
                  {(formData.imagem_url || imagePreviewUrl) && !uploadingImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded transition-colors",
                        theme === 'dark'
                          ? "text-red-400 hover:bg-red-500/20"
                          : "text-red-600 hover:bg-red-50"
                      )}
                    >
                      <X className="w-4 h-4 inline mr-0.5" /> Remover
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Link (ação ao clicar) *
              </label>
              <input
                type="text"
                value={formData.action_url}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                placeholder="/aluno/desafios ou https://..."
                className={cn(
                  "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
                  theme === 'dark'
                    ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                    : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
                )}
                required={formData.tipo === 'warning'}
              />
              <p className={cn("text-xs mt-1", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                URL interna (ex: /aluno/desafios) ou externa aberta ao clicar na imagem.
              </p>
            </div>
          </div>
        )}

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Data de Início"
            value={formData.dataInicio}
            onChange={(date) => setFormData({ ...formData, dataInicio: date })}
            required
            placeholder="Selecione a data"
          />

          <DatePicker
            label="Data de Fim"
            value={formData.dataFim}
            onChange={(date) => setFormData({ ...formData, dataFim: date })}
            required
            minDate={formData.dataInicio}
            placeholder="Selecione a data"
          />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
        }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? "bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            )}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
              theme === 'dark'
                ? "bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
                : "bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
            )}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Notificação'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
