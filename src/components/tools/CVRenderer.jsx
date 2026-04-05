import { forwardRef } from 'react'

export default forwardRef(function CVRenderer({ sections, header, style }, ref) {
  const { font, palette } = style

  function SectionTitle({ children }) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{
          color: palette.accent,
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: font.family,
          margin: '0 0 5px 0',
        }}>
          {children}
        </h3>
        <div style={{
          height: '2px',
          backgroundColor: palette.accent,
          opacity: 0.35,
          borderRadius: '2px',
        }} />
      </div>
    )
  }

  function SkillPills({ text }) {
    if (!text) return null
    const skills = text
      .split('\n')
      .flatMap((line) =>
        line.replace(/^[-•*]\s*/, '').split(',').map((s) => s.trim())
      )
      .filter(Boolean)

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {skills.map((skill, i) => (
          <span key={i} style={{
            backgroundColor: palette.light,
            color: palette.accent,
            border: `1px solid ${palette.accent}30`,
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '10.5px',
            fontFamily: font.family,
            whiteSpace: 'nowrap',
            fontWeight: '500',
          }}>
            {skill}
          </span>
        ))}
      </div>
    )
  }

  function TextBlock({ text, size = '11.5px' }) {
    if (!text) return null
    return (
      <div>
        {text.split('\n').map((line, i) => {
          if (!line.trim()) return <div key={i} style={{ height: '6px' }} />
          const isBullet = line.startsWith('-') || line.startsWith('•')
          const cleaned = line.replace(/^[-•]\s*/, '')
          const isJobTitle = !isBullet && line.length < 60 &&
            (line.includes(' at ') || line.includes('(20') || /^[A-Z]/.test(line))

          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: isBullet ? '6px' : '0',
              marginBottom: '3px',
            }}>
              {isBullet && (
                <span style={{
                  color: palette.accent,
                  fontSize: '10px',
                  marginTop: '3px',
                  flexShrink: 0,
                }}>●</span>
              )}
              <p style={{
                margin: 0,
                fontSize: isJobTitle ? '12px' : size,
                fontWeight: isJobTitle ? '600' : '400',
                color: isJobTitle ? '#111827' : '#374151',
                lineHeight: '1.65',
                fontFamily: font.family,
              }}>
                {cleaned}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      id="cv-preview"
      style={{
        width: '100%',
        maxWidth: '794px',
        minHeight: '1123px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        fontFamily: font.family,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* ── Full-width header ── */}
      <div style={{
        backgroundColor: palette.sidebar,
        padding: '32px 40px 24px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 4px 0',
          fontFamily: font.family,
          letterSpacing: '-0.02em',
          lineHeight: '1.2',
        }}>
          {header.name}
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: '13px',
          margin: '0 0 14px 0',
          fontFamily: font.family,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontWeight: '500',
        }}>
          {header.role}
        </p>
        {sections?.summary && (
          <p style={{
            color: 'rgba(255,255,255,0.82)',
            fontSize: '11.5px',
            lineHeight: '1.7',
            margin: 0,
            fontFamily: font.family,
            maxWidth: '680px',
          }}>
            {sections.summary.replace(/\n/g, ' ').trim()}
          </p>
        )}
      </div>

      {/* ── Contact strip ── */}
      <div style={{
        backgroundColor: palette.light,
        borderBottom: `1px solid ${palette.accent}20`,
        padding: '10px 40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
      }}>
        {[
          { icon: '✉', value: header.email },
          { icon: '📞', value: header.phone },
          { icon: '📍', value: header.location },
          { icon: '🔗', value: header.linkedin },
        ].filter((c) => c.value).map((c, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10.5px',
            color: '#4b5563',
            fontFamily: font.family,
          }}>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{c.icon}</span>
            <span>{c.value}</span>
          </div>
        ))}
      </div>

      {/* ── Two column body ── */}
      <div style={{
        display: 'flex',
        flex: 1,
        padding: '28px 40px',
        gap: '36px',
        boxSizing: 'border-box',
      }}>

        {/* Left column — Experience + Education */}
        <div style={{ flex: '1.4', minWidth: 0 }}>

          {sections?.experience && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Work Experience</SectionTitle>
              <TextBlock text={sections.experience} />
            </div>
          )}

          {sections?.projects && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Projects</SectionTitle>
              <TextBlock text={sections.projects} />
            </div>
          )}

          {sections?.achievements && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Achievements</SectionTitle>
              <TextBlock text={sections.achievements} />
            </div>
          )}

          {sections?.additional && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Additional</SectionTitle>
              <TextBlock text={sections.additional} />
            </div>
          )}
        </div>

        {/* Right column — Skills + Education + Certs */}
        <div style={{ flex: '0.9', minWidth: 0 }}>

          {sections?.skills && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Skills</SectionTitle>
              <SkillPills text={sections.skills} />
            </div>
          )}

          {sections?.education && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Education</SectionTitle>
              <TextBlock text={sections.education} />
            </div>
          )}

          {sections?.certifications && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Certifications</SectionTitle>
              <TextBlock text={sections.certifications} />
            </div>
          )}

          {sections?.languages && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle>Languages</SectionTitle>
              <TextBlock text={sections.languages} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})