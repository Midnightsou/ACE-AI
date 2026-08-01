import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useEmailStore } from '../../store/emailStore'
import { useToolSession } from '../../hooks/useToolSession'
import ToolLayout from './ToolLayout'
import EmailPreview from './EmailPreview'
import {
  buildEmailPrompt,
  toneOptions,
  lengthOptions,
  recipientTypes,
  purposeTemplates,
} from '../../prompts/tools/emailPrompt'
import { streamCompletion, MODELS } from '../../services/deepseekClient'

const CHAT_SUGGESTIONS = [
  'Make it shorter',
  'Make it more formal',
  'Make it friendlier',
  'Strengthen the opening',
  'Make the ask clearer',
  'Add more urgency',
]

export default function EmailComposer() {
  const location = useLocation()
  const { form, output, liveOutput, updateForm, setOutput, setLiveOutput, reset } = useEmailStore()
  const { saveSession, loadSession, restoring, resetSession } = useToolSession('email-composer', 'Email Composer', '📧')

  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Chat refinement
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const currentEmail = liveOutput || output
  const canGenerate = form.purpose.trim() && form.keyPoints.trim()

  // Restore session from Recent click
  useEffect(() => {
    const sid = location.state?.sessionId
    if (!sid) return
    loadSession(sid).then((saved) => {
      if (!saved) return
      if (saved.form) {
        Object.entries(saved.form).forEach(([k, v]) => updateForm(k, v))
      }
      if (saved.output) {
        setOutput(saved.output)
        setLiveOutput(saved.output)
      }
      if (saved.chatMessages) {
        setChatMessages(saved.chatMessages)
      }
    })
  }, [location.state?.sessionId, loadSession, setLiveOutput, setOutput, updateForm])

  async function handleGenerate() {
    setLoading(true)
    setStreaming(true)
    setError(null)
    setLiveOutput('')

    try {
      const { system, user: userPrompt } = buildEmailPrompt(form)
      let fullContent = ''

      await streamCompletion({
        model: MODELS.chat,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        maxTokens: 1500,
        onChunk: (content) => {
          fullContent = content
          setLiveOutput(content)
        },
      })

      setOutput(fullContent)
      setLiveOutput(fullContent)
      setStreaming(false)

      // Save to Firestore
      const state = { form, output: fullContent, chatMessages }
      const title = `Email — ${form.purpose.slice(0, 40)}`
      await saveSession(state, title)

    } catch (err) {
      setError('Failed to generate. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading || !currentEmail) return

    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      const systemPrompt = `You are an expert email writer. The user wants to refine this email:

---
${currentEmail}
---

When asked for changes, return the COMPLETE updated email with changes applied.
Keep the SUBJECT: format on the first line. Plain text only.`

      let fullContent = ''

      await streamCompletion({
        model: MODELS.chat,
        messages: [
          { role: 'system', content: systemPrompt },
          ...newMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        maxTokens: 1000,
        onChunk: (content) => {
          fullContent = content
          setLiveOutput(content)
        },
      })

      setOutput(fullContent)
      const finalMessages = [...newMessages, { role: 'assistant', content: '✓ Email updated.' }]
      setChatMessages(finalMessages)

      // Update saved session
      const state = { form, output: fullContent, chatMessages: finalMessages }
      const title = `Email — ${form.purpose.slice(0, 40)}`
      await saveSession(state, title)

    } catch (err) {
      console.error(err)
    } finally {
      setChatLoading(false)
    }
  }

  function handleReset() {
    reset()
    setChatMessages([])
    setChatInput('')
    resetSession()
  }

  return (
    <ToolLayout tool={{ id: 'email-composer', name: 'Email Composer', icon: '📧' }}>
      {restoring && (
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border-b border-violet-100 text-xs text-violet-600">
          <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Restoring your session...
        </div>
      )}
      <div className="flex h-full">

        {/* Left — form */}
        <div className="w-full md:w-96 flex-shrink-0 flex flex-col border-r border-zinc-100 overflow-y-auto bg-white"
          style={{ maxHeight: 'calc(100dvh - 57px)' }}
        >
          <div className="flex flex-col gap-5 p-5">

            {/* Purpose */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Purpose
              </label>
              <textarea
                value={form.purpose}
                onChange={(e) => updateForm('purpose', e.target.value)}
                placeholder="e.g. Follow up on a job application sent last week"
                rows={2}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {purposeTemplates.map((p) => (
                  <button
                    key={p}
                    onClick={() => updateForm('purpose', p)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors
                      ${form.purpose === p ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Key points */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Key points</label>
              <textarea
                value={form.keyPoints}
                onChange={(e) => updateForm('keyPoints', e.target.value)}
                placeholder="- Main point 1&#10;- Main point 2&#10;- Main point 3"
                rows={5}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Your name</label>
                <input type="text" value={form.senderName} onChange={(e) => updateForm('senderName', e.target.value)}
                  placeholder="e.g. Emeka"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Recipient name</label>
                <input type="text" value={form.recipientName} onChange={(e) => updateForm('recipientName', e.target.value)}
                  placeholder="e.g. Mr. Johnson"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>

            {/* Recipient type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Recipient type</label>
              <div className="flex flex-wrap gap-1.5">
                {recipientTypes.map((r) => (
                  <button key={r} onClick={() => updateForm('recipientType', r)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl transition-colors
                      ${form.recipientType === r ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {toneOptions.map((t) => (
                  <button key={t.id} onClick={() => updateForm('tone', t.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors
                      ${form.tone === t.id ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Length</label>
              <div className="flex gap-2">
                {lengthOptions.map((l) => (
                  <button key={l.id} onClick={() => updateForm('length', l.id)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all text-center
                      ${form.length === l.id ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-zinc-200 text-zinc-600 hover:border-violet-300'}`}>
                    <p className="font-semibold">{l.label}</p>
                    <p className="text-zinc-400 font-normal mt-0.5">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Additional context <span className="text-zinc-400 normal-case">(optional)</span>
              </label>
              <textarea value={form.context} onChange={(e) => updateForm('context', e.target.value)}
                placeholder="Any extra details Ace should know..."
                rows={2}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none" />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            <button onClick={handleGenerate} disabled={loading || !canGenerate}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Writing...</>
              ) : (
                <>✨ {currentEmail ? 'Regenerate' : 'Write email'}</>
              )}
            </button>

            {currentEmail && (
              <button onClick={handleReset} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center">
                Start over
              </button>
            )}

            {/* Chat refinement */}
            {currentEmail && !streaming && (
              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-violet-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-700">Refine with Ace</p>
                </div>

                {chatMessages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => setChatInput(s)}
                        className="text-xs px-2.5 py-1.5 bg-zinc-100 hover:bg-violet-50 hover:text-violet-700 text-zinc-600 rounded-lg transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {chatMessages.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed
                          ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-zinc-100 text-zinc-700 rounded-tl-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-100 px-3 py-2 rounded-xl flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-violet-400 transition-colors">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend() }}
                    placeholder="Ask Ace to tweak the email..."
                    disabled={chatLoading}
                    className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 outline-none disabled:opacity-50" />
                  <button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()}
                    className="w-6 h-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — preview */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden" style={{ maxHeight: 'calc(100dvh - 57px)' }}>
          <EmailPreview
            content={currentEmail}
            streaming={streaming}
            recipientName={form.recipientName}
            senderName={form.senderName}
          />
        </div>
      </div>
    </ToolLayout>
  )
}