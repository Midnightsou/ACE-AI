export default async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY is not set')
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  try {
    const body = req.body

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek error:', response.status, errorText)
      return res.status(response.status).json({
        error: `DeepSeek returned ${response.status}`,
        detail: errorText,
      })
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // Stream response back to client
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      res.write(chunk)
    }

    res.end()
  } catch (err) {
    console.error('Proxy error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
}