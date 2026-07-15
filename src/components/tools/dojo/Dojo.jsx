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
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 bg-white px-4 py-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
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
    </div>
  )
}