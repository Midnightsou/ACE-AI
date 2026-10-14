import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { markTourDone } from './tour'

const slides = [
  { icon: '💬', title: 'Chat with Ace', desc: 'Ask anything: writing, coding, research, homework help.' },
  { icon: '🛠️', title: 'Smart tools', desc: 'CV Maker, Essay Writer, Email Composer, Codex and more, all in one place.' },
  { icon: '🌍', title: 'Speaks your language', desc: 'English, Pidgin, Yoruba or Hausa. Change it anytime in your profile.' },
  { icon: '📚', title: 'Study better', desc: 'Dojo turns your notes into flashcards, quizzes and summaries.' },
]

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const last = i === slides.length - 1

  function finish() {
    markTourDone()
    navigate('/chat', { replace: true })
  }

  const s = slides[i]

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <div className="flex gap-2">
          {slides.map((_, n) => (
            <div key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-violet-600' : 'w-3 bg-zinc-200'}`} />
          ))}
        </div>
        <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center text-4xl">{s.icon}</div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">{s.title}</h2>
          <p className="text-zinc-500 mt-2 leading-relaxed">{s.desc}</p>
        </div>
        <div className="flex gap-3 w-full">
          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="flex-1 py-3.5 border border-zinc-200 text-zinc-600 font-medium rounded-2xl">
              Back
            </button>
          )}
          <button
            onClick={last ? finish : () => setI(i + 1)}
            className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-2xl"
          >
            {last ? 'Get Started' : 'Next'}
          </button>
        </div>
        {!last && (
          <button onClick={finish} className="text-sm text-zinc-400 hover:text-zinc-600">
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
