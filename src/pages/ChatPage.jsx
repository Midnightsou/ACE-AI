import { useState } from 'react'
import ChatWindow from '../components/chat/ChatWindow'
import Sidebar from '../components/sidebar/Sidebar'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Remove the useEffect that was re-loading on mount
  // The sidebar now handles loading directly before navigating

  return (
    <div className="flex" style={{ height: '100dvh' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-zinc-100 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900">Ace</span>
          </div>
          <div className="w-5" />
        </div>

        <ChatWindow />
      </div>
    </div>
  )
}