export default function handler(req, res) {
  const key = process.env.DEEPSEEK_API_KEY
  res.json({
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 8) + '...' : 'MISSING',
    time: new Date().toISOString(),
  })
}