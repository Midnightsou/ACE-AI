import {
  lazy,
  Suspense,
} from 'react'

import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { useUserStore } from './store/userStore'

import { tourDone } from './components/onboarding/tour'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

const ChatPage =
  lazy(() =>
    import('./pages/ChatPage')
  )

const ToolsPage =
  lazy(() =>
    import('./pages/ToolsPage')
  )

const ProfilePage =
  lazy(() =>
    import('./pages/ProfilePage')
  )

const PricingPage =
  lazy(() =>
    import('./pages/PricingPage')
  )

const OnboardingFlow =
  lazy(() =>
    import(
      './components/onboarding/OnboardingFlow'
    )
  )

const ToolPage =
  lazy(() =>
    import('./pages/ToolPage')
  )

const SharedConversationPage =
  lazy(() =>
    import(
      './pages/SharedConversationPage'
    )
  )

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="w-7 h-7 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const user = useUserStore((s) => s.user)
  const loading = useUserStore((s) => s.loading)

  if (loading) {
    return <Spinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!tourDone() && window.location.pathname === '/chat') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default function AppRouter() {
  return (
    <Suspense
      fallback={<Spinner />}
    >
      <Routes>

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/signup"
          element={
            <SignupPage />
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingFlow />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <ToolsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tool/:toolId"
          element={
            <ProtectedRoute>
              <ToolPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/share/:shareId"
          element={
            <SharedConversationPage />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/chat"
              replace
            />
          }
        />

      </Routes>
    </Suspense>
  )
}