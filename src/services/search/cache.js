const cache = new Map()
const TTL = 5 * 60 * 1000 // 5 minutes

export function getCached(key) {
  const entry = cache.get(key.toLowerCase().trim())
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key, data) {
  cache.set(key.toLowerCase().trim(), {
    data,
    expires: Date.now() + TTL,
  })
}