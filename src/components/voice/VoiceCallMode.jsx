import { useEffect, useState } from 'react'
import { useVoiceCall } from '../../hooks/useVoiceCall'
import { VOICE_PRESETS, STT_LANGS } from '../../services/voice'

const LABELS = {
  idle: 'Starting...',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Tap to interrupt',
}

export default function VoiceCallMode({ onClose }) {
  const call = useVoiceCall()
  const [showVoices, setShowVoices] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    call.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEnd() {
    call.end()
    onClose()
  }

  const visible = call.voices.filter((v) =>
    showAll || /^(en|yo|ha|ig)/i.test(v.lang)
  )

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm text-zinc-400">Voice call</p>
        <button
          onClick={() => setShowVoices((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
        >
          Voices
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        <button
          onClick={call.interrupt}
          className={`relative w-44 h-44 rounded-full ${call.status !== 'idle' ? 'animate-pulse' : ''}`}
          style={{
            background: 'radial-gradient(circle at 35% 30%, #7eaeff, #2952c4 55%, #0b1b4d)',
            boxShadow: call.status === 'listening'
              ? '0 0 80px 20px rgba(80,130,255,0.55)'
              : '0 0 50px 10px rgba(60,100,220,0.35)',
          }}
          aria-label="Tap to interrupt and speak"
        />

        <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900/80 p-4 shadow-lg">
          <div className="max-h-56 overflow-y-auto space-y-4 text-left">
            {(call.transcript || call.interim) && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">You</p>
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {call.status === 'listening' && call.interim
                    ? call.interim
                    : call.transcript}
                </p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-300 mb-1">
                {call.status === 'thinking' && <span aria-hidden="true">💭</span>}
                <span>{LABELS[call.status]}</span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {call.status === 'thinking' && !call.reply
                  ? 'Ace is thinking…'
                  : call.reply || (call.status === 'listening' ? 'I’m listening for you…' : '')}
              </p>
            </div>
            {call.error && <p className="text-sm text-red-400">{call.error}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center pb-10">
        <button
          onClick={handleEnd}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
          aria-label="End call"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showVoices && (
        <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold">Choose a voice</p>
            <button onClick={() => setShowVoices(false)} className="text-sm text-zinc-400">Done</button>
          </div>

          <p className="text-xs text-zinc-500 mb-2">Style</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {VOICE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => { call.updateSettings({ presetId: p.id }); call.previewVoice('Hello, this is how I sound.') }}
                className={`px-3 py-1.5 rounded-full text-xs ${call.settings.presetId === p.id ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-300'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-zinc-500 mb-2">Speed {call.settings.rate.toFixed(1)}x</p>
          <input
            type="range" min="0.6" max="1.6" step="0.1"
            value={call.settings.rate}
            onChange={(e) => call.updateSettings({ rate: Number(e.target.value) })}
            className="w-full mb-4"
          />

          <p className="text-xs text-zinc-500 mb-2">I will understand you in</p>
          <select
            value={call.sttLang}
            onChange={(e) => call.updateSettings({ sttLang: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm mb-4"
          >
            {STT_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-500">Voices on this device ({visible.length})</p>
            <button onClick={() => setShowAll((v) => !v)} className="text-xs text-blue-400">
              {showAll ? 'Show relevant only' : 'Show all languages'}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {visible.map((v) => (
              <button
                key={v.voiceURI}
                onClick={() => { call.updateSettings({ voiceURI: v.voiceURI }); call.previewVoice('Hello, how can I help you today?') }}
                className={`text-left px-3 py-2.5 rounded-xl text-sm flex justify-between ${call.settings.voiceURI === v.voiceURI ? 'bg-blue-600/20 border border-blue-500' : 'bg-zinc-900'}`}
              >
                <span>{v.name}</span>
                <span className="text-zinc-500 text-xs">{v.lang}</span>
              </button>
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-zinc-500">No voices found. On Android and iPhone you get many; on Linux desktops you may only see a few.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}