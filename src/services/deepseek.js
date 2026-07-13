import { streamCompletion, MODELS } from './deepseekClient'
import { buildSystemPrompt } from '../prompts/systemPrompt'

const MATH_KEYWORDS = [
  'solve',
  'calculate',
  'integral',
  'derivative',
  'equation',
  'algebra',
  'matrix',
  'quadratic',
  'differentiate',
  'integrate',
  'prove',
  'simplify',
  'factorise',
  'factorize',
  'graph',
  'plot',
]

function isMathHeavy(message = '') {
  const lower = message.toLowerCase() 
  return MATH_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function sendMessage({
  messages,
  profile,
  recentMessages = [],
  onChunk,
  signal,
}) {
  const lastMessage =
    messages?.[messages.length - 1]?.content || ''

  const model = isMathHeavy(lastMessage)
    ? MODELS.reasoner
    : MODELS.chat

  const systemPrompt = `${buildSystemPrompt(
    profile,
    recentMessages
  )}

CRITICAL: Never use markdown under any circumstance.
No ### headings.
No **bold**.
No bullet points.
No markdown tables.
Plain text only.
Use numbered lists when necessary.`

  return streamCompletion({
    model,
    signal,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    temperature: 0.5,
    maxTokens: 4096,
    onChunk,
  })
}