import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { useUserStore } from '../store/userStore'

export default function NotFoundPage() {
  // Signed-in users go back to the app; visitors go to the landing page.
  const user = useUserStore((s) => s.user)
  const home = user ? '/chat' : '/'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <EmptyState
        mood="oops"
        title="That page doesn't exist"
        text="The link may be old or mistyped."
        action={
          <Link
            to={home}
            className="inline-block min-h-12 rounded-2xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            {user ? 'Back to chat' : 'Go home'}
          </Link>
        }
      />
    </div>
  )
}
