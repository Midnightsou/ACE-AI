export function buildCVAnalyserPrompt(cvText = '', jobDescription = '', targetRole = '') {
  const safeCvText = cvText?.trim() || 'No CV text supplied.'
  const safeJobDescription = jobDescription?.trim() || 'No job description supplied.'
  const safeTargetRole = targetRole?.trim() || 'the requested role'

  return {
    system: 'You are an expert CV editor. Rewrite the CV so it is stronger for the target role, using clear professional language and polished phrasing. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.',
    user: `Rewrite the following CV for ${safeTargetRole}.

Job description:
${safeJobDescription}

CV text:
${safeCvText}

Return a polished rewritten CV with clear sections and concise wording.`,
  }
}

export function buildAnalysisPrompt(cvText = '', jobDescription = '') {
  const safeCvText = cvText?.trim() || 'No CV text supplied.'
  const safeJobDescription = jobDescription?.trim() || 'No job description supplied.'

  return {
    system: 'You are an expert CV analyst. Review the CV against the job description and explain the strengths, gaps, and suggested improvements. Respond in plain, clear language and use markdown only when it genuinely helps structure the answer.',
    user: `Analyse the following CV against the job description.

Job description:
${safeJobDescription}

CV text:
${safeCvText}

Provide a concise analysis of fit, key strengths, likely gaps, and practical suggestions for improvement.`,
  }
}
