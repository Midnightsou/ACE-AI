export function parseCV(rawText) {
  if (!rawText) return null

  const lines = rawText.split('\n').map((l) => l.trim())
  const sections = {}
  let currentSection = 'header'
  let buffer = []

  const sectionKeywords = {
    'PROFESSIONAL SUMMARY': 'summary',
    'SUMMARY': 'summary',
    'WORK EXPERIENCE': 'experience',
    'EXPERIENCE': 'experience',
    'EDUCATION': 'education',
    'SKILLS': 'skills',
    'CERTIFICATIONS': 'certifications',
    'ADDITIONAL': 'additional',
    'LANGUAGES': 'languages',
    'REFERENCES': 'references',
    'PROJECTS': 'projects',
    'ACHIEVEMENTS': 'achievements',
    'AWARDS': 'awards',
  }

  function flushBuffer() {
    if (buffer.length > 0) {
      sections[currentSection] = buffer.join('\n').trim()
      buffer = []
    }
  }

  for (const line of lines) {
    if (!line) {
      buffer.push('')
      continue
    }

    // Check if this line is a section header
    const upper = line.toUpperCase().replace(/[-=]+/g, '').trim()
    const matched = Object.keys(sectionKeywords).find(
      (k) => upper === k || upper.startsWith(k)
    )

    if (matched) {
      flushBuffer()
      currentSection = sectionKeywords[matched]
      continue
    }

    buffer.push(line)
  }

  flushBuffer()

  return sections
}

export function extractHeaderInfo(headerText, formData) {
  // Use form data as primary source for header
  return {
    name: formData.fullName || 'Your Name',
    role: formData.targetRole || 'Professional',
    email: formData.email || '',
    phone: formData.phone || '',
    location: formData.location || '',
    linkedin: formData.linkedin || '',
  }
}