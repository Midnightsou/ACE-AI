import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AuthLayout, { FieldError, ButtonSpinner, GoogleMark } from '../components/auth/AuthLayout'
import GrimMascot from '../components/GrimMascot'

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await signup(email, password)
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

  return (
    <AuthLayout
      eyebrow="Ace AI"
      title="Create your account"
      subtitle="Start learning smarter today"
      mascot={<GrimMascot mood="happy" size={104} />}
      footer={
        <p className="text-center text-[13.5px] text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline underline-offset-4 decoration-violet-200 transition-colors">
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
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
          placeholder="Min 6 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <FieldError>{error}</FieldError>

        <Button type="submit" disabled={loading}>
          {loading && <ButtonSpinner />}
          {loading ? 'Creating account...' : 'Create account'}
        </Button>

        <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        <Button variant="ghost" onClick={handleGoogle} disabled={loading}>
          {!loading && <GoogleMark />}
          {loading && <ButtonSpinner />}
          Continue with Google
        </Button>
      </form>
    </AuthLayout>
  )
}

function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password is too weak.',
    'auth/network-request-failed': 'No internet connection.',
  }
  return messages[code] || 'Something went wrong. Try again.'
}