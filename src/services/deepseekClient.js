function getBaseUrl() {
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
  return isLocal
    ? 'https://api.deepseek.com/v1/chat/completions'
    : '/api/chat'
}

export const MODELS = {
  chat: 'deepseek-chat',
  reasoner: 'deepseek-reasoner',
}

export function getApiKey() {
  return import.meta.env.VITE_DEEPSEEK_API_KEY
}

function buildHeaders() {
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')

  const headers = { 'Content-Type': 'application/json' }
  if (isLocal) headers['Authorization'] = `Bearer ${getApiKey()}`
  return headers
}

export async function streamCompletion({
  messages,
  model = MODELS.chat,
  temperature = 0.5,
  maxTokens = 4096,
  onChunk,
  signal,
}) {
  const BASE_URL = getBaseUrl()

  const makeRequest = async () => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      signal,
      headers: buildHeaders(),
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
    response = await makeRequest()
  } catch (err) {
    if (err.name === 'AbortError') throw err
    if (err.status === 401 || err.status === 403) throw err
    // Retry once after short delay
    await new Promise((r) => setTimeout(r, 1500))
    response = await makeRequest()
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
  const BASE_URL = getBaseUrl()

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: buildHeaders(),
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