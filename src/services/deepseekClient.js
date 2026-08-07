// Detect environment — use proxy on production, direct on localhost
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://api.deepseek.com/v1/chat/completions'
  : '/api/chat'

export const MODELS = {
  chat: 'deepseek-chat',
  reasoner: 'deepseek-reasoner',
}

export function getApiKey() {
  return import.meta.env.VITE_DEEPSEEK_API_KEY
}

export async function streamCompletion({
  messages,
  model = MODELS.chat,
  temperature = 0.5,
  maxTokens = 4096,
  onChunk,
  signal,
}) {
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  const headers = {
    'Content-Type': 'application/json',
  }

  // Only send API key directly on localhost
  // On production the proxy handles auth server-side
  if (isLocalhost) {
    headers['Authorization'] = `Bearer ${getApiKey()}`
  }

  const attemptStream = async () => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      signal,
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const error = new Error(
        err?.error?.message || `Request failed: ${response.status}`
      )
      error.status = response.status
      throw error
    }

    return response
  }

  let response
  try {
    response = await attemptStream()
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) {
      await new Promise((r) => setTimeout(r, 1500))
      response = await attemptStream()
    } else {
      throw err
    }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
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
      } catch { }
    }
  }

  return fullContent
}

export async function complete({
  messages,
  model = MODELS.chat,
  temperature = 0.5,
  maxTokens = 2048,
}) {
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  const headers = {
    'Content-Type': 'application/json',
  }

  if (isLocalhost) {
    headers['Authorization'] = `Bearer ${getApiKey()}`
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}