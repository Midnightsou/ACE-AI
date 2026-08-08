import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './hooks/useAuth'
import { useUserStore } from './store/userStore'
import { useChatStore } from './store/chatStore'
import { useConversationStore } from './store/conversationStore'
import { useCVMakerStore, useCVAnalyserStore } from './store/cvStore'
import { useCoverLetterStore } from './store/coverLetterStore'
import { useEssayStore } from './store/essayStore'
import { useEmailStore } from './store/emailStore'
import { useCodexStore } from './store/codexStore'
import { useMathStore } from './store/mathStore'
import { useDojoStore } from './store/dojoStore'
import AppRouter from './router'
import SplashScreen from './components/SplashScreen'
import { useState } from 'react'
import { useThemeStore } from './store/themeStore'
import NetworkBanner from './components/ui/NetworkBanner'

export default function App() {
  const { user } = useAuth()
  const setUser = useUserStore((s) => s.setUser)
  const theme = useThemeStore((s) => s.theme)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const clearConversations = useConversationStore((s) => s.clearConversations)
  const resetCVMaker = useCVMakerStore((s) => s.reset)
  const resetCVAnalyser = useCVAnalyserStore((s) => s.reset)
  const resetCoverLetter = useCoverLetterStore((s) => s.reset)
  const resetEssay = useEssayStore((s) => s.reset)
  const resetEmail = useEmailStore((s) => s.reset)
  const clearCodex = useCodexStore((s) => s.clearMessages)
  const clearMath = useMathStore((s) => s.clearMessages)
  const clearDojo = useDojoStore((s) => s.clearSession)

  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })

  useEffect(() => {
    setUser(user)

    // Clear ALL stores when user changes — prevents data leaking between accounts
    clearMessages()
    clearConversations()
    resetCVMaker()
    resetCVAnalyser()
    resetCoverLetter()
    resetEssay()
    resetEmail()
    clearCodex()
    clearMath()
    clearDojo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]) // key on uid specifically — fires when account switches

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function handleSplashComplete() {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <>
      <NetworkBanner />
      <AppRouter />
      <Analytics />
    </>
  )
}