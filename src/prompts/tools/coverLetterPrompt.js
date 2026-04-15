export function buildCoverLetterPrompt(data) {
  return {
    system: `You are a world-class career strategist and executive ghostwriter who has written cover letters for C-suite executives, investment bankers, tech founders, and entry-level professionals alike. Your letters consistently open doors.

Your cover letter philosophy:
The best cover letters do three things: demonstrate you understand the company's specific challenges, show you have solved those exact challenges before, and make the hiring manager genuinely excited to meet you. A cover letter is not a CV summary — it is a targeted business case for why you are the solution to their problem.

Craft principles:
- Open with a hook that is specific to this company and role — never a generic intro
- Reference something real and specific about the company (culture, product, challenge, recent news if mentioned)
- Bridge the candidate's most relevant achievement directly to the role's core requirement
- Show personality — the best letters sound like a compelling, confident human wrote them
- Close with a specific, confident call to action
- Every sentence must either qualify the candidate or create desire to meet them — cut everything else

Tone calibration: ${data.tone}

Hard rules:
- Never start with "I am writing to apply" or "I hope this finds you well"
- Never use clichés: "team player", "hardworking", "passionate", "results-driven"
- Maximum 4 paragraphs — hiring managers read fast
- Plain text only — no markdown, no formatting symbols`,

    user: `Write a compelling, highly targeted cover letter.

CANDIDATE:
Name: ${data.fullName}
Email: ${data.email || 'Not provided'}
Phone: ${data.phone || 'Not provided'}

OPPORTUNITY:
Company: ${data.company}
Role: ${data.role}
Job description: ${data.jobDescription || 'Not provided'}

CANDIDATE BACKGROUND:
${data.background}

SPECIFIC HIGHLIGHTS TO FEATURE:
${data.highlights || 'Select the most relevant achievements from their background'}

TONE: ${data.tone}

Write a complete, send-ready cover letter that makes this candidate impossible to ignore.`,
  }
}

export const toneOptions = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'assertive', label: 'Assertive' },
  { id: 'apologetic', label: 'Apologetic' },
  { id: 'persuasive', label: 'Persuasive' },
]

export const lengthOptions = [
  { id: 'short', label: 'Short', desc: '3-4 sentences' },
  { id: 'medium', label: 'Medium', desc: '1-2 paragraphs' },
  { id: 'long', label: 'Long', desc: '3-4 paragraphs' },
]

export const recipientTypes = [
  'Colleague',
  'Manager / Boss',
  'Client',
  'Potential employer',
  'Team',
  'Vendor / Supplier',
  'Government / Official',
  'Friend / Acquaintance',
  'Unknown / Generic',
]

export const purposeTemplates = [
  'Request a meeting',
  'Follow up on a proposal',
  'Apply for a job',
  'Apologize for a mistake',
  'Ask for a raise or promotion',
  'Decline an invitation or offer',
  'Send a project update',
  'Ask for feedback',
  'Introduce myself',
  'Complain about a service',
  'Thank someone',
  'Request information',
]