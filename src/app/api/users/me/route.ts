import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export const runtime = 'nodejs'

const AVATAR_BUCKET = 'avatars'

function safeFileExt(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return 'jpg'
  const ext = parts[parts.length - 1].toLowerCase()
  // whitelist básica
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext
  return 'jpg'
}

export async function GET(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,role,access_level,level,xp,xp_mensal,coins,streak,avatar_url,bio,created_at')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const supabase = getSupabaseAdmin()

    const contentType = request.headers.get('content-type') || ''
    let name: string | null = null
    let avatarFile: File | null = null
    let bio: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const rawName = form.get('name')
      if (typeof rawName === 'string') name = rawName.trim()
      const rawBio = form.get('bio')
      if (typeof rawBio === 'string') bio = rawBio.trim()
      const file = form.get('avatar')
      if (file && typeof file !== 'string') avatarFile = file as File
    } else {
      const body = await request.json().catch(() => ({}))
      if (typeof body?.name === 'string') name = body.name.trim()
      if (typeof body?.bio === 'string') bio = body.bio.trim()
    }

    const updatePayload: Record<string, any> = {}
    if (name != null) {
      if (name.length < 2) return NextResponse.json({ error: 'Nome muito curto' }, { status: 400 })
      if (name.length > 80) return NextResponse.json({ error: 'Nome muito longo' }, { status: 400 })
      updatePayload.name = name
    }

    if (bio != null) {
      if (bio.length > 160) return NextResponse.json({ error: 'Frase muito longa (máx 160)' }, { status: 400 })
      updatePayload.bio = bio.length ? bio : null
    }

    if (avatarFile) {
      const maxBytes = 5 * 1024 * 1024
      if (avatarFile.size > maxBytes) {
        return NextResponse.json({ error: 'Imagem muito grande (máx 5MB)' }, { status: 400 })
      }
      if (!avatarFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Arquivo inválido (precisa ser imagem)' }, { status: 400 })
      }

      const ext = safeFileExt(avatarFile.name)
      const rand = Math.random().toString(16).slice(2)
      const objectPath = `${userId}/${Date.now()}-${rand}.${ext}`

      const arrayBuffer = await avatarFile.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(objectPath, fileBuffer, {
          contentType: avatarFile.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('Erro upload avatar:', uploadError)
        return NextResponse.json(
          { error: `Falha ao enviar avatar. Verifique se o bucket '${AVATAR_BUCKET}' existe.` },
          { status: 500 }
        )
      }

      const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath)
      updatePayload.avatar_url = publicData.publicUrl
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id,name,avatar_url,bio')
      .single()

    if (updateError) {
      console.error('Erro update users:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (error: any) {
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}


