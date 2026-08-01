import { normalizeResult } from './normalize'

export async function searchDuckDuckGo(query) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: controller.signal }
    )
    const data = await response.json()
    const results = []

    if (data.AbstractText) {
      results.push(normalizeResult({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        type: 'knowledge',
      }, 'duckduckgo'))
    }

    data.RelatedTopics?.slice(0, 4).forEach((t) => {
      if (t.Text && t.FirstURL) {
        results.push(normalizeResult({
          title: t.Text.split(' - ')[0],
          url: t.FirstURL,
          snippet: t.Text,
          type: 'organic',
        }, 'duckduckgo'))
      }
    })

    return results.filter(Boolean)
  } finally {
    clearTimeout(timeout)
  }
}