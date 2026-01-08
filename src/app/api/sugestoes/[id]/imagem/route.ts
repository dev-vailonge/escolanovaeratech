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
    const notificacaoId = params.id

    if (!notificacaoId) {
      return NextResponse.json({ error: 'ID da notificação inválido' }, { status: 400 })
    }

    // Verificar se a notificação pertence ao usuário e é uma sugestão/bug
    const { data: notificacao, error: notifError } = await supabase
      .from('notificacoes')
      .select('id, created_by, is_sugestao_bug')
      .eq('id', notificacaoId)
      .single()

    if (notifError || !notificacao) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    if (notificacao.created_by !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para fazer upload nesta notificação' }, { status: 403 })
    }

    if (!notificacao.is_sugestao_bug) {
      return NextResponse.json({ error: 'Apenas sugestões/bugs podem ter imagens' }, { status: 400 })
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
    const objectPath = `sugestoes/${notificacaoId}/${Date.now()}-${rand}.${ext}`

    const arrayBuffer = await imagemFile.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Fazer upload usando cliente autenticado do usuário (RLS deve permitir)
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

    // Atualizar notificação com a URL da imagem
    const { error: updateError } = await supabase
      .from('notificacoes')
      .update({ imagem_url: imagemUrl })
      .eq('id', notificacaoId)

    if (updateError) {
      console.error('Erro ao atualizar notificação com imagem:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
    }

    return NextResponse.json({ success: true, imagem_url: imagemUrl })
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (String(error?.message || '').includes('permission') || String(error?.message || '').includes('RLS')) {
      return NextResponse.json({ error: 'Erro de permissão. Verifique se você tem permissão para fazer upload nesta notificação.', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, { status: 403 })
    }
    const errorMessage = process.env.NODE_ENV === 'development' ? error?.message || 'Erro ao fazer upload de imagem' : 'Erro ao fazer upload de imagem. Tente novamente mais tarde.'
    return NextResponse.json({ error: errorMessage, details: process.env.NODE_ENV === 'development' ? error?.stack : undefined }, { status: 500 })
  }
}

