import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const query = searchParams.get('q') || ''

    // Extrair token se disponível (opcional para sugestões)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

    const supabase = await getSupabaseClient(accessToken || undefined)

    // Se houver query, buscar sugestões que correspondam
    if (query.trim()) {
      const queryLower = query.toLowerCase()
      
      // Buscar perguntas que correspondem
      const { data: perguntas } = await supabase
        .from('perguntas')
        .select('titulo, tags, categoria')
        .limit(50)
        .order('created_at', { ascending: false })

      if (!perguntas) {
        return NextResponse.json({ success: true, sugestoes: [] })
      }

      const sugestoes: string[] = []
      const sugestoesSet = new Set<string>()

      // Coletar títulos, tags e categorias que correspondem
      perguntas.forEach((p) => {
        // Títulos que correspondem
        if (p.titulo?.toLowerCase().includes(queryLower)) {
          const titulo = p.titulo.trim()
          if (titulo && titulo.length <= 100 && !sugestoesSet.has(titulo)) {
            sugestoes.push(titulo)
            sugestoesSet.add(titulo)
          }
        }

        // Tags que correspondem
        if (p.tags && Array.isArray(p.tags)) {
          p.tags.forEach((tag: string) => {
            if (tag?.toLowerCase().includes(queryLower) && !sugestoesSet.has(tag)) {
              sugestoes.push(tag)
              sugestoesSet.add(tag)
            }
          })
        }

        // Categorias que correspondem
        if (p.categoria?.toLowerCase().includes(queryLower) && !sugestoesSet.has(p.categoria)) {
          sugestoes.push(p.categoria)
          sugestoesSet.add(p.categoria)
        }
      })

      // Limitar a 10 sugestões
      return NextResponse.json({ 
        success: true, 
        sugestoes: sugestoes.slice(0, 10) 
      })
    }

    // Sem query, retornar sugestões populares (últimas tags, categorias, títulos)
    const { data: perguntas } = await supabase
      .from('perguntas')
      .select('titulo, tags, categoria')
      .limit(100)
      .order('created_at', { ascending: false })

    if (!perguntas) {
      return NextResponse.json({ success: true, sugestoes: [] })
    }

    const sugestoes: string[] = []
    const sugestoesSet = new Set<string>()

    // Coletar tags únicas
    const tagsMap = new Map<string, number>()
    perguntas.forEach((p) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            const count = tagsMap.get(tag) || 0
            tagsMap.set(tag, count + 1)
          }
        })
      }
    })

    // Adicionar tags mais comuns
    const tagsOrdenadas = Array.from(tagsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)
    
    tagsOrdenadas.forEach((tag) => {
      if (!sugestoesSet.has(tag)) {
        sugestoes.push(tag)
        sugestoesSet.add(tag)
      }
    })

    // Adicionar categorias únicas
    const categoriasMap = new Map<string, number>()
    perguntas.forEach((p) => {
      if (p.categoria && p.categoria.trim()) {
        const count = categoriasMap.get(p.categoria) || 0
        categoriasMap.set(p.categoria, count + 1)
      }
    })

    const categoriasOrdenadas = Array.from(categoriasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat)

    categoriasOrdenadas.forEach((cat) => {
      if (!sugestoesSet.has(cat)) {
        sugestoes.push(cat)
        sugestoesSet.add(cat)
      }
    })

    return NextResponse.json({ 
      success: true, 
      sugestoes: sugestoes.slice(0, 10) 
    })
  } catch (error: any) {
    console.error('Erro ao buscar sugestões:', error)
    return NextResponse.json({ success: true, sugestoes: [] }) // Retornar vazio em caso de erro
  }
}

