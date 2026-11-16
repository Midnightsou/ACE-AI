const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export const sttSupported = !!SR
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export const STT_LANGS = [
  { id: 'en-NG', label: 'English (Nigeria)' },
  { id: 'en-GB', label: 'English (UK)' },
  { id: 'en-US', label: 'English (US)' },
  { id: 'yo-NG', label: 'Yoruba' },
  { id: 'ha-NG', label: 'Hausa' },
  { id: 'ig-NG', label: 'Igbo' },
]

export function defaultSttLang(language) {
  if (language === 'yoruba') return 'yo-NG'
  if (language === 'hausa') return 'ha-NG'
  return 'en-NG'
}

export const VOICE_PRESETS = [
  { id: 'natural', label: 'Natural', rate: 1, pitch: 1 },
  { id: 'warm', label: 'Warm', rate: 0.95, pitch: 0.9 },
  { id: 'bright', label: 'Bright', rate: 1.05, pitch: 1.2 },
  { id: 'deep', label: 'Deep', rate: 0.9, pitch: 0.7 },
  { id: 'calm', label: 'Calm', rate: 0.85, pitch: 1 },
  { id: 'quick', label: 'Quick', rate: 1.25, pitch: 1 },
]

const KEY = 'ace_voice_settings'

export function loadVoiceSettings() {
  try {
    return { voiceURI: '', presetId: 'natural', rate: 1, sttLang: '', ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { voiceURI: '', presetId: 'natural', rate: 1, sttLang: '' }
  }
}

export function saveVoiceSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage blocked */ }
}

// ── Speech to text ─────────────────────────────────────
export function createRecognizer({ lang, continuous = false, onInterim, onError, onEnd }) {
  if (!SR) return null
  const rec = new SR()
  rec.lang = lang
  rec.continuous = continuous
  rec.interimResults = true
  rec.maxAlternatives = 1

  let finalText = ''
  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript + ' '
      else interim += r[0].transcript
    }
    onInterim?.((finalText + interim).trim())
  }
  rec.onerror = (e) => onError?.(e.error)
  rec.onend = () => onEnd?.(finalText.trim())
  return rec
}

// ── Voices ─────────────────────────────────────────────
let voiceCache = []

export function loadVoices() {
  return new Promise((resolve) => {
    if (!ttsSupported) return resolve([])
    const grab = () => {
      voiceCache = window.speechSynthesis.getVoices()
      return voiceCache
    }
    if (grab().length) return resolve(voiceCache)
    const done = () => resolve(grab())
    window.speechSynthesis.onvoiceschanged = done
    setTimeout(done, 1500)
  })
}

function pickVoice(settings) {
  if (!voiceCache.length) return null
  if (settings.voiceURI) {
    const exact = voiceCache.find((v) => v.voiceURI === settings.voiceURI)
    if (exact) return exact
  }
  return voiceCache.find((v) => v.lang === 'en-NG') ||
    voiceCache.find((v) => v.lang.startsWith('en')) ||
    voiceCache[0]
}

// ── Text prep ──────────────────────────────────────────
export function cleanForSpeech(text) {
  return text
    .split('━━━ Sources ━━━')[0]
    .replace(/```[\s\S]*?```/g, ' code omitted. ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/[*_`#>$\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Returns finished sentences from a streaming buffer plus how much was consumed
export function takeSpeakable(buffer) {
  const re = /[.!?]+["')\]]*\s+|\n+/g
  const sentences = []
  let last = 0
  let m
  while ((m = re.exec(buffer)) !== null) {
    const piece = buffer.slice(last, m.index + m[0].length)
    if (piece.trim().length < 25 && re.lastIndex < buffer.length) continue
    sentences.push(piece)
    last = m.index + m[0].length
  }
  return { sentences, consumed: last }
}

// ── Speaker with queue (avoids Chrome's long-utterance cutoff) ──
export function createSpeaker({ getSettings, onStart, onIdle }) {
  let queue = []
  let busy = false
  let gen = 0

  function next() {
    const myGen = gen
    const text = queue.shift()
    if (!text) {
      busy = false
      onIdle?.()
      return
    }
    busy = true
    const s = getSettings()
    const preset = VOICE_PRESETS.find((p) => p.id === s.presetId) || VOICE_PRESETS[0]
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(s)
    if (voice) { u.voice = voice; u.lang = voice.lang }
    u.rate = preset.rate * (s.rate || 1)
    u.pitch = preset.pitch
    u.onstart = () => { if (myGen === gen) onStart?.() }
    u.onend = () => { if (myGen === gen) next() }
    u.onerror = () => { if (myGen === gen) next() }
    window.speechSynthesis.speak(u)
  }

  return {
    speak(raw) {
      const text = cleanForSpeech(raw)
      if (!text || !ttsSupported) return
      queue.push(text)
      if (!busy) next()
    },
    stop() {
      gen++
      queue = []
      busy = false
      if (ttsSupported) window.speechSynthesis.cancel()
    },
    isBusy: () => busy || queue.length > 0,
  }
}