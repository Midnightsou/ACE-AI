export function buildOutlinePrompt(form = {}) {
  const topic = form.topic?.trim() || 'a compelling essay topic'
  const essayType = form.essayType?.trim() || 'argumentative'
  const academicLevel = form.academicLevel?.trim() || 'undergraduate'
  const wordCount = form.wordCount?.trim() || '1000'

  return {
    system: 'You are an academic writing assistant. Create a clear essay outline with introduction, body sections, and conclusion. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.',
    user: `Create a structured outline for an ${essayType} essay on ${topic}. Target academic level: ${academicLevel}. Approximate length: ${wordCount} words.`,
  }
}

export function buildSectionPrompt(form = {}, sectionTitle = '', sectionPoints = '', previousContent = '', isFirst = false, isLast = false) {
  const topic = form.topic?.trim() || 'the essay topic'
  const wordTarget = form.sectionWordTarget || 250

  return {
    system: 'You are an academic writing assistant. Write one polished section of an essay that fits the outline and the requested word target. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.',
    user: `Write the ${sectionTitle || 'next'} section for an essay on ${topic}.\n\nWord target: ${wordTarget}.\n\nOutline points:\n${sectionPoints || 'Expand the topic clearly.'}\n\nPrevious content:\n${previousContent || 'None.'}\n\nThis is ${isFirst ? 'the first' : isLast ? 'the last' : 'a middle'} section.`,
  }
}
