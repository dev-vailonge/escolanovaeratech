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

// Importar Supabase Admin como fallback (apenas server-side)
let getSupabaseAdmin: (() => any) | null = null
if (typeof window === 'undefined') {
  try {
    const adminModule = require('./server/supabaseAdmin')
    getSupabaseAdmin = adminModule.getSupabaseAdmin
  } catch (e) {
    // Ignorar se não estiver disponível (client-side)
  }
}

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
      // Se o erro for "no rows returned" (PGRST116), não logar como erro
      // pois o usuário será criado automaticamente
      if (error.code === 'PGRST116') {
        return null
      }
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
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - getUserByEmail retornando null')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      // Se o erro for "no rows returned" (PGRST116), não logar como erro
      // pois o usuário será criado automaticamente
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching user by email:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserByEmail:', error)
    return null
  }
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
 * Atualiza a role de um usuário (admin ou aluno)
 * Usado no painel administrativo
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'aluno' | 'formacao'
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - updateUserRole retornando false')
    return false
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return false
  }
}

/**
 * Cria um usuário na tabela users
 * Usado principalmente quando recebemos dados do webhook ou após signup
 */
export async function createUser(userData: {
  id?: string // ID opcional (geralmente do auth.users.id)
  email: string
  name: string
  role?: 'aluno' | 'formacao' | 'admin'
  access_level?: 'full' | 'limited'
}): Promise<DatabaseUser | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - createUser retornando null')
    return null
  }

  try {
    // Se um ID foi fornecido, verificar se já existe usuário com esse ID
    if (userData.id) {
      const existingById = await getUserById(userData.id)
      if (existingById) {
        console.log(`Usuário já existe com ID: ${userData.id}`)
        return existingById
      }
    }

    // Verificar se já existe usuário com este email
    const existingByEmail = await getUserByEmail(userData.email)
    if (existingByEmail) {
      // Se um ID foi fornecido e já existe usuário com aquele email mas ID diferente,
      // retornar o existente. O vínculo correto será feito via email no futuro.
      // NOTA: Isso pode causar problemas se o ID não corresponder ao auth.users.id,
      // mas será resolvido quando implementar vínculo por email.
      if (userData.id && existingByEmail.id !== userData.id) {
        console.warn(`⚠️ Usuário ${userData.email} já existe com ID diferente (${existingByEmail.id} vs ${userData.id}). Retornando existente.`)
      }
      console.log(`Usuário já existe: ${userData.email}`)
      return existingByEmail
    }

    const insertData: any = {
      email: userData.email,
      name: userData.name,
      role: userData.role || 'aluno',
      access_level: userData.access_level || 'full',
    }

    // Se um ID foi fornecido, usar esse ID ao invés de gerar um novo
    if (userData.id) {
      insertData.id = userData.id
    }

    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
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

/**
 * Busca todos os usuários da tabela users
 * Usado no painel administrativo para listar alunos
 */
export async function getAllUsers(): Promise<DatabaseUser[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado - getAllUsers retornando []')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    return []
  }
}

// ============================================================
// RANKING
// ============================================================

export async function getRankingGeral(limit: number = 100): Promise<DatabaseUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['aluno', 'formacao'])
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
    .in('role', ['aluno', 'formacao'])
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
    console.error('❌ Supabase não configurado')
    return null
  }

  try {
    console.log('📤 createQuiz: Enviando para Supabase...')
    console.log('📊 Dados:', {
      titulo: quiz.titulo,
      tecnologia: quiz.tecnologia,
      nivel: quiz.nivel,
      xp: quiz.xp,
      numQuestoes: Array.isArray(quiz.questoes) ? quiz.questoes.length : 0
    })
    
    // Timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quiz)
      .select()
      .single()
    
    clearTimeout(timeoutId)

    if (error) {
      console.error('❌ Error creating quiz:', error.message, error.details, error.hint)
      return null
    }

    console.log('✅ Quiz criado no Supabase:', data?.id)
    return data
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('❌ Timeout: criação do quiz demorou mais de 30s')
    } else {
      console.error('❌ Error in createQuiz:', error)
    }
    return null
  }
}

export async function updateQuiz(quizId: string, updates: Partial<DatabaseQuiz>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase não configurado')
    return false
  }

  try {
    console.log('📤 updateQuiz: Atualizando quiz', quizId)
    
    // Timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const { error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', quizId)
      .abortSignal(controller.signal)
    
    clearTimeout(timeoutId)

    if (error) {
      console.error('❌ Error updating quiz:', error.message, error.details, error.hint)
      return false
    }

    console.log('✅ Quiz atualizado com sucesso')
    return true
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('❌ Timeout: atualização do quiz demorou mais de 30s')
    } else {
      console.error('❌ Error in updateQuiz:', error)
    }
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

export async function getNotificacoesAtivas(userId?: string, publicoAlvo?: string): Promise<DatabaseNotificacao[]> {
  const now = new Date().toISOString()
  
  // Buscar notificações individuais para este usuário (se userId fornecido)
  let individualNotifs: DatabaseNotificacao[] = []
  if (userId) {
    const { data: individual, error: indError } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('target_user_id', userId)
      .lte('data_inicio', now)
      .gte('data_fim', now)
      .order('created_at', { ascending: false })
    
    if (!indError && individual) {
      individualNotifs = individual
    }
  }

  // Buscar notificações broadcast (sem target_user_id)
  let broadcastQuery = supabase
    .from('notificacoes')
    .select('*')
    .is('target_user_id', null)
    .lte('data_inicio', now)
    .gte('data_fim', now)
    .order('created_at', { ascending: false })

  if (publicoAlvo) {
    broadcastQuery = broadcastQuery.or(`publico_alvo.eq.${publicoAlvo},publico_alvo.eq.todos`)
  }

  const { data: broadcastNotifs, error } = await broadcastQuery

  if (error) {
    console.error('Error fetching notificacoes:', error)
    return individualNotifs // Retornar ao menos as individuais
  }

  // Combinar e ordenar por data
  const allNotifs = [...individualNotifs, ...(broadcastNotifs || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return allNotifs
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

export async function addXP(
  userId: string,
  amount: number,
  source: 'aula' | 'quiz' | 'desafio' | 'comunidade',
  sourceId?: string,
  description?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase não configurado - não é possível adicionar XP')
    return false
  }

  try {
    console.log(`📤 Adicionando ${amount} XP ao usuário ${userId} (source: ${source}, sourceId: ${sourceId})`)

    const { data, error } = await supabase
      .from('user_xp_history')
      .insert({
        user_id: userId,
        amount,
        source,
        source_id: sourceId || null,
        description: description || null,
      })
      .select()

    if (error) {
      console.error('❌ Error adding XP (tentando com Supabase Admin como fallback):')
      console.error('  Message:', error.message)
      console.error('  Details:', error.details)
      console.error('  Hint:', error.hint)
      console.error('  Code:', error.code)
      
      // Tentar com Supabase Admin se disponível (server-side apenas)
      if (getSupabaseAdmin && typeof window === 'undefined') {
        try {
          console.log('🔄 Tentando inserir XP usando Supabase Admin...')
          const supabaseAdmin = getSupabaseAdmin()
          const { error: adminError } = await supabaseAdmin
            .from('user_xp_history')
            .insert({
              user_id: userId,
              amount,
              source,
              source_id: sourceId || null,
              description: description || null,
            })
          
          if (adminError) {
            console.error('❌ Erro mesmo com Admin:', adminError)
            return false
          }
          
          console.log('✅ XP inserido usando Supabase Admin')
        } catch (adminErr: any) {
          console.error('❌ Erro ao usar Supabase Admin:', adminErr)
          return false
        }
      } else {
        return false
      }
    }

    if (!data || data.length === 0) {
      console.error('❌ Nenhum dado retornado ao inserir XP')
      return false
    }

    console.log('✅ XP adicionado ao histórico:', data[0]?.id)

    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verificar se o trigger atualizou o XP do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('xp, xp_mensal, level')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Erro ao verificar XP do usuário:', userError.message)
    } else if (userData) {
      console.log(`✅ XP do usuário atualizado: ${userData.xp} XP, Nível ${userData.level}`)
    } else {
      console.warn('⚠️ Não foi possível verificar se o XP foi atualizado')
    }

    // O trigger no banco atualiza automaticamente o XP do usuário
    return true
  } catch (error: any) {
    console.error('❌ Exceção ao adicionar XP:', error)
    console.error('  Stack:', error.stack)
    return false
  }
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
    console.log('📥 Buscando todos os formulários...')
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching all formularios:', error.message, error.details, error.hint)
      return []
    }

    console.log(`✅ Formulários encontrados: ${data?.length || 0}`)
    if (data && data.length > 0) {
      console.log('📋 IDs dos formulários:', data.map(f => f.id))
    }

    return data || []
  } catch (error) {
    console.error('❌ Error in getAllFormularios:', error)
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
    // Preparar dados para inserção, removendo campos undefined
    const dadosInsert: any = {
      nome: formulario.nome,
      tipo: formulario.tipo,
      ativo: formulario.ativo !== undefined ? formulario.ativo : true,
      created_by: createdBy || null
    }

    // Adicionar perguntas apenas se existirem
    // Se não houver perguntas, não incluir o campo (deixa o banco usar o default NULL)
    if (formulario.perguntas && Array.isArray(formulario.perguntas) && formulario.perguntas.length > 0) {
      dadosInsert.perguntas = formulario.perguntas
    }
    // Se não houver perguntas, simplesmente não incluir o campo

    console.log('📤 createFormulario: Enviando para Supabase...')
    console.log('📊 Dados:', JSON.stringify(dadosInsert, null, 2))
    console.log('👤 Created by:', createdBy)

    const { data, error } = await supabase
      .from('formularios')
      .insert(dadosInsert)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating formulario:')
      console.error('  Message:', error.message)
      console.error('  Details:', error.details)
      console.error('  Hint:', error.hint)
      console.error('  Code:', error.code)
      return null
    }

    console.log('✅ Formulário criado no Supabase:', data?.id)
    return data
  } catch (error: any) {
    console.error('❌ Error in createFormulario:', error)
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
    console.log(`🗑️ Iniciando exclusão do formulário ${formularioId}`)

    // Buscar todas as respostas ao formulário
    const { data: respostas, error: respostasError } = await supabase
      .from('formulario_respostas')
      .select('user_id, id')
      .eq('formulario_id', formularioId)

    if (respostasError) {
      console.error('Erro ao buscar respostas do formulário:', respostasError)
      return false
    }

    console.log(`📊 Encontradas ${respostas?.length || 0} respostas ao formulário`)

    // Se houver respostas, reverter o XP dos usuários
    if (respostas && respostas.length > 0) {
      // Buscar informações do formulário para calcular XP
      const { data: formulario, error: formularioError } = await supabase
        .from('formularios')
        .select('nome')
        .eq('id', formularioId)
        .single()

      if (formularioError) {
        console.error('Erro ao buscar informações do formulário:', formularioError)
        return false
      }

      const nomeFormulario = formulario?.nome || 'Formulário excluído'

      // Usar Supabase Admin para inserir entradas negativas de XP
      if (getSupabaseAdmin && typeof window === 'undefined') {
        try {
          const supabaseAdmin = getSupabaseAdmin()
          
          // Para cada usuário que respondeu, inserir entrada negativa de XP
          const xpEntries = respostas.map(resposta => ({
            user_id: resposta.user_id,
            amount: -1, // Negativo para subtrair XP (formulários dão 1 XP)
            source: 'comunidade' as const,
            source_id: formularioId,
            description: `XP removido - Formulário excluído: ${nomeFormulario}`
          }))

          console.log(`💰 Revertendo XP de ${xpEntries.length} usuário(s)...`)

          const { error: xpError } = await supabaseAdmin
            .from('user_xp_history')
            .insert(xpEntries)

          if (xpError) {
            console.error('❌ Erro ao reverter XP dos usuários:', xpError)
            return false
          }

          console.log('✅ XP revertido com sucesso para todos os usuários')
        } catch (adminError) {
          console.error('❌ Erro ao usar Supabase Admin para reverter XP:', adminError)
          return false
        }
      } else {
        console.warn('⚠️ Supabase Admin não disponível - XP não será revertido')
      }
    }

    // Excluir notificações relacionadas ao formulário
    // As notificações têm action_url apontando para o formulário
    const actionUrlPattern = `/aluno/formularios/${formularioId}`
    console.log(`🔔 Excluindo notificações com action_url: ${actionUrlPattern}`)
    
    const { data: notificacoes, error: notifFindError } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('action_url', actionUrlPattern)
    
    if (notifFindError) {
      console.error('⚠️ Erro ao buscar notificações relacionadas:', notifFindError)
      // Não bloquear a exclusão se houver erro ao buscar notificações
    } else if (notificacoes && notificacoes.length > 0) {
      console.log(`📢 Encontradas ${notificacoes.length} notificação(ões) para excluir`)
      
      const { error: notifDeleteError } = await supabase
        .from('notificacoes')
        .delete()
        .eq('action_url', actionUrlPattern)
      
      if (notifDeleteError) {
        console.error('⚠️ Erro ao excluir notificações:', notifDeleteError)
        // Não bloquear a exclusão se houver erro ao excluir notificações
      } else {
        console.log(`✅ ${notificacoes.length} notificação(ões) excluída(s)`)
      }
    } else {
      console.log('ℹ️ Nenhuma notificação encontrada para este formulário')
    }

    // Agora excluir o formulário (as respostas serão excluídas em cascata pelo banco)
    const { error: deleteError } = await supabase
      .from('formularios')
      .delete()
      .eq('id', formularioId)

    if (deleteError) {
      console.error('❌ Erro ao excluir formulário:', deleteError)
      return false
    }

    console.log(`✅ Formulário ${formularioId} excluído com sucesso`)
    return true
  } catch (error) {
    console.error('❌ Erro crítico em deleteFormulario:', error)
    return false
  }
}

export async function toggleFormularioAtivo(formularioId: string, ativo: boolean): Promise<boolean> {
  return updateFormulario(formularioId, { ativo })
}

// ============================================================
// ESTATÍSTICAS DO USUÁRIO
// ============================================================

export interface UserStats {
  aulasCompletas: number
  quizCompletos: number
  desafiosConcluidos: number
  tempoEstudo: number // em minutos
  participacaoComunidade: number
  perguntasRespondidas: number
  perguntasFeitas: number
}

/**
 * Busca estatísticas reais do usuário
 * - Aulas completas: contagem única de entries no XP history com source='aula'
 * - Quizzes completos: contagem de quizzes com completo=true
 * - Desafios concluídos: contagem de desafios com completo=true
 * - Tempo de estudo: estimativa baseada em atividades (30min por aula, 10min por quiz)
 * - Participação na comunidade: contagem de respostas na comunidade no mês atual
 * - Perguntas respondidas: contagem total de respostas na comunidade
 * - Perguntas feitas: contagem total de perguntas criadas pelo usuário
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const defaultStats: UserStats = {
    aulasCompletas: 0,
    quizCompletos: 0,
    desafiosConcluidos: 0,
    tempoEstudo: 0,
    participacaoComunidade: 0,
    perguntasRespondidas: 0,
    perguntasFeitas: 0,
  }

  if (!isSupabaseConfigured()) {
    return defaultStats
  }

  try {
    // Início do mês atual para filtrar participação na comunidade
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Buscar todas as estatísticas em paralelo
    const [
      aulasResult,
      quizzesResult,
      desafiosResult,
      comunidadeResult,
      perguntasRespondidasResult,
      perguntasFeitasResult,
    ] = await Promise.all([
      // Aulas completas (baseado em XP history com source='aula')
      supabase
        .from('user_xp_history')
        .select('source_id')
        .eq('user_id', userId)
        .eq('source', 'aula'),
      
      // Quizzes completos
      supabase
        .from('user_quiz_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('completo', true),
      
      // Desafios concluídos
      supabase
        .from('user_desafio_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('completo', true),
      
      // Participação na comunidade este mês (respostas)
      supabase
        .from('respostas')
        .select('id')
        .eq('autor_id', userId)
        .gte('created_at', startOfMonth.toISOString()),
      
      // Total de perguntas respondidas (todas as respostas)
      supabase
        .from('respostas')
        .select('id')
        .eq('autor_id', userId),
      
      // Total de perguntas feitas pelo usuário
      supabase
        .from('perguntas')
        .select('id')
        .eq('autor_id', userId),
    ])

    // Debug logs
    if (quizzesResult.error) {
      console.error('Erro ao buscar quizzes:', quizzesResult.error)
    }
    console.log('getUserStats - userId:', userId)
    console.log('getUserStats - quizzes encontrados:', quizzesResult.data?.length, quizzesResult.data)

    // Contar aulas únicas (cada source_id diferente conta como uma aula)
    const aulasUnicas = new Set(
      (aulasResult.data || [])
        .filter(item => item.source_id)
        .map(item => item.source_id)
    )
    const aulasCompletas = aulasUnicas.size

    const quizCompletos = quizzesResult.data?.length || 0
    const desafiosConcluidos = desafiosResult.data?.length || 0
    const participacaoComunidade = comunidadeResult.data?.length || 0
    const perguntasRespondidas = perguntasRespondidasResult.data?.length || 0
    const perguntasFeitas = perguntasFeitasResult.data?.length || 0

    // Estimativa de tempo de estudo (30 min por aula, 10 min por quiz, 15 min por desafio)
    const tempoEstudo = (aulasCompletas * 30) + (quizCompletos * 10) + (desafiosConcluidos * 15)

    return {
      aulasCompletas,
      quizCompletos,
      desafiosConcluidos,
      tempoEstudo,
      participacaoComunidade,
      perguntasRespondidas,
      perguntasFeitas,
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return defaultStats
  }
}

