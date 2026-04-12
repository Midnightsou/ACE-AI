import { useDojoStore } from '../../../store/dojoStore'
import SourcePanel from './SourcePanel'
import DojoChat from './DojoChat'
import DojoGenerateTab from './DojoGenerateTab'
import DojoPodcast from './DojoPodcast'

export default function Dojo() {
  const { sources, activeTab, setActiveTab, clearSession } = useDojoStore()
  const readySources = sources.filter((s) => !s.loading && !s.error && s.content)
  const hasContent = readySources.length > 0

  const tabs = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'summary', label: 'Summary', icon: '📋' },
    { id: 'concepts', label: 'Key concepts', icon: '💡' },
    { id: 'quiz', label: 'Quiz', icon: '❓' },
    { id: 'podcast', label: 'Podcast', icon: '🎙' },
  ]

  function renderTab() {
    if (!hasContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-3xl">
            🥋
          </div>
          <div>
            <p className="font-semibold text-zinc-700">Add sources to get started</p>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">
              Upload PDFs, paste text, or add URLs on the left. Then chat with your content, generate summaries, quizzes, and podcasts.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-zinc-400 mt-2">
            {['📄 PDF', '📝 DOCX', '🔗 URL', '📋 Paste', '🖼 Image'].map((s) => (
              <span key={s} className="px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">{s}</span>
            ))}
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'chat': return <DojoChat />
      case 'summary': return <DojoGenerateTab tabId="summary" />
      case 'concepts': return <DojoGenerateTab tabId="concepts" />
      case 'quiz': return <DojoGenerateTab tabId="quiz" />
      case 'podcast': return <DojoPodcast />
      default: return <DojoChat />
    }
  }

  return (
    <div className="flex h-full">

      {/* Left — sources */}
      <div
        className="w-72 flex-shrink-0 border-r border-zinc-100 flex flex-col bg-white"
        style={{ maxHeight: 'calc(100dvh - 57px)' }}
      >
        <SourcePanel />
      </div>

      {/* Right — tabs */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ maxHeight: 'calc(100dvh - 57px)' }}
      >
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-zinc-100 bg-white flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          {hasContent && (
            <button
              onClick={clearSession}
              className="ml-auto text-xs text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0 pl-2"
            >
              New session
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {renderTab()}
        </div>
      </div>
    </div>
  )
}