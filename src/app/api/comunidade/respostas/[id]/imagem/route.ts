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
    
    // Extrair accessToken do header para usar com getSupabaseClient
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    // Usar getSupabaseClient para operações que precisam do contexto do usuário (RLS)
    const supabase = await getSupabaseClient(accessToken)
    const respostaId = params.id

    if (!respostaId) {
      return NextResponse.json({ error: 'ID da resposta inválido' }, { status: 400 })
    }

    // Verificar se a resposta pertence ao usuário
    const { data: resposta, error: respostaError } = await supabase
      .from('respostas')
      .select('id, autor_id')
      .eq('id', respostaId)
      .single()

    if (respostaError || !resposta) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
    }

    if (resposta.autor_id !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para fazer upload nesta resposta' }, { status: 403 })
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
    const objectPath = `respostas/${respostaId}/${Date.now()}-${rand}.${ext}`

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
      
      // Se o erro menciona bucket não encontrado, dar mensagem específica
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
      
      // Se o erro é de permissão, dar mensagem sobre políticas RLS
      if (errorMessage.includes('permission') || errorMessage.includes('policy') || uploadError.statusCode === '403') {
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

    // Obter URL pública da imagem (funciona com qualquer cliente)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const imagemUrl = `${supabaseUrl}/storage/v1/object/public/${IMAGEM_BUCKET}/${objectPath}`

    // Atualizar resposta com a URL da imagem (usar cliente do usuário para RLS)
    const { error: updateError } = await supabase
      .from('respostas')
      .update({ imagem_url: imagemUrl })
      .eq('id', respostaId)

    if (updateError) {
      console.error('Erro ao atualizar resposta com imagem:', updateError)
      console.error('Detalhes do erro:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      
      // Verificar se o erro é porque a coluna não existe
      if (updateError.message?.includes('column') && updateError.message?.includes('imagem_url')) {
        return NextResponse.json({ 
          error: 'Coluna imagem_url não existe na tabela respostas. Execute o script SQL: docs/ADICIONAR_IMAGEM_URL_RESPOSTAS.sql',
          details: updateError.message 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Erro ao atualizar resposta',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, imagem_url: imagemUrl })
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao fazer upload de imagem' }, { status: 500 })
  }
}

