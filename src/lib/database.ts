/**
 * Funções helper para queries no Supabase
 * 
 * Centraliza todas as operações de banco de dados.
 * 
 * NOTA: Estas funções retornam null/[] se Supabase não estiver configurado,
 * permitindo que a aplicação funcione em modo mockado.
 */

import { supabase } from './supabase'
import type { DatabaseUser, DatabaseQuiz, DatabaseDesafio, DatabaseNotificacao, DatabaseFormulario, DatabaseFormularioResposta } from '@/types/database'

// Verificar se Supabase está configurado
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

// ============================================================
// USUÁRIOS
// ============================================================

export async function getUserById(userId: string): Promise<DatabaseUser | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - getUserById retornando null')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserById:', error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<DatabaseUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error fetching user by email:', error)
    return null
  }

  return data
}

export async function updateUserAccessLevel(userId: string, accessLevel: 'full' | 'limited'): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ access_level: accessLevel })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user access level:', error)
    return false
  }

  return true
}

/**
 * Cria um usuário na tabela users
 * Usado principalmente quando recebemos dados do webhook da Hotmart
 */
export async function createUser(userData: {
  email: string
  name: string
  role?: 'aluno' | 'admin'
  access_level?: 'full' | 'limited'
}): Promise<DatabaseUser | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - createUser retornando null')
    return null
  }

  try {
    // Verificar se já existe usuário com este email
    const existing = await getUserByEmail(userData.email)
    if (existing) {
      console.log(`Usuário já existe: ${userData.email}`)
      return existing
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        name: userData.name,
        role: userData.role || 'aluno',
        access_level: userData.access_level || 'limited',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    console.log(`✅ Usuário criado: ${userData.email}`)
    return data
  } catch (error) {
    console.error('Error in createUser:', error)
    return null
  }
}

// ============================================================
// RANKING
// ============================================================

export async function getRankingGeral(limit: number = 100): Promise<DatabaseUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'aluno')
    .eq('access_level', 'full')
    .order('xp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching ranking geral:', error)
    return []
  }

  return data || []
}

export async function getRankingMensal(limit: number = 100): Promise<DatabaseUser[]> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'aluno')
    .eq('access_level', 'full')
    .order('xp_mensal', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching ranking mensal:', error)
    return []
  }

  return data || []
}

// ============================================================
// QUIZZES
// ============================================================

export async function getQuizzes(): Promise<DatabaseQuiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('disponivel', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quizzes:', error)
    return []
  }

  return data || []
}

export async function getAllQuizzes(): Promise<DatabaseQuiz[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all quizzes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllQuizzes:', error)
    return []
  }
}

export async function createQuiz(quiz: Omit<DatabaseQuiz, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseQuiz | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quiz)
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createQuiz:', error)
    return null
  }
}

export async function updateQuiz(quizId: string, updates: Partial<DatabaseQuiz>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', quizId)

    if (error) {
      console.error('Error updating quiz:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateQuiz:', error)
    return false
  }
}

export async function deleteQuiz(quizId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) {
      console.error('Error deleting quiz:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteQuiz:', error)
    return false
  }
}

// ============================================================
// DESAFIOS
// ============================================================

export async function getDesafios(): Promise<DatabaseDesafio[]> {
  const { data, error } = await supabase
    .from('desafios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching desafios:', error)
    return []
  }

  return data || []
}

// getAllDesafios é igual a getDesafios - retorna todos
export const getAllDesafios = getDesafios

export async function createDesafio(desafio: Omit<DatabaseDesafio, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseDesafio | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('desafios')
      .insert(desafio)
      .select()
      .single()

    if (error) {
      console.error('Error creating desafio:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createDesafio:', error)
    return null
  }
}

export async function updateDesafio(desafioId: string, updates: Partial<DatabaseDesafio>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('desafios')
      .update(updates)
      .eq('id', desafioId)

    if (error) {
      console.error('Error updating desafio:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateDesafio:', error)
    return false
  }
}

export async function deleteDesafio(desafioId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('desafios')
      .delete()
      .eq('id', desafioId)

    if (error) {
      console.error('Error deleting desafio:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteDesafio:', error)
    return false
  }
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================

export async function getNotificacoesAtivas(publicoAlvo?: string): Promise<DatabaseNotificacao[]> {
  const now = new Date().toISOString()
  
  let query = supabase
    .from('notificacoes')
    .select('*')
    .lte('data_inicio', now)
    .gte('data_fim', now)
    .order('created_at', { ascending: false })

  if (publicoAlvo) {
    query = query.or(`publico_alvo.eq.${publicoAlvo},publico_alvo.eq.todos`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notificacoes:', error)
    return []
  }

  return data || []
}

export async function getAllNotificacoes(): Promise<DatabaseNotificacao[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all notificacoes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllNotificacoes:', error)
    return []
  }
}

export async function createNotificacao(notificacao: Omit<DatabaseNotificacao, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseNotificacao | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .insert(notificacao)
      .select()
      .single()

    if (error) {
      console.error('Error creating notificacao:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createNotificacao:', error)
    return null
  }
}

export async function updateNotificacao(notificacaoId: string, updates: Partial<DatabaseNotificacao>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('notificacoes')
      .update(updates)
      .eq('id', notificacaoId)

    if (error) {
      console.error('Error updating notificacao:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateNotificacao:', error)
    return false
  }
}

export async function deleteNotificacao(notificacaoId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', notificacaoId)

    if (error) {
      console.error('Error deleting notificacao:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteNotificacao:', error)
    return false
  }
}

// ============================================================
// XP E PROGRESSO
// ============================================================

export async function addXP(userId: string, amount: number, source: 'aula' | 'quiz' | 'desafio', sourceId?: string, description?: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_xp_history')
    .insert({
      user_id: userId,
      amount,
      source,
      source_id: sourceId || null,
      description: description || null,
    })

  if (error) {
    console.error('Error adding XP:', error)
    return false
  }

  // O trigger no banco atualiza automaticamente o XP do usuário
  return true
}

export async function getXPHistory(userId: string, limit: number = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_xp_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching XP history:', error)
    return []
  }

  return data || []
}

// ============================================================
// FORMULÁRIOS
// ============================================================

export async function getFormulariosAtivos(): Promise<DatabaseFormulario[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - getFormulariosAtivos retornando []')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching formularios:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getFormulariosAtivos:', error)
    return []
  }
}

export async function getAllFormularios(): Promise<DatabaseFormulario[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all formularios:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllFormularios:', error)
    return []
  }
}

export async function getFormularioById(formularioId: string): Promise<DatabaseFormulario | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - getFormularioById retornando null')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', formularioId)
      .eq('ativo', true)
      .single()

    if (error) {
      console.error('Error fetching formulario:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getFormularioById:', error)
    return null
  }
}

export async function verificarRespostaExistente(formularioId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('formulario_respostas')
      .select('id')
      .eq('formulario_id', formularioId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking existing resposta:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in verificarRespostaExistente:', error)
    return false
  }
}

export async function salvarRespostaFormulario(
  formularioId: string,
  userId: string,
  respostas: any
): Promise<DatabaseFormularioResposta | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - salvarRespostaFormulario retornando null')
    return null
  }

  try {
    // Verificar se já existe resposta
    const existe = await verificarRespostaExistente(formularioId, userId)
    if (existe) {
      // Atualizar resposta existente
      const { data, error } = await supabase
        .from('formulario_respostas')
        .update({ respostas })
        .eq('formulario_id', formularioId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating resposta:', error)
        return null
      }

      return data
    } else {
      // Criar nova resposta
      const { data, error } = await supabase
        .from('formulario_respostas')
        .insert({
          formulario_id: formularioId,
          user_id: userId,
          respostas,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating resposta:', error)
        return null
      }

      return data
    }
  } catch (error) {
    console.error('Error in salvarRespostaFormulario:', error)
    return null
  }
}

export async function getRespostasFormulario(formularioId: string): Promise<DatabaseFormularioResposta[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('formulario_respostas')
      .select('*')
      .eq('formulario_id', formularioId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching respostas:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRespostasFormulario:', error)
    return []
  }
}

export async function getMinhaRespostaFormulario(formularioId: string, userId: string): Promise<DatabaseFormularioResposta | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('formulario_respostas')
      .select('*')
      .eq('formulario_id', formularioId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching minha resposta:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getMinhaRespostaFormulario:', error)
    return null
  }
}

export async function createFormulario(formulario: Omit<DatabaseFormulario, 'id' | 'created_at' | 'updated_at'>, createdBy?: string): Promise<DatabaseFormulario | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('formularios')
      .insert({
        ...formulario,
        created_by: createdBy || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating formulario:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createFormulario:', error)
    return null
  }
}

export async function updateFormulario(formularioId: string, updates: Partial<DatabaseFormulario>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('formularios')
      .update(updates)
      .eq('id', formularioId)

    if (error) {
      console.error('Error updating formulario:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateFormulario:', error)
    return false
  }
}

export async function deleteFormulario(formularioId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', formularioId)

    if (error) {
      console.error('Error deleting formulario:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteFormulario:', error)
    return false
  }
}

export async function toggleFormularioAtivo(formularioId: string, ativo: boolean): Promise<boolean> {
  return updateFormulario(formularioId, { ativo })
}

