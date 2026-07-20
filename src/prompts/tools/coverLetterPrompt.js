export function buildCoverLetterPrompt(form = {}) {
  const fullName = form.fullName?.trim() || 'the candidate'
  const company = form.company?.trim() || 'the company'
  const role = form.role?.trim() || 'the target role'
  const experience = form.experience?.trim() || 'relevant experience'
  const tone = form.tone?.trim() || 'professional'

  return {
    system: 'You are an expert cover letter writer. Write a concise, persuasive cover letter tailored to the company and role. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.',
    user: `Write a ${tone} cover letter for ${fullName} applying to ${role} at ${company}. Highlight ${experience}. Keep it clear, polished, and suitable for a professional application.`,
  }
}
