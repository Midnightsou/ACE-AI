import { useState } from 'react'
import ChatWindow from '../components/chat/ChatWindow'
import Sidebar from '../components/sidebar/Sidebar'
import GrimMascot from '../components/GrimMascot'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex" style={{ height: '100dvh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center border-b border-zinc-100 bg-white px-2 pt-[env(safe-area-inset-top)] md:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            <GrimMascot mood="happy" size={30} animate={false} />
            <span className="text-sm font-semibold text-zinc-900">Ace</span>
          </div>
          <div className="w-11" />
        </header>
        <ChatWindow />
      </div>
    </div>
  )
}
