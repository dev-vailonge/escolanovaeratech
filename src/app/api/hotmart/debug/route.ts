/**
 * Endpoint de diagnóstico para testar hosts/endpoints da Hotmart
 * 
 * Uso: GET /api/hotmart/debug
 * 
 * Retorna informações sobre qual host/endpoint está funcionando
 */

import { NextResponse } from 'next/server'
import { getHotmartAccessToken } from '@/lib/hotmart/auth'
import { getApiBase, getApiBaseSandbox } from '@/lib/hotmart/config'

export async function GET() {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint disponível apenas em desenvolvimento' },
      { status: 403 }
    )
  }

  const results: any[] = []

  try {
    const token = await getHotmartAccessToken()
    
    if (!token) {
      return NextResponse.json({
        error: 'Não foi possível obter token de acesso',
        results: [],
      })
    }

    const apiBase = getApiBase()
    const apiBaseSandbox = getApiBaseSandbox()
    const endpointPath = '/payments/api/v1/sales/history'
    const queryParams = new URLSearchParams({ 
      max_results: '1',
      transaction_status: 'APPROVED'
    })

    const hosts = [
      { base: apiBase, name: 'produção' },
      { base: apiBaseSandbox, name: 'sandbox' },
    ]

    for (const { base, name } of hosts) {
      const url = `${base}${endpointPath}?${queryParams.toString()}`
      
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          })

          const status = response.status
          const statusText = response.statusText
          const contentType = response.headers.get('content-type') || ''
          let bodySnippet = ''
          
          try {
            const text = await response.text()
            
            // Se for HTML, extrair informações úteis
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i)
              const h1Match = text.match(/<h1[^>]*>([^<]+)<\/h1>/i)
              bodySnippet = `HTML Response:\n`
              if (titleMatch) bodySnippet += `Title: ${titleMatch[1]}\n`
              if (h1Match) bodySnippet += `H1: ${h1Match[1]}\n`
              bodySnippet += `First 500 chars: ${text.substring(0, 500)}`
            } else {
              bodySnippet = text.substring(0, 500)
              
              // Tentar parsear como JSON
              try {
                const json = JSON.parse(text)
                bodySnippet = JSON.stringify(json, null, 2).substring(0, 500)
              } catch {
                // Manter como texto
              }
            }
          } catch {
            bodySnippet = 'Erro ao ler body'
          }

        results.push({
          hostTried: base,
          hostName: name,
          url,
          status,
          statusText,
          contentType,
          success: status === 200 && !bodySnippet.includes('HTML Response'),
          bodySnippet,
        })
      } catch (error) {
        results.push({
          hostTried: base,
          hostName: name,
          url,
          status: 'ERROR',
          statusText: error instanceof Error ? error.message : String(error),
          success: false,
          bodySnippet: '',
        })
      }
    }

    const workingHost = results.find(r => r.success)
    
    return NextResponse.json({
      tokenObtained: !!token,
      results,
      recommendation: workingHost
        ? `✅ Use o host: ${workingHost.hostTried}`
        : '❌ Nenhum host funcionou. Verifique credenciais e permissões.',
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      results,
    }, { status: 500 })
  }
}

