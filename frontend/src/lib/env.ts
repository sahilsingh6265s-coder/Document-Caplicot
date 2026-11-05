const requiredEnv = [
  "VITE_API_BASE_URL",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
] as const

type EnvKey = (typeof requiredEnv)[number]

function getRequiredEnv(key: EnvKey): string {
  const value = import.meta.env[key]
  if (!value || typeof value !== "string") {
    throw new Error(`${key} is required and must be a string.`)
  }
  return value
}

function validateUrl(value: string, key: EnvKey): string {
  try {
    return new URL(value).toString().replace(/\/$/, "")
  } catch {
    throw new Error(`${key} must be a valid URL. Received: ${value}`)
  }
}

const apiBaseUrl = validateUrl(getRequiredEnv("VITE_API_BASE_URL"), "VITE_API_BASE_URL")
const supabaseUrl = validateUrl(getRequiredEnv("VITE_SUPABASE_URL"), "VITE_SUPABASE_URL")
const supabaseAnonKey = getRequiredEnv("VITE_SUPABASE_ANON_KEY")

export const env = {
  API_BASE_URL: apiBaseUrl,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
  apiBaseUrl,
  supabaseUrl,
  supabaseAnonKey,
}
