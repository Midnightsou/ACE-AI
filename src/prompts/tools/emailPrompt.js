export function buildEmailPrompt(data) {
  return {
    system: `You are an expert email writer with years of experience writing professional, effective emails across all industries and contexts.

Rules:
- Write emails that are clear, concise, and achieve their purpose
- Match the tone and formality level specified exactly
- Subject line should be compelling and specific
- Opening should be direct — never start with "I hope this email finds you well"
- Body should be focused — say what needs to be said, nothing more
- Closing should match the tone
- Never use clichés like "As per my last email" or "Please find attached"
- Plain text only — no markdown, no asterisks, no headers
- Return the email in this exact format:

SUBJECT: [subject line here]

[email body here]`,

    user: `Write a professional email with these details:

Purpose: ${data.purpose}
Recipient type: ${data.recipientType}
Sender name: ${data.senderName || 'Not provided'}
Recipient name: ${data.recipientName || 'Not provided'}
Company/Organization: ${data.company || 'Not provided'}
Tone: ${data.tone}
Length: ${data.length}
Key points to cover:
${data.keyPoints}

Additional context: ${data.context || 'None'}

Write the complete email now.`,
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