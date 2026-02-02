import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

const IMAGEM_BUCKET = 'comunidade-imagens'

function safeFileExt(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return 'webp'
  const ext = parts[parts.length - 1].toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext
  return 'webp'
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token de acesso não fornecido' }, { status: 401 })
    }

    const supabaseUser = await getSupabaseClient(accessToken)
    const { data: user, error: userError } = await supabaseUser
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas admins podem enviar imagens de avisos.' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type') || ''
    let imagemFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('imagem')
      if (file && typeof file !== 'string') {
        imagemFile = file as File
      }
    }

    if (!imagemFile) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 })
    }

    const maxBytes = 2 * 1024 * 1024 // 2MB
    if (imagemFile.size > maxBytes) {
      return NextResponse.json({ error: 'Imagem muito grande (máx 2MB)' }, { status: 400 })
    }

    if (!imagemFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo inválido (precisa ser imagem)' }, { status: 400 })
    }

    const ext = safeFileExt(imagemFile.name)
    const rand = Math.random().toString(16).slice(2)
    const objectPath = `avisos/${Date.now()}-${rand}.${ext}`

    const arrayBuffer = await imagemFile.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Usar cliente do usuário autenticado (admin já verificado acima) - não exige SUPABASE_SERVICE_ROLE_KEY
    const { error: uploadError } = await supabaseUser.storage
      .from(IMAGEM_BUCKET)
      .upload(objectPath, fileBuffer, {
        contentType: imagemFile.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro upload imagem aviso:', uploadError)
      const errorMessage = uploadError?.message || 'Erro desconhecido'
      if (errorMessage.includes('Bucket') || errorMessage.includes('bucket')) {
        return NextResponse.json(
          {
            error: `Bucket '${IMAGEM_BUCKET}' não encontrado. Verifique se o bucket existe no Supabase.`,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 500 }
        )
      }
      if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
        return NextResponse.json(
          {
            error: 'Permissão negada no Storage. Verifique as políticas RLS do bucket para permitir upload na pasta avisos/.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        {
          error: `Falha ao enviar imagem: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? uploadError : undefined
        },
        { status: 500 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const imagemUrl = `${supabaseUrl}/storage/v1/object/public/${IMAGEM_BUCKET}/${objectPath}`

    return NextResponse.json({ success: true, imagem_url: imagemUrl })
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem de aviso:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const errorMessage = process.env.NODE_ENV === 'development' ? error?.message || 'Erro ao fazer upload' : 'Erro ao fazer upload. Tente novamente.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
