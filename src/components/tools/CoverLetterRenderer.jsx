import { forwardRef } from 'react'

export default forwardRef(function CoverLetterRenderer({ content, header, style }, ref) {
  const { font, palette } = style

  if (!content) return null

  const paragraphs = content
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  return (
    <div
      ref={ref}
      id="cover-letter-preview"
      style={{
        width: '100%',
        maxWidth: '794px',
        minHeight: '1123px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        fontFamily: font.family,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Letterhead */}
      <div style={{
        backgroundColor: palette.sidebar,
        padding: '32px 48px',
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: '700',
          margin: '0 0 4px',
          fontFamily: font.family,
          letterSpacing: '-0.01em',
        }}>
          {header.name}
        </h1>

        {/* Contact strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '8px',
        }}>
          {[
            { icon: '✉', value: header.email },
            { icon: '📞', value: header.phone },
          ].filter((c) => c.value).map((c, i) => (
            <span key={i} style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '11px',
              fontFamily: font.family,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <span style={{ opacity: 0.7 }}>{c.icon}</span>
              {c.value}
            </span>
          ))}
        </div>
      </div>

      {/* Accent bar */}
      <div style={{
        height: '4px',
        backgroundColor: palette.accent,
        opacity: 0.6,
      }} />

      {/* Letter body */}
      <div style={{
        flex: 1,
        padding: '48px 48px 40px',
      }}>

        {/* Date */}
        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          fontFamily: font.family,
          margin: '0 0 28px',
        }}>
          {new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {/* Company + role */}
        {(header.company || header.role) && (
          <div style={{ marginBottom: '28px' }}>
            {header.company && (
              <p style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#111827',
                fontFamily: font.family,
                margin: '0 0 2px',
              }}>
                {header.company}
              </p>
            )}
            {header.role && (
              <p style={{
                fontSize: '12px',
                color: palette.accent,
                fontFamily: font.family,
                margin: 0,
                fontWeight: '500',
              }}>
                Re: {header.role}
              </p>
            )}
          </div>
        )}

        {/* Letter paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{
              fontSize: '12px',
              lineHeight: '1.8',
              color: '#374151',
              fontFamily: font.family,
              margin: 0,
            }}>
              {para}
            </p>
          ))}
        </div>

        {/* Signature */}
        <div style={{ marginTop: '40px' }}>
          <p style={{
            fontSize: '12px',
            color: '#374151',
            fontFamily: font.family,
            margin: '0 0 24px',
          }}>
            Yours sincerely,
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: '700',
            color: palette.accent,
            fontFamily: font.family,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {header.name}
          </p>
        </div>
      </div>
    </div>
  )
})