import { useEffect, useState } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter') // enter → pulse → text → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('pulse'), 600)
    const t2 = setTimeout(() => setPhase('text'), 1400)
    const t3 = setTimeout(() => setPhase('exit'), 2800)
    const t4 = setTimeout(() => onComplete?.(), 3400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500
        ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Glow background */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: phase === 'pulse' || phase === 'text'
            ? 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)'
            : 'transparent',
        }}
      />

      {/* Logo */}
      <div
        className="relative transition-all duration-700"
        style={{
          transform: phase === 'enter'
            ? 'scale(0.6) translateY(20px)'
            : phase === 'exit'
              ? 'scale(1.05) translateY(-10px)'
              : 'scale(1) translateY(0)',
          opacity: phase === 'enter' ? 0 : 1,
        }}
      >
        {/* Outer ring animation */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-1000"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(37,99,235,0.6), transparent)',
            transform: phase === 'pulse' || phase === 'text' ? 'scale(1.15) rotate(180deg)' : 'scale(1) rotate(0deg)',
            opacity: phase === 'pulse' || phase === 'text' ? 0.6 : 0,
            filter: 'blur(8px)',
          }}
        />

        {/* Logo image */}
        <img
          src="/logo.png"
          alt="Ace"
          className="relative z-10 transition-all duration-700"
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            filter: phase === 'pulse' || phase === 'text'
              ? 'drop-shadow(0 0 30px rgba(37,99,235,0.8)) drop-shadow(0 0 60px rgba(37,99,235,0.4))'
              : 'none',
          }}
        />

        {/* Pulse rings */}
        {(phase === 'pulse' || phase === 'text') && (
          <>
            <div
              className="absolute inset-0 rounded-full border border-blue-500 animate-ping"
              style={{ opacity: 0.3, animationDuration: '1.5s' }}
            />
            <div
              className="absolute inset-0 rounded-full border border-blue-400 animate-ping"
              style={{ opacity: 0.15, animationDuration: '2s', animationDelay: '0.3s' }}
            />
          </>
        )}
      </div>

      {/* App name */}
      <div
        className="mt-8 text-center transition-all duration-500"
        style={{
          opacity: phase === 'text' ? 1 : 0,
          transform: phase === 'text' ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        <h1 className="text-white text-4xl font-bold tracking-tight">
          Ace
        </h1>
        <p
          className="text-blue-400 text-sm mt-2 tracking-widest uppercase"
          style={{ letterSpacing: '0.3em' }}
        >
          Your AI Workspace
        </p>
      </div>

      {/* Loading bar */}
      <div
        className="absolute bottom-12 w-32 transition-all duration-500"
        style={{ opacity: phase === 'text' ? 1 : 0 }}
      >
        <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{
              width: phase === 'text' ? '100%' : '0%',
              transition: 'width 1.2s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  )
}