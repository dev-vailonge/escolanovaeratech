import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

const IMAGEM_BUCKET = 'comunidade-imagens'

/**
 * Endpoint para criar o bucket de imagens da comunidade
 * Pode ser chamado manualmente ou automaticamente
 */
export async function POST() {
  try {
    const supabase = getSupabaseAdmin()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase não configurado corretamente' },
        { status: 500 }
      )
    }

    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError)
    }

    const bucketExists = buckets?.some((b) => b.id === IMAGEM_BUCKET)

    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: `Bucket '${IMAGEM_BUCKET}' já existe`,
        bucket: IMAGEM_BUCKET,
      })
    }

    // Criar o bucket via API REST do Supabase
    const createBucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        id: IMAGEM_BUCKET,
        name: IMAGEM_BUCKET,
        public: true, // Público para leitura
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      }),
    })

    if (!createBucketResponse.ok) {
      const errorText = await createBucketResponse.text()
      console.error('Erro ao criar bucket:', errorText)
      return NextResponse.json(
        {
          error: 'Erro ao criar bucket',
          details: errorText,
        },
        { status: 500 }
      )
    }

    const bucketData = await createBucketResponse.json()

    return NextResponse.json({
      success: true,
      message: `Bucket '${IMAGEM_BUCKET}' criado com sucesso!`,
      bucket: bucketData,
    })
  } catch (error: any) {
    console.error('Erro ao criar bucket:', error)
    return NextResponse.json(
      {
        error: 'Erro ao criar bucket',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return NextResponse.json(
        { error: 'Erro ao listar buckets', details: listError.message },
        { status: 500 }
      )
    }

    const bucketExists = buckets?.some((b) => b.id === IMAGEM_BUCKET)

    return NextResponse.json({
      exists: bucketExists,
      bucket: bucketExists ? buckets?.find((b) => b.id === IMAGEM_BUCKET) : null,
      allBuckets: buckets?.map((b) => b.id),
    })
  } catch (error: any) {
    console.error('Erro ao verificar bucket:', error)
    return NextResponse.json(
      {
        error: 'Erro ao verificar bucket',
        details: error.message,
      },
      { status: 500 }
    )
  }
}





