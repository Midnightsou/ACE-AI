import { useState, useEffect } from 'react'
import { useUserStore } from '../../store/userStore'
import { getAllDrillStats, calculateReadiness } from '../../services/drill'

const subjectColors = {
  Mathematics: 'bg-blue-500',
  English: 'bg-violet-500',
  Physics: 'bg-cyan-500',
  Chemistry: 'bg-green-500',
  Biology: 'bg-emerald-500',
  Economics: 'bg-amber-500',
  Government: 'bg-orange-500',
  Literature: 'bg-pink-500',
  Geography: 'bg-teal-500',
}

function ReadinessBar({ subject, score }) {
  const color = subjectColors[subject] || 'bg-violet-500'

  const barColor =
    score >= 70 ? 'bg-green-500' :
    score >= 40 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 truncate">{subject}</span>
        <span className={`text-xs font-bold ${
          score >= 70 ? 'text-green-400' :
          score >= 40 ? 'text-amber-400' :
          'text-red-400'
        }`}>
          {score}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function ReadinessScore() {
  const user = useUserStore((s) => s.user)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    getAllDrillStats(user.uid)
      .then((results) => {
        const withScores = results.map((r) => ({
          subject: r.subject,
          score: calculateReadiness(r.stats),
          total: r.stats.totalQuestions,
        }))
        setStats(withScores)
      })
      .catch((err) => console.error('Failed to load readiness:', err))
      .finally(() => setLoading(false))
  }, [user?.uid])

  if (loading || stats.length === 0) return null

  // Overall average
  const overall = Math.round(
    stats.reduce((sum, s) => sum + s.score, 0) / stats.length
  )

  const overallColor =
    overall >= 70 ? 'text-green-400' :
    overall >= 40 ? 'text-amber-400' :
    'text-red-400'

  const displayStats = expanded ? stats : stats.slice(0, 3)

  return (
    <div className="px-3 py-3 border-t border-zinc-800">

      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="text-xs text-zinc-400">Readiness score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${overallColor}`}>
            {overall}%
          </span>
          <svg
            width="12" height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71717a"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Score bars */}
      <div className="flex flex-col gap-2.5">
        {displayStats.map((s) => (
          <ReadinessBar key={s.subject} subject={s.subject} score={s.score} />
        ))}
      </div>

      {/* Show more/less */}
      {stats.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? 'Show less' : `+${stats.length - 3} more subjects`}
        </button>
      )}

      {/* Encouragement message */}
      {overall > 0 && (
        <p className="text-xs text-zinc-600 mt-3 leading-relaxed">
          {overall >= 70
            ? 'You are well prepared. Keep it up!'
            : overall >= 40
            ? 'Good progress. Keep drilling to improve.'
            : 'Keep practicing — you will get there.'}
        </p>
      )}
    </div>
  )
}