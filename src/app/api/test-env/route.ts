import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envCheck = {
    hasKiwifyClientId: !!process.env.KIWIFY_CLIENT_ID,
    hasKiwifyClientSecret: !!process.env.KIWIFY_CLIENT_SECRET,
    hasKiwifyAccountId: !!process.env.KIWIFY_ACCOUNT_ID,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(envCheck)
} 