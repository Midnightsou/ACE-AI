import { useState } from 'react'
import { useDojo } from '../../../hooks/useDojo'
import { buildFlashcardsPrompt } from '../../../prompts/tools/dojoPrompt'

function parseFlashcards(text) {
  if (!text) return []
  const cards = []
  const blocks = text.split(/CARD\s+\d+/i).filter(Boolean)

  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+?)(?=A:|$)/s)
    const aMatch = block.match(/A:\s*(.+?)(?=Q:|$)/s)
    if (qMatch && aMatch) {
      cards.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
      })
    }
  }
  return cards
}

function FlashCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(null)

  return (
    <div className="flex flex-col gap-3">
      {/* Card */}
      <div
        className="relative cursor-pointer select-none"
        onClick={() => setFlipped((v) => !v)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-all duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4">Question {index + 1} of {total}</p>
            <p className="text-base font-medium text-zinc-800 text-center leading-relaxed">
              {card.question}
            </p>
            <p className="text-xs text-zinc-400 mt-6">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-violet-600 border border-violet-500 rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-violet-200 uppercase tracking-wider mb-4">Answer</p>
            <p className="text-base text-white text-center leading-relaxed">
              {card.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Rating buttons — only show after flip */}
      {flipped && known === null && (
        <div className="flex gap-3">
          <button
            onClick={() => setKnown(false)}
            className="flex-1 py-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
          >
            ✗ Didn't know
          </button>
          <button
            onClick={() => setKnown(true)}
            className="flex-1 py-3 bg-green-50 border border-green-200 text-green-600 text-sm font-medium rounded-xl hover:bg-green-100 transition-colors"
          >
            ✓ Got it
          </button>
        </div>
      )}

      {known !== null && (
        <div className={`text-center py-2 text-sm font-medium rounded-xl
          ${known ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}
        >
          {known ? '✓ Marked as known' : '✗ Marked for review'}
        </div>
      )}
    </div>
  )
}

export default function DojoFlashcards() {
  const { generateContent, generatingTab, generatedContent, readySources } = useDojo()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)

  const content = generatedContent['flashcards']
  const isGenerating = generatingTab === 'flashcards'
  const cards = parseFlashcards(content)

  function handleNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setSessionComplete(true)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  function handleRestart() {
    setCurrentIndex(0)
    setSessionComplete(false)
  }

  if (readySources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="text-3xl">🃏</span>
        <p className="text-sm font-medium text-zinc-600">Add sources first</p>
        <p className="text-xs text-zinc-400 max-w-xs">Upload content then generate flashcards to test your knowledge.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-zinc-800">🃏 Flashcards</p>
          <p className="text-xs text-zinc-400 mt-0.5">Tap a card to flip it</p>
        </div>
        {cards.length > 0 && !isGenerating && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">{currentIndex + 1} / {cards.length}</span>
            <button
              onClick={() => generateContent('flashcards', buildFlashcardsPrompt)}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!content && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl">🃏</div>
            <div>
              <p className="text-sm font-medium text-zinc-700">Generate flashcards</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Ace will create question-answer cards from your sources. Flip each card to test yourself.
              </p>
            </div>
            <button
              onClick={() => generateContent('flashcards', buildFlashcardsPrompt)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>✨</span> Generate flashcards
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-700">
            <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Creating flashcards from your sources...
          </div>
        )}

        {cards.length > 0 && !isGenerating && !sessionComplete && (
          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            <FlashCard
              card={cards[currentIndex]}
              index={currentIndex}
              total={cards.length}
            />

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 text-sm rounded-xl hover:bg-zinc-50 disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {currentIndex === cards.length - 1 ? 'Finish →' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {sessionComplete && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">🎉</div>
            <div>
              <p className="font-semibold text-zinc-800">Session complete!</p>
              <p className="text-sm text-zinc-400 mt-1">You reviewed all {cards.length} cards.</p>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Study again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}