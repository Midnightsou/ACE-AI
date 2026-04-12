import { useState, useEffect, useRef } from 'react'
import { getAvailableVoices, pickVoices, speakSegment } from '../../../services/podcast'

export default function PodcastPlayer({ segments }) {
  const [voices, setVoices] = useState({ alex: null, sam: null })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const playingRef = useRef(false)
  const currentRef = useRef(0)

  useEffect(() => {
    getAvailableVoices().then((all) => {
      const picked = pickVoices(all)
      setVoices(picked)
      setLoading(false)
    })

    return () => {
      window.speechSynthesis.cancel()
      playingRef.current = false
    }
  }, [])

  async function playFrom(index) {
    if (index >= segments.length) {
      setPlaying(false)
      playingRef.current = false
      setCurrentIndex(0)
      currentRef.current = 0
      return
    }

    playingRef.current = true
    setCurrentIndex(index)
    currentRef.current = index

    const seg = segments[index]
    const voice = seg.speaker === 'ALEX' ? voices.alex : voices.sam
    const pitch = seg.speaker === 'ALEX' ? 1.1 : 0.9
    const rate = seg.speaker === 'ALEX' ? 0.95 : 0.9

    try {
      await speakSegment(seg.text, voice, rate, pitch)
      if (playingRef.current) {
        await playFrom(currentRef.current + 1)
      }
    } catch {
      setPlaying(false)
      playingRef.current = false
    }
  }

  function handlePlay() {
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      playingRef.current = false
    } else {
      setPlaying(true)
      playFrom(currentIndex)
    }
  }

  function handleSkipBack() {
    const newIndex = Math.max(0, currentIndex - 1)
    window.speechSynthesis.cancel()
    setCurrentIndex(newIndex)
    currentRef.current = newIndex
    if (playing) playFrom(newIndex)
  }

  function handleSkipForward() {
    const newIndex = Math.min(segments.length - 1, currentIndex + 1)
    window.speechSynthesis.cancel()
    setCurrentIndex(newIndex)
    currentRef.current = newIndex
    if (playing) playFrom(newIndex)
  }

  function handleJump(index) {
    window.speechSynthesis.cancel()
    setCurrentIndex(index)
    currentRef.current = index
    if (!playing) setPlaying(true)
    playFrom(index)
  }

  const current = segments[currentIndex]
  const isAlex = current?.speaker === 'ALEX'
  const progress = segments.length > 0 ? ((currentIndex) / segments.length) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        Loading voices...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Now speaking */}
      <div className={`rounded-2xl p-4 border ${isAlex ? 'bg-violet-50 border-violet-200' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isAlex ? 'bg-violet-600' : 'bg-zinc-700'}`}>
            {current?.speaker?.[0] || 'A'}
          </div>
          <div>
            <p className={`text-xs font-bold ${isAlex ? 'text-violet-700' : 'text-zinc-700'}`}>
              {isAlex ? 'Alex (Host)' : 'Sam (Guest)'}
            </p>
            <p className="text-xs text-zinc-400">
              Segment {currentIndex + 1} of {segments.length}
            </p>
          </div>
          {playing && (
            <div className="ml-auto flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full animate-pulse ${isAlex ? 'bg-violet-400' : 'bg-zinc-400'}`}
                  style={{
                    height: `${8 + i * 4}px`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed">
          {current?.text}
        </p>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handleSkipBack}
          disabled={currentIndex === 0}
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="19 20 9 12 19 4 19 20"/>
            <line x1="5" y1="19" x2="5" y2="5"/>
          </svg>
        </button>

        <button
          onClick={handlePlay}
          className="w-12 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        <button
          onClick={handleSkipForward}
          disabled={currentIndex === segments.length - 1}
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="5 4 15 12 5 20 5 4"/>
            <line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>

      {/* Voice info */}
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
        <span>Alex → {voices.alex?.name || 'Default'}</span>
        <span>·</span>
        <span>Sam → {voices.sam?.name || 'Default'}</span>
      </div>

      {/* Segment list */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {segments.map((seg, i) => (
          <button
            key={i}
            onClick={() => handleJump(i)}
            className={`flex items-start gap-3 px-3 py-2 rounded-xl text-left transition-colors text-xs
              ${i === currentIndex
                ? 'bg-violet-50 border border-violet-200'
                : 'hover:bg-zinc-50'
              }`}
          >
            <span className={`font-bold flex-shrink-0 mt-0.5 w-8 ${seg.speaker === 'ALEX' ? 'text-violet-600' : 'text-zinc-500'}`}>
              {seg.speaker === 'ALEX' ? 'Alex' : 'Sam'}
            </span>
            <span className="text-zinc-600 line-clamp-2">{seg.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}