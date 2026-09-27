import { createContext, useContext, useState, useEffect } from 'react'
import {
  supabase,
  isSupabaseConfigured,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  upsertProfile,
} from '../services/supabase'

const AuthContext = createContext(null)
const LOCAL_STORAGE_SESSION_KEY = 'ev_route_planner_oauth_session'

/**
 * Safely decodes a JWT payload without external dependencies
 */
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let isMounted = true

    /**
     * 1. Resilient OAuth Token Parser
     * Handles tokens returning from Google via Supabase OAuth (in URL hash or query)
     * e.g. http://localhost:5173/#access_token=...&refresh_token=...
     */
    const handleUrlTokens = async () => {
      try {
        if (typeof window === 'undefined') return false

        let tokenParams = null

        // Check hash fragment (#access_token=...)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          const rawHash = window.location.hash.replace(/^#/, '')
          tokenParams = new URLSearchParams(rawHash)
        }
        // Check query parameters (?access_token=...)
        else if (window.location.search && window.location.search.includes('access_token')) {
          tokenParams = new URLSearchParams(window.location.search)
        }

        if (tokenParams) {
          // Check for OAuth error returned by provider
          const errorDesc = tokenParams.get('error_description') || tokenParams.get('error')
          if (errorDesc) {
            const cleanError = decodeURIComponent(errorDesc.replace(/\+/g, ' '))
            if (isMounted) {
              setAuthError(cleanError)
              setLoading(false)
            }
            return false
          }

          const accessToken = tokenParams.get('access_token')
          const refreshToken = tokenParams.get('refresh_token')

          if (accessToken) {
            let activeUser = null
            let activeSession = null

            // Attempt official Supabase session establishment
            if (supabase) {
              try {
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                })
                if (!error && data?.session?.user) {
                  activeSession = data.session
                  activeUser = data.session.user
                }
              } catch (e) {
                console.warn('supabase.auth.setSession error:', e)
              }
            }

            // Fail-safe: Decode JWT directly from access_token if Supabase setSession had issues
            if (!activeUser) {
              const payload = decodeJwtPayload(accessToken)
              if (payload?.sub) {
                activeUser = {
                  id: payload.sub,
                  email: payload.email || '',
                  user_metadata: payload.user_metadata || {
                    full_name: payload.email?.split('@')[0] || 'Google User',
                    name: payload.email?.split('@')[0] || 'Google User',
                    avatar_url: payload.avatar_url || '',
                  },
                  app_metadata: payload.app_metadata || {},
                }
                activeSession = {
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                  user: activeUser,
                }
              }
            }

            if (activeUser && activeSession) {
              if (isMounted) {
                setSession(activeSession)
                setUser(activeUser)
                setLoading(false)
              }

              // Persist session so browser refreshes remain logged in
              try {
                localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(activeSession))
              } catch (e) {}

              // Clean address bar: reset URL to root '/' without reload (clearing /svg and hash tokens)
              window.history.replaceState(null, '', '/')

              // Sync profile if Supabase is active
              if (supabase) {
                upsertProfile(activeUser)
              }
              return true
            }
          }
        }
      } catch (err) {
        console.warn('OAuth URL token handling exception:', err)
      }
      return false
    }

    /**
     * 2. Synchronous auth state listener
     * Listens for sign in, sign out, or token refresh
     */
    let authSubscription = null
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!isMounted) return

          if (currentSession?.user) {
            setSession(currentSession)
            setUser(currentSession.user)
            setLoading(false)

            try {
              localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(currentSession))
            } catch (e) {}

            // Clean address bar if tokens are still present
            if (typeof window !== 'undefined' && (window.location.hash?.includes('access_token') || window.location.pathname !== '/')) {
              window.history.replaceState(null, '', '/')
            }

            if (event === 'SIGNED_IN') {
              await upsertProfile(currentSession.user)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setSession(null)
            setLoading(false)
            try {
              localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
            } catch (e) {}
          }
        }
      )
      authSubscription = data?.subscription
    }

    /**
     * 3. Session initialization
     * First checks URL callback tokens. If none, checks Supabase storage or localStorage.
     */
    async function initSession() {
      // 1. Process URL tokens if arriving from OAuth redirect
      const handledFromUrl = await handleUrlTokens()
      if (handledFromUrl) return

      // 2. Try Supabase getSession()
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.getSession()
          if (!error && data?.session?.user && isMounted) {
            setSession(data.session)
            setUser(data.session.user)
            upsertProfile(data.session.user)
            setLoading(false)
            return
          }
        } catch (err) {
          console.warn('getSession error:', err)
        }
      }

      // 3. Fallback: Restore persisted session from localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.user && isMounted) {
            setSession(parsed)
            setUser(parsed.user)
            setLoading(false)
            return
          }
        }
      } catch (e) {}

      if (isMounted) {
        setLoading(false)
      }
    }

    initSession()

    return () => {
      isMounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const loginWithGoogle = async () => {
    setAuthError(null)
    try {
      await authSignInWithGoogle()
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }

  // Development helper: allows previewing and testing the complete flow
  const demoLogin = () => {
    setAuthError(null)
    const mockUser = {
      id: 'demo-google-user',
      email: 'nisshanth@gmail.com',
      user_metadata: {
        full_name: 'Nisshanth',
        name: 'Nisshanth',
        avatar_url: '',
      },
    }
    const mockSession = { user: mockUser }
    setUser(mockUser)
    setSession(mockSession)
    setLoading(false)
    try {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockSession))
    } catch (e) {}
  }

  const logout = async () => {
    setAuthError(null)
    try {
      if (supabase) {
        await authSignOut()
      }
      setUser(null)
      setSession(null)
      try {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/')
      }
    } catch (err) {
      setAuthError(err.message)
      console.error('Error signing out:', err)
    }
  }

  const value = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    authError,
    setAuthError,
    loginWithGoogle,
    demoLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
