import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useUserStore } from './store/userStore'
import { useChatStore } from './store/chatStore'
import { useConversationStore } from './store/conversationStore'
import AppRouter from './router'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const { user } = useAuth()
  const setUser = useUserStore((s) => s.setUser)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const clearConversations = useConversationStore((s) => s.clearConversations)
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    const shown = sessionStorage.getItem('splashShown')
    return !shown
  })

  useEffect(() => {
    setUser(user)
    clearMessages()
    clearConversations()
  }, [user])

  function handleSplashComplete() {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return <AppRouter />
}