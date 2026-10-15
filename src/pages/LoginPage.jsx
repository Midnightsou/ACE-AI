import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AuthLayout, { FieldError, ButtonSpinner, GoogleMark } from '../components/auth/AuthLayout'
import GrimMascot from '../components/GrimMascot'

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

  function closeForgot() {
    setShowForgot(false)
    setForgotSent(false)
    setForgotError('')
    setForgotEmail('')
  }

  return (
    <AuthLayout
      eyebrow="Ace AI"
      title="Welcome back"
      subtitle="Your personal tutor is waiting"
      mascot={<GrimMascot mood="welcome" size={104} />}
      footer={
        <div className="flex flex-col items-center gap-2.5 text-center">
          <button
            onClick={() => setShowForgot(true)}
            className="text-[13.5px] font-semibold text-violet-600 hover:text-violet-700 hover:underline underline-offset-4 decoration-violet-200 transition-colors"
          >
            Forgot password?
          </button>
          <p className="text-[13.5px] text-zinc-500">
            No account?{' '}
            <Link to="/signup" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline underline-offset-4 decoration-violet-200 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
        <Button variant="ghost" onClick={handleGoogle} disabled={loading}>
          {!loading && <GoogleMark />}
          {loading && <ButtonSpinner />}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <FieldError>{error}</FieldError>

        <Button type="submit" disabled={loading}>
          {loading && <ButtonSpinner />}
          {loading ? 'Logging in...' : 'Log in'}
        </Button>

      </form>

      {showForgot && (
        <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50" onClick={closeForgot}>
          <div
            className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-sm shadow-[0_24px_64px_-16px_rgba(0,0,0,0.3)] auth-enter"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Reset Password"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">Reset Password</h2>
              <button
                onClick={closeForgot}
                aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-1">
                <div className="w-12 h-12 bg-emerald-50 ring-1 ring-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-bold tracking-tight text-zinc-900 mb-1.5">Check your email</h3>
                <p className="text-[13.5px] leading-relaxed text-zinc-500 mb-5">
                  We&apos;ve sent a password reset link to <span className="font-semibold text-zinc-700">{forgotEmail}</span>
                </p>
                <Button onClick={closeForgot}>
                  Back to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4" noValidate>
                <p className="text-[13.5px] leading-relaxed text-zinc-500">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                <Input
                  label="Email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                />

                <FieldError>{forgotError}</FieldError>

                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading && <ButtonSpinner />}
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
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
