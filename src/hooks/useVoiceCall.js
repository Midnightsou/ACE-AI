import { useRef, useState, useCallback, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { useChatStore } from '../store/chatStore'
import { useConversationStore } from '../store/conversationStore'
import { streamCompletion, MODELS } from '../services/deepseekClient'
import { buildSystemPrompt } from '../prompts/systemPrompt'
import { reserveMessageSlot, createConversation, saveMessage } from '../services/memory'
import {
  createRecognizer, createSpeaker, takeSpeakable, loadVoices,
  loadVoiceSettings, saveVoiceSettings, defaultSttLang, sttSupported,
} from '../services/voice'

const VOICE_RULES = `

VOICE CALL MODE: You are speaking out loud on a phone call. Reply in 1 to 3 short, natural spoken sentences unless the user asks for detail. No lists, no markdown, no symbols, no URLs. If the user speaks Pidgin, Yoruba or Hausa, answer in the same language.`

export function useVoiceCall() {
  const user = useUserStore((s) => s.user)
  const [status, setStatus] = useState('idle') // idle | listening | thinking | speaking
  const [interim, setInterim] = useState('')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [voices, setVoices] = useState([])
  const [settings, setSettingsState] = useState(loadVoiceSettings)

  const settingsRef = useRef(settings)
  const activeRef = useRef(false)
  const recRef = useRef(null)
  const abortRef = useRef(null)
  const streamDoneRef = useRef(true)
  const speakerRef = useRef(null)
  const listenRef = useRef(() => {})

  useEffect(() => { loadVoices().then(setVoices) }, [])

  const sttLang = settings.sttLang || defaultSttLang(user?.profile?.language)

  useEffect(() => {
    speakerRef.current = createSpeaker({
      getSettings: () => settingsRef.current,
      onStart: () => setStatus('speaking'),
      onIdle: () => {
        if (activeRef.current && streamDoneRef.current) listenRef.current()
      },
    })
  }, [])

  function updateSettings(patch) {
    const merged = { ...settingsRef.current, ...patch }
    settingsRef.current = merged
    setSettingsState(merged)
    saveVoiceSettings(merged)
  }

  const persist = useCallback(async (userText, aiText) => {
    try {
      const uid = user?.uid
      if (!uid) return
      const conv = useConversationStore.getState()
      let convId = conv.activeConversationId
      if (!convId) {
        convId = await createConversation(uid, userText.slice(0, 50))
        conv.setActiveConversationId(convId)
      }
      await saveMessage(uid, convId, { role: 'user', content: userText })
      await saveMessage(uid, convId, { role: 'assistant', content: aiText })
    } catch (err) {
      console.warn('Voice transcript not saved:', err.message)
    }
  }, [user])

  const handleUserText = useCallback(async (text) => {
    setStatus('thinking')
    setInterim('')
    setTranscript(text)
    setReply('')
    const uid = user?.uid
    const speaker = speakerRef.current

    try {
      if (uid) {
        const slot = await reserveMessageSlot(uid)
        if (!slot.allowed) {
          speaker.speak('You have used your free messages for now. Open the app to upgrade or wait for the countdown.')
          activeRef.current = false
          return
        }
      }

      const chat = useChatStore.getState()
      const history = chat.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }))
      abortRef.current = new AbortController()
      streamDoneRef.current = false
      let spokenLen = 0

      const full = await streamCompletion({
        model: MODELS.chat,
        messages: [
          { role: 'system', content: buildSystemPrompt(user?.profile, chat.messages) + VOICE_RULES },
          ...history,
          { role: 'user', content: text },
        ],
        temperature: 0.6,
        maxTokens: 400,
        signal: abortRef.current.signal,
        onChunk: (content) => {
          setReply(content)
          const { sentences, consumed } = takeSpeakable(content.slice(spokenLen))
          sentences.forEach((s) => speaker.speak(s))
          spokenLen += consumed
        },
      })

      const rest = full.slice(spokenLen)
      if (rest.trim()) speaker.speak(rest)

      chat.addMessage({ role: 'user', content: text })
      chat.addMessage({ role: 'assistant', content: full })
      persist(text, full)

      streamDoneRef.current = true
      if (!speaker.isBusy() && activeRef.current) listenRef.current()
    } catch (err) {
      streamDoneRef.current = true
      if (err.name === 'AbortError') return
      setError('Could not reach Ace. Check your connection.')
      if (activeRef.current) setTimeout(() => listenRef.current(), 1200)
    }
  }, [user, persist])

  const listen = useCallback(() => {
    if (!activeRef.current || !sttSupported) return
    setError('')
    setStatus('listening')
    setInterim('')

    const rec = createRecognizer({
      lang: settingsRef.current.sttLang || defaultSttLang(user?.profile?.language),
      onInterim: setInterim,
      onError: (code) => {
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setError('Microphone blocked. Allow mic access in your browser settings.')
          activeRef.current = false
        } else if (code === 'language-not-supported') {
          setError('That language is not supported by your browser. Try English (Nigeria).')
        }
      },
      onEnd: (finalText) => {
        if (!activeRef.current) return
        if (finalText) handleUserText(finalText)
        else setTimeout(() => activeRef.current && listenRef.current(), 300)
      },
    })
    recRef.current = rec
    try { rec.start() } catch { /* already started */ }
  }, [handleUserText, user?.profile?.language])

  useEffect(() => {
    listenRef.current = listen
  }, [listen])

  const start = useCallback(() => {
    if (!sttSupported) {
      setError('Voice input is not supported in this browser. Use Chrome, Edge or Safari.')
      return
    }
    activeRef.current = true
    listen()
  }, [listen])

  // Tap the orb: cut Ace off and talk
  const interrupt = useCallback(() => {
    abortRef.current?.abort()
    speakerRef.current.stop()
    streamDoneRef.current = true
    recRef.current?.abort()
    activeRef.current = true
    setTimeout(listen, 200)
  }, [listen])

  const end = useCallback(() => {
    activeRef.current = false
    abortRef.current?.abort()
    speakerRef.current.stop()
    recRef.current?.abort()
    setStatus('idle')
  }, [])

  const previewVoice = useCallback((text) => {
    speakerRef.current.stop()
    speakerRef.current.speak(text)
  }, [])

  useEffect(() => end, [end])

  return {
    status, interim, transcript, reply, error, voices, settings, sttLang,
    start, end, interrupt, updateSettings, previewVoice,
  }
}