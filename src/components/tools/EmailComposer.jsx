import { useRef } from 'react'
import { useEmailStore } from '../../store/emailStore'
import { useTool } from '../../hooks/useTool'
import { useEmailChat } from '../../hooks/useEmailChat'
import ToolLayout from './ToolLayout'
import EmailPreview from './EmailPreview'
import {
  buildEmailPrompt,
  toneOptions,
  lengthOptions,
  recipientTypes,
  purposeTemplates,
} from '../../prompts/tools/emailPrompt'
import { getToolById } from '../../tools/registry'
import { saveToolSession } from '../../services/memory'
import { useUserStore } from '../../store/userStore'

const tool = getToolById('email-composer')

const CHAT_SUGGESTIONS = [
  'Make it shorter',
  'Make it more formal',
  'Make it friendlier',
  'Strengthen the opening',
  'Make the ask clearer',
  'Add more urgency',
]

export default function EmailComposer() {
  const {
    form, updateForm,
    output, setOutput,
    liveOutput, setLiveOutput,
    reset,
  } = useEmailStore()

  const { streaming, loading, error, generate } = useTool('email-composer')
  const user = useUserStore((s) => s.user)
  const chat = useEmailChat((updated) => setLiveOutput(updated))

  async function handleGenerate() {
    const { system, user: userPrompt } = buildEmailPrompt(form)
    const result = await generate(system, userPrompt, {
      purpose: form.purpose,
      recipientType: form.recipientType,
    })
    if (result) {
      setOutput(result)
      setLiveOutput(result)
      if (user?.uid) {
        saveToolSession(
          user.uid,
          'email-composer',
          'Email Composer',
          `Email — ${form.purpose.slice(0, 40)}`,
          '📧'
        ).catch(() => {})
      }
    }
  }

  function handleReset() {
    reset()
    chat.reset()
  }

  const currentEmail = liveOutput || output
  const canGenerate = form.purpose.trim() && form.keyPoints.trim()

  return (
    <ToolLayout tool={tool}>
      <div className="flex h-full">

        {/* ── Left panel — form ── */}
        <div
          className="w-full md:w-96 flex-shrink-0 flex flex-col border-r border-zinc-100 overflow-y-auto bg-white"
          style={{ maxHeight: 'calc(100dvh - 57px)' }}
        >
          <div className="flex flex-col gap-5 p-5">

            {/* Purpose */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Purpose
                <span className="ml-1 normal-case text-zinc-400">— what is this email for?</span>
              </label>
              <textarea
                value={form.purpose}
                onChange={(e) => updateForm('purpose', e.target.value)}
                placeholder="e.g. Follow up on a job application I sent last week"
                rows={2}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
              {/* Quick purpose templates */}
              <div className="flex flex-wrap gap-1.5">
                {purposeTemplates.map((p) => (
                  <button
                    key={p}
                    onClick={() => updateForm('purpose', p)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors
                      ${form.purpose === p
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Key points */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Key points to cover
              </label>
              <textarea
                value={form.keyPoints}
                onChange={(e) => updateForm('keyPoints', e.target.value)}
                placeholder={`e.g.\n- Applied for the Senior Developer role on Monday\n- Haven't heard back in 5 days\n- Asking for a status update\n- Available for interview any time this week`}
                rows={5}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Your name</label>
                <input
                  type="text"
                  value={form.senderName}
                  onChange={(e) => updateForm('senderName', e.target.value)}
                  placeholder="e.g. Emeka"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Recipient name</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => updateForm('recipientName', e.target.value)}
                  placeholder="e.g. Mr. Johnson"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Recipient type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Recipient type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {recipientTypes.map((r) => (
                  <button
                    key={r}
                    onClick={() => updateForm('recipientType', r)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl transition-colors
                      ${form.recipientType === r
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
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
                  <button
                    key={t.id}
                    onClick={() => updateForm('tone', t.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors
                      ${form.tone === t.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
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
                  <button
                    key={l.id}
                    onClick={() => updateForm('length', l.id)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all text-center
                      ${form.length === l.id
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-zinc-200 text-zinc-600 hover:border-violet-300'
                      }`}
                  >
                    <p className="font-semibold">{l.label}</p>
                    <p className="text-zinc-400 font-normal mt-0.5">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional context */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Additional context
                <span className="ml-1 normal-case text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={form.context}
                onChange={(e) => updateForm('context', e.target.value)}
                placeholder="Any extra details Ace should know..."
                rows={2}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !canGenerate}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Writing email...
                </>
              ) : (
                <>✨ {currentEmail ? 'Regenerate' : 'Write email'}</>
              )}
            </button>

            {currentEmail && (
              <button
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
              >
                Start over
              </button>
            )}

            {/* Chat refinement */}
            {currentEmail && !streaming && (
              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-700">Refine with Ace</p>
                </div>

                {chat.messages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => chat.setInput(s)}
                        className="text-xs px-2.5 py-1.5 bg-zinc-100 hover:bg-violet-50 hover:text-violet-700 text-zinc-600 rounded-lg transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {chat.messages.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {chat.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed
                          ${msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-tr-sm'
                            : 'bg-zinc-100 text-zinc-700 rounded-tl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chat.loading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-100 px-3 py-2 rounded-xl flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-violet-400 transition-colors">
                  <input
                    type="text"
                    value={chat.input}
                    onChange={(e) => chat.setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        chat.send(currentEmail)
                      }
                    }}
                    placeholder="Ask Ace to tweak the email..."
                    disabled={chat.loading}
                    className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => chat.send(currentEmail)}
                    disabled={chat.loading || !chat.input.trim()}
                    className="w-6 h-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2L15 22 11 13 2 9l20-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel — preview ── */}
        <div
          className="hidden md:flex flex-col flex-1 overflow-hidden"
          style={{ maxHeight: 'calc(100dvh - 57px)' }}
        >
          <EmailPreview
            content={currentEmail}
            streaming={streaming}
            recipientName={form.recipientName}
            senderName={form.senderName}
          />
        </div>

        {/* Mobile copy button */}
        {currentEmail && (
          <div className="md:hidden fixed bottom-4 right-4 z-10">
            <button
              onClick={async () => {
                const { subject, body } = parseEmailSimple(currentEmail)
                await navigator.clipboard.writeText(
                  subject ? `Subject: ${subject}\n\n${body}` : currentEmail
                )
              }}
              className="flex items-center gap-2 px-4 py-3 bg-violet-600 text-white text-sm font-medium rounded-xl shadow-lg"
            >
              Copy email
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}

function parseEmailSimple(content) {
  if (!content) return { subject: '', body: '' }
  const lines = content.split('\n')
  const subjectLine = lines.find((l) => l.toUpperCase().startsWith('SUBJECT:'))
  const subject = subjectLine ? subjectLine.replace(/^SUBJECT:\s*/i, '').trim() : ''
  const bodyStart = subjectLine ? lines.indexOf(subjectLine) + 1 : 0
  const body = lines.slice(bodyStart).join('\n').trim()
  return { subject, body }
}