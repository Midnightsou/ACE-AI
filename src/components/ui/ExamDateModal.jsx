import { useState } from 'react'
import { updateProfile } from '../../services/memory'
import { useUserStore } from '../../store/userStore'

export default function ExamDateModal({ onClose }) {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const [examType, setExamType] = useState('JAMB')
  const [examDate, setExamDate] = useState('')
  const [saving, setSaving] = useState(false)

  const examTypes = ['JAMB', 'WAEC', 'NECO', 'GCE', 'University Exam', 'Other']

  async function handleSave() {
    if (!examDate) return
    setSaving(true)

    const timeout = setTimeout(() => {
      setSaving(false)
      alert('Connection is slow. Check your internet and try again.')
    }, 8000)

    try {
      await updateProfile(user.uid, { examDate, examType })
      setUser({
        ...user,
        profile: { ...user.profile, examDate, examType },
      })
      clearTimeout(timeout)
      onClose()
    } catch (err) {
      clearTimeout(timeout)
      setSaving(false)
      if (err.code === 'unavailable' || err.message?.includes('offline')) {
        alert('No internet connection. Please check your network and try again.')
      } else {
        alert('Failed to save. Try again.')
      }
      console.error('Failed to save exam date:', err)
    }
  }

  async function handleClear() {
    setSaving(true)

    const timeout = setTimeout(() => {
      setSaving(false)
      alert('Connection is slow. Check your internet and try again.')
    }, 8000)

    try {
      await updateProfile(user.uid, { examDate: null, examType: null })
      setUser({
        ...user,
        profile: { ...user.profile, examDate: null, examType: null },
      })
      clearTimeout(timeout)
      onClose()
    } catch (err) {
      clearTimeout(timeout)
      setSaving(false)
      console.error('Failed to clear exam date:', err)
      alert('Failed to clear. Check your connection and try again.')
    }
  }

  // Minimum date is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-base font-semibold text-zinc-900 mb-1">Set exam date</h2>
        <p className="text-sm text-zinc-500 mb-5">
          Ace will show you a countdown and adjust study tips as your exam gets closer.
        </p>

        {/* Exam type */}
        <div className="mb-4">
          <p className="text-xs text-zinc-500 mb-2">Exam type</p>
          <div className="flex flex-wrap gap-2">
            {examTypes.map((type) => (
              <button
                key={type}
                onClick={() => setExamType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${examType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Date picker */}
        <div className="mb-5">
          <p className="text-xs text-zinc-500 mb-2">Exam date</p>
          <input
            type="date"
            value={examDate}
            min={minDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-800 outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          {user?.profile?.examDate && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!examDate || saving}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}