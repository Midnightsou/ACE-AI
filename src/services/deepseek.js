import axios from 'axios'
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

export async function sendMessage({ messages, profile, apiKey }) {
  const model = isMathHeavy(messages[messages.length - 1]?.content)
    ? 'deepseek-ai/DeepSeek-R1-0528'
    : 'deepseek-ai/DeepSeek-V3.2'

  const response = await axios.post(
    BASE_URL,
    {
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(profile) },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data.choices[0].message.content
}