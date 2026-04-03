import { buildSystemPrompt } from '../prompts/systemPrompt'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

const MATH_KEYWORDS = [
  'solve', 'calculate', 'integral', 'derivative', 'equation',
  'algebra', 'matrix', 'quadratic', 'differentiate', 'integrate',
  'prove', 'simplify', 'factorise', 'factorize', 'graph', 'plot'
]

function isMathHeavy(message) {
  const lower = message.toLowerCase()
  return MATH_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function sendMessage({ messages, profile, recentMessages = [], apiKey, onChunk }) {
  const model = isMathHeavy(messages[messages.length - 1]?.content)
    ? 'deepseek-ai/DeepSeek-R1-0528'
    : 'deepseek-ai/DeepSeek-V3.2'

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(profile, recentMessages) + '\n\nCRITICAL: Never use markdown under any circumstance. No ###, no **, no --, no bullet points. Plain text only. Use numbers for lists.',
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const err = new Error(error?.message || 'Request failed')
    err.status = response.status
    throw err
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'data: [DONE]') continue
      if (!trimmed.startsWith('data: ')) continue

      try {
        const json = JSON.parse(trimmed.slice(6))
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          fullContent += delta
          onChunk?.(fullContent)
        }
      } catch {
        // Incomplete JSON chunk — skip
      }
    }
  }

  return fullContent
}