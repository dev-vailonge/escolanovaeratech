'use client'

import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getAuthToken } from '@/lib/getAuthToken'
import { userHasFormacaoMatriculaRole } from '@/lib/formacao/formacaoAlunoAccess'
import ValidarFormacaoModal from '@/components/aluno/ValidarFormacaoModal'
import FormacaoNaoMatriculadoModal from '@/components/aluno/FormacaoNaoMatriculadoModal'
import { payUrlComCupomNorteTechPorSubdomainHotmart } from '@/lib/constants/formacoes'

function mensagemValidacaoFalhou(reason: string | undefined, status?: string): string {
  return 'Não foi possível validar. Tente novamente.'
}

type Options = {
  /** Ex.: `formacaoandroid` — mesmo usado em `/api/formacoes/validar` */
  hotmartSubdomain: string
  /** Checkout com cupom; se omitido, deriva de `hotmartSubdomain`. */
  formacaoCheckoutUrl?: string
  /** Chamado ao fechar o modal de validação sem concluir (ex.: limpar deep link pendente). */
  onDismissWithoutContinue?: () => void
}

/**
 * Antes de abrir plano de desafio da formação: exige `role === 'formacao'` ou `admin`.
 * Caso contrário abre o modal de validação; após sucesso chama `refreshSession` e o callback.
 */
export function useFormacaoDesafioAccessGate({
  hotmartSubdomain,
  formacaoCheckoutUrl,
  onDismissWithoutContinue,
}: Options) {
  const { user, refreshSession } = useAuth()
  const [validarOpen, setValidarOpen] = useState(false)
  const [naoMatriculadoOpen, setNaoMatriculadoOpen] = useState(false)
  const [validarEmail, setValidarEmail] = useState('')
  const [validarError, setValidarError] = useState('')
  const [validarLoading, setValidarLoading] = useState(false)
  const pendingThenRef = useRef<(() => void) | null>(null)
  const checkoutHref =
    formacaoCheckoutUrl ?? payUrlComCupomNorteTechPorSubdomainHotmart(hotmartSubdomain)

  const gate = useCallback(
    (then: () => void) => {
      if (!user) return
      // Se já tem permissão, não abre modal.
      if (userHasFormacaoMatriculaRole(user.role)) {
        then()
        return
      }
      pendingThenRef.current = then
      // Sempre pedir o e-mail da compra, sem pré-preencher.
      setValidarEmail('')
      setValidarError('')
      setValidarOpen(true)
    },
    [user]
  )

  const requestValidation = useCallback(
    (then?: () => void) => {
      if (!user) return
      pendingThenRef.current = then ?? null
      // Sempre pedir o e-mail da compra, sem pré-preencher.
      setValidarEmail('')
      setValidarError('')
      setValidarOpen(true)
    },
    [user]
  )

  const closeValidar = useCallback(() => {
    if (validarLoading) return
    if (pendingThenRef.current) {
      onDismissWithoutContinue?.()
    }
    setValidarOpen(false)
    pendingThenRef.current = null
    setValidarError('')
  }, [validarLoading, onDismissWithoutContinue])

  const runValidar = useCallback(async () => {
    setValidarError('')
    const email = validarEmail.trim().toLowerCase()
    if (!email) {
      setValidarError('Informe o e-mail da compra na Hotmart.')
      return
    }
    setValidarLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        setValidarError('Faça login novamente.')
        return
      }
      const res = await fetch('/api/formacoes/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, subdomain: hotmartSubdomain }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        validated?: boolean
        reason?: string
        status?: string
        error?: string
        role?: 'aluno' | 'formacao' | 'admin'
      }
      if (!res.ok) {
        setValidarError(typeof data.error === 'string' ? data.error : 'Erro ao validar.')
        return
      }
      if (!data.validated) {
        if (data.reason === 'email_not_found' || data.reason === 'upgrade_required') {
          pendingThenRef.current = null
          onDismissWithoutContinue?.()
          setValidarOpen(false)
          setValidarError('')
          setNaoMatriculadoOpen(true)
          return
        }
        setValidarError(mensagemValidacaoFalhou(data.reason, data.status))
        return
      }
      await refreshSession()
      if (data.role !== 'formacao' && data.role !== 'admin') {
        setValidarError('Validação concluída, mas a permissão não foi atualizada. Tente novamente.')
        return
      }
      setValidarOpen(false)
      const next = pendingThenRef.current
      pendingThenRef.current = null
      next?.()
    } catch {
      setValidarError('Erro de rede. Tente novamente.')
    } finally {
      setValidarLoading(false)
    }
  }, [validarEmail, hotmartSubdomain, refreshSession, user?.role, onDismissWithoutContinue])

  const validarModal = (
    <>
      <ValidarFormacaoModal
        isOpen={validarOpen}
        onClose={closeValidar}
        email={validarEmail}
        onEmailChange={setValidarEmail}
        onValidate={() => void runValidar()}
        isValidating={validarLoading}
        errorMessage={validarError || undefined}
      />
      <FormacaoNaoMatriculadoModal
        isOpen={naoMatriculadoOpen}
        onClose={() => setNaoMatriculadoOpen(false)}
        checkoutHref={checkoutHref}
      />
    </>
  )

  return { gate, requestValidation, validarModal }
}
