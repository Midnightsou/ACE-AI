function SkeletonLine({ width = 'w-full', height = 'h-3' }) {
  return (
    <div className={`${width} ${height} bg-zinc-200 rounded-full animate-pulse`} />
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* User message */}
      <div className="flex justify-end">
        <div className="w-48 h-10 bg-violet-100 rounded-2xl rounded-tr-sm animate-pulse" />
      </div>
      {/* AI response */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-zinc-200 rounded-full animate-pulse flex-shrink-0 mt-1" />
        <div className="flex-1 flex flex-col gap-2 bg-white border border-zinc-100 rounded-2xl rounded-tl-sm p-4">
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-5/6" />
          <SkeletonLine width="w-4/6" />
        </div>
      </div>
      {/* User message */}
      <div className="flex justify-end">
        <div className="w-32 h-10 bg-violet-100 rounded-2xl rounded-tr-sm animate-pulse" />
      </div>
      {/* AI response */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-zinc-200 rounded-full animate-pulse flex-shrink-0 mt-1" />
        <div className="flex-1 flex flex-col gap-2 bg-white border border-zinc-100 rounded-2xl rounded-tl-sm p-4">
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-5/6" />
        </div>
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      {[80, 60, 90, 50, 70].map((w, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <div className="w-4 h-4 bg-zinc-700 rounded animate-pulse flex-shrink-0" />
          <div className={`h-3 bg-zinc-700 rounded-full animate-pulse`} style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  )
}

export function ToolCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 bg-white border border-zinc-100 rounded-2xl">
      <div className="w-10 h-10 bg-zinc-100 rounded-xl animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="h-3.5 bg-zinc-100 rounded-full w-2/3 animate-pulse" />
        <div className="h-3 bg-zinc-100 rounded-full w-full animate-pulse" />
        <div className="h-3 bg-zinc-100 rounded-full w-4/5 animate-pulse" />
      </div>
    </div>
  )
}

export function CVSkeleton() {
  return (
    <div className="bg-white p-8 flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col items-center gap-2 pb-4 border-b border-zinc-100">
        <div className="h-6 bg-zinc-200 rounded w-48" />
        <div className="h-3 bg-zinc-100 rounded w-64" />
        <div className="h-3 bg-zinc-100 rounded w-56" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 bg-zinc-200 rounded w-32" />
          <div className="h-3 bg-zinc-100 rounded w-full" />
          <div className="h-3 bg-zinc-100 rounded w-5/6" />
          <div className="h-3 bg-zinc-100 rounded w-4/5" />
        </div>
      ))}
    </div>
  )
}