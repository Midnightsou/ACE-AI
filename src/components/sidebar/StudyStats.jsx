import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { getExamCountdown, getCountdownUrgency } from '../../services/streak'
import ExamDateModal from '../ui/ExamDateModal'

export default function StudyStats() {
  const user = useUserStore((s) => s.user)
  const [showModal, setShowModal] = useState(false)

  const profile = user?.profile || {}
  const streak = profile.streak || 0
  const countdown = getExamCountdown(profile.examDate)
  const urgency = getCountdownUrgency(countdown)

  const urgencyColors = {
    critical: 'text-red-400 border-red-800',
    warning: 'text-amber-400 border-amber-800',
    normal: 'text-violet-400 border-violet-800',
  }

  const urgencyBg = {
    critical: 'bg-red-950',
    warning: 'bg-amber-950',
    normal: 'bg-violet-950',
  }

  return (
    <>
      <div className="px-3 py-3 border-t border-zinc-800 flex flex-col gap-2">

        {/* Streak */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <span className="text-lg">🔥</span>
          <div className="flex-1">
            <p className="text-xs text-zinc-400">Study streak</p>
            <p className="text-sm font-semibold text-white">
              {streak} {streak === 1 ? 'day' : 'days'}
            </p>
          </div>
          {streak >= 7 && (
            <span className="text-xs bg-amber-900 text-amber-400 px-2 py-0.5 rounded-lg font-medium">
              🏆 {streak}d
            </span>
          )}
        </div>

        {/* Exam countdown */}
        {countdown ? (
          <button
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-3 px-2 py-2 rounded-xl border ${urgencyColors[urgency]} ${urgencyBg[urgency]} hover:opacity-90 transition-opacity text-left`}
          >
            <span className="text-lg">📅</span>
            <div className="flex-1">
              <p className="text-xs opacity-70">
                {profile.examType || 'Exam'} countdown
              </p>
              <p className="text-sm font-bold">
                {countdown} {countdown === 1 ? 'day' : 'days'} left
              </p>
            </div>
            {urgency === 'critical' && (
              <span className="text-xs font-bold animate-pulse">!</span>
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-left"
          >
            <span className="text-lg">📅</span>
            <div className="flex-1">
              <p className="text-xs text-zinc-400">Set exam date</p>
              <p className="text-xs text-zinc-600">Track your countdown</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        )}
      </div>

      {showModal && <ExamDateModal onClose={() => setShowModal(false)} />}
    </>
  )
}