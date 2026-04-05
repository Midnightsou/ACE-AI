import { useDrill } from '../hooks/useDrill'
import { useNavigate } from 'react-router-dom'

const SUBJECTS = [
  'Mathematics', 'English', 'Physics', 'Chemistry',
  'Biology', 'Economics', 'Government', 'Literature', 'Geography'
]

const optionLetters = ['a', 'b', 'c', 'd']

export default function DrillPage() {
  const navigate = useNavigate()
  const {
    subject,
    setSubject,
    question,
    selectedAnswer,
    evaluation,
    loadingQuestion,
    loadingEval,
    sessionStats,
    generateQuestion,
    submitAnswer,
    resetSession,
  } = useDrill()

  function handleSubjectChange(s) {
    setSubject(s)
    resetSession()
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/chat')}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900">Dojo Mode</p>
          <p className="text-xs text-zinc-400">Practice past-style questions</p>
        </div>

        {/* Session stats */}
        {sessionStats.total > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 font-medium">{sessionStats.correct} correct</span>
            <span className="text-red-500 font-medium">{sessionStats.wrong} wrong</span>
            <span className="text-zinc-400">{sessionStats.total} total</span>
          </div>
        )}
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* Subject picker */}
        <div>
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Subject</p>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => handleSubjectChange(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${subject === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-violet-400'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Question card */}
        {!question && !loadingQuestion && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-12">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🎯</span>
            </div>
            <div>
              <p className="font-semibold text-zinc-800">Ready to drill?</p>
              <p className="text-sm text-zinc-500 mt-1">
                Practice JAMB-style {subject} questions and track your progress.
              </p>
            </div>
            <button
              onClick={generateQuestion}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Start drilling
            </button>
          </div>
        )}

        {loadingQuestion && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Generating question...</p>
          </div>
        )}

        {question && !loadingQuestion && (
          <div className="flex flex-col gap-4">

            {/* Question */}
            <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">
                  {subject}
                </span>
                <span className="text-xs text-zinc-400">JAMB style</span>
              </div>
              <p className="text-sm text-zinc-800 leading-relaxed font-medium">
                {question.question}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {optionLetters.map((letter) => {
                const value = question[letter]
                if (!value) return null

                const isSelected = selectedAnswer === letter.toUpperCase()
                const isCorrect = question.answer === letter.toUpperCase()
                const showResult = evaluation !== null

                let style = 'bg-white border-zinc-200 text-zinc-700 hover:border-violet-400'
                if (showResult && isCorrect) style = 'bg-green-50 border-green-400 text-green-800'
                else if (showResult && isSelected && !isCorrect) style = 'bg-red-50 border-red-400 text-red-800'
                else if (isSelected) style = 'bg-violet-50 border-violet-400 text-violet-800'

                return (
                  <button
                    key={letter}
                    onClick={() => !evaluation && submitAnswer(letter.toUpperCase())}
                    disabled={!!evaluation || loadingEval}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all disabled:cursor-default ${style}`}
                  >
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {letter.toUpperCase()}
                    </span>
                    <span>{value}</span>
                    {showResult && isCorrect && (
                      <span className="ml-auto text-green-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="ml-auto text-red-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Loading eval */}
            {loadingEval && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                Checking your answer...
              </div>
            )}

            {/* Evaluation result */}
            {evaluation && (
              <div className={`rounded-2xl p-4 text-sm leading-relaxed
                ${evaluation.correct
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <p className="font-semibold mb-1">
                  {evaluation.correct ? '✓ Correct!' : '✗ Not quite'}
                </p>
                <p>{evaluation.feedback}</p>
                {!evaluation.correct && question.explanation && (
                  <p className="mt-2 pt-2 border-t border-red-200 text-red-700">
                    {question.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Next question button */}
            {evaluation && (
              <button
                onClick={generateQuestion}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Next question →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}