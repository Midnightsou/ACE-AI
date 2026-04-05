export function buildCVPrompt(data) {
  return {
    system: `You are a professional CV writer with 15 years of experience helping people land jobs at top companies worldwide. You write clean, ATS-friendly CVs that get interviews.

Rules:
- Write in a professional, confident tone
- Use strong action verbs (Led, Built, Increased, Managed, Delivered)
- Quantify achievements where possible
- Keep it concise and impactful
- Structure clearly with sections
- Never use markdown symbols like ** or ## 
- Use plain text with clear section headers in CAPS (like WORK EXPERIENCE, EDUCATION, SKILLS)
- Do not add fictional information — only use what the user provides
- If information is missing for a section, skip that section entirely`,

    user: `Create a professional CV for the following person:

PERSONAL INFORMATION:
Full name: ${data.fullName}
Email: ${data.email || 'Not provided'}
Phone: ${data.phone || 'Not provided'}
Location: ${data.location || 'Not provided'}
LinkedIn: ${data.linkedin || 'Not provided'}

TARGET ROLE: ${data.targetRole}

PROFESSIONAL SUMMARY (write this based on their background):
${data.summary || 'Write a compelling 3-sentence summary based on their experience and target role'}

WORK EXPERIENCE:
${data.experience || 'Not provided'}

EDUCATION:
${data.education || 'Not provided'}

SKILLS:
${data.skills || 'Not provided'}

CERTIFICATIONS:
${data.certifications || 'Not provided'}

ADDITIONAL INFO:
${data.additional || 'None'}

Write a complete, professional CV ready to send to employers.`
  }
}