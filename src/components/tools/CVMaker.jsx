import { useRef } from 'react'
import { useCVMakerStore } from '../../store/cvStore'
import { useTool } from '../../hooks/useTool'
import { useCVChat } from '../../hooks/useCVChat'
import ToolLayout from './ToolLayout'
import CVRenderer from './CVRenderer'
import CVStylePicker from './CVStylePicker'
import CVChat from './CVChat'
import { ToolField, ToolTextarea, GenerateButton } from './ToolInput'
import { buildCVPrompt } from '../../prompts/tools/cvMakerPrompt'
import { parseCV, extractHeaderInfo } from '../../utils/cvParser'
import { getToolById } from '../../tools/registry'

const tool = getToolById('cv-maker')
const STEPS = ['Personal', 'Experience', 'Education', 'Skills', 'Style', 'Preview']

export default function CVMaker() {
  const {
    step, setStep,
    form, updateForm,
    style, setStyle,
    output, setOutput,
    liveCV, setLiveCV,
    reset,
  } = useCVMakerStore()

  const { streaming, loading, error, generate } = useTool('cv-maker')
  const cvRef = useRef(null)
  const [downloading, setDownloading] = window.__react_useState_hack__ || [false, () => {}]

  // Use local state only for downloading since it doesn't need persistence
  const [downloadingState, setDownloading2] = [false, (v) => {}]

  const cvChat = useCVChat((updatedCV) => setLiveCV(updatedCV))

  function canProceed() {
    if (step === 0) return form.fullName.trim() && form.targetRole.trim()
    if (step === 1) return form.experience.trim()
    if (step === 2) return form.education.trim()
    if (step === 3) return form.skills.trim()
    return true
  }

  async function handleGenerate() {
    const { system, user } = buildCVPrompt(form)
    const result = await generate(system, user, {
      fullName: form.fullName,
      targetRole: form.targetRole,
    })
    if (result) setLiveCV(result)
  }

  async function handleDownloadPDF() {
    if (!cvRef.current) return
    setDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: 0,
          filename: `${form.fullName.replace(/\s+/g, '_')}_CV.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(cvRef.current)
        .save()
    } catch (err) {
      console.error('PDF error:', err)
      alert('Failed to export PDF. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  function handleStartOver() {
    reset()
    cvChat.reset()
    setLiveCV('')
    setStep(0)
    setForm({
      fullName: '', email: '', phone: '', location: '',
      linkedin: '', targetRole: '', summary: '', experience: '',
      education: '', skills: '', certifications: '', additional: '',
    })
  }

  // Use liveCV (from chat refinements) or original output
  const currentCV = liveCV || output
  const parsedSections = currentCV ? parseCV(currentCV) : null
  const headerInfo = extractHeaderInfo('', form)

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-300
                ${i <= step ? 'bg-violet-600' : 'bg-zinc-200'}`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">Step {step + 1} of {STEPS.length}</p>
          <p className="text-sm font-medium text-zinc-800">{STEPS[step]}</p>
        </div>

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <ToolField label="Full name" hint="Required">
              <input type="text" value={form.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
                placeholder="e.g. Chukwuemeka Okonkwo"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>
            <ToolField label="Target role" hint="Required">
              <input type="text" value={form.targetRole}
                onChange={(e) => updateForm('targetRole', e.target.value)}
                placeholder="e.g. Software Engineer, Marketing Manager"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>
            <ToolField label="Email">
              <input type="email" value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>
            <ToolField label="Phone">
              <input type="text" value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>
            <ToolField label="Location">
              <input type="text" value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>
            <ToolField label="LinkedIn">
              <input type="text" value={form.linkedin}
                onChange={(e) => updateForm('linkedin', e.target.value)}
                placeholder="linkedin.com/in/yourname"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </ToolField>
            <ToolField label="Professional summary" hint="Optional">
              <ToolTextarea value={form.summary}
                onChange={(v) => updateForm('summary', v)}
                placeholder="Briefly describe your background — AI will write one if left blank..."
                rows={3}
              />
            </ToolField>
          </div>
        )}

        {/* Step 1 — Experience */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-500 leading-relaxed">
              List your work experience naturally. Include company, role, dates, and key achievements.
            </p>
            <ToolField label="Work experience" hint="Required">
              <ToolTextarea value={form.experience}
                onChange={(v) => updateForm('experience', v)}
                placeholder={`Software Engineer at Paystack (2021–2023)\n- Built payment APIs used by 10,000+ merchants\n- Reduced transaction failure rate by 30%\n\nJunior Developer at Flutterwave (2019–2021)\n- Worked on mobile SDK for Android and iOS`}
                rows={10}
              />
            </ToolField>
          </div>
        )}

        {/* Step 2 — Education */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <ToolField label="Education" hint="Required">
              <ToolTextarea value={form.education}
                onChange={(v) => updateForm('education', v)}
                placeholder={`B.Sc Computer Science — University of Lagos (2015–2019)\nSecond Class Upper (2:1)`}
                rows={5}
              />
            </ToolField>
            <ToolField label="Certifications" hint="Optional">
              <ToolTextarea value={form.certifications}
                onChange={(v) => updateForm('certifications', v)}
                placeholder={`AWS Certified Developer (2022)\nGoogle Project Management Certificate (2023)`}
                rows={4}
              />
            </ToolField>
          </div>
        )}

        {/* Step 3 — Skills */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <ToolField label="Skills" hint="Required">
              <ToolTextarea value={form.skills}
                onChange={(v) => updateForm('skills', v)}
                placeholder={`React, Node.js, Python, PostgreSQL, AWS\nTeam leadership, project management\nEnglish (fluent), Yoruba (native)`}
                rows={5}
              />
            </ToolField>
            <ToolField label="Additional information" hint="Optional">
              <ToolTextarea value={form.additional}
                onChange={(v) => updateForm('additional', v)}
                placeholder="Volunteer work, publications, awards..."
                rows={3}
              />
            </ToolField>
          </div>
        )}

        {/* Step 4 — Style */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-zinc-500">
              Choose how your CV will look before generating.
            </p>
            <CVStylePicker style={style} onChange={setStyle} />

            {/* Mini preview */}
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
              <div style={{
                backgroundColor: style.palette.sidebar,
                padding: '16px 20px',
              }}>
                <p style={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '15px',
                  fontFamily: style.font.family,
                  margin: '0 0 2px',
                }}>
                  {form.fullName || 'Your Name'}
                </p>
                <p style={{
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: '11px',
                  fontFamily: style.font.family,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {form.targetRole || 'Your Role'}
                </p>
              </div>
              <div style={{ padding: '12px 20px', backgroundColor: '#fff' }}>
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: style.palette.light, marginBottom: '6px' }} />
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: style.palette.light, width: '70%', marginBottom: '6px' }} />
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: style.palette.light, width: '85%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Generate + Preview + Chat */}
        {step === 5 && (
          <div className="flex flex-col gap-5">

            {/* Generate button */}
            {!currentCV && (
              <>
                {/* Summary card */}
                <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <p className="text-sm font-semibold text-zinc-800">Ready to generate</p>
                  <div className="flex flex-col gap-2 text-sm">
                    {[
                      { label: 'Name', value: form.fullName },
                      { label: 'Target role', value: form.targetRole },
                      { label: 'Font', value: style.font.label },
                      { label: 'Color', value: style.palette.label },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-zinc-400">{label}</span>
                        <span className="font-medium text-zinc-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                )}

                <GenerateButton
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={loading}
                  label="Generate my CV"
                />
              </>
            )}

            {/* Streaming indicator */}
            {streaming && (
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Writing your CV...
              </div>
            )}

            {/* CV Preview + Chat */}
            {currentCV && !streaming && (
              <div className="flex flex-col gap-5">

                {/* Action buttons */}
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
                    onClick={handleStartOver}
                    className="px-4 py-3 border border-zinc-200 text-zinc-600 text-sm rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    Start over
                  </button>
                </div>

                {/* CV preview */}
                <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
                  <div style={{ minWidth: '600px' }}>
                    <CVRenderer
                      ref={cvRef}
                      sections={parsedSections}
                      header={headerInfo}
                      style={style}
                    />
                  </div>
                </div>

                {/* Chat refinement */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <CVChat
                    currentCV={currentCV}
                    onUpdate={cvChat}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              {step === 4 ? 'Review & Generate' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}