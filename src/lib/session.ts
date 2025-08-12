import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Secure session management without exposing tokens
export class SecureSessionManager {
  // Supabase uses different cookie names based on the project
  private static getSessionCookieName() {
    // Try to get the project ref from the URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        return `sb-${projectRef}-auth-token`
      }
    }
    // Fallback to common cookie names
    return 'sb-auth-token'
  }

  private static readonly SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  }

  // Get session from request cookies (for middleware)
  static getSessionFromRequest(request: NextRequest) {
    const cookieName = this.getSessionCookieName()
    console.log('SessionManager: Looking for cookie:', cookieName)
    
    const sessionCookie = request.cookies.get(cookieName) || 
                         request.cookies.get('sb-auth-token') ||
                         request.cookies.get('sb-access-token') ||
                         request.cookies.get('supabase-auth-token')
    
    console.log('SessionManager: Found cookie:', sessionCookie ? 'Yes' : 'No')
    
    if (!sessionCookie?.value) {
      console.log('SessionManager: No session cookie found')
      return null
    }

    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value))
      console.log('SessionManager: Session parsed successfully')
      
      // Validate session structure
      if (!session?.access_token || !session?.refresh_token) {
        console.log('SessionManager: Invalid session structure')
        return null
      }

      // Check if token is expired
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.log('SessionManager: Session expired')
        return null
      }

      console.log('SessionManager: Valid session found')
      return {
        isValid: true,
        userId: session.user?.id,
        expiresAt: session.expires_at
      }
    } catch (error) {
      console.log('SessionManager: Error parsing session:', error)
      return null
    }
  }

  // Get session from server cookies (for server components)
  static async getSessionFromCookies() {
    const cookieStore = await cookies()
    const cookieName = this.getSessionCookieName()
    console.log('SessionManager: Looking for cookie:', cookieName)
    
    const sessionCookie = cookieStore.get(cookieName) || 
                         cookieStore.get('sb-auth-token') ||
                         cookieStore.get('sb-access-token') ||
                         cookieStore.get('supabase-auth-token')
    
    console.log('SessionManager: Found cookie:', sessionCookie ? 'Yes' : 'No')
    
    if (!sessionCookie?.value) {
      console.log('SessionManager: No session cookie found')
      return null
    }

    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value))
      console.log('SessionManager: Session parsed successfully')
      
      if (!session?.access_token || !session?.refresh_token) {
        console.log('SessionManager: Invalid session structure')
        return null
      }

      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.log('SessionManager: Session expired')
        return null
      }

      console.log('SessionManager: Valid session found')
      return {
        isValid: true,
        userId: session.user?.id,
        expiresAt: session.expires_at
      }
    } catch (error) {
      console.log('SessionManager: Error parsing session:', error)
      return null
    }
  }

  // Clear session (for logout)
  static async clearSession() {
    const cookieStore = await cookies()
    const cookieName = this.getSessionCookieName()
    cookieStore.delete(cookieName)
    cookieStore.delete('sb-auth-token')
    cookieStore.delete('sb-access-token')
    cookieStore.delete('supabase-auth-token')
    console.log('SessionManager: Session cleared')
  }
} 