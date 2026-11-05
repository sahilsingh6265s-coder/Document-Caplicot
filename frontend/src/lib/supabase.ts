import { createClient } from '@supabase/supabase-js'

import { env } from './env'

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

export function getUserToken(): string | null {
  // Get the current session from localStorage (set by Supabase)
  try {
    const sessionJson = localStorage.getItem(`sb-${env.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`)
    if (!sessionJson) return null
    const session = JSON.parse(sessionJson)
    return session?.access_token ?? null
  } catch {
    return null
  }
}

export async function getValidSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

