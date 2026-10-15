import { useAuth } from '../hooks/useAuth'
import SplashLoader from './SplashLoader'

export default function AuthProvider({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return <SplashLoader label="Checking your session..." />
  }

  return children
}