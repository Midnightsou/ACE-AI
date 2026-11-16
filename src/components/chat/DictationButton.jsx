import { useRef, useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { createRecognizer, defaultSttLang, loadVoiceSettings, sttSupported } from '../../services/voice'

export default function DictationButton({ value, onChange, disabled }) {
  const language = useUserStore((s) => s.user?.profile?.language)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  if (!sttSupported) return null

  function toggle() {
    if (listening) {
      recRef.current?.stop()
      return
    }
    const base = value ? value.trim() + ' ' : ''
    const lang = loadVoiceSettings().sttLang || defaultSttLang(language)

    const rec = createRecognizer({
      lang,
      continuous: true,
      onInterim: (text) => onChange(base + text),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    })
    recRef.current = rec
    setListening(true)
    try { rec.start() } catch { setListening(false) }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop dictation' : 'Dictate'}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 mb-1
        ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-zinc-400 hover:text-violet-600'}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0014 0M12 18v4" />
      </svg>
    </button>
  )
}