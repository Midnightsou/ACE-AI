export function buildOutlinePrompt(data) {
  return {
    system: `You are an expert academic writer. Create detailed essay outlines.

Rules:
- Create a comprehensive outline matching the word count target
- For essays over 2000 words include more subsections
- Each section must have a clear title and 3-4 key points to cover
- Plain text only, no markdown, no asterisks
- Format exactly like this:

INTRODUCTION
- Hook and background
- Thesis statement
- Essay roadmap

SECTION 1: [Title]
- Key point 1
- Key point 2
- Key point 3

SECTION 2: [Title]
- Key point 1
- Key point 2
- Key point 3

CONCLUSION
- Summary of main points
- Restate thesis
- Closing thoughts`,

    user: `Create a detailed outline for this essay:

Topic: ${data.topic}
Essay type: ${data.essayType}
Academic level: ${data.academicLevel}
Target word count: ${data.wordCount} words
Citation style: ${data.citationStyle}
Writing style: ${data.writingStyle}
Additional instructions: ${data.instructions || 'None'}

Generate the outline now. Include enough sections to reach ${data.wordCount} words when written.`,
  }
}

export function buildSectionPrompt(data, sectionTitle, sectionPoints, previousContent, isFirst, isLast) {
  return {
    system: `You are an expert academic writer writing a ${data.essayType} essay at ${data.academicLevel} level.

Rules:
- Write ONLY the section specified — not the full essay
- Match ${data.academicLevel} academic level throughout
- Use ${data.citationStyle} citation format — use placeholder citations like (Author, Year) or [1]
- Writing style: ${data.writingStyle}
- Plain text only — no markdown, no asterisks, no ## headers
- Write the section title as plain text on its own line then start writing
- Each section should be proportional to the total ${data.wordCount} word target
- Ensure smooth flow ${isFirst ? 'as the opening' : isLast ? 'as the conclusion' : 'that connects to previous content'}
- Do not add "Section X:" prefix — just the title and content`,

    user: `Write the "${sectionTitle}" section of this essay.

Topic: "${data.topic}"
Essay type: ${data.essayType}
Total target: ${data.wordCount} words

Key points to cover in this section:
${sectionPoints}

${previousContent ? `Context from previous sections (do not repeat, just maintain flow):\n${previousContent.slice(-500)}` : ''}

Write ONLY this section now. Make it detailed and substantive.`,
  }
}