import {
  lazy,
  Suspense,
} from 'react'

import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'

import { useUserStore } from './store/userStore'

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
  const user =
    useUserStore(
      (s) => s.user
    )

  const loading =
    useUserStore(
      (s) => s.loading
    )

  const location =
    useLocation()

  if (loading) {
    return <Spinner />
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  /*
   If Firestore temporarily fails but the user
   is authenticated, don't immediately force them
   into onboarding.

   The app can retry profile loading on the next
   refresh instead of creating an onboarding loop.
  */

  if (!user.profile) {
    return children
  }

  const isOnboardingRoute =
    location.pathname ===
    '/onboarding'

  const isOnboarded =
    user.profile.onboarded ===
    true

  // Account has NOT completed onboarding
  if (
    !isOnboarded &&
    !isOnboardingRoute
  ) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    )
  }

  // Account has ALREADY completed onboarding
  if (
    isOnboarded &&
    isOnboardingRoute
  ) {
    return (
      <Navigate
        to="/chat"
        replace
      />
    )
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