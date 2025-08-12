import { NextRequest, NextResponse } from 'next/server'
import { SecureSessionManager } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Clear the session
    await SecureSessionManager.clearSession()
    
    // Return success response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
} 