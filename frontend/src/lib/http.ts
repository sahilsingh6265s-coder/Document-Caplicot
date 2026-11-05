import { env } from "./env"
import { getUserToken } from "./supabase"

export interface FetchOptions extends Omit<RequestInit, "headers" | "body"> {
  headers?: Record<string, string>
  body?: unknown
}

export async function fetchWithAuth(path: string, options: FetchOptions = {}): Promise<Response> {
  const url = new URL(path, env.API_BASE_URL).toString()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const token = getUserToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    body: options.body != null ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  }

  return fetch(url, init)
}
