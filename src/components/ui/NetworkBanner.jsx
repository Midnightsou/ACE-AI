import { useNetwork } from '../../hooks/useNetwork'

export default function NetworkBanner() {
  const { online, slow } = useNetwork()

  if (online && !slow) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs text-center font-medium
      ${!online
        ? 'bg-red-500 text-white'
        : 'bg-amber-400 text-amber-900'
      }`}
    >
      {!online
        ? ' No internet connection — messages will send when you reconnect'
        : ' Slow connection detected — responses may take longer'
      }
    </div>
  )
}