export function deduplicate(results) {
  const seenUrls = new Set()
  const seenTitles = new Set()

  return results.filter((r) => {
    if (!r) return false
    const titleKey = r.title.toLowerCase().slice(0, 40)
    if (seenUrls.has(r.url) || seenTitles.has(titleKey)) return false
    seenUrls.add(r.url)
    seenTitles.add(titleKey)
    return true
  })
}