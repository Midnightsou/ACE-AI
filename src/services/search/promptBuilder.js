export function buildSearchContext(results) {
  if (!results?.length) return { systemContext: '', citations: [] }

  const citations = results.map((r, i) => ({
    index: i + 1,
    title: r.title,
    url: r.url,
    domain: r.domain,
    snippet: r.snippet,
    published: r.published,
    confidence: r.confidence,
  }))

  const systemContext = `
REAL-TIME WEB SEARCH RESULTS
These results are from a live web search. Use them to answer accurately.

CITATION RULES:
- Add [N] after any sentence that uses information from result N
- Example: "OpenAI released GPT-5 last month [1]"
- At the end of your response, list only the sources you actually cited
- Prefer higher-confidence sources when results conflict
- If no result is relevant, answer from your own knowledge and say so

SOURCES:
${citations.map((c) => `[${c.index}] ${c.title}
Domain: ${c.domain}${c.published ? ` | Published: ${c.published}` : ''}
${c.snippet}`).join('\n\n')}
`

  return { systemContext, citations }
}