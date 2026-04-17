import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserStore } from '../store/userStore'
import { updateProfile } from '../services/memory'
import Sidebar from '../components/sidebar/Sidebar'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '../services/firebase'

const languages = [
  { code: 'english', label: 'English', flag: '🇬🇧' },
  { code: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
  { code: 'yoruba', label: 'Yoruba', flag: '🟢' },
  { code: 'hausa', label: 'Hausa', flag: '🔵' },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [name, setName] = useState(user?.profile?.name || '')
  const [language, setLanguage] = useState(user?.profile?.language || 'english')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateProfile(user.uid, { name, language })
      setUser({
        ...user,
        profile: { ...user.profile, name, language },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError('Failed to save. Check your connection.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange() {
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect.')
      } else {
        setPasswordError('Failed to update password. Try again.')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="flex" style={{ height: '100dvh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 bg-zinc-50">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 bg-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-500 hover:text-zinc-800 transition-colors md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-zinc-400 hover:text-zinc-700 transition-colors hidden md:block"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <p className="text-base font-bold text-zinc-900">Profile</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-5 py-8 flex flex-col gap-6">

            {/* Avatar + basic info */}
            <div className="flex flex-col items-center gap-4 py-6 bg-white rounded-2xl border border-zinc-100 shadow-sm">
              <div className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-900 text-lg">
                  {user?.profile?.name || 'User'}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">{user?.email}</p>
                <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium
                  ${user?.profile?.isPro
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {user?.profile?.isPro ? '⭐ Pro' : 'Free plan'}
                </span>
              </div>
            </div>

            {/* Edit profile */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-50">
                <p className="text-sm font-semibold text-zinc-800">Edit profile</p>
              </div>
              <div className="p-5 flex flex-col gap-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">Display name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-zinc-100 rounded-xl text-sm text-zinc-400 bg-zinc-50 cursor-not-allowed"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Saved
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-50">
                <p className="text-sm font-semibold text-zinc-800">Change password</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {[
                  { label: 'Current password', value: currentPassword, set: setCurrentPassword },
                  { label: 'New password', value: newPassword, set: setNewPassword },
                  { label: 'Confirm new password', value: confirmPassword, set: setConfirmPassword },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-500">{label}</label>
                    <input
                      type="password"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                ))}

                {passwordError && (
                  <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{passwordError}</p>
                )}

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {passwordSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : passwordSaved ? (
                    '✓ Password updated'
                  ) : (
                    'Update password'
                  )}
                </button>
              </div>
            </div>

            {/* Language preference */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-50">
                <p className="text-sm font-semibold text-zinc-800">Language preference</p>
                <p className="text-xs text-zinc-400 mt-0.5">Ace will communicate in your chosen language</p>
              </div>
              <div className="p-5 flex flex-col gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all text-left
                      ${language === lang.code
                        ? 'border-violet-400 bg-violet-50 text-violet-700'
                        : 'border-zinc-200 text-zinc-600 hover:border-violet-300'
                      }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-xs text-violet-500 font-medium">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Account stats */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-50">
                <p className="text-sm font-semibold text-zinc-800">Account</p>
              </div>
              <div className="divide-y divide-zinc-50">
                {[
                  { label: 'Member since', value: user?.profile?.createdAt ? new Date(user.profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown' },
                  { label: 'Plan', value: user?.profile?.isPro ? 'Pro' : 'Free' },
                  { label: 'User ID', value: user?.uid?.slice(0, 12) + '...' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-zinc-500">{label}</span>
                    <span className="text-sm font-medium text-zinc-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-50">
                <p className="text-sm font-semibold text-zinc-800">Account actions</p>
              </div>
              <div className="p-5">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Log out
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}