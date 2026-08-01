import { normalizeResult } from './normalize'

const SERPER_URL = 'https://google.serper.dev/search'

export async function searchSerper(query, count = 6) {
  const key = import.meta.env.VITE_SERPER_API_KEY
  if (!key) throw new Error('No Serper key')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(SERPER_URL, {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: count }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`Serper ${response.status}`)

    const data = await response.json()
    const results = []

    if (data.answerBox) {
      results.push(normalizeResult({
        title: data.answerBox.title || 'Direct Answer',
        url: data.answerBox.link || '',
        snippet: data.answerBox.answer || data.answerBox.snippet || '',
        type: 'answer',
      }, 'serper'))
    }

    if (data.knowledgeGraph?.description) {
      results.push(normalizeResult({
        title: data.knowledgeGraph.title || query,
        url: data.knowledgeGraph.website || '',
        snippet: data.knowledgeGraph.description,
        type: 'knowledge',
      }, 'serper'))
    }

    const organic = (data.organic || []).slice(0, count).map((r) =>
      normalizeResult({ ...r, type: 'organic' }, 'serper')
    )

    return [...results, ...organic].filter(Boolean)
  } finally {
    clearTimeout(timeout)
  }
}