export default function AppHeader({ onMenuClick, title, subtitle, actions }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 16px',
        height: '56px',
        borderBottom: '1px solid #f4f4f5',
        backgroundColor: 'white',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#71717a',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f4f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      {/* Title */}
      {(title || subtitle) && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#18181b',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </p>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '11px',
                color: '#a1a1aa',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}