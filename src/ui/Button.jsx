export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const base = 'w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800',
    ghost: 'border border-zinc-200 hover:bg-zinc-50 text-zinc-700',
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