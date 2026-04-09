export function buildCVAnalyserPrompt(cvText, jobDescription, targetRole) {
  return {
    system: `You are an expert CV consultant and ATS optimization specialist with 15 years of experience helping candidates land interviews at top companies. You analyze CVs against job descriptions and rewrite them to maximize match rate.

Rules:
- Rewrite the CV to align strongly with the job description
- Use keywords and phrases directly from the job description
- Reorder and emphasize experience that matches the role
- Strengthen weak bullet points with stronger action verbs
- Quantify achievements where possible based on context
- Never fabricate information — only reframe what exists
- Keep the same person's real experience — just present it better
- Use plain text with CAPS section headers followed by dashes
- Do not use markdown symbols like ** or ## or ---------
- Structure: Summary, Work Experience, Education, Skills, Certifications`,

    user: `Analyze this CV and rewrite it to match the job description below.

EXISTING CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

TARGET ROLE: ${targetRole}

Rewrite the full CV optimized for this specific job. Make it ATS-friendly and compelling for this role.`,
  }
}

export function buildAnalysisPrompt(cvText, jobDescription) {
  return {
    system: `You are an ATS and CV expert. Analyze CVs against job descriptions and give honest, actionable feedback.

Rules:
- Be direct and specific
- Give a match score out of 100
- List exactly what's missing
- List what's strong
- Give 3 specific improvement tips
- Plain text only, no markdown, no asterisks
- Use numbers for lists`,

    user: `Analyze this CV against the job description.

CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Give:
1. Match score (X/100)
2. Top 3 strengths
3. Top 3 gaps or missing keywords
4. 3 specific improvement tips`,
  }
}