export function normalizeResult(raw, source) {
  try {
    const url = raw.url || raw.link || ''
    const domain = url ? new URL(url).hostname.replace('www.', '') : ''

    return {
      title: raw.title || '',
      url,
      snippet: raw.snippet || raw.description || raw.AbstractText || '',
      domain,
      source,
      published: raw.date || raw.published || null,
      type: raw.type || 'organic',
      confidence: getConfidence(raw, domain),
    }
  } catch {
    return null
  }
}

function getConfidence(raw, domain) {
  if (raw.type === 'answer') return 1.0
  if (raw.type === 'knowledge') return 0.95
  if (domain.includes('reuters') || domain.includes('bbc') || domain.includes('apnews')) return 0.92
  if (domain.includes('wikipedia')) return 0.88
  if (domain.includes('gov') || domain.includes('edu')) return 0.90
  if (domain.includes('bloomberg') || domain.includes('ft.com')) return 0.88
  return 0.70
}