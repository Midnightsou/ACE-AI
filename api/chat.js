export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East — closest to DeepSeek servers
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {  
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // Pass the stream directly through — no buffering
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}