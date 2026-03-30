import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Garante linha em `curso_desafio_conclusoes` ao finalizar plano (módulo da formação).
 * Separado de `desafio_submissions` (desafios gerais).
 */
export async function upsertCursoDesafioConclusaoFromPlanoFinalize(params: {
  supabase: SupabaseClient
  userId: string
  cursosDesafioId: string
  githubUrl: string
}): Promise<{ id: string } | null> {
  const { supabase, userId, cursosDesafioId, githubUrl } = params
  const now = new Date().toISOString()

  const { data: existing, error: findErr } = await supabase
    .from('curso_desafio_conclusoes')
    .select('id, status')
    .eq('user_id', userId)
    .eq('cursos_desafio_id', cursosDesafioId)
    .maybeSingle()

  if (findErr && findErr.code !== 'PGRST116') {
    throw new Error(findErr.message)
  }

  if (existing) {
    const { data: updated, error: upErr } = await supabase
      .from('curso_desafio_conclusoes')
      .update({
        github_url: githubUrl,
        status: 'aprovado',
        admin_notes: null,
        reviewed_at: now,
        reviewed_by: null,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select('id')
      .single()

    if (upErr) throw new Error(upErr.message)
    return updated ? { id: updated.id } : null
  }

  const { data: inserted, error: insErr } = await supabase
    .from('curso_desafio_conclusoes')
    .insert({
      user_id: userId,
      cursos_desafio_id: cursosDesafioId,
      github_url: githubUrl,
      status: 'aprovado',
      admin_notes: null,
      reviewed_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (insErr) throw new Error(insErr.message)
  return inserted ? { id: inserted.id } : null
}
