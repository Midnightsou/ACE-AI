function formatSources(sources = []) {
  return sources
    .map((source, index) => {
      const content = source?.content || ''
      const title = source?.title || `Source ${index + 1}`
      return `Source ${index + 1}: ${title}\n\n${content}`.trim()
    })
    .join('\n\n')
}

function buildPrompt(sources, instruction) {
  const sourcesText = formatSources(sources)

  return {
    system: `You are Ace, a clear and encouraging study tutor. Use the provided sources only and answer in a practical, helpful way.`,
    user: `${instruction}\n\nSources:\n${sourcesText}`,
  }
}

export function buildDojoChatPrompt(sources) {
  const sourcesText = formatSources(sources)

  return `You are Ace, a clear and encouraging study tutor. Use the provided sources only and answer the latest user question clearly and helpfully. Keep the response focused and educational.\n\nSources:\n${sourcesText}`
}

export function buildSummaryPrompt(sources) {
  return buildPrompt(
    sources,
    'Create a concise summary of the key ideas from the sources. Highlight the most important points in a structured way.'
  )
}

export function buildKeyConceptsPrompt(sources) {
  return buildPrompt(
    sources,
    'Extract the most important concepts, terms, and ideas from the sources. Present them as a clear list with brief explanations.'
  )
}

export function buildQuizPrompt(sources) {
  return buildPrompt(
    sources,
    'Generate a short quiz from the sources. Include a few multiple-choice or short-answer questions with answers.'
  )
}

export function buildFlashcardsPrompt(sources) {
  return buildPrompt(
    sources,
    'Create study flashcards from the sources. Format each card as CARD n, Q: ..., A: ...'
  )
}

export function buildMindMapPrompt(sources) {
  return buildPrompt(
    sources,
    'Create a mind map outline from the sources. Organize the main topic, subtopics, and supporting details in a clear hierarchy.'
  )
}

export function buildReportPrompt(sources) {
  return buildPrompt(
    sources,
    'Write a structured study report from the sources. Include an overview, key takeaways, and useful insights.'
  )
}

export function buildPodcastPrompt(sources) {
  return buildPrompt(
    sources,
    'Write a conversational podcast script with two hosts discussing the sources in an engaging and easy-to-follow way.'
  )
}
