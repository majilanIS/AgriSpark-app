import { supabase } from './supabaseClient'

export async function testConnection() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      message: 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    }
  }

  try {
    // Uses Supabase URL and key directly to confirm the project is reachable.
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        ok: false,
        message: `HTTP ${response.status}: ${body}`,
      }
    }

    const settings = await response.json()
    const { error } = await supabase.auth.getSession()
    if (error) {
      return { ok: false, message: error.message }
    }

    return {
      ok: true,
      message: 'Connected to Supabase successfully',
      settings,
    }
  } catch (err) {
    return {
      ok: false,
      message: err?.message || 'Unknown connection error',
    }
  }
}