import ChatWindow from '../components/chat/ChatWindow'
import { useAuth } from '../hooks/useAuth'

export default function ChatPage() {
  const { logout } = useAuth()

  return (
    <div style={{ height: '100dvh' }} className="flex flex-col bg-white relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={logout}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Log out
        </button>
      </div>
      <ChatWindow />
    </div>
  )
}