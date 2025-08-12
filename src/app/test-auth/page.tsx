'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function TestAuthPage() {
  const { user, loading, refreshSession } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkSession = async () => {
    setIsChecking(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setDebugInfo({
        session: session ? 'Yes' : 'No',
        user: session?.user ? 'Yes' : 'No',
        userEmail: session?.user?.email,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Test</h1>
        
        {user ? (
          <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-400 mb-4">✅ Authenticated</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Created:</strong> {user.created_at}</p>
            </div>
            <div className="mt-4">
              <a 
                href="/dashboard" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">❌ Not Authenticated</h2>
            <p className="text-gray-300 mb-4">
              You need to sign in to access the dashboard.
            </p>
            <div className="space-x-4">
              <a 
                href="/signin" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
              <a 
                href="/" 
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <p className="text-sm text-gray-400 mb-4">
            Loading: {loading ? 'Yes' : 'No'} | User: {user ? 'Yes' : 'No'}
          </p>
          
          <button
            onClick={checkSession}
            disabled={isChecking}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Check Session'}
          </button>
          
          <button
            onClick={refreshSession}
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Session
          </button>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-800 rounded text-sm">
              <pre className="text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 