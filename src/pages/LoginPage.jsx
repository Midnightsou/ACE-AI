import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AuthLayout, { FieldError, ButtonSpinner, GoogleMark } from '../components/auth/AuthLayout'
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal'
import GrimMascot from '../components/GrimMascot'
import { authMessage, isSilent } from '../lib/authErrors'

const emailProps = { inputMode: 'email', autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }

export default function LoginPage() {
  const { user, login, loginWithGoogle, forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [showForgot, setShowForgot] = useState(false)
  const loading = busy !== null
  const mood = error ? 'oops' : busy ? 'think' : 'welcome'
  if (user) return <Navigate to="/chat" replace />
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setBusy('email')
    try {
      await login(email.trim(), password)
      navigate('/chat')
    } catch (err) {
      setError(authMessage(err.code))
    } finally {
      setBusy(null)
    }
  }
  async function handleGoogle() {
    setError('')
    setBusy('google')
    try {
      await loginWithGoogle()
      navigate('/chat')
    } catch (err) {
      if (!isSilent(err.code)) setError(authMessage(err.code))
    } finally {
      setBusy(null)
    }
  }
  const linkCls = 'font-semibold text-violet-600 hover:text-violet-700 hover:underline underline-offset-4 decoration-violet-200 transition-colors'
  return (
    <AuthLayout eyebrow="Ace AI" title="Welcome back" subtitle="Log in to pick up where you left off" mascot={<GrimMascot mood={mood} size={104} />} footer={<p className="text-center text-[13.5px] text-zinc-500">No account? <Link to="/signup" className={linkCls}>Sign up free</Link></p>}>
      <div className="flex flex-col gap-4">
        <Button type="button" variant="ghost" onClick={handleGoogle} disabled={loading}>
          {busy === 'google' ? <ButtonSpinner /> : <GoogleMark />}
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">or use email</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required {...emailProps} />
          <Input label="Password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" autoComplete="current-password" required hidePasswordToggle />
          <div className="flex items-center justify-between">
            <label className="flex min-h-11 items-center gap-2.5 text-[13.5px] text-zinc-500">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-violet-600" />
              Show password
            </label>
            <button type="button" onClick={() => setShowForgot(true)} className={`min-h-11 text-[13.5px] ${linkCls}`}>Forgot password?</button>
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={loading}>
            {busy === 'email' && <ButtonSpinner />}
            {busy === 'email' ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
      </div>
      {showForgot && <ForgotPasswordModal forgotPassword={forgotPassword} onClose={() => setShowForgot(false)} />}
    </AuthLayout>
  )
}
