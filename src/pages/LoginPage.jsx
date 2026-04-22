import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const { login, loginWithGoogle, forgotPassword } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/chat')
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/chat')
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotError('')
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotSent(true)
    } catch (err) {
      setForgotError(
        err.code === 'auth/user-not-found'
          ? 'No account with that email.'
          : 'Failed to send reset email. Try again.'
      )
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Your personal tutor is waiting</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400">or</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          <Button variant="ghost" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          <button
            onClick={() => setShowForgot(true)}
            className="text-violet-600 font-medium hover:underline"
          >
            Forgot password?
          </button>
        </p>

        <p className="text-center text-sm text-zinc-500 mt-4">
          No account?{' '}
          <Link to="/signup" className="text-violet-600 font-medium hover:underline">
            Sign up free
          </Link>
        </p>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">Reset Password</h2>
                <button
                  onClick={() => {
                    setShowForgot(false)
                    setForgotSent(false)
                    setForgotError('')
                    setForgotEmail('')
                  }}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {forgotSent ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22,4 12,14.01 9,11.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">Check your email</h3>
                  <p className="text-sm text-zinc-600 mb-4">
                    We've sent a password reset link to {forgotEmail}
                  </p>
                  <Button onClick={() => {
                    setShowForgot(false)
                    setForgotSent(false)
                    setForgotEmail('')
                  }}>
                    Back to login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <p className="text-sm text-zinc-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <Input
                    label="Email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />

                  {forgotError && (
                    <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{forgotError}</p>
                  )}

                  <Button type="submit" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function getErrorMessage(code) {
  const messages = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email.',
    'auth/wrong-password': 'Wrong password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'No internet connection.',
  }
  return messages[code] || 'Something went wrong. Try again.'
}