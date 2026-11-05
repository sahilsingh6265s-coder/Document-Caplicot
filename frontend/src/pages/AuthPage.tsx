import { useState } from "react"
import { signIn } from "../lib/auth"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const result = await signIn(email, password)

      if (result.error) {
        setMessage(result.error.message)
      } else {
        window.location.href = "/chat"
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unexpected auth error",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div>
        <h1>Sign in</h1>
        <p className="subtitle">
          New user creation is disabled for this app. Ask an admin to add your account via Supabase.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Working…" : "Sign in"}
        </button>
      </form>

      {message ? <p className="message">{message}</p> : null}
    </main>
  )
}
