const REALTIME_KEYWORDS = [
  'today', 'tonight', 'right now', 'this week', 'this month',
  'latest', 'recent', 'current', 'live', 'breaking', 'just announced',
  'update', 'news',
]

const SEARCH_INTENTS = [
  'search', 'look up', 'find', 'google',
  'weather', 'forecast', 'temperature',
  'price', 'cost', 'stock', 'crypto', 'bitcoin', 'naira',
  'score', 'result', 'winner', 'match',
  'exchange rate', 'dollar', 'pound',
  'election', 'vote', 'polling',
  'who is the', 'who became', 'who won',
  'what happened', 'when did',
]

function cleanQuery(query) {
  return query
    .replace(/^can you (please )?(search|look up|find|tell me about)/i, '')
    .replace(/^please (search|look up|find)/i, '')
    .replace(/^(search|look up|find) (for |me )?(about )?/i, '')
    .replace(/^tell me (about|the latest on) /i, '')
    .trim()
}

export function needsWebSearch(message) {
  const text = message.toLowerCase()

  if (REALTIME_KEYWORDS.some((k) => text.includes(k))) return true
  if (SEARCH_INTENTS.some((k) => text.includes(k))) return true

  // Year pattern — 2024, 2025, 2026
  if (/20(2[4-9]|[3-9]\d)/.test(text)) return true

  return false
}

export function extractSearchQuery(message) {
  return cleanQuery(message).slice(0, 200)
}