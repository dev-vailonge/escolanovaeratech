import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

const IMAGEM_BUCKET = 'comunidade-imagens'

function safeFileExt(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return 'webp'
  const ext = parts[parts.length - 1].toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext
  return 'webp'
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    const supabase = await getSupabaseClient(accessToken)
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Verificar se a pergunta pertence ao usuário
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, autor_id')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    if (pergunta.autor_id !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para fazer upload nesta pergunta' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type') || ''
    let imagemFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('imagem')
      if (file && typeof file !== 'string') {
        imagemFile = file as File
      }
    } else {
      // Tentar receber como blob
      const blob = await request.blob()
      if (blob && blob.size > 0) {
        const ext = safeFileExt('imagem.webp')
        imagemFile = new File([blob], `imagem.${ext}`, { type: blob.type || 'image/webp' })
      }
    }

    if (!imagemFile) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 })
    }

    const maxBytes = 1 * 1024 * 1024 // 1MB (já comprimido no cliente)
    if (imagemFile.size > maxBytes) {
      return NextResponse.json({ error: 'Imagem muito grande (máx 1MB)' }, { status: 400 })
    }

    if (!imagemFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo inválido (precisa ser imagem)' }, { status: 400 })
    }

    const ext = safeFileExt(imagemFile.name)
    const rand = Math.random().toString(16).slice(2)
    const objectPath = `perguntas/${perguntaId}/${Date.now()}-${rand}.${ext}`

    const arrayBuffer = await imagemFile.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Fazer upload usando cliente autenticado do usuário (RLS deve permitir)
    // Não precisa de service role key - as políticas RLS do bucket devem permitir upload para usuários autenticados
    const { error: uploadError } = await supabase.storage
      .from(IMAGEM_BUCKET)
      .upload(objectPath, fileBuffer, {
        contentType: imagemFile.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro upload imagem:', uploadError)
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
            error: 'Permissão negada para fazer upload. Verifique as políticas RLS do bucket no Supabase.',
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const imagemUrl = `${supabaseUrl}/storage/v1/object/public/${IMAGEM_BUCKET}/${objectPath}`

    // Atualizar pergunta com a URL da imagem (usar cliente do usuário para RLS)
    const { error: updateError } = await supabase
      .from('perguntas')
      .update({ imagem_url: imagemUrl })
      .eq('id', perguntaId)

    if (updateError) {
      console.error('Erro ao atualizar pergunta com imagem:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar pergunta' }, { status: 500 })
    }

    return NextResponse.json({ success: true, imagem_url: imagemUrl })
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (String(error?.message || '').includes('permission') || String(error?.message || '').includes('RLS')) {
      return NextResponse.json({ error: 'Erro de permissão. Verifique se você tem permissão para fazer upload nesta pergunta.', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, { status: 403 })
    }
    const errorMessage = process.env.NODE_ENV === 'development' ? error?.message || 'Erro ao fazer upload de imagem' : 'Erro ao fazer upload de imagem. Tente novamente mais tarde.'
    return NextResponse.json({ error: errorMessage, details: process.env.NODE_ENV === 'development' ? error?.stack : undefined }, { status: 500 })
  }
}

