import { useNavigate } from 'react-router-dom'

export default function UpgradePrompt({ message, feature, onClose }) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">

        {/* Top bar */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-5">
          <p className="text-white font-bold text-lg">Upgrade to Pro</p>
          <p className="text-violet-200 text-sm mt-1">Unlock the full power of Ace</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-zinc-600 leading-relaxed">{message}</p>

          {/* Quick feature highlights */}
          <div className="flex flex-col gap-2">
            {[
              '200 messages per day',
              'All languages — Pidgin, Yoruba, Hausa',
              'Unlimited tool generations',
              'PDF export for CV and Cover Letter',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-zinc-700">
                <svg className="w-4 h-4 text-violet-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {f}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => { navigate('/pricing'); onClose?.() }}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              See plans — from ₦2,500/month
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-zinc-400 text-sm hover:text-zinc-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}