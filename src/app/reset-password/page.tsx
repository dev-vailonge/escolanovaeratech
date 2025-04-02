'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PasswordInput } from '@/components/PasswordInput'

export default function ResetPassword() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    form: ''
  })

  const validateForm = () => {
    const newErrors = {
      password: '',
      confirmPassword: '',
      form: ''
    }

    if (!formData.password) {
      newErrors.password = 'Nova senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor, confirme sua nova senha'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) throw error

      toast.success('Senha atualizada com sucesso!')
      router.push('/login')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao atualizar senha. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Redefinir Senha</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600 text-center">
            Digite sua nova senha abaixo.
          </p>
        </div>

        {errors.form && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="password"
            label="Nova Senha"
            placeholder="Digite sua nova senha"
            value={formData.password}
            onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
            error={errors.password}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirmar Nova Senha"
            placeholder="Confirme sua nova senha"
            value={formData.confirmPassword}
            onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A0A0A] text-white py-3 px-4 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
} 