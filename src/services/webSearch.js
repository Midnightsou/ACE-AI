import { getCached, setCached } from './search/cache'
import { searchSerper } from './search/serper'
import { searchDuckDuckGo } from './search/duckduckgo'
import { deduplicate } from './search/deduplicate'
import { rankResults } from './search/rank'
export { needsWebSearch, extractSearchQuery } from './search/intent'
export { buildSearchContext } from './search/promptBuilder'

async function fetchWithRetry(fn, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, 500))
    }
  }
}

export async function searchWeb(query, count = 6) {
  const cacheKey = query.toLowerCase().trim()
  const cached = getCached(cacheKey)
  if (cached) return cached

  let results = []

  // Run Serper and DuckDuckGo in parallel
  const [serperResult, ddgResult] = await Promise.allSettled([
    fetchWithRetry(() => searchSerper(query, count)),
    searchDuckDuckGo(query),
  ])

  if (serperResult.status === 'fulfilled' && serperResult.value?.length) {
    results = serperResult.value
  } else if (ddgResult.status === 'fulfilled' && ddgResult.value?.length) {
    results = ddgResult.value
    console.warn('Serper failed, using DuckDuckGo fallback')
  }

  if (!results.length) return null

  const final = rankResults(deduplicate(results)).slice(0, count)
  setCached(cacheKey, final)
  return final
}