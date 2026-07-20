export const toneOptions = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'confident', label: 'Confident' },
  { id: 'formal', label: 'Formal' },
]

export const lengthOptions = [
  { id: 'short', label: 'Short', desc: '1–2 short paragraphs' },
  { id: 'medium', label: 'Medium', desc: '3–4 concise paragraphs' },
  { id: 'long', label: 'Long', desc: 'Detailed and structured' },
]

export const recipientTypes = ['Colleague', 'Manager', 'Client', 'Recruiter', 'Friend']

export const purposeTemplates = [
  'Follow up after a meeting',
  'Apply for a role',
  'Request a status update',
  'Thank someone for their help',
  'Ask for a referral',
]

export function buildEmailPrompt(form = {}) {
  const purpose = form.purpose?.trim() || 'a professional communication'
  const recipientType = form.recipientType?.trim() || 'recipient'
  const tone = form.tone?.trim() || 'professional'
  const length = form.length?.trim() || 'medium'
  const senderName = form.senderName?.trim() || 'the sender'
  const recipientName = form.recipientName?.trim() || 'the recipient'
  const keyPoints = form.keyPoints?.trim() || 'The email should be clear and concise.'

  return {
    system: 'You are an expert email assistant. Draft polished emails that match the requested tone, length, and audience. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.',
    user: `Draft an email for ${senderName} to ${recipientName}, who is a ${recipientType}. The purpose is: ${purpose}.\n\nTone: ${tone}\nLength: ${length}\n\nKey points to cover:\n${keyPoints}`,
  }
}
