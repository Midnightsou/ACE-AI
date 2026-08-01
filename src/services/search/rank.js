export function rankResults(results) {
  return [...results].sort((a, b) => {
    // Type priority
    const typePriority = { answer: 4, knowledge: 3, news: 2, organic: 1 }
    const typeScore = (typePriority[b.type] || 0) - (typePriority[a.type] || 0)
    if (typeScore !== 0) return typeScore

    // Confidence
    return b.confidence - a.confidence
  })
}