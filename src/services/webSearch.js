const BRAVE_API = 'https://api.search.brave.com/res/v1/web/search'

export async function searchWeb(query, count = 5) {
  const apiKey = import.meta.env.VITE_BRAVE_SEARCH_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(
      `${BRAVE_API}?q=${encodeURIComponent(query)}&count=${count}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const results = data.web?.results || []

    return results.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }))
  } catch {
    return null
  }
}

export function needsWebSearch(message) {
  const currentInfoPatterns = [
    /today|tonight|this week|this month|this year/i,
    /latest|recent|current|now|live|breaking/i,
    /news|update|announce|release|launch/i,
    /price|stock|rate|exchange|crypto|bitcoin/i,
    /who is (the |currently )?(ceo|president|prime minister|governor|chairman)/i,
    /what is happening|what happened/i,
    /score|result|winner|champion/i,
    /weather/i,
    /20(2[5-9]|[3-9]\d)/,
  ]
  return currentInfoPatterns.some((p) => p.test(message))
}

export function formatSearchResults(results) {
  if (!results?.length) return ''
  return `\n\n[Real-time web search results for context — use these to answer accurately]\n${
    results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`).join('\n\n')
  }\n[End of search results]`
}