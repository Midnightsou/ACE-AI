import { useState } from 'react'
import DojoChat from './DojoChat'
import DojoFlashcards from './DojoFlashcards'
import DojoGenerateTab from './DojoGenerateTab'
import DojoMindMap from './DojoMindMap'
import DojoPodcast from './DojoPodcast'
import DojoReport from './DojoReport'
import SourcePanel from './SourcePanel'

const TABS = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { id: 'mindmap', label: 'Mind Map', icon: '🗺' },
  { id: 'concepts', label: 'Concepts', icon: '💡' },
  { id: 'quiz', label: 'Quiz', icon: '❓' },
  { id: 'report', label: 'Report', icon: '📊' },
  { id: 'podcast', label: 'Podcast', icon: '🎙' },
]

export default function Dojo() {
  const [activeTab, setActiveTab] = useState('chat')
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function renderContent() {
    switch (activeTab) {
      case 'flashcards':
        return <DojoFlashcards />
      case 'mindmap':
        return <DojoMindMap />
      case 'concepts':
        return <DojoGenerateTab tabId="concepts" />
      case 'quiz':
        return <DojoGenerateTab tabId="quiz" />
      case 'report':
        return <DojoReport />
      case 'podcast':
        return <DojoPodcast />
      case 'chat':
      default:
        return <DojoChat />
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50">
      <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setSourcesOpen(true)}
          className="min-h-11 flex-shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 lg:hidden"
        >
          Sources
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-11 flex-shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-80 flex-shrink-0 border-r border-zinc-200 bg-white lg:block">
          <SourcePanel />
        </div>
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
      {sourcesOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSourcesOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88vw] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-800">Sources</p>
              <button
                onClick={() => setSourcesOpen(false)}
                className="min-h-11 min-w-11 rounded-xl text-lg text-zinc-500"
                aria-label="Close sources"
              >
                X
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SourcePanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}