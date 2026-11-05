import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getValidSession } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getValidSession()
        if (session) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          navigate('/', { replace: true })
        }
      } catch (error) {
        setIsAuthenticated(false)
        navigate('/', { replace: true })
      }
    }

    checkAuth()
  }, [navigate])

  if (isAuthenticated === null) {
    return <div>Loading...</div>
  }

  return isAuthenticated ? <>{children}</> : null
}
