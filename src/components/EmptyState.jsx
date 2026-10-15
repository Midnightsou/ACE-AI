import GrimMascot from './GrimMascot'

export default function EmptyState({ mood = 'happy', title, text, action, size = 120 }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <GrimMascot mood={mood} size={size} />
      <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
      {text && <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
