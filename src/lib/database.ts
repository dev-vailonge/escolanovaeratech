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
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<DatabaseUser | null> {
  if (!isSupabaseConfigured()) {
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
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function updateUserAccessLevel(userId: string, accessLevel: 'full' | 'limited'): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ access_level: accessLevel })
    .eq('id', userId)

  if (error) {
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
    return false
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      return false
    }

    return true
  } catch (error) {
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
    return null
  }

  try {
    // Se um ID foi fornecido, verificar se já existe usuário com esse ID
    if (userData.id) {
      const existingById = await getUserById(userData.id)
      if (existingById) {
        return existingById
      }
    }

    // Verificar se já existe usuário com este email
    const existingByEmail = await getUserByEmail(userData.email)
    if (existingByEmail) {
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
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

/**
 * Busca todos os usuários da tabela users
 * Usado no painel administrativo para listar alunos
 */
export async function getAllUsers(): Promise<DatabaseUser[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
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
    .neq('role', 'admin')
    .order('xp', { ascending: false })
    .limit(limit)

  if (error) {
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
    .neq('role', 'admin')
    .order('xp_mensal', { ascending: false })
    .limit(limit)

  if (error) {
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
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function createQuiz(quiz: Omit<DatabaseQuiz, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseQuiz | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    
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
      return null
    }

    return data
  } catch {
    return null
  }
}

export async function updateQuiz(quizId: string, updates: Partial<DatabaseQuiz>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    
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
      return false
    }

    return true
  } catch {
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
      return false
    }

    return true
  } catch (error) {
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
      return null
    }

    return data
  } catch (error) {
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
      return false
    }

    return true
  } catch (error) {
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
      return false
    }

    return true
  } catch (error) {
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
      return []
    }

    return data || []
  } catch (error) {
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
      return null
    }

    return data
  } catch (error) {
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
      return false
    }

    return true
  } catch (error) {
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
      return false
    }

    return true
  } catch (error) {
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
    return false
  }

  try {

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
      if (getSupabaseAdmin && typeof window === 'undefined') {
        try {
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
            return false
          }

          await new Promise(resolve => setTimeout(resolve, 500))
          await supabase.from('users').select('xp, xp_mensal, level').eq('id', userId).single()
          return true
        } catch {
          return false
        }
      }
      return false
    }

    if (!data || data.length === 0) {
      return false
    }

    await new Promise(resolve => setTimeout(resolve, 500))
    await supabase.from('users').select('xp, xp_mensal, level').eq('id', userId).single()
    return true
  } catch (error: any) {
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
    return []
  }

  return data || []
}

// ============================================================
// FORMULÁRIOS
// ============================================================

export async function getFormulariosAtivos(): Promise<DatabaseFormulario[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
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
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function getFormularioById(formularioId: string): Promise<DatabaseFormulario | null> {
  if (!isSupabaseConfigured()) {
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
      return null
    }

    return data
  } catch (error) {
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
      return false
    }

    return !!data
  } catch (error) {
    return false
  }
}

export async function salvarRespostaFormulario(
  formularioId: string,
  userId: string,
  respostas: any
): Promise<DatabaseFormularioResposta | null> {
  if (!isSupabaseConfigured()) {
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
        return null
      }

      return data
    }
  } catch (error) {
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
      return []
    }

    return data || []
  } catch (error) {
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
      return null
    }

    return data
  } catch (error) {
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


    const { data, error } = await supabase
      .from('formularios')
      .insert(dadosInsert)
      .select()
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error: any) {
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
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function deleteFormulario(formularioId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {

    // Buscar todas as respostas ao formulário
    const { data: respostas, error: respostasError } = await supabase
      .from('formulario_respostas')
      .select('user_id, id')
      .eq('formulario_id', formularioId)

    if (respostasError) {
      return false
    }


    // Se houver respostas, reverter o XP dos usuários
    if (respostas && respostas.length > 0) {
      // Buscar informações do formulário para calcular XP
      const { data: formulario, error: formularioError } = await supabase
        .from('formularios')
        .select('nome')
        .eq('id', formularioId)
        .single()

      if (formularioError) {
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


          const { error: xpError } = await supabaseAdmin
            .from('user_xp_history')
            .insert(xpEntries)

          if (xpError) {
            return false
          }

        } catch (adminError) {
          return false
        }
      }
    }

    // Excluir notificações relacionadas ao formulário
    // As notificações têm action_url apontando para o formulário
    const actionUrlPattern = `/aluno/formularios/${formularioId}`
    
    const { data: notificacoes, error: notifFindError } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('action_url', actionUrlPattern)
    
    if (!notifFindError && notificacoes && notificacoes.length > 0) {
      await supabase.from('notificacoes').delete().eq('action_url', actionUrlPattern)
    }

    // Agora excluir o formulário (as respostas serão excluídas em cascata pelo banco)
    const { error: deleteError } = await supabase
      .from('formularios')
      .delete()
      .eq('id', formularioId)

    if (deleteError) {
      return false
    }

    return true
  } catch (error) {
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
    }

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
    return defaultStats
  }
}

