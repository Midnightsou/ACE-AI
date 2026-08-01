import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useToolSession } from '../../hooks/useToolSession'
import { useCVAnalyserStore } from '../../store/cvStore'
import { useTool } from '../../hooks/useTool'
import ToolLayout from './ToolLayout'
import CVRenderer from './CVRenderer'
import CVStylePicker from './CVStylePicker'
import { ToolField, ToolTextarea, GenerateButton } from './ToolInput'
import { buildCVAnalyserPrompt, buildAnalysisPrompt } from '../../prompts/tools/cvAnalyserPrompt'
import { parseCV } from '../../utils/cvParser'
import { getToolById } from '../../tools/registry'
import { useCVChat } from '../../hooks/useCVChat'
import CVChat from './CVChat'
const tool = getToolById('cv-analyser')
const STEPS = ['Your CV', 'Job Description', 'Style', 'Analyse']
import { extractTextFromPDF } from '../../services/pdf'
import { extractTextFromImage } from '../../services/ocr'



export default function CVAnalyser() {
  const rewriter = useTool('cv-analyser')
  const analyser = useTool('cv-analyser-analysis')

  // ── Session hooks ────────────────────────────────
  const location = useLocation()
  const { saveSession, loadSession } = useToolSession('cv-analyser', 'CV Analyser', '🔍')

  const {
    step, setStep,
    form, updateForm,
    style, setStyle,
    output, setOutput,
    analysisOutput, setAnalysisOutput,
    liveCV, setLiveCV,
    mode, setMode,
    fileName, setFileName,
    reset,
  } = useCVAnalyserStore()

  const cvRef = useRef(null)
  const fileInputRef = useRef(null)

  const [downloading, setDownloading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)

  const cvChat = useCVChat((updatedCV) => setLiveCV(updatedCV))

  // ── Session restore ───────────────────────────────
  useEffect(() => {
    const sid = location.state?.sessionId
    if (!sid) return
    loadSession(sid).then((saved) => {
      if (!saved) return
      if (saved.form) {
        Object.entries(saved.form).forEach(([k, v]) => {
          if (v !== '[document_stripped]') updateForm(k, v)
        })
      }
      if (saved.output) setOutput(saved.output)
      if (saved.analysisOutput) setAnalysisOutput(saved.analysisOutput)
      if (saved.mode) setMode(saved.mode)
      if (saved.step !== undefined) setStep(saved.step)
    })
  }, [location.state?.sessionId, loadSession, setAnalysisOutput, setMode, setOutput, setStep, updateForm])

  // ── Auto-save ─────────────────────────────────────
  useEffect(() => {
    if (!output && !analysisOutput) return
    const title = `CV Analysis — ${form.targetRole || 'Untitled'}`
    saveSession({ form, output, analysisOutput, mode, step }, title)
  }, [output, analysisOutput, form, mode, saveSession, step])

  function canProceed() {
    if (step === 0) return form.cvText.trim().length > 20
    if (step === 1) return form.jobDescription.trim().length > 20 && form.targetRole.trim()
    return true
  }

  async function handleAnalyse() {
    setMode('analyse')
    const { system, user } = buildAnalysisPrompt(form.cvText, form.jobDescription)
    const result = await analyser.generate(system, user, {
      type: 'analysis',
      targetRole: form.targetRole,
    })
    if (result) setAnalysisOutput(result)
  }

  async function handleRewrite() {
    setMode('rewrite')
    const { system, user } = buildCVAnalyserPrompt(
      form.cvText,
      form.jobDescription,
      form.targetRole
    )
    const result = await rewriter.generate(system, user, {
      type: 'rewrite',
      targetRole: form.targetRole,
    })
    if (result) {
      setOutput(result)
      setLiveCV(result)
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')

    if (!isPDF && !isImage) {
      alert('Only PDF and image files supported.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB.')
      return
    }

    setFileLoading(true)
    setFileName(file.name)

    try {
      let text = ''
      if (isPDF) {
        text = await extractTextFromPDF(file)
      } else {
        text = await extractTextFromImage(file, () => {})
      }

      if (!text || text.length < 20) {
        alert('Could not extract text from this file. Try a clearer image or a text-based PDF.')
        setFileName('')
        return
      }

      updateForm('cvText', text)
    } catch (err) {
      console.error('File extraction error:', err)
      alert('Failed to read file. Try again.')
      setFileName('')
    } finally {
      setFileLoading(false)
      e.target.value = ''
    }
  }

  async function handleDownloadPDF() {
    if (!cvRef.current) return
    setDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: 0,
          filename: `${form.targetRole.replace(/\s+/g, '_')}_CV_Optimized.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(cvRef.current)
        .save()
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to export PDF. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  function resetAll() {
    reset()
    rewriter.reset()
    analyser.reset()
    cvChat.reset()
  }

  const parsedSections = rewriter.output ? parseCV(rewriter.output) : null
  const headerInfo = {
    name: form.fullName || 'Your Name',
    role: form.targetRole || 'Professional',
    email: form.email,
    phone: form.phone,
    location: form.location,
    linkedin: form.linkedin,
  }

  const currentCV = liveCV || rewriter.output

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-300
                ${i <= step ? 'bg-violet-600' : 'bg-zinc-200'}`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">Step {step + 1} of {STEPS.length}</p>
          <p className="text-sm font-medium text-zinc-800">{STEPS[step]}</p>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-500 leading-relaxed">
              Upload your current CV as a PDF or image. Ace will extract the text automatically.
            </p>

            {/* File upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileLoading}
              className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 transition-colors
                ${fileName
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-zinc-200 hover:border-violet-300 hover:bg-zinc-50 bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {fileLoading ? (
                <>
                  <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-zinc-500">Extracting text from your CV...</p>
                </>
              ) : fileName ? (
                <>
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-violet-700">{fileName}</p>
                    <p className="text-xs text-violet-500 mt-1">
                      Text extracted successfully — tap to change file
                    </p>
                  </div>
                  {form.cvText && (
                    <div className="w-full bg-white border border-violet-200 rounded-xl p-3 text-left">
                      <p className="text-xs text-zinc-400 mb-1">Preview (first 200 chars)</p>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {form.cvText.slice(0, 200)}...
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-700">Upload your CV</p>
                    <p className="text-xs text-zinc-400 mt-1">PDF or image · Max 10MB</p>
                  </div>
                </>
              )}
            </button>

            {/* Optional contact info */}
            <div className="bg-zinc-50 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs text-zinc-500 font-medium">
                Contact details — fill these for the CV preview header
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'fullName', label: 'Full name', placeholder: 'john doe' },
                  { field: 'email', label: 'Email', placeholder: 'you@email.com' },
                  { field: 'phone', label: 'Phone', placeholder: '+234 801 234 5678' },
                  { field: 'location', label: 'Location', placeholder: 'Lagos, Nigeria' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">{label}</label>
                    <input
                      type="text"
                      value={form[field]}
                      onChange={(e) => updateForm(field, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Job description */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-500 leading-relaxed">
              Paste the job description you're applying for. The more detail you provide, the better the AI can optimize your CV.
            </p>

            <ToolField label="Target role" hint="Required">
              <input
                type="text"
                value={form.targetRole}
                onChange={(e) => updateForm('targetRole', e.target.value)}
                placeholder="e.g. Senior Software Engineer, Product Manager"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>

            <ToolField label="Job description" hint="Required">
              <ToolTextarea
                value={form.jobDescription}
                onChange={(v) => updateForm('jobDescription', v)}
                placeholder={`Paste the full job description here...\n\nWe are looking for a Senior Software Engineer to join our team...\n\nRequirements:\n- 3+ years experience with React and Node.js\n- Experience with cloud platforms (AWS, GCP)\n- Strong problem-solving skills\n...`}
                rows={12}
              />
            </ToolField>
          </div>
        )}

        {/* Step 2 — Style */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-zinc-500">
              Choose how your optimized CV will look.
            </p>
            <CVStylePicker style={style} onChange={setStyle} />

            {/* Mini preview */}
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
              <div style={{
                backgroundColor: style.palette.sidebar,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div>
                  <p style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    fontFamily: style.font.family,
                    margin: 0,
                  }}>
                    {form.fullName || 'Your Name'}
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '11px',
                    fontFamily: style.font.family,
                    margin: 0,
                  }}>
                    {form.targetRole || 'Target Role'}
                  </p>
                </div>
              </div>
              <div style={{ padding: '12px 16px', backgroundColor: '#fff' }}>
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: style.palette.light, marginBottom: '6px' }} />
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: style.palette.light, width: '70%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Analyse + Rewrite */}
        {step === 3 && (
          <div className="flex flex-col gap-5">

            {/* Action buttons */}
            {!mode && (
              <>
                <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <p className="text-sm font-semibold text-zinc-800">What would you like to do?</p>
                  <p className="text-sm text-zinc-500">
                    Analysing first gives you a match score and feedback. Rewriting directly optimizes your CV for the job.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAnalyse}
                    disabled={analyser.loading}
                    className="w-full py-4 bg-white border-2 border-violet-200 hover:border-violet-500 text-violet-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">🔍</span>
                    <div className="text-left">
                      <p className="font-semibold">Analyse my CV</p>
                      <p className="text-xs text-zinc-400 font-normal">Get a match score and gap analysis first</p>
                    </div>
                  </button>

                  <button
                    onClick={handleRewrite}
                    disabled={rewriter.loading}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">✨</span>
                    <div className="text-left">
                      <p className="font-semibold">Rewrite & optimize CV</p>
                      <p className="text-xs text-violet-200 font-normal">Directly rewrite CV for this job</p>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Loading states */}
            {(analyser.loading || rewriter.loading) && (
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                {mode === 'analyse' ? 'Analysing your CV against the job description...' : `Rewriting your CV for ${form.targetRole}...`}
              </div>
            )}

            {/* Show output as soon as it exists */}
            {(output || analysisOutput) ? (
              <div className="flex flex-col gap-4">
                {mode === 'analyse' && analysisOutput && (
                  <>
                    <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                      <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                        {analysisOutput}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleRewrite}
                        disabled={rewriter.loading}
                        className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
                      >
                        Now rewrite my CV ✨
                      </button>
                      <button
                        onClick={resetAll}
                        className="px-4 py-3 border border-zinc-200 text-zinc-600 text-sm rounded-xl hover:bg-zinc-50 transition-colors"
                      >
                        Start over
                      </button>
                    </div>
                  </>
                )}
                {mode === 'rewrite' && output && (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {downloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                            </svg>
                            Download PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetAll}
                        className="px-4 py-3 border border-zinc-200 text-zinc-600 text-sm rounded-xl hover:bg-zinc-50 transition-colors"
                      >
                        Start over
                      </button>
                    </div>
                    <div id="cv-analyser-preview" className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
                      <div style={{ minWidth: '600px' }}>
                        <CVRenderer
                          ref={cvRef}
                          sections={parsedSections}
                          header={headerInfo}
                          style={style}
                        />
                      </div>
                    </div>
                    {currentCV && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                        <CVChat
                          currentCV={currentCV}
                          onUpdate={cvChat}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-200 py-16">
                <div className="text-center text-zinc-400">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm">Upload a CV and job description to get started</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              {step === 2 ? 'Proceed' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}