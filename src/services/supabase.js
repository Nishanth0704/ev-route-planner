import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || ''

// Check whether Supabase credentials have been configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co'
)

// Initialize the client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Initiates Google OAuth Sign-in through Supabase
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  }

  // Ensure redirect URL always targets the root origin
  const redirectTarget = window.location.origin.replace(/\/+$/, '') + '/'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTarget,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) throw error
  return data
}

/**
 * Signs out the current authenticated user
 */
export async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { error: null }
}

/**
 * Upserts a user's profile record in the 'profiles' table
 */
export async function upsertProfile(user) {
  if (!isSupabaseConfigured || !supabase || !user) return null

  const profileData = {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.warn('Could not sync user profile to Supabase table:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Error syncing profile:', err)
    return null
  }
}

/**
 * Retrieves a user's profile from the 'profiles' table
 */
export async function getProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Error fetching profile:', err)
    return null
  }
}
