import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useUserStore } from './store/userStore'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ChatPage from './pages/ChatPage'
import ToolPage from './pages/ToolPage'
import ToolsPage from './pages/ToolsPage'
import ProfilePage from './pages/ProfilePage'
import OnboardingFlow from './components/onboarding/OnboardingFlow'


function ProtectedRoute({ children }) {
  const { user: authUser, loading } = useAuth()
  const user = useUserStore((s) => s.user)
  const location = useLocation()

  if (loading) return null
  if (!authUser) return <Navigate to="/login" replace />
  if (!user?.profile?.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  if (user?.profile?.onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/chat" replace />
  }

  return children
}

 
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
      <Route path="/tool/:toolId" element={<ProtectedRoute><ToolPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}