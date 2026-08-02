import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  loading: (
    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
  ),
}

const BG = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  loading: 'bg-violet-50 border-violet-200',
}

const TEXT = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
  loading: 'text-violet-800',
}

// Export the hook separately to fix react-refresh warning
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timerRef = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timerRef.current[id])
  }, [])

  const showToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
    if (duration > 0) {
      timerRef.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  // Build the toast API as a plain object — no mutation
  const toast = {
    show: showToast,
    success: (message, opts) => showToast({ message, type: 'success', ...opts }),
    error: (message, opts) => showToast({ message, type: 'error', duration: 5000, ...opts }),
    info: (message, opts) => showToast({ message, type: 'info', ...opts }),
    loading: (message) => showToast({ message, type: 'loading', duration: 0 }),
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg w-full pointer-events-auto ${BG[t.type]}`}
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <span className="flex-shrink-0">{ICONS[t.type]}</span>
            <p className={`text-sm font-medium flex-1 ${TEXT[t.type]}`}>{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-zinc-400 hover:text-zinc-600 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}