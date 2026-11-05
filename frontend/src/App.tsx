import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/Dashboard'
import ChatThreadPage from './pages/ChatThread'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/chat" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/chat/:threadId" element={<ProtectedRoute><ChatThreadPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App