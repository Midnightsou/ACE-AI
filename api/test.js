export const config = {
  runtime: 'edge',
}

export default function handler(req) {
  const key = process.env.DEEPSEEK_API_KEY
  return new Response(
    JSON.stringify({
      hasKey: !!key,
      keyPrefix: key ? key.slice(0, 8) + '...' : 'MISSING',
      time: new Date().toISOString(),
      runtime: 'edge',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}