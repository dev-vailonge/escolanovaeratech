'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { Gift, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function AdminBonificacaoTab() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [emails, setEmails] = useState('')
  const [motivo, setMotivo] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ rewardedCount: number; notFoundEmails: string[] } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const emailsTrim = emails.trim()
    if (!emailsTrim) {
      setError('Informe ao menos um email.')
      return
    }
    if (!motivo.trim()) {
      setError('Informe o motivo da bonificação.')
      return
    }
    const numAmount = Number(amount)
    if (!Number.isFinite(numAmount) || numAmount < 1) {
      setError('Informe uma quantidade de XP válida (número maior que zero).')
      return
    }

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }

      const res = await fetch('/api/admin/bonificacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          emails: emailsTrim,
          motivo: motivo.trim(),
          amount: numAmount,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar bonificação')
      }

      setSuccess({
        rewardedCount: data.rewardedCount ?? 0,
        notFoundEmails: Array.isArray(data.notFoundEmails) ? data.notFoundEmails : [],
      })
      setEmails('')
      setMotivo('')
      setAmount('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar bonificação')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className={cn(
        'p-6 rounded-lg',
        theme === 'dark'
          ? 'bg-gray-800/30 border border-white/10'
          : 'bg-yellow-500/10 border border-yellow-400/90'
      )}>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-red-400' : 'text-red-600'
        )}>
          Acesso negado. Apenas administradores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gift className={cn(
          'w-6 h-6',
          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
        )} />
        <h2 className={cn(
          'text-2xl font-bold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Bonificação
        </h2>
      </div>
      <p className={cn(
        'text-sm leading-relaxed',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      )}>
        Conceda XP (pontos) a um ou mais alunos informando os emails, o motivo e a quantidade.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label htmlFor="bonificacao-emails" className={cn(
            'block text-sm font-medium mb-1',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Emails dos alunos <span className="text-red-500">*</span>
          </label>
          <textarea
            id="bonificacao-emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="aluno1@email.com, aluno2@email.com"
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg border text-sm',
              theme === 'dark'
                ? 'bg-black/30 border-white/20 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
            )}
          />
          <p className={cn(
            'mt-1 text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          )}>
            Um ou mais emails separados por vírgula. Serão considerados apenas usuários cadastrados com esses emails.
          </p>
        </div>

        <div>
          <label htmlFor="bonificacao-motivo" className={cn(
            'block text-sm font-medium mb-1',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Motivo <span className="text-red-500">*</span>
          </label>
          <input
            id="bonificacao-motivo"
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Participação no evento X"
            className={cn(
              'w-full px-3 py-2 rounded-lg border text-sm',
              theme === 'dark'
                ? 'bg-black/30 border-white/20 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
            )}
          />
        </div>

        <div>
          <label htmlFor="bonificacao-amount" className={cn(
            'block text-sm font-medium mb-1',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Quantidade de XP <span className="text-red-500">*</span>
          </label>
          <input
            id="bonificacao-amount"
            type="number"
            min={1}
            value={amount === '' ? '' : amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Ex.: 300"
            className={cn(
              'w-full max-w-[140px] px-3 py-2 rounded-lg border text-sm',
              theme === 'dark'
                ? 'bg-black/30 border-white/20 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
            )}
          />
        </div>

        {error && (
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
          )}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="space-y-2">
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg text-sm',
              theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
            )}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Bonificação aplicada a {success.rewardedCount} aluno(s).
            </div>
            {success.notFoundEmails.length > 0 && (
              <div className={cn(
                'p-3 rounded-lg text-sm',
                theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-800'
              )}>
                <p className="font-medium mb-1">Emails não encontrados (nenhum usuário cadastrado com estes emails):</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {success.notFoundEmails.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            theme === 'dark'
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-yellow-500 text-white hover:bg-yellow-600',
            loading && 'opacity-70 cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Confirmar'
          )}
        </button>
      </form>
    </div>
  )
}
