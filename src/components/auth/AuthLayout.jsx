export function AuthLogo({ size = 48 }) {
  return (
    <div
      className="mx-auto overflow-hidden bg-white ring-1 ring-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      style={{ width: size, height: size, borderRadius: 14 }}
    >
      <img
        src="/logo.png"
        alt="Ace AI"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  )
}

export function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76z"
      />
    </svg>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="flex items-start gap-2 text-[13px] leading-snug text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-[1px] shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

export function ButtonSpinner() {
  return (
    <span
      className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
      aria-hidden="true"
    />
  )
}

export default function AuthLayout({ eyebrow, title, subtitle, children, footer, mascot }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col relative overflow-hidden">
      {/* Restrained backdrop: faint dot grid + soft violet wash. Same palette, no gradient mesh. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          opacity: 0.35,
          maskImage: 'radial-gradient(640px 420px at 50% 0%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(640px 420px at 50% 0%, black 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-140px] -translate-x-1/2 h-[280px] w-[560px] rounded-full bg-violet-600/[0.07] blur-3xl"
      />

      <div className="relative flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[400px] auth-enter">
          {/* Brand */}
          <div className="mb-6 text-center">
            {mascot ? (
              <div className="grim-float flex justify-center [@media(max-height:620px)]:hidden" aria-hidden="true">
                {mascot}
              </div>
            ) : (
              <AuthLogo />
            )}
            {eyebrow && (
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 text-[26px] leading-8 font-bold tracking-tight text-zinc-900 text-balance">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[14px] text-zinc-500 mt-1.5 text-balance">{subtitle}</p>
            )}
          </div>

          {/* Card — same fields, better surface */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_16px_40px_-24px_rgba(0,0,0,0.18)]">
            {children}
          </div>

          {footer && <div className="mt-5">{footer}</div>}

          <p className="mt-6 text-center text-[12px] leading-relaxed text-zinc-400">
            Protected by Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  )
}
