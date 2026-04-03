import { useUserStore } from '../../store/userStore'

export default function MessageBubble({ message }) {
  const user = useUserStore((s) => s.user)
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          A
        </div>
      )}

      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : 'bg-white text-zinc-800 rounded-tl-sm border border-zinc-100 shadow-sm'
          }`}
      >
        {message.content}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 text-xs font-bold ml-2 flex-shrink-0 mt-1">
          {user?.profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
    </div>
  )
}