import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useUserStore } from './store/userStore'
import { useChatStore } from './store/chatStore'
import { useConversationStore } from './store/conversationStore'
import AppRouter from './router'

export default function App() {
  const { user } = useAuth()
  const setUser = useUserStore((s) => s.setUser)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const clearConversations = useConversationStore((s) => s.clearConversations)

  useEffect(() => {
    setUser(user)
    clearMessages()
    clearConversations()
  }, [user])

  return <AppRouter />
}