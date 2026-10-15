import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GrimMascot from '../GrimMascot'
import { markTourDone } from './tour'

const slides = [
  { mood: 'welcome', title: 'Meet Ace', text: 'Your AI workspace for writing, studying, coding and getting work done.' },
  { mood: 'happy', title: 'Tools for real tasks', text: 'CV Maker, Essay Writer, Email Composer, Codex and more, all in one place.' },
  { mood: 'think', title: 'Study smarter', text: 'Turn your notes into flashcards, quizzes and summaries with Dojo.' },
  { mood: 'celebrate', title: "You're ready", text: 'Start a chat, or pick a tool. You can replay this tour from your profile.' },
]

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const last = i === slides.length - 1
  const s = slides[i]

  function finish() {
    try { markTourDone() } catch { /* private mode: tour may repeat, nothing breaks */ }
    navigate('/chat', { replace: true })
  }

  const next = () => (last ? finish() : setI((n) => n + 1))
  const back = () => setI((n) => Math.max(0, n - 1))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') back()
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-4 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={slides.length} aria-valuenow={i + 1} aria-label="Onboarding progress">
          {slides.map((_, n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= i ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          ))}
        </div>
        {!last && (
          <button onClick={finish} className="min-h-11 min-w-11 px-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 rounded-lg">
            Skip
          </button>
        )}
      </div>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div key={i}>
          <GrimMascot mood={s.mood} size={190} />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{s.title}</h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-zinc-600 dark:text-zinc-300">{s.text}</p>
      </main>
      <div className="flex gap-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {i > 0 && (
          <button onClick={back} className="min-h-12 flex-1 rounded-2xl border border-zinc-200 font-semibold text-zinc-700 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
            Back
          </button>
        )}
        <button onClick={next} className="min-h-12 flex-[2] rounded-2xl bg-violet-600 hover:bg-violet-700 font-semibold text-white shadow-lg shadow-violet-600/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
          {last ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  )
}
