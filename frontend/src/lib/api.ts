import { fetchWithAuth } from "./http"

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = body?.message ?? response.statusText
    throw new Error(`API request failed: ${message}`)
  }

  return body as T
}

export async function apiRequest<T>(path: string, options?: Parameters<typeof fetchWithAuth>[1]): Promise<T> {
  const response = await fetchWithAuth(path, options)
  return parseResponse<T>(response)
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body })
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body })
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" })
}
