// SplashLoader.jsx - replaces the plain spinner in router.jsx and AuthProvider.jsx.
// If loading drags on (slow networks, Firestore cold start), it says so.
import { useEffect, useState } from 'react'
import GrimMascot from './GrimMascot'

export default function SplashLoader({ label = 'Loading Ace...' }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <div>
        <GrimMascot mood={slow ? 'oops' : 'happy'} size={112} />
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {slow ? 'Slow connection. Still trying...' : label}
      </p>
      {slow && (
        <button onClick={() => window.location.reload()} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
          Reload
        </button>
      )}
    </div>
  )
}
