import { useEffect } from 'react'
import { useState } from 'react'
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
import { useThemeStore } from './store/themeStore'
import AuthProvider from './components/AuthProvider'
import AppRouter from './router'
import SplashScreen from './components/SplashScreen'
import NetworkBanner from './components/ui/NetworkBanner'

export default function App() {
  const user = useUserStore((s) => s.user)
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
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </>
  )
}