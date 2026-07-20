import { useState, useEffect, useCallback } from 'react'
import { useDojo } from '../../../hooks/useDojo'
import { buildFlashcardsPrompt } from '../../../prompts/tools/dojoPrompt'

function parseFlashcards(text) {
  if (!text) return []
  const cards = []
  const blocks = text.split(/CARD\s+#?\d+/i).filter(Boolean)

  for (const block of blocks) {
    const qMatch = block.match(/(?:Q|QUESTION):\s*(.+?)(?=(?:A|ANSWER):|$)/is)
    const aMatch = block.match(/(?:A|ANSWER):\s*(.+?)(?=(?:Q|QUESTION):|$)/is)
    
    if (qMatch && aMatch) {
      cards.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
      })
    }
  }
  return cards
}

function FlashCard({ card, index, total, onFlip, flipped }) {
  const [known, setKnown] = useState(null)

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 3D Flippable Card Container */}
      <div
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label="Tap to flip card"
        className="group relative w-full cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-3xl"
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative w-full transition-all duration-500 ease-out shadow-lg rounded-3xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '300px',
          }}
        >
          {/* FRONT FACE (Question) - Crisp White with Bright Violet Accents & Deep Black Text */}
          <div
            className="absolute inset-0 w-full h-full bg-slate-950 border-2 border-blue-900/70 rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
            style={{ backfaceVisibility: 'hidden', color: '#f8fafc' }}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-600">
              <span>Card {index + 1} of {total}</span>
              <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
                QUESTION
              </span>
            </div>

            {/* Explicit dark slate text (#0f172a) so it NEVER washes out to ash/grey */}
            <div className="my-auto py-6 flex items-center justify-center">
              <p 
                className="text-lg sm:text-xl md:text-2xl font-bold text-center leading-relaxed max-w-prose"
                style={{ color: '#f8fafc' }}
              >
                {card.question}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-500 group-hover:text-blue-700 transition-colors pt-3 border-t border-blue-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Tap or press Space to flip</span>
            </div>
          </div>

          {/* BACK FACE (Answer) - Rich Vibrant Indigo & Violet Gradient */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 border-2 border-blue-400 rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between shadow-xl text-white overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-100">
              <span>Card {index + 1} of {total}</span>
              <span className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm">
                ANSWER
              </span>
            </div>

            <div className="my-auto py-6 flex items-center justify-center">
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white text-center leading-relaxed max-w-prose shadow-sm">
                {card.answer}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-100 pt-3 border-t border-white/20">
              <span>Did you get it right?</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className={`transition-all duration-300 ${flipped ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden pointer-events-none'}`}>
        {known === null ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setKnown(false); }}
              className="min-h-[48px] py-3 px-4 bg-red-50 hover:bg-red-100 active:bg-red-200 border-2 border-red-200 text-red-700 text-sm sm:text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>✗</span> Didn't know
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setKnown(true); }}
              className="min-h-[48px] py-3 px-4 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border-2 border-emerald-300 text-emerald-800 text-sm sm:text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>✓</span> Got it
            </button>
          </div>
        ) : (
          <div
            className={`min-h-[48px] flex items-center justify-center py-3 px-4 text-sm sm:text-base font-bold rounded-2xl transition-all shadow-sm animate-fade-in
              ${known ? 'text-emerald-800 bg-emerald-100 border-2 border-emerald-300' : 'text-red-700 bg-red-100 border-2 border-red-300'}`}
          >
            {known ? '✓ Marked as known' : '✗ Marked for review'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DojoFlashcards() {
  const { generateContent, generatingTab, generatedContent, readySources } = useDojo()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const content = generatedContent['flashcards']
  const isGenerating = generatingTab === 'flashcards'
  const cards = parseFlashcards(content)

  const handleNext = useCallback(() => {
    setFlipped(false)
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setSessionComplete(true)
    }
  }, [currentIndex, cards.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setFlipped(false)
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  function handleRestart() {
    setFlipped(false)
    setCurrentIndex(0)
    setSessionComplete(false)
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (isGenerating || cards.length === 0 || sessionComplete) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGenerating, cards.length, sessionComplete, handleNext, handlePrev])

  if (readySources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_45%),_#020617]">
        <div className="w-16 h-16 bg-blue-950/70 text-blue-400 rounded-3xl flex items-center justify-center text-3xl shadow-inner mb-2 border border-blue-800">
          🃏
        </div>
        <p className="text-base font-bold text-slate-100">Add sources first</p>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed">
          Upload content on the left, then generate flashcards to test your knowledge.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_45%),_#020617]">
      {/* Top Bar */}
      <div className="px-4 sm:px-6 py-4 bg-slate-950/90 border-b border-blue-900/60 flex items-center justify-between flex-shrink-0 backdrop-blur-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <span>🃏</span> Flashcards
          </h2>
          <p className="text-[11px] sm:text-xs font-medium text-blue-600 mt-0.5">Active recall & spaced repetition</p>
        </div>

        {cards.length > 0 && !isGenerating && (
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs font-bold text-blue-100 bg-blue-950/80 border border-blue-700 px-3 py-1 rounded-full">
              {currentIndex + 1} / {cards.length}
            </span>
            <button
              onClick={() => {
                handleRestart()
                generateContent('flashcards', buildFlashcardsPrompt)
              }}
              className="text-xs font-bold text-slate-300 hover:text-blue-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-950/70 border border-transparent hover:border-blue-800"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col justify-center">
        
        {/* 1. Initial State */}
        {!content && !isGenerating && (
          <div className="flex flex-col items-center justify-center my-auto gap-5 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-md border border-blue-200">
              🃏
            </div>
            <div>
              <p className="text-base font-bold text-slate-100">Ready to test your memory?</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Ace will extract key concepts and build active-recall cards from your uploaded sources.
              </p>
            </div>
            <button
              onClick={() => generateContent('flashcards', buildFlashcardsPrompt)}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>✨</span> Generate flashcards
            </button>
          </div>
        )}

        {/* 2. Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center my-auto gap-3">
            <div className="flex items-center gap-3 bg-slate-900/80 border-2 border-blue-800 shadow-md rounded-2xl px-6 py-4 text-sm font-bold text-blue-200">
              <div className="w-5 h-5 border-[2.5px] border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Creating study flashcards...</span>
            </div>
            <p className="text-xs font-semibold text-slate-400">Extracting high-yield questions from sources</p>
          </div>
        )}

        {/* 3. Fallback/Error State */}
        {content && cards.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center my-auto gap-4 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center text-3xl shadow-md border border-amber-200">
              ⚠️
            </div>
            <div>
              <p className="text-base font-bold text-slate-100">Couldn't format flashcards</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Ace generated a response, but it didn't match the card layout. Let's try generating them again!
              </p>
            </div>
            <button
              onClick={() => generateContent('flashcards', buildFlashcardsPrompt)}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all"
            >
              Regenerate cards
            </button>
          </div>
        )}

        {/* 4. Active Deck State */}
        {cards.length > 0 && !isGenerating && !sessionComplete && (
          <div className="flex flex-col gap-6 w-full max-w-xl mx-auto my-auto">
            <FlashCard
              key={currentIndex}
              card={cards[currentIndex]}
              index={currentIndex}
              total={cards.length}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
            />

            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden p-0.5 border border-blue-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="min-h-[48px] flex-1 py-3 px-4 bg-slate-900/80 border-2 border-slate-700 text-slate-200 font-bold text-sm rounded-2xl hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm flex items-center justify-center gap-2"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="min-h-[48px] flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {currentIndex === cards.length - 1 ? 'Finish Session →' : 'Next Card →'}
              </button>
            </div>
          </div>
        )}

        {/* 5. Session Complete State */}
        {sessionComplete && (
          <div className="flex flex-col items-center justify-center my-auto gap-5 text-center max-w-sm mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl shadow-md border border-emerald-200">
              🎉
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Session Complete!</h3>
              <p className="text-sm font-medium text-slate-400 mt-1">
                You just reviewed all {cards.length} cards from this deck. Great job keeping up with your spaced repetition.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <button
                onClick={handleRestart}
                className="min-h-[48px] flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-2xl shadow-md transition-all"
              >
                Study again
              </button>
              <button
                onClick={() => {
                  handleRestart()
                  generateContent('flashcards', buildFlashcardsPrompt)
                }}
                className="min-h-[48px] flex-1 py-3 px-6 bg-slate-900/80 border-2 border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl shadow-sm transition-all"
              >
                New deck
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}