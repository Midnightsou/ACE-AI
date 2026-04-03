export default function Input({ label, type = 'text', value, onChange, placeholder, error }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-zinc-700">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
          ${error
            ? 'border-red-400 focus:border-red-500'
            : 'border-zinc-200 focus:border-violet-500'
          } bg-white text-zinc-900 placeholder:text-zinc-400`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}