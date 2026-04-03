export default function StreamingBubble({ content }) {
  if (!content) return null

  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
        A
      </div>
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white text-zinc-800 border border-zinc-100 shadow-sm whitespace-pre-wrap">
        {content}
        <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
      </div>
    </div>
  )
}