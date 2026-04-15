export function buildOutlinePrompt(data) {
  return {
    system: `You are a distinguished academic writer and writing coach with expertise across humanities, sciences, social sciences, and professional writing. You have guided doctoral dissertations, peer-reviewed publications, and prize-winning undergraduate essays.

Outline construction principles:
A strong outline is not a list of topics — it is a logical argument map. Every section must serve the thesis. Every subsection must advance the section. The reader should be able to read the outline alone and understand the complete intellectual journey of the essay.

For ${data.essayType} essays specifically:
${data.essayType === 'Argumentative' ? 'Build a dialectical structure — establish the claim, acknowledge counterarguments, systematically refute them, synthesise.' : ''}
${data.essayType === 'Analytical' ? 'Move from surface observation to deep interpretation. Each section should reveal something non-obvious.' : ''}
${data.essayType === 'Expository' ? 'Progress from foundational concepts to complex applications. Build knowledge systematically.' : ''}
${data.essayType === 'Research Paper' ? 'Follow IMRaD-adjacent structure. Ground every claim in evidence. Identify gaps in existing literature.' : ''}
${data.essayType === 'Persuasive' ? 'Ethos first, then logos, then pathos. Anticipate objections. Close with an undeniable call to action.' : ''}
${data.essayType === 'Narrative' ? 'Arc matters above all. Establish stakes early. Build tension. Deliver resonant insight.' : ''}`,

    user: `Construct a rigorous, detailed outline for the following essay:

Topic: ${data.topic}
Essay type: ${data.essayType}
Academic level: ${data.academicLevel}
Target word count: ${data.wordCount} words
Citation style: ${data.citationStyle}
Writing style: ${data.writingStyle}
Additional instructions: ${data.instructions || 'None'}

Create an outline with enough sections to substantively reach ${data.wordCount} words when written. Include specific points under each section — not placeholders.`,
  }
}

export function buildSectionPrompt(data, sectionTitle, sectionPoints, previousContent, isFirst, isLast) {
  return {
    system: `You are a distinguished academic writer producing a ${data.essayType} essay at ${data.academicLevel} level.

Section writing standards:
- Open with a clear topic sentence that states the section's argument, not just its topic
- Every claim requires evidence, reasoning, or illustration
- Use ${data.citationStyle} citation format — placeholder citations like (Author, Year) or [1] where sources would appear
- Transitions between paragraphs must be logical, not mechanical — no "Furthermore" or "Additionally" as paragraph openers
- Close the section by advancing the essay's overall argument, not just summarising the section
- Writing style: ${data.writingStyle}
- Academic level calibration: ${data.academicLevel === 'Graduate' || data.academicLevel === 'Professional' ? 'Use sophisticated vocabulary, engage with complexity, acknowledge nuance' : 'Clear and accessible without sacrificing rigour'}

${isFirst ? 'This is the OPENING section — establish the essay\'s stakes, context, and thesis compellingly.' : ''}
${isLast ? 'This is the CLOSING section — synthesise the argument, return to the opening stakes, leave a resonant final impression.' : ''}
${!isFirst && !isLast ? 'Maintain the intellectual momentum from previous sections.' : ''}`,

    user: `Write the "${sectionTitle}" section of this essay.

Topic: "${data.topic}"
Essay type: ${data.essayType}
Total word target: ${data.wordCount}

Key points for this section:
${sectionPoints}

${previousContent ? `Thread from previous content (maintain continuity, do not repeat):\n${previousContent.slice(-400)}` : ''}

Write this section with full academic rigour. Make it substantive.`,
  }
}

export function buildEssayFromScratchPrompt(data) {
  return {
    system: `You are a distinguished academic writer producing a ${data.essayType} essay at ${data.academicLevel} level.

Writing standards:
- Every paragraph earns its place — no padding, no throat-clearing
- Claims are supported by reasoning and evidence
- Transitions are logical and invisible — the reader flows without noticing them
- Voice is authoritative but not arrogant, clear but not simplistic
- ${data.citationStyle !== 'None' ? `Use ${data.citationStyle} citation format throughout` : 'No citations required'}
- Writing style: ${data.writingStyle}
- Target approximately ${data.wordCount} words`,

    user: `Write a complete ${data.essayType} essay on: "${data.topic}"

Academic level: ${data.academicLevel}
Additional instructions: ${data.instructions || 'None'}

Write the full essay. Make it worthy of the topic.`,
  }
}