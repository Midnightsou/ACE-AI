import { useRef, useState, useEffect } from 'react'
import { useEssayStore } from '../../store/essayStore'
import { useEssayChat } from '../../hooks/useEssayChat'
import { useLocation } from 'react-router-dom'
import { useToolSession } from '../../hooks/useToolSession'
import ToolLayout from './ToolLayout'
import { buildOutlinePrompt, buildSectionPrompt } from '../../prompts/tools/essayPrompt'
import { getToolById } from '../../tools/registry'
import { saveToolSession } from '../../services/memory'
import { useUserStore } from '../../store/userStore'
import { streamCompletion, MODELS } from '../../services/deepseekClient'

const tool = getToolById('essay-writer')


const ESSAY_TYPES = ['Argumentative', 'Expository', 'Narrative', 'Analytical', 'Descriptive', 'Persuasive', 'Research Paper', 'Reflective']
const ACADEMIC_LEVELS = ['High School', 'Undergraduate', 'Graduate', 'Professional']
const CITATION_STYLES = ['APA', 'MLA', 'Harvard', 'Chicago', 'None']
const WRITING_STYLES = ['Academic', 'Formal', 'Semi-formal', 'Creative', 'Journalistic']
const WORD_COUNTS = [
  { label: '500', value: '500' },
  { label: '750', value: '750' },
  { label: '1,000', value: '1000' },
  { label: '1,500', value: '1500' },
  { label: '2,000', value: '2000' },
  { label: '3,000', value: '3000' },
  { label: '5,000', value: '5000' },
]

const SUGGESTED_TOPICS = [
  'The impact of social media on mental health in teenagers',
  'Climate change and its effect on global food security',
  'The role of artificial intelligence in modern healthcare',
  'Nigeria\'s economic potential in the 21st century',
  'The influence of colonialism on African education systems',
  'Why entrepreneurship is the future of African youth',
]

const CHAT_SUGGESTIONS = [
  'Strengthen the introduction',
  'Add more evidence to support the main argument',
  'Make the conclusion more impactful',
  'Improve transitions between sections',
  'Make the tone more academic',
  'Expand the analysis in the body paragraphs',
]

const STEPS = ['Topic', 'Word Count', 'Essay Type', 'Writing Style', 'References']


function parseOutlineSections(outlineText) {
  const lines = outlineText.split('\n').map(l => l.trim()).filter(Boolean)
  const sections = []
  let current = null

  for (const line of lines) {
    const isHeader = !line.startsWith('-') && !line.startsWith('•') && line.length < 80
    if (isHeader) {
      if (current) sections.push(current)
      current = { title: line, points: [] }
    } else if (current) {
      current.points.push(line.replace(/^[-•]\s*/, ''))
    }
  }
  if (current) sections.push(current)
  return sections
}

function wordCount(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function EssayWriter() {
  const {
    step, setStep,
    form, updateForm,
    outline, setOutline,
    essay, setEssay,
    liveEssay, setLiveEssay,
    generatingSection, setGeneratingSection,
    stage, setStage,
    reset,
  } = useEssayStore()
  const location = useLocation()
  const { saveSession, loadSession } = useToolSession('essay-writer', 'Essay Writer', '📝')
  // ── Session restore ───────────────────────────────
  useEffect(() => {
    const sid = location.state?.sessionId
    if (!sid) return
    loadSession(sid).then((saved) => {
      if (!saved) return
      if (saved.form) Object.entries(saved.form).forEach(([k, v]) => updateForm(k, v))
      if (saved.outline) setOutline(saved.outline)
      if (saved.essay) {
        setEssay(saved.essay)
        setStage('essay')
        setStep(2)
      }
    })
  }, [location.state?.sessionId])

  useEffect(() => {
    if (!essay && !outline) return
    const state = { form, outline, essay, step, stage }
    const title = `Essay — ${form.topic?.slice(0, 40) || 'Untitled'}`
    saveSession(state, title)
  }, [essay, outline])

const user = useUserStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const essayChat = useEssayChat((updated) => setLiveEssay(updated))
  const essayRef = useRef(null)

  const currentEssay = liveEssay || essay

  async function handleGenerateOutline() {
    if (!form.topic.trim()) return
    setLoading(true)
    setError(null)
    setGeneratingSection('outline')

    try {
      const { system, user } = buildOutlinePrompt(form)
      let result = ''
      await streamCompletion({
        model: MODELS.chat,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        maxTokens: 4096,
        onChunk: (chunk) => {
          result = chunk
          setOutline(chunk)
        },
      })
      setOutline(result)
      setStage('outline')
    } catch (err) {
      setError('Failed to generate outline. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
      setGeneratingSection('')
    }
  }

  async function handleGenerateEssay() {
  if (!outline) return
  setLoading(true)
  setError(null)
  setStage('essay')
  setEssay('')
  setLiveEssay('')

  const sections = parseOutlineSections(outline)
  const wordsPerSection = Math.ceil(parseInt(form.wordCount) / sections.length)
  let fullEssay = ''

  try {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      setGeneratingSection(section.title)

      // Pass word target per section
      const sectionForm = { ...form, sectionWordTarget: wordsPerSection }

      const { system, user } = buildSectionPrompt(
        sectionForm,
        section.title,
        section.points.join('\n'),
        fullEssay,
        i === 0,
        i === sections.length - 1
      )

      let sectionContent = ''
      await streamCompletion({
        model: MODELS.chat,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        maxTokens: 4096,
        onChunk: (chunk) => {
          sectionContent = chunk
          setLiveEssay(fullEssay + '\n\n' + chunk)
        },
      })

      fullEssay += (fullEssay ? '\n\n' : '') + sectionContent
      setEssay(fullEssay)
      setLiveEssay(fullEssay)
    }
  } catch (err) {
    setError('Failed to generate essay. Try again.')
  } finally {
    setLoading(false)
    setGeneratingSection('')
  }
}

  function handleDownload() {
    if (!currentEssay) return
    const blob = new Blob([currentEssay], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.topic.slice(0, 30).replace(/\s+/g, '_')}_essay.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleReset() {
    reset()
    essayChat.reset()
    setError(null)
  }

  function canProceed() {
    if (step === 0) return form.topic.trim().length > 5
    return true
  }

  // ── Wizard input screens ──────────────────────────────
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">What would you like to write about?</h2>
              <p className="text-sm text-zinc-400 mt-2">Enter your topic and let Ace craft your essay</p>
            </div>

            <textarea
              value={form.topic}
              onChange={(e) => updateForm('topic', e.target.value)}
              placeholder="e.g. The impact of social media on mental health in Nigerian teenagers"
              rows={4}
              className="w-full px-5 py-4 border-2 border-zinc-200 focus:border-violet-500 rounded-2xl text-sm outline-none transition-colors resize-none text-zinc-800 placeholder:text-zinc-300"
              autoFocus
            />

            {/* Suggested topics */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-zinc-500">Suggested topics</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => updateForm('topic', topic)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors
                      ${form.topic === topic
                        ? 'border-violet-400 bg-violet-50 text-violet-700'
                        : 'border-zinc-200 text-zinc-600 hover:border-violet-300 hover:bg-zinc-50'
                      }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">How long should it be?</h2>
              <p className="text-sm text-zinc-400 mt-2">Choose your target word count</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {WORD_COUNTS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => updateForm('wordCount', value)}
                  className={`py-5 rounded-2xl border-2 text-center transition-all
                    ${form.wordCount === value
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-violet-300'
                    }`}
                >
                  <p className={`text-2xl font-bold ${form.wordCount === value ? 'text-violet-700' : 'text-zinc-800'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">words</p>
                </button>
              ))}
            </div>

            {parseInt(form.wordCount) >= 3000 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                Essays of {form.wordCount} words are generated section by section for best quality. This may take 1-2 minutes.
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">What type of essay?</h2>
              <p className="text-sm text-zinc-400 mt-2">Select the essay format</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ESSAY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => updateForm('essayType', type)}
                  className={`py-4 px-4 rounded-2xl border-2 text-left transition-all
                    ${form.essayType === type
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-violet-300'
                    }`}
                >
                  <p className={`text-sm font-semibold ${form.essayType === type ? 'text-violet-700' : 'text-zinc-800'}`}>
                    {type}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-600">Academic level</p>
              <div className="flex flex-wrap gap-2">
                {ACADEMIC_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => updateForm('academicLevel', level)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors
                      ${form.academicLevel === level
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-zinc-200 text-zinc-600 hover:border-violet-300'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">Writing style</h2>
              <p className="text-sm text-zinc-400 mt-2">How should Ace write this?</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {WRITING_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => updateForm('writingStyle', style)}
                  className={`py-4 px-5 rounded-2xl border-2 text-left transition-all
                    ${form.writingStyle === style
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-violet-300'
                    }`}
                >
                  <p className={`text-sm font-semibold ${form.writingStyle === style ? 'text-violet-700' : 'text-zinc-800'}`}>
                    {style}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-600">
                Additional instructions
                <span className="ml-1 font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => updateForm('instructions', e.target.value)}
                placeholder="Any specific requirements, points to include, or style preferences..."
                rows={3}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">References & citations</h2>
              <p className="text-sm text-zinc-400 mt-2">Choose your citation format</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {CITATION_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => updateForm('citationStyle', style)}
                  className={`py-4 px-5 rounded-2xl border-2 text-left transition-all
                    ${form.citationStyle === style
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-violet-300'
                    }`}
                >
                  <p className={`text-sm font-semibold ${form.citationStyle === style ? 'text-violet-700' : 'text-zinc-800'}`}>
                    {style === 'None' ? 'No citations' : style}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {style === 'APA' && 'American Psychological Association'}
                    {style === 'MLA' && 'Modern Language Association'}
                    {style === 'Harvard' && 'Harvard referencing system'}
                    {style === 'Chicago' && 'Chicago Manual of Style'}
                    {style === 'None' && 'No in-text citations or reference list'}
                  </p>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-2 border border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Essay summary</p>
              {[
                { label: 'Topic', value: form.topic.slice(0, 50) + (form.topic.length > 50 ? '...' : '') },
                { label: 'Type', value: form.essayType },
                { label: 'Level', value: form.academicLevel },
                { label: 'Word count', value: `${parseInt(form.wordCount).toLocaleString()} words` },
                { label: 'Style', value: form.writingStyle },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-medium text-zinc-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ToolLayout tool={tool}>
      <div className="flex h-full">

        {/* ── Left panel ── */}
        <div
          className="w-full md:w-96 flex-shrink-0 flex flex-col border-r border-zinc-100 overflow-y-auto bg-white"
          style={{ maxHeight: 'calc(100dvh - 112px)' }}
        >

          {/* Stage: input wizard */}
          {stage === 'input' && (
            <div className="flex flex-col gap-6 p-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${i < step
                        ? 'bg-green-500 text-white'
                        : i === step
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {i < step ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-4 h-0.5 ${i < step ? 'bg-green-400' : 'bg-zinc-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              {renderStep()}

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Back
                  </button>
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateOutline}
                    disabled={loading}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating outline...
                      </>
                    ) : (
                      <>✨ Generate essay</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stage: outline review */}
          {stage === 'outline' && !loading && (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-800">Essay outline</p>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Review before writing
                </span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap border border-zinc-100">
                {outline}
              </div>

              <button
                onClick={handleGenerateEssay}
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Writing...
                  </>
                ) : (
                  <>✨ Write full essay</>
                )}
              </button>

              <button
                onClick={handleGenerateOutline}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
              >
                Regenerate outline
              </button>

              <button
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
              >
                Start over
              </button>
            </div>
          )}

          {/* Stage: essay — show progress + chat */}
          {stage === 'essay' && (
            <div className="flex flex-col gap-4 p-6">
              {/* Generation progress */}
              {loading && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-zinc-800">Writing your essay...</p>
                  <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                    <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-violet-700">
                        {generatingSection || 'Generating...'}
                      </p>
                      <p className="text-xs text-violet-400 mt-0.5">
                        {wordCount(currentEssay).toLocaleString()} words so far
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 text-center">
                    {parseInt(form.wordCount) >= 3000
                      ? 'Writing section by section — this may take a moment'
                      : 'Almost done...'}
                  </p>
                </div>
              )}

              {/* Essay complete — actions */}
              {currentEssay && !loading && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-800">Essay complete</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${wordCount(currentEssay) >= parseInt(form.wordCount) * 0.9
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {wordCount(currentEssay).toLocaleString()} words
                    </span>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Download essay
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateEssay}
                      className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-xs rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-xs rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              )}

              {/* Chat refinement */}
              {currentEssay && !loading && (
                <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-700">Refine with Ace</p>
                  </div>

                  {essayChat.messages.length === 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {CHAT_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => essayChat.setInput(s)}
                          className="text-xs px-2.5 py-1.5 bg-zinc-100 hover:bg-violet-50 hover:text-violet-700 text-zinc-600 rounded-lg transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {essayChat.messages.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {essayChat.messages.map((msg, i) => (
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
                      {essayChat.loading && (
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
                      value={essayChat.input}
                      onChange={(e) => essayChat.setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          essayChat.send(currentEssay)
                        }
                      }}
                      placeholder="Ask Ace to refine the essay..."
                      disabled={essayChat.loading}
                      className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={() => essayChat.send(currentEssay)}
                      disabled={essayChat.loading || !essayChat.input.trim()}
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
          )}
        </div>

        {/* ── Right panel — document ── */}
        <div
          className="hidden md:flex flex-col flex-1 bg-zinc-50 overflow-y-auto"
          style={{ maxHeight: 'calc(100dvh - 112px)' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-100 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-zinc-800 truncate max-w-sm">
                {form.topic || 'Untitled essay'}
              </h2>
              {currentEssay && (
                <span className="text-xs text-zinc-400">
                  {wordCount(currentEssay).toLocaleString()} / {parseInt(form.wordCount).toLocaleString()} words
                </span>
              )}
            </div>
            {currentEssay && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-8 py-8 flex justify-center">
            <div className="w-full max-w-2xl">

              {/* Empty state */}
              {stage === 'input' && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl">📝</div>
                  <div>
                    <p className="font-semibold text-zinc-700">Your essay will appear here</p>
                    <p className="text-sm text-zinc-400 mt-1">Complete the steps on the left to generate your essay</p>
                  </div>
                </div>
              )}

              {/* Outline preview */}
              {stage === 'outline' && outline && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">Outline</span>
                  </div>
                  <h1 className="text-xl font-bold text-zinc-900 mb-6">{form.topic}</h1>
                  <pre className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap font-sans">
                    {outline}
                  </pre>
                </div>
              )}

              {/* Essay document */}
              {(stage === 'essay' || currentEssay) && (
                <div ref={essayRef} className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-10 pt-10 pb-6 border-b border-zinc-50">
                    <h1 className="text-2xl font-bold text-zinc-900 leading-tight">{form.topic}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {[form.essayType, form.academicLevel, form.writingStyle, form.citationStyle !== 'None' && form.citationStyle].filter(Boolean).map((tag) => (
                        <span key={tag} className="text-xs text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-10 py-8">
                    {currentEssay ? (
                      currentEssay.split('\n').map((line, i) => {
                        if (!line.trim()) return <div key={i} style={{ height: '10px' }} />
                        const isHeader = line.length < 70 &&
                          !line.startsWith('-') &&
                          !line.startsWith('(') &&
                          (line === line.toUpperCase() || /^[A-Z][A-Z\s:]+$/.test(line) || (line.trim().split(' ').length <= 6 && i > 0))

                        return (
                          <p key={i} className={
                            isHeader
                              ? 'text-base font-bold text-zinc-900 mt-8 mb-3'
                              : 'text-sm leading-[1.9] text-zinc-700'
                          }>
                            {line}
                          </p>
                        )
                      })
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-zinc-400 py-8">
                        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        Starting to write...
                      </div>
                    )}

                    {loading && currentEssay && (
                      <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
                    )}
                  </div>

                  {/* Footer */}
                  {currentEssay && (
                    <div className="px-10 py-4 border-t border-zinc-50 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        {wordCount(currentEssay).toLocaleString()} words
                        {loading && <span className="ml-1 text-violet-500">· writing...</span>}
                      </span>
                      {generatingSection && loading && (
                        <span className="text-xs text-violet-500">
                          Writing: {generatingSection}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile download */}
        {currentEssay && (
          <div className="md:hidden fixed bottom-4 right-4 z-10">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-3 bg-violet-600 text-white text-sm font-medium rounded-xl shadow-lg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}