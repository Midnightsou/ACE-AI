export function buildCoverLetterPrompt(data) {
  return {
    system: `You are an expert cover letter writer who has helped thousands of candidates land interviews at top companies. You write compelling, personalized cover letters that get noticed.

Rules:
- Write in a ${data.tone} tone
- Make it specific to the company and role — not generic
- Open with a strong hook that grabs attention immediately
- Show genuine enthusiasm for the specific company
- Connect the candidate's experience directly to the job requirements
- End with a confident call to action
- Keep it to 3-4 paragraphs — hiring managers read fast
- Never use clichés like "I am writing to apply" or "To whom it may concern"
- Plain text only — no markdown, no asterisks, no headers
- Do not add fictional achievements — only use what the user provides`,

    user: `Write a compelling cover letter for this candidate:

PERSONAL DETAILS:
Name: ${data.fullName}
Email: ${data.email || 'Not provided'}
Phone: ${data.phone || 'Not provided'}

JOB DETAILS:
Company: ${data.company}
Role: ${data.role}
Job description: ${data.jobDescription || 'Not provided'}

CANDIDATE BACKGROUND:
${data.background}

TONE: ${data.tone}

SPECIFIC THINGS TO HIGHLIGHT:
${data.highlights || 'Use the most relevant parts of their background'}

Write a complete, ready-to-send cover letter.`,
  }
}