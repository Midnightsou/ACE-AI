import { useState, useEffect } from 'react'
import { useNetwork } from '../../hooks/useNetwork'

const DISMISSED_KEY = 'ace_network_banner_dismissed'

export default function NetworkBanner() {
  const { online, slow } = useNetwork()
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state when network status changes
  useEffect(() => {
    setDismissed(false)
  }, [online, slow])

  // Also reset on page refresh (sessionStorage clears on refresh)
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY)
    if (wasDismissed) setDismissed(true)
  }, [])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  if ((online && !slow) || dismissed) return null

  return (
    <div className={`flex items-center justify-between px-4 py-2 text-xs font-medium z-50 flex-shrink-0
      ${!online ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'}`}
    >
      <span>
        {!online
          ? ' No internet connection — messages will send when you reconnect'
          : ' Slow connection detected — responses may take longer than usual'
        }
      </span>
      <button
        onClick={handleDismiss}
        className={`ml-4 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-colors
          ${!online ? 'hover:bg-red-400' : 'hover:bg-amber-300'}`}
        aria-label="Dismiss"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}