import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useUserStore } from './store/userStore'
import AppRouter from './router'

export default function App() {
  const { user } = useAuth()
  const setUser = useUserStore((s) => s.setUser)

  useEffect(() => {
    setUser(user)
  }, [user])

  return <AppRouter />
}