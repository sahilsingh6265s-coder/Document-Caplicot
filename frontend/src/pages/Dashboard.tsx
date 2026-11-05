import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../lib/api'

interface ChatThread {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchThreads()
  }, [])

  async function fetchThreads() {
    setError(null)
    setLoading(true)

    try {
      const response = await apiGet<{ data: ChatThread[] }>('/chat/threads')
      setThreads(response.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads')
    } finally {
      setLoading(false)
    }
  }

  async function startConversation() {
    setError(null)
    setLoading(true)

    try {
      await apiPost<{ data: ChatThread[] }>('/chat/threads', { title: 'New conversation' })
      await fetchThreads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create a new conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <div>
        <h1>Dashboard</h1>
        <p>Start a conversation or continue an existing thread below.</p>
      </div>

      <button type="button" onClick={startConversation} disabled={loading}>
        {loading ? 'Working…' : 'Start a conversation'}
      </button>

      {error ? <p className="error">{error}</p> : null}

      <div>
        <h2>Your conversations</h2>
        {loading && threads.length === 0 ? (
          <p>Loading conversations…</p>
        ) : threads.length === 0 ? (
          <p>No conversations yet. Start one to get going.</p>
        ) : (
          <ul>
            {threads.map((thread) => (
              <li key={thread.id}>
                <strong>{thread.title}</strong>
                <div>Last updated: {new Date(thread.updated_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
