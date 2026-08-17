import { useAuth } from '../hooks/useAuth'

export default function AuthProvider({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50">
        <div className="w-7 h-7 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return children
}