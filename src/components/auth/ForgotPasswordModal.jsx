import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { FieldError, ButtonSpinner } from './AuthLayout'
import GrimMascot from '../GrimMascot'

export default function ForgotPasswordModal({ forgotPassword, onClose }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(
        err.code === 'auth/network-request-failed'
          ? 'No internet connection.'
          : err.code === 'auth/invalid-email'
            ? 'That email address does not look right.'
            : 'Could not send the reset email. Try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="auth-enter w-full max-w-sm rounded-t-3xl border border-zinc-200 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.3)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reset password"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">Reset password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {sent ? (
          <div className="py-1 text-center">
            <div className="flex justify-center"><GrimMascot mood="celebrate" size={88} /></div>
            <h3 className="mb-1.5 mt-2 text-[16px] font-bold tracking-tight text-zinc-900">Check your email</h3>
            <p className="mb-5 text-[13.5px] leading-relaxed text-zinc-500">
              We sent a reset link to <span className="font-semibold text-zinc-700">{email}</span>. Check spam if you don&apos;t see it.
            </p>
            <Button type="button" onClick={onClose}>Back to login</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <p className="text-[13.5px] leading-relaxed text-zinc-500">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus />
            <FieldError>{error}</FieldError>
            <Button type="submit" disabled={loading}>
              {loading && <ButtonSpinner />}
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
