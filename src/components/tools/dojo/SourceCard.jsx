import { getSourceIcon } from '../../../services/sourceExtractor'

export default function SourceCard({ source, onRemove, index }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-zinc-100 rounded-xl shadow-sm group">

      {/* Icon + index */}
      <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-zinc-100">
        <span className="text-sm">{getSourceIcon(source.type)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400">Source {index + 1}</span>
          <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            {source.type}
          </span>
        </div>
        <p className="text-sm font-medium text-zinc-800 truncate mt-0.5">
          {source.name}
        </p>
        {source.preview && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {source.preview}
          </p>
        )}
        {source.loading && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-violet-500">Extracting content...</span>
          </div>
        )}
        {source.error && (
          <p className="text-xs text-red-500 mt-1">{source.error}</p>
        )}
        {source.wordCount && (
          <p className="text-xs text-zinc-400 mt-1">
            {source.wordCount.toLocaleString()} words extracted
          </p>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(source.id)}
        className="text-zinc-300 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}