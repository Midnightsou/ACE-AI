import { useState } from 'react'

export default function Input({ label, type = 'text', value, onChange, placeholder, error, required, autoComplete, hidePasswordToggle = false, ...rest }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold tracking-tight text-zinc-700">{label}</label>
      )}
      <div className="relative">
        <input
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          {...rest}
          className={`w-full h-11 pl-3.5 ${isPassword ? 'pr-12' : 'pr-3.5'} rounded-xl border text-[14px] leading-none outline-none transition-all duration-150 bg-white text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-zinc-300 ${error ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-zinc-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-600/10'}`}
        />
        {isPassword && !hidePasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

