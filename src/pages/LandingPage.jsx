import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import GrimMascot from '../components/mascot/GrimMascot'
import { useUserStore } from '../store/userStore'
import SplashLoader from '../components/SplashLoader'

let audioCtx = null
function sound(kind) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const t = audioCtx.currentTime
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g); g.connect(audioCtx.destination)
    if (kind === 'growl') {
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(110, t)
      o.frequency.exponentialRampToValueAtTime(60, t + 0.45)
      const lfo = audioCtx.createOscillator(), lg = audioCtx.createGain()
      lfo.frequency.value = 28; lg.gain.value = 14
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.45)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
      o.start(t); o.stop(t + 0.45)
    } else {
      o.type = 'sine'
      o.frequency.setValueAtTime(880, t)
      o.frequency.exponentialRampToValueAtTime(1500, t + 0.09)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
      o.start(t); o.stop(t + 0.15)
    }
  } catch { /* silent */ }
}
function ScrollGrim({ mood, soundOn }) {
  const rig = useRef(null)
  const hop = useRef(null)
  const taps = useRef({ n: 0, t: 0 })
  const timers = useRef([])
  const [poke, setPoke] = useState(null)
  const [size, setSize] = useState(() => (window.innerWidth < 640 ? 76 : 112))

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let stopTimer
    const update = () => {
      raf = 0
      const s = window.innerWidth < 640 ? 76 : 112
      setSize((cur) => (cur === s ? cur : s))
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      const range = Math.max(0, window.innerWidth - s - 24)
      const x = 12 + range * (0.5 + 0.5 * Math.sin(p * Math.PI * 5 - Math.PI / 2))
      if (rig.current) rig.current.style.transform = `translate3d(${x}px,0,0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
      if (reduce || !hop.current) return
      hop.current.classList.add('grim-hopping')
      clearTimeout(stopTimer)
      stopTimer = setTimeout(() => hop.current?.classList.remove('grim-hopping'), 160)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(stopTimer)
      timers.current.forEach(clearTimeout)
    }
  }, [])

  function onPoke() {
    const now = performance.now()
    taps.current = now - taps.current.t < 1500 ? { n: taps.current.n + 1, t: now } : { n: 1, t: now }
    timers.current.forEach(clearTimeout)
    const el = hop.current
    if (el) { el.classList.remove('grim-squish'); void el.offsetWidth; el.classList.add('grim-squish') }
    if (taps.current.n >= 4) {
      taps.current.n = 0
      if (soundOn) sound('growl')
      setPoke('oops')
      timers.current = [setTimeout(() => setPoke(null), 900)]
      return
    }
    if (soundOn) sound('teet')
    setPoke('celebrate')
    timers.current = [setTimeout(() => setPoke('safe'), 450), setTimeout(() => setPoke(null), 1000)]
  }

  return (
    <div ref={rig} className="pointer-events-none fixed bottom-3 left-0 z-40 will-change-transform">
      <button ref={hop} onPointerDown={onPoke} aria-label="Poke Grim"
        className="pointer-events-auto block touch-manipulation select-none bg-transparent border-0 p-0 cursor-pointer">
        <GrimMascot mood={poke || mood} size={size} />
      </button>
    </div>
  )
}

function Reveal({ children, className = '' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`transition-all duration-700 motion-reduce:transition-none ${on ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}>
      {children}
    </div>
  )
}

const greetings = [
  { lang: 'English', text: 'Good morning. What are we working on today?' },
  { lang: 'Pidgin', text: 'How far? Wetin we dey do today?' },
  { lang: 'Yoruba', text: 'E ku aaro. Ki la fe se lonii?' },
  { lang: 'Hausa', text: 'Barka da safe. Me za mu yi yau?' },
]

const uses = [
  { icon: 'WF', title: 'Work and career', text: 'CVs, emails and proposals that sound like you.' },
  { icon: 'ST', title: 'Study and research', text: 'Essays, research and quizzes when exams are close.' },
  { icon: 'CD', title: 'Coding', text: 'Build and debug software with an answer you can run.' },
  { icon: 'CR', title: 'Creative work', text: 'Writing, ideas and images when you are stuck.' },
]

export default function LandingPage() {
  const user = useUserStore((s) => s.user)
  const loading = useUserStore((s) => s.loading)
  const [mood, setMood] = useState('welcome')
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('grim_sound') !== '0' } catch { return true }
  })

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setMood(e.target.dataset.mood)),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll('[data-mood]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  if (loading) return <SplashLoader />
  if (user) return <Navigate to="/chat" replace />

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    try { localStorage.setItem('grim_sound', next ? '1' : '0') } catch { /* ignore */ }
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-100 bg-white/80 px-5 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <span className="text-xl font-extrabold tracking-tight text-[#0066FF]">Ace</span>
        <nav className="flex items-center gap-2">
          <button onClick={toggleSound} aria-label={soundOn ? 'Mute Grim' : 'Unmute Grim'} className="min-h-11 min-w-11 rounded-xl text-lg">
            {soundOn ? 'SOUND ON' : 'MUTED'}
          </button>
          <Link to="/login" className="min-h-11 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">Sign in</Link>
          <Link to="/signup" className="min-h-11 rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white">Get started</Link>
        </nav>
      </header>
      <section data-mood="welcome" className="bg-gradient-to-b from-blue-50 to-white px-6 pb-28 pt-16 text-center dark:from-zinc-900 dark:to-zinc-950 sm:pt-24">
        <Reveal>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Your AI workspace, built for how <span className="text-[#0066FF]">we</span> work and study.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
            Chat in English, Pidgin, Yoruba or Hausa. Write, research, code and revise in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="min-h-12 w-full rounded-2xl bg-[#0066FF] px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 sm:w-auto">Start free</Link>
            <Link to="/login" className="min-h-12 w-full rounded-2xl border border-zinc-200 px-8 py-3.5 font-semibold dark:border-zinc-700 sm:w-auto">I have an account</Link>
          </div>
          <p className="mt-6 text-sm text-zinc-400">Scroll down. Grim will tag along. Poke him.</p>
        </Reveal>
      </section>
      <section data-mood="happy" className="px-6 py-24">
        <Reveal className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Ace speaks your language</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {greetings.map((g) => (
              <div key={g.lang} className="rounded-3xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-bold uppercase tracking-wider text-[#06B6D4]">{g.lang}</p>
                <p className="mt-2 text-lg font-medium">{g.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section data-mood="think" className="bg-zinc-50 px-6 py-24 dark:bg-zinc-900/50">
        <Reveal className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">One place for the work that matters</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {uses.map((u) => (
              <div key={u.title} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-900">
                <div className="text-3xl">{u.icon}</div>
                <h3 className="mt-3 text-lg font-bold">{u.title}</h3>
                <p className="mt-1 text-zinc-600 dark:text-zinc-300">{u.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section data-mood="celebrate" className="px-6 py-28 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold sm:text-5xl">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-600 dark:text-zinc-300">Create your account in under a minute.</p>
          <Link to="/signup" className="mt-8 inline-block min-h-12 rounded-2xl bg-[#0066FF] px-10 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30">Get started</Link>
        </Reveal>
      </section>
      <footer className="px-6 pb-32 pt-6 text-center text-sm text-zinc-400">Ace</footer>
      <ScrollGrim mood={mood} soundOn={soundOn} />
    </div>
  )
}

