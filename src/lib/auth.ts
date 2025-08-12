import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { serverConfig } from './server-config'
import { SecureSessionManager } from './session'

// Create a server-side Supabase client for authentication
function createServerSupabaseClient() {
  return createClient(
    serverConfig.supabase.url,
    serverConfig.supabase.anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}

// Get session using secure session manager
export async function getSession() {
  try {
    const sessionInfo = await SecureSessionManager.getSessionFromCookies()
    
    if (!sessionInfo?.isValid) {
      console.log('No valid session found')
      return null
    }

    const supabase = createServerSupabaseClient()
    
    // Get the full session from Supabase to verify it's still valid
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session from Supabase:', error)
      return null
    }
    
    if (!session) {
      console.log('No session returned from Supabase')
      return null
    }

    return {
      user: session.user,
      access_token: session.access_token,
      refresh_token: session.refresh_token
    }
  } catch (error) {
    console.error('Error in getSession:', error)
    return null
  }
}

export async function requireAuth() {
  try {
    const session = await getSession()
    
    if (!session) {
      console.log('Authentication required - redirecting to signin')
      redirect('/signin')
    }
    
    console.log('User authenticated:', session.user?.email)
    return session
  } catch (error) {
    console.error('Error in requireAuth:', error)
    redirect('/signin')
  }
}

// Create a client for database operations (without auth)
export function createDatabaseClient() {
  return createClient(
    serverConfig.supabase.url,
    serverConfig.supabase.anonKey
  )
} 