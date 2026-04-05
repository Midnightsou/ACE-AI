export function ToolField({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">{label}</label>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function ToolTextarea({ value, onChange, placeholder, rows = 4, maxLength }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-violet-500 transition-colors resize-none"
    />
  )
}

export function ToolSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-800 outline-none focus:border-violet-500 transition-colors bg-white"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function ToolChips({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
            ${value === opt
              ? 'bg-violet-600 text-white'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:border-violet-400'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function GenerateButton({ onClick, loading, disabled, label = 'Generate' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <span>✨</span>
          {label}
        </>
      )}
    </button>
  )
}