import { useState } from 'react'
import { useDojoStore } from '../../../store/dojoStore'
import SourcePanel from './SourcePanel'
import DojoChat from './DojoChat'
import DojoGenerateTab from './DojoGenerateTab'
import DojoPodcast from './DojoPodcast'

const TABS = [
  { id: 'sources', label: 'Sources', icon: '📚', mobileOnly: true },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'concepts', label: 'Key concepts', icon: '💡' },
  { id: 'quiz', label: 'Quiz', icon: '❓' },
  { id: 'podcast', label: 'Podcast', icon: '🎙' },
]

export default function Dojo() {
  const { sources, activeTab, setActiveTab, clearSession } = useDojoStore()
  const [mobilePage, setMobilePage] = useState('sources')

  const readySources = sources.filter((s) => !s.loading && !s.error && s.content)
  const hasContent = readySources.length > 0

  function renderContent(tab) {
    if (!hasContent && tab !== 'sources') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-3xl">🥋</div>
          <div>
            <p className="font-semibold text-zinc-700">Add sources first</p>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">
              Go to Sources and upload PDFs, paste text, or add URLs.
            </p>
          </div>
          <button
            onClick={() => setMobilePage('sources')}
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl md:hidden"
          >
            Add sources
          </button>
        </div>
      )
    }

    switch (tab) {
      case 'chat': return <DojoChat />
      case 'concepts': return <DojoGenerateTab tabId="concepts" />
      case 'quiz': return <DojoGenerateTab tabId="quiz" />
      case 'podcast': return <DojoPodcast />
      default: return null
    }
  }

  // ── Mobile layout ──────────────────────────────────
  return (
    <>
      {/* ── MOBILE ── */}
      <div className="flex flex-col h-full md:hidden">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-100 flex-shrink-0">
          <p className="text-sm font-semibold text-zinc-800">
            {TABS.find((t) => t.id === mobilePage)?.icon}{' '}
            {mobilePage === 'sources' ? 'Sources' : TABS.find((t) => t.id === mobilePage)?.label}
          </p>
          {hasContent && mobilePage !== 'sources' && (
            <button
              onClick={clearSession}
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
            >
              New session
            </button>
          )}
        </div>

        {/* Mobile page content */}
        <div className="flex-1 overflow-hidden">
          {mobilePage === 'sources' ? (
            <SourcePanel />
          ) : (
            renderContent(mobilePage)
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="flex-shrink-0 border-t border-zinc-100 bg-white">
          <div className="flex items-center">
            {TABS.map((tab) => {
              const isActive = mobilePage === tab.id
              const isDisabled = tab.id !== 'sources' && !hasContent
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setMobilePage(tab.id)}
                  disabled={isDisabled}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors disabled:opacity-30
                    ${isActive ? 'text-violet-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <span className="text-lg leading-none">{tab.icon}</span>
                  <span className="text-xs font-medium leading-none">
                    {tab.id === 'sources'
                      ? `Sources${sources.length > 0 ? ` (${sources.length})` : ''}`
                      : tab.label}
                  </span>
                  {isActive && (
                    <div className="w-4 h-0.5 bg-violet-600 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex h-full">

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
          {/* Desktop tab bar — no Sources tab, no Summary */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-zinc-100 bg-white flex-shrink-0">
            {TABS.filter((t) => !t.mobileOnly).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap
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
                className="ml-auto text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                New session
              </button>
            )}
          </div>

          {/* Desktop tab content */}
          <div className="flex-1 overflow-hidden">
            {renderContent(activeTab || 'chat')}
          </div>
        </div>
      </div>
    </>
  )
}