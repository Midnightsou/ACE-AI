import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AuthLayout, { FieldError, ButtonSpinner, GoogleMark } from '../components/auth/AuthLayout'
import GrimMascot from '../components/GrimMascot'
import { authMessage, isSilent } from '../lib/authErrors'

// Phone keyboards: no auto-capital, no autocorrect on emails
const emailProps = { inputMode: 'email', autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }

export default function SignupPage() {
  const { user, signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [done, setDone] = useState(false)
  const loading = busy !== null || done
  const mismatch = confirm.length > 0 && confirm !== password
  const mood = done ? 'celebrate' : error ? 'oops' : busy ? 'think' : 'happy'

  // Already signed in (e.g. back-button after Google redirect): skip the form.
  if (user && !done) return <Navigate to="/chat" replace />
  const finish = () => {
    setDone(true)
    setTimeout(() => navigate('/chat', { replace: true }), 1100)
  }
  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy('email')
    try {
      await signup(email.trim(), password)
      finish()
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
      finish()
    } catch (err) {
      if (!isSilent(err.code)) setError(authMessage(err.code))
    } finally {
      setBusy(null)
    }
  }
  const linkCls = 'font-semibold text-violet-600 hover:text-violet-700 hover:underline underline-offset-4 decoration-violet-200 transition-colors'
  return (
    <AuthLayout eyebrow="Ace AI" title={done ? "You're in!" : 'Create your account'} subtitle={done ? 'Taking you to Ace...' : 'Free to start. Takes under a minute.'} mascot={<GrimMascot mood={mood} size={104} />} footer={<p className="text-center text-[13.5px] text-zinc-500">Already have an account? <Link to="/login" className={linkCls}>Log in</Link></p>}>
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
        <form onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required {...emailProps} />
          <Input label="Password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required hidePasswordToggle />
          <Input label="Confirm password" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" autoComplete="new-password" required hidePasswordToggle />
          {mismatch && <p className="text-[12.5px] text-amber-600" role="status">Passwords don't match yet.</p>}
          <label className="flex min-h-11 items-center gap-2.5 text-[13.5px] text-zinc-500">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-violet-600" />
            Show passwords
          </label>
          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={loading}>
            {busy === 'email' && <ButtonSpinner />}
            {busy === 'email' ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
