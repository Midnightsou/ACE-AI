import { useRef, useState, useEffect } from 'react'
import { forwardRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useToolSession } from '../../hooks/useToolSession'
import { useCoverLetterStore } from '../../store/coverLetterStore'
import { useTool } from '../../hooks/useTool'
import { useCoverLetterChat } from '../../hooks/useCoverLetterChat'
import ToolLayout from './ToolLayout'
import CVStylePicker from './CVStylePicker'
import { saveToolSession } from '../../services/memory'
import { useUserStore } from '../../store/userStore'
import { GenerateButton } from './ToolInput'
import { buildCoverLetterPrompt } from '../../prompts/tools/coverLetterPrompt'
import { getToolById } from '../../tools/registry'
import { defaultStyle } from '../../tools/cvStyles'

const tool = getToolById('cover-letter')
const TONES = ['Professional', 'Confident', 'Conversational', 'Creative', 'Formal']

// ── Inline letter preview ──────────────────────────────
function LetterPreview({ content, header, style, forwardedRef }) {
  const { font, palette } = style

  const paragraphs = (content || '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  return (
    <div
      ref={forwardedRef}
      style={{
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#ffffff',
        fontFamily: font.family,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Letterhead */}
      <div style={{
        backgroundColor: palette.sidebar,
        padding: '28px 36px 22px',
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: '700',
          margin: '0 0 6px',
          fontFamily: font.family,
          letterSpacing: '-0.01em',
        }}>
          {header.name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          {[header.email, header.phone].filter(Boolean).map((v, i) => (
            <span key={i} style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '10.5px',
              fontFamily: font.family,
            }}>
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Accent bar */}
      <div style={{ height: '3px', backgroundColor: palette.accent, opacity: 0.6 }} />

      {/* Body */}
      <div style={{ flex: 1, padding: '32px 36px' }}>
        {/* Date + company */}
        <p style={{
          fontSize: '10.5px',
          color: '#9ca3af',
          fontFamily: font.family,
          margin: '0 0 20px',
        }}>
          {new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>

        {(header.company || header.role) && (
          <div style={{ marginBottom: '20px' }}>
            {header.company && (
              <p style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#111827',
                fontFamily: font.family,
                margin: '0 0 2px',
              }}>
                {header.company}
              </p>
            )}
            {header.role && (
              <p style={{
                fontSize: '11px',
                color: palette.accent,
                fontFamily: font.family,
                margin: 0,
                fontWeight: '500',
              }}>
                Re: {header.role}
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!content && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '10px',
          }}>
            <p style={{
              color: '#d1d5db',
              fontSize: '12px',
              fontFamily: font.family,
              textAlign: 'center',
            }}>
              Your cover letter will appear here
            </p>
          </div>
        )}

        {/* Paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{
              fontSize: '11.5px',
              lineHeight: '1.8',
              color: '#374151',
              fontFamily: font.family,
              margin: 0,
            }}>
              {para}
            </p>
          ))}
        </div>

        {/* Signature */}
        {content && (
          <div style={{ marginTop: '32px' }}>
            <p style={{
              fontSize: '11.5px',
              color: '#374151',
              fontFamily: font.family,
              margin: '0 0 20px',
            }}>
              Yours sincerely,
            </p>
            <p style={{
              fontSize: '13px',
              fontWeight: '700',
              color: palette.accent,
              fontFamily: font.family,
              margin: 0,
            }}>
              {header.name || 'Your Name'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────
export default function CoverLetter() {
  const location = useLocation()
  const { saveSession, loadSession } = useToolSession('cover-letter', 'Cover Letter', '✉️')

  const {
    form, updateForm,
    output, setOutput,
    liveOutput, setLiveOutput,
    reset,
  } = useCoverLetterStore()
  const user = useUserStore((s) => s.user)
  const { streaming, loading, error, generate } = useTool('cover-letter')
  const [style, setStyle] = useState(defaultStyle)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const letterRef = useRef(null)

  const chat = useCoverLetterChat((updated) => setLiveOutput(updated))

  // ── Session restore ───────────────────────────────
  useEffect(() => {
    const sid = location.state?.sessionId
    if (!sid) return
    loadSession(sid).then((saved) => {
      if (!saved) return
      if (saved.form) Object.entries(saved.form).forEach(([k, v]) => updateForm(k, v))
      if (saved.output) {
        setOutput(saved.output)
        setLiveOutput(saved.output)
      }
    })
  }, [location.state?.sessionId])

  useEffect(() => {
    if (!output) return
    const title = `Cover Letter — ${form.company || form.role || 'Untitled'}`
    saveSession({ form, output }, title)
  }, [output])

  const CHAT_SUGGESTIONS = [
    'Make the opening more attention-grabbing',
    'Make it sound more confident',
    'Shorten it to 3 paragraphs',
    'Strengthen the closing paragraph',
    'Make the tone more conversational',
    'Make it more specific to the company',
  ]

  async function handleGenerate() {
    const { system, user } = buildCoverLetterPrompt(form)
    const result = await generate(system, user, {
      company: form.company,
      role: form.role,
    })
    if (result) {
      setOutput(result)
      setLiveOutput(result)
    }
  }
  const [result, setResult] = useState("");

  if (user?.uid && result) {
    saveToolSession(
      user.uid,
      'cover-letter',
      'Cover Letter',
      `Cover Letter — ${form.company || form.role}`,
      '✉️'
    ).catch(() => {});
  }

  async function handleDownloadPDF() {
    if (!letterRef.current) return
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: 0,
          filename: `${form.fullName.replace(/\s+/g, '_') || 'Cover'}_Letter.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(letterRef.current)
        .save()
    } catch (err) {
      console.error('PDF error:', err)
      alert('Failed to export. Try again.')
    }
  }

  function handleReset() {
    reset()
    chat.reset()
  }

  const currentLetter = liveOutput || output

  const header = {
    name: form.fullName,
    email: form.email,
    phone: form.phone,
    company: form.company,
    role: form.role,
  }

  return (
    <ToolLayout tool={tool}>
      <div className="flex h-full">

        {/* ── Left panel — form + chat ── */}
        <div className="w-full md:w-2/5 flex flex-col border-r border-zinc-100 overflow-y-auto"
          style={{ maxHeight: 'calc(100dvh - 112px)' }}
        >
          <div className="flex flex-col gap-5 p-5">

            {/* Personal info */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Your details</p>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="Phone"
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Job details */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Job details</p>
              <input
                type="text"
                value={form.role}
                onChange={(e) => updateForm('role', e.target.value)}
                placeholder="Position you're applying for"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
              <input
                type="text"
                value={form.company}
                onChange={(e) => updateForm('company', e.target.value)}
                placeholder="Company name"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
              <textarea
                value={form.jobDescription}
                onChange={(e) => updateForm('jobDescription', e.target.value)}
                placeholder="Job description (optional but recommended)..."
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Background */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Your background</p>
              <textarea
                value={form.background}
                onChange={(e) => updateForm('background', e.target.value)}
                placeholder="Describe your relevant experience and why you want this role..."
                rows={5}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Tone */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Tone</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => updateForm('tone', tone)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                      ${form.tone === tone
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Style toggle */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowStylePicker((v) => !v)}
                className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-medium hover:text-zinc-700 transition-colors"
              >
                <span>Style</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: style.palette.sidebar }}
                  />
                  <span className="normal-case text-zinc-400">{style.palette.label} · {style.font.label}</span>
                  <svg
                    width="12" height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`transition-transform ${showStylePicker ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </button>
              {showStylePicker && (
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <CVStylePicker style={style} onChange={setStyle} />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            {/* Generate button */}
            <GenerateButton
              onClick={handleGenerate}
              loading={loading}
              disabled={loading || !form.role.trim() || !form.background.trim()}
              label={currentLetter ? 'Regenerate' : 'Generate cover letter'}
            />

            {/* Reset */}
            {currentLetter && (
              <button
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
              >
                Start over
              </button>
            )}

            {/* Chat refinement */}
            {currentLetter && !streaming && (
              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-700">Refine with Ace</p>
                </div>

                {/* Suggestions */}
                {chat.messages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => chat.setInput(s)}
                        className="text-xs px-2.5 py-1.5 bg-zinc-100 hover:bg-violet-50 hover:text-violet-700 text-zinc-600 rounded-lg transition-colors border border-zinc-200 hover:border-violet-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Messages */}
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

                {/* Chat input */}
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-violet-400 transition-colors">
                  <input
                    type="text"
                    value={chat.input}
                    onChange={(e) => chat.setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        chat.send(currentLetter)
                      }
                    }}
                    placeholder="Ask Ace to tweak anything..."
                    disabled={chat.loading}
                    className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => chat.send(currentLetter)}
                    disabled={chat.loading || !chat.input.trim()}
                    className="w-6 h-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2L15 22 11 13 2 9l20-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel — live preview ── */}
        <div className="hidden md:flex flex-col flex-1 bg-zinc-100 overflow-y-auto"
          style={{ maxHeight: 'calc(100dvh - 112px)' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-zinc-100">
            <p className="text-xs text-zinc-400">Live preview</p>
            {currentLetter && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download PDF
              </button>
            )}
          </div>

          {/* Letter preview */}
          <div className="flex-1 p-6 flex items-start justify-center">
            <div className="w-full max-w-xl shadow-xl rounded-xl overflow-hidden">
              <LetterPreview
                content={streaming ? currentLetter : currentLetter}
                header={header}
                style={style}
                forwardedRef={letterRef}
              />
              {streaming && (
                <div className="bg-white px-6 pb-4">
                  <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile download button */}
        {currentLetter && (
          <div className="md:hidden fixed bottom-4 right-4 z-10">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download PDF
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}