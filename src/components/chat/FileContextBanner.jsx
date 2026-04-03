export default function FileContextBanner({ file, onClear }) {
  if (!file) return null

  return (
    <div className="mx-4 mt-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-xl flex items-center gap-3">

      {/* Preview or icon */}
      {file.type === 'image' && file.previewUrl ? (
        <img
          src={file.previewUrl}
          alt="uploaded"
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-violet-200"
        />
      ) : (
        <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-violet-700 truncate">{file.name}</p>
        <p className="text-xs text-violet-500">
          {file.type === 'pdf'
            ? 'PDF loaded — ask Ace anything about it'
            : 'Image scanned — ask Ace to explain or solve it'}
        </p>
      </div>

      <button
        onClick={onClear}
        className="text-violet-400 hover:text-violet-600 transition-colors flex-shrink-0"
        title="Remove file"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}