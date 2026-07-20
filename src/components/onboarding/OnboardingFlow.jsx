import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { updateProfile } from '../../services/memory'

const languages = [
  { code: 'english', label: 'English', flag: '🇬🇧', desc: 'Default' },
  { code: 'pidgin', label: 'Pidgin', flag: '🇳🇬', desc: 'Nigerian Pidgin' },
  { code: 'yoruba', label: 'Yoruba', flag: '🟢', desc: 'Yoruba-English mix' },
  { code: 'hausa', label: 'Hausa', flag: '🔵', desc: 'Hausa-English mix' },
]

const useCases = [
  { id: 'work', label: 'Work & Career', icon: '💼', desc: 'CVs, emails, proposals' },
  { id: 'study', label: 'Study & Research', icon: '📚', desc: 'Essays, research, quizzes' },
  { id: 'code', label: 'Coding', icon: '💻', desc: 'Build and debug software' },
  { id: 'creative', label: 'Creative work', icon: '🎨', desc: 'Writing, images, ideas' },
  { id: 'general', label: 'General assistant', icon: '💬', desc: 'A bit of everything' },
]

const STEPS = ['welcome', 'name', 'language', 'usecase', 'done']

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('english')
  const [selectedUseCase, setSelectedUseCase] = useState('')
  const [saving, setSaving] = useState(false)

  async function completeOnboarding() {
    const profileUpdates = {
      name: name.trim() || user?.profile?.name || user?.displayName || '',
      language,
      useCase: selectedUseCase || user?.profile?.useCase || '',
      onboarded: true,
    }

    if (user?.uid) {
      try {
        await updateProfile(user.uid, profileUpdates)
      } catch (err) {
        console.error('Onboarding save error:', err)
      }
    }

    setUser({
      ...(user || {}),
      profile: {
        ...(user?.profile || {}),
        ...profileUpdates,
      },
    })

    navigate('/chat')
  }

  async function handleFinish() {
    if (saving) return

    setSaving(true)
    try {
      await completeOnboarding()
    } finally {
      setSaving(false)
    }
  }

  async function skip() {
    if (saving) return

    setSaving(true)
    try {
      await completeOnboarding()
    } finally {
      setSaving(false)
    }
  }

  function next() {
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.slice(1).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300
                ${i < step
                  ? 'bg-violet-600 w-6'
                  : i === step - 1
                    ? 'bg-violet-600 w-6'
                    : 'bg-zinc-200 w-3'
                }`}
            />
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-200">
              <span className="text-white text-3xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Welcome to Ace</h1>
              <p className="text-zinc-500 mt-2 leading-relaxed">
                Your AI workspace for writing, coding, research, and more. Let's set things up in 30 seconds.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={next}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-2xl transition-colors"
              >
                Get started
              </button>
              <button
                onClick={skip}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Skip setup
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Name */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">What should I call you?</h2>
              <p className="text-sm text-zinc-500 mt-1">Ace will use this to personalise your experience.</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()}
              placeholder="Enter your name"
              autoFocus
              className="w-full px-5 py-4 border-2 border-zinc-200 focus:border-violet-500 rounded-2xl text-base outline-none transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3.5 border border-zinc-200 text-zinc-600 font-medium rounded-2xl hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={next}
                disabled={!name.trim()}
                className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-medium rounded-2xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Language */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Choose your language</h2>
              <p className="text-sm text-zinc-500 mt-1">Ace speaks your language.</p>
            </div>
            <div className="flex flex-col gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
                    ${language === lang.code
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-violet-300'
                    }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className={`font-semibold text-sm ${language === lang.code ? 'text-violet-700' : 'text-zinc-800'}`}>
                      {lang.label}
                    </p>
                    <p className="text-xs text-zinc-400">{lang.desc}</p>
                  </div>
                  {language === lang.code && (
                    <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 border border-zinc-200 text-zinc-600 font-medium rounded-2xl hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-2xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Use case */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">What will you use Ace for?</h2>
              <p className="text-sm text-zinc-500 mt-1">Pick your primary use case.</p>
            </div>
            <div className="flex flex-col gap-2">
              {useCases.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => setSelectedUseCase(uc.id)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
                    ${selectedUseCase === uc.id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-violet-300'
                    }`}
                >
                  <span className="text-2xl">{uc.icon}</span>
                  <div>
                    <p className={`font-semibold text-sm ${selectedUseCase === uc.id ? 'text-violet-700' : 'text-zinc-800'}`}>
                      {uc.label}
                    </p>
                    <p className="text-xs text-zinc-400">{uc.desc}</p>
                  </div>
                  {selectedUseCase === uc.id && (
                    <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 border border-zinc-200 text-zinc-600 font-medium rounded-2xl hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={next}
                disabled={!selectedUseCase}
                className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-medium rounded-2xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                You're all set{name ? `, ${name.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-zinc-500 mt-2 leading-relaxed">
                Ace is ready. Start with a conversation, explore the tools, or ask anything.
              </p>
            </div>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                'Start using Ace →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}