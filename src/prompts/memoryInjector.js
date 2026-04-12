export function buildMemoryContext(profile, recentMessages = []) {
  const sections = []

  if (profile?.name) {
    sections.push(`Student name: ${profile.name}`)
  }

  if (profile?.level) {
    sections.push(`Academic level: ${profile.level}`)
  }

  if (profile?.subjects?.length) {
    sections.push(`Subjects studied: ${profile.subjects.join(', ')}`)
  }

  if (profile?.weakAreas && Object.keys(profile.weakAreas).length) {
    const weak = Object.entries(profile.weakAreas)
      .map(([topic, count]) => `${topic} (missed ${count}x)`)
      .join(', ')
    sections.push(`Known weak areas: ${weak}`)
  }

  if (profile?.language && profile.language !== 'english') {
    sections.push(`Preferred language: ${profile.language}`)
  }

  if (recentMessages.length > 0) {
    const lastFew = recentMessages.slice(-6)
    const summary = lastFew
      .map((m) => `${m.role === 'user' ? 'User' : 'Ace'}: ${m.content.slice(0, 120)}${m.content.length > 120 ? '...' : ''}`)
      .join('\n')
    sections.push(`\nRecent conversation:\n${summary}`)
  }

  if (!sections.length) return ''

  return `\n\n─── User Memory ───\n${sections.join('\n')}\n──────────────────────`
}

export function extractWeakAreas(messages) {
  const weakAreas = {}
  const weakSignals = [
    "i don't understand",
    "i'm confused",
    "can you explain again",
    "i still don't get",
    "what does that mean",
    "i got it wrong",
  ]

  messages
    .filter((m) => m.role === 'user')
    .forEach((m) => {
      const lower = m.content.toLowerCase()
      const isStruggling = weakSignals.some((signal) => lower.includes(signal))
      if (isStruggling) {
        const topic = extractTopic(m.content)
        if (topic) {
          weakAreas[topic] = (weakAreas[topic] || 0) + 1
        }
      }
    })

  return weakAreas
}

function extractTopic(message) {
  const subjects = [
    'algebra', 'calculus', 'trigonometry', 'geometry', 'statistics',
    'physics', 'chemistry', 'biology', 'english', 'literature',
    'economics', 'government', 'history', 'geography',
  ]
  const lower = message.toLowerCase()
  return subjects.find((s) => lower.includes(s)) || null
}