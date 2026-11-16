export function buildOutlinePrompt(form = {}) {
  const topic = form.topic?.trim() || 'a compelling essay topic'
  const essayType = form.essayType?.trim() || 'argumentative'
  const academicLevel = form.academicLevel?.trim() || 'undergraduate'
  const wordCount = form.wordCount?.trim() || '1000'
  const language = form.responseLanguage || 'English'

  return {
    system: `You are an academic writing assistant. Create a clear essay outline with introduction, body sections, and conclusion. Write in ${language} even if the user's topic or instructions are in English, unless they explicitly request English. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.`,
    user: `Create a structured outline for an ${essayType} essay on ${topic}. Target academic level: ${academicLevel}. The completed essay must contain exactly ${wordCount} words.`,
  }
}

export function buildSectionPrompt(form = {}, sectionTitle = '', sectionPoints = '', previousContent = '', isFirst = false, isLast = false) {
  const topic = form.topic?.trim() || 'the essay topic'
  const wordTarget = form.sectionWordTarget || 250
  const language = form.responseLanguage || 'English'

  return {
    system: `You are an academic writing assistant. Write one polished section of an essay that fits the outline and the requested word target. Write in ${language} even if the user's topic or instructions are in English, unless they explicitly request English. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.`,
    user: `Write the ${sectionTitle || 'next'} section for an essay on ${topic}.\n\nWrite exactly ${wordTarget} words. Count words separated by whitespace. Do not include a word-count note.\n\nOutline points:\n${sectionPoints || 'Expand the topic clearly.'}\n\nPrevious content:\n${previousContent || 'None.'}\n\nThis is ${isFirst ? 'the first' : isLast ? 'the last' : 'a middle'} section.`,
  }
}
