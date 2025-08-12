// Server-side configuration - these variables are only available on the server
export const serverConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Add any service role key here if needed for server-side operations
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  kiwify: {
    clientId: process.env.KIWIFY_CLIENT_ID,
    clientSecret: process.env.KIWIFY_CLIENT_SECRET,
    accountId: process.env.KIWIFY_ACCOUNT_ID,
  }
}

// Validate required environment variables
export function validateServerConfig() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
} 