import { useState } from 'react'
import { useNetwork } from '../../hooks/useNetwork'

const DISMISSED_KEY = 'ace_network_banner_dismissed'

export default function NetworkBanner() {
  const { online, slow } = useNetwork()
  const [dismissedStatus, setDismissedStatus] = useState(() => {
    const stored = sessionStorage.getItem(DISMISSED_KEY)
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  })

  // If currently online and not slow, no banner needed
  if (online && !slow) return null

  // If the current status matches the dismissed status, don't show
  if (dismissedStatus && dismissedStatus.online === online && dismissedStatus.slow === slow) return null

  function handleDismiss() {
    const status = { online, slow }
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(status))
    setDismissedStatus(status)
  }

  return (
    <div
      id="network-banner"
      className={`flex items-center justify-between px-4 py-2 text-xs font-medium z-50 flex-shrink-0
        ${!online ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'}`}
    >
      <span>
        {!online
          ? ' No internet — messages will send when you reconnect'
          : ' Slow connection — responses may take longer'
        }
      </span>
      <button
        onClick={handleDismiss}
        className={`ml-4 w-5 h-5 flex items-center justify-center rounded-full
          ${!online ? 'hover:bg-red-400' : 'hover:bg-amber-300'}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}