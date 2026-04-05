import { useRef, useState } from 'react'
import { useEssayStore } from '../../store/essayStore'
import { useTool } from '../../hooks/useTool'
import { useEssayChat } from '../../hooks/useEssayChat'
import ToolLayout from './ToolLayout'
import { buildOutlinePrompt, buildEssayPrompt, buildEssayFromScratchPrompt } from '../../prompts/tools/essayPrompt'
import { getToolById } from '../../tools/registry'

const tool = getToolById('essay-writer')

const ESSAY_TYPES = ['Argumentative', 'Expository', 'Narrative', 'Analytical', 'Descriptive', 'Persuasive']
const ACADEMIC_LEVELS = ['High School', 'Undergraduate', 'Graduate', 'Professional']
const CITATION_STYLES = ['APA', 'MLA', 'Harvard', 'Chicago', 'None']
const WORD_COUNTS = ['500', '750', '1000', '1500', '2000', '3000']

const CHAT_SUGGESTIONS = [
  'Strengthen the argument in the introduction',
  'Add more evidence to support the main points',
  'Make the conclusion more impactful',
  'Improve the transitions between paragraphs',
  'Make the tone more academic',
  'Simplify the language',
]

function wordCount(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function EssayWriter() {
  const {
    form, updateForm,
    outline, setOutline,
    essay, setEssay,
    liveEssay, setLiveEssay,
    stage, setStage,
    reset,
  } = useEssayStore()

  const outlineTool = useTool('essay-outline')
  const essayTool = useTool('essay-writer')
  const [useOutlineFirst, setUseOutlineFirst] = useState(true)
  const essayChat = useEssayChat((updated) => setLiveEssay(updated))
  const essayRef = useRef(null)

  const currentEssay = liveEssay || essay
  const isStreaming = outlineTool.streaming || essayTool.streaming

  async function handleGenerateOutline() {
    const { system, user } = buildOutlinePrompt(form)
    const result = await outlineTool.generate(system, user, { topic: form.topic })
    if (result) {
      setOutline(result)
      setStage('outline')
    }
  }

  async function handleGenerateEssay() {
    let result
    if (useOutlineFirst && outline) {
      const { system, user } = buildEssayPrompt(form, outline)
      result = await essayTool.generate(system, user, { topic: form.topic })
    } else {
      const { system, user } = buildEssayFromScratchPrompt(form)
      result = await essayTool.generate(system, user, { topic: form.topic })
    }
    if (result) {
      setEssay(result)
      setLiveEssay(result)
      setStage('essay')
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
    outlineTool.reset()
    essayTool.reset()
  }

  return (
    <ToolLayout tool={tool}>
      <div className="flex h-full">

        {/* ── Left panel — controls ── */}
        <div
          className="w-full md:w-80 flex-shrink-0 flex flex-col border-r border-zinc-100 overflow-y-auto bg-white"
          style={{ maxHeight: 'calc(100dvh - 57px)' }}
        >
          <div className="flex flex-col gap-5 p-5">

            {/* Topic */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Essay topic
              </label>
              <textarea
                value={form.topic}
                onChange={(e) => updateForm('topic', e.target.value)}
                placeholder="e.g. The effects of social media on mental health in teenagers"
                rows={3}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Essay type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Essay type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ESSAY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateForm('essayType', type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                      ${form.essayType === type
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Academic level */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Academic level
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ACADEMIC_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => updateForm('academicLevel', level)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                      ${form.academicLevel === level
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Word count */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Target word count
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WORD_COUNTS.map((count) => (
                  <button
                    key={count}
                    onClick={() => updateForm('wordCount', count)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                      ${form.wordCount === count
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {count}w
                  </button>
                ))}
              </div>
            </div>

            {/* Citation style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Citation style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CITATION_STYLES.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateForm('citationStyle', c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                      ${form.citationStyle === c
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional instructions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Additional instructions
                <span className="ml-1 normal-case text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => updateForm('instructions', e.target.value)}
                placeholder="Any specific requirements, points to cover, or style preferences..."
                rows={3}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Outline toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setUseOutlineFirst((v) => !v)}
                className={`w-9 h-5 rounded-full relative transition-colors ${useOutlineFirst ? 'bg-violet-600' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useOutlineFirst ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-700">Generate outline first</p>
                <p className="text-xs text-zinc-400">Review structure before full essay</p>
              </div>
            </label>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {/* Outline button */}
              {useOutlineFirst && stage === 'input' && (
                <button
                  onClick={handleGenerateOutline}
                  disabled={!form.topic.trim() || outlineTool.loading}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {outlineTool.loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating outline...
                    </>
                  ) : (
                    <>
                      <span>🗂</span>
                      Generate outline
                    </>
                  )}
                </button>
              )}

              {/* Write essay button */}
              {(stage === 'outline' || !useOutlineFirst) && (
                <button
                  onClick={handleGenerateEssay}
                  disabled={!form.topic.trim() || essayTool.loading}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {essayTool.loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Writing essay...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      {currentEssay ? 'Regenerate essay' : 'Write full essay'}
                    </>
                  )}
                </button>
              )}

              {/* Skip outline */}
              {useOutlineFirst && stage === 'input' && (
                <button
                  onClick={() => {
                    setUseOutlineFirst(false)
                    setStage('outline')
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
                >
                  Skip outline and write directly
                </button>
              )}
            </div>

            {/* Reset */}
            {stage !== 'input' && (
              <button
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
              >
                Start over
              </button>
            )}

            {/* Chat refinement */}
            {currentEssay && !isStreaming && (
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
                    placeholder="Ask Ace to improve the essay..."
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
        </div>

        {/* ── Right panel — document editor feel ── */}
        <div
          className="hidden md:flex flex-col flex-1 bg-zinc-50 overflow-y-auto"
          style={{ maxHeight: 'calc(100dvh - 57px)' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-100 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-zinc-800 truncate max-w-xs">
                {form.topic || 'Untitled essay'}
              </h2>
              {currentEssay && (
                <span className="text-xs text-zinc-400">
                  {wordCount(currentEssay).toLocaleString()} words
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Stage indicators */}
              {['input', 'outline', 'essay'].map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg
                    ${stage === s
                      ? 'bg-violet-100 text-violet-700 font-medium'
                      : i < ['input', 'outline', 'essay'].indexOf(stage)
                        ? 'text-green-600'
                        : 'text-zinc-400'
                    }`}
                >
                  {i < ['input', 'outline', 'essay'].indexOf(stage) && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
              ))}

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
          </div>

          {/* Document content */}
          <div className="flex-1 px-8 py-8 flex justify-center">
            <div className="w-full max-w-2xl">

              {/* Empty state */}
              {stage === 'input' && !outlineTool.loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl">
                    📝
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700">Start with a topic</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Enter your topic on the left, choose your settings, and let Ace write your essay.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-zinc-400 bg-white border border-zinc-100 rounded-xl p-4 text-left w-full max-w-sm">
                    <p className="font-medium text-zinc-600">Tips for better essays:</p>
                    <p>• Be specific with your topic — avoid vague titles</p>
                    <p>• Use "Generate outline first" to review structure</p>
                    <p>• Add instructions for custom requirements</p>
                    <p>• Use the chat to refine specific sections</p>
                  </div>
                </div>
              )}

              {/* Outline loading */}
              {outlineTool.loading && (
                <div className="flex items-center gap-3 text-sm text-zinc-500 py-8">
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Generating outline...
                </div>
              )}

              {/* Outline display */}
              {outline && stage === 'outline' && !outlineTool.loading && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-700">Essay Outline</h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Review before writing
                    </span>
                  </div>
                  <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                    <pre className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {outline}
                    </pre>
                  </div>
                  <button
                    onClick={handleGenerateEssay}
                    disabled={essayTool.loading}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {essayTool.loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Writing essay...
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        Write full essay from this outline
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Essay loading */}
              {essayTool.loading && (
                <div className="flex items-center gap-3 text-sm text-zinc-500 py-4">
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Writing your essay...
                </div>
              )}

              {/* Essay document */}
              {currentEssay && (
                <div
                  ref={essayRef}
                  className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden"
                >
                  {/* Document header */}
                  <div className="px-10 pt-10 pb-4 border-b border-zinc-50">
                    <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
                      {form.topic}
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                        {form.essayType}
                      </span>
                      <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                        {form.academicLevel}
                      </span>
                      {form.citationStyle !== 'None' && (
                        <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                          {form.citationStyle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Essay body */}
                  <div className="px-10 py-8">
                    {currentEssay.split('\n').map((line, i) => {
                      if (!line.trim()) {
                        return <div key={i} style={{ height: '12px' }} />
                      }

                      // Detect section headers
                      const isHeader = line.length < 60 &&
                        !line.startsWith('-') &&
                        !line.startsWith('(') &&
                        (
                          line === line.toUpperCase() ||
                          /^[IVX]+\.|^\d+\.|^[A-Z][^a-z]{0,3}\./.test(line)
                        )

                      return (
                        <p
                          key={i}
                          className={
                            isHeader
                              ? 'text-base font-bold text-zinc-900 mt-6 mb-2'
                              : 'text-sm leading-relaxed text-zinc-700 mb-0'
                          }
                        >
                          {line}
                          {i === currentEssay.split('\n').length - 1 && essayTool.streaming && (
                            <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
                          )}
                        </p>
                      )
                    })}
                  </div>

                  {/* Word count footer */}
                  <div className="px-10 py-4 border-t border-zinc-50 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      {wordCount(currentEssay).toLocaleString()} words
                      {form.wordCount && (
                        <span className="ml-1">
                          · target {parseInt(form.wordCount).toLocaleString()}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {form.citationStyle !== 'None' && `${form.citationStyle} format`}
                    </span>
                  </div>
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