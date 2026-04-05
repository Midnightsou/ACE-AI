export function buildOutlinePrompt(data) {
  return {
    system: `You are an expert academic writer with deep knowledge across all subjects. You create clear, well-structured essay outlines.

Rules:
- Create a logical, detailed outline for the essay
- Match the academic level and essay type specified
- Include introduction, body sections with subsections, and conclusion
- Each section should have a clear purpose and 2-3 key points
- Plain text only — no markdown, no asterisks
- Use numbers and letters for structure (1. A. i.)
- Be specific — not generic placeholder text`,

    user: `Create a detailed outline for this essay:

Topic: ${data.topic}
Essay type: ${data.essayType}
Academic level: ${data.academicLevel}
Word count target: ${data.wordCount} words
Citation style: ${data.citationStyle}
Additional instructions: ${data.instructions || 'None'}

Generate a clear, structured outline.`,
  }
}

export function buildEssayPrompt(data, outline) {
  return {
    system: `You are an expert academic writer. You write well-researched, compelling essays that match the specified academic level and style.

Rules:
- Write a complete, polished essay based on the outline provided
- Match the ${data.academicLevel} academic level throughout
- Use ${data.citationStyle} citation format where relevant — use placeholder citations like (Author, Year) or [1] as appropriate
- Essay type is ${data.essayType} — maintain appropriate structure and argumentation style
- Target approximately ${data.wordCount} words
- Use clear topic sentences for each paragraph
- Ensure smooth transitions between sections
- Plain text only — no markdown symbols, no asterisks, no headers with ##
- Use the section titles from the outline as plain text headers followed by a blank line
- Write in a natural academic voice appropriate for ${data.academicLevel} level`,

    user: `Write a complete ${data.essayType} essay on: "${data.topic}"

Use this outline as your structure:
${outline}

Additional instructions: ${data.instructions || 'None'}

Write the full essay now.`,
  }
}

export function buildEssayFromScratchPrompt(data) {
  return {
    system: `You are an expert academic writer. You write well-researched, compelling essays.

Rules:
- Write a complete, polished essay
- Match the ${data.academicLevel} academic level
- Use ${data.citationStyle} citation format where relevant
- Essay type is ${data.essayType}
- Target approximately ${data.wordCount} words
- Plain text only — no markdown, no asterisks
- Use section titles as plain text followed by blank lines
- Write in a natural academic voice`,

    user: `Write a complete ${data.essayType} essay on: "${data.topic}"

Additional instructions: ${data.instructions || 'None'}

Write the full essay.`,
  }
}