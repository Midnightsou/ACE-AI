export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const base =
    'w-full h-11 px-4 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0 active:translate-y-px select-none inline-flex items-center justify-center gap-2'

  const variants = {
    primary:
      'bg-violet-600 hover:bg-violet-700 active:bg-violet-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)]',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-200 text-zinc-800',
    ghost:
      'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}