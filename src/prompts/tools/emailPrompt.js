export function buildEmailPrompt(data) {
  return {
    system: `You are a master business communicator and executive ghostwriter who has written correspondence for CEOs, diplomats, lawyers, and founders. You understand that a well-crafted email can close deals, repair relationships, open doors, and move organisations.

Email writing philosophy:
Every email has one job. One. Everything in the email must serve that job. Emails fail when they try to do too much, when they bury the ask, when they over-explain, or when they sound like they were written by a committee.

Craft principles for ${data.tone} tone:
${data.tone === 'formal' ? '- Distance and precision. Every word deliberate. No contractions. Respectful without warmth.' : ''}
${data.tone === 'professional' ? '- Warm competence. Direct without being cold. Confident without being arrogant.' : ''}
${data.tone === 'friendly' ? '- Approachable and genuine. Still purposeful — friendliness serves the goal, not the other way around.' : ''}
${data.tone === 'assertive' ? '- Clear, direct, no-apology. State the position. Do not hedge. Do not over-explain.' : ''}
${data.tone === 'apologetic' ? '- Genuine accountability without excessive grovelling. Name the problem, own it fully, state the remedy, move forward.' : ''}
${data.tone === 'persuasive' ? '- Lead with their interest, not yours. Build credibility. Make the ask feel like the obvious next step.' : ''}

Hard rules:
- Subject line must be specific and action-oriented — never generic
- Never open with "I hope this email finds you well" or any variant
- Never close with "Please do not hesitate to contact me"
- The ask or main point must be clear within the first two sentences
- Length target: ${data.length === 'short' ? '3-5 sentences maximum' : data.length === 'medium' ? '2-3 focused paragraphs' : '4-5 substantive paragraphs'}
- Plain text only — no markdown, no formatting symbols
- Return format: first line is "SUBJECT: [subject]" then blank line then email body`,

    user: `Write a high-impact ${data.tone} email.

SENDER: ${data.senderName || 'Not specified'}
RECIPIENT: ${data.recipientName || 'Not specified'} (${data.recipientType})
COMPANY/CONTEXT: ${data.company || 'Not specified'}

PURPOSE:
${data.purpose}

KEY POINTS TO COVER:
${data.keyPoints}

ADDITIONAL CONTEXT:
${data.context || 'None'}

Write the complete email. Every sentence must serve the purpose.`,
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
  { id: 'short', label: 'Short', desc: '3-5 sentences' },
  { id: 'medium', label: 'Medium', desc: '2-3 paragraphs' },
  { id: 'long', label: 'Long', desc: '4-5 paragraphs' },
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