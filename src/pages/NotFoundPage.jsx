import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <EmptyState
        mood="oops"
        title="That page wandered off"
        text="The link you followed does not exist. Let's get you back."
        action={
          <Link
            to="/chat"
            className="inline-block min-h-12 rounded-2xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            Back to chat
          </Link>
        }
      />
    </div>
  )
}
