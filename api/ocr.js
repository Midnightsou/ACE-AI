export const config = { runtime: 'edge' }

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const key = globalThis.process?.env?.OCR_SPACE_API_KEY
  if (!key) {
    return json({ IsErroredOnProcessing: true, ErrorMessage: ['OCR key not set on server'] }, 500)
  }

  try {
    const incoming = await req.formData()
    const out = new FormData()
    for (const [k, v] of incoming.entries()) out.append(k, v)
    out.set('apikey', key)

    const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: out })
    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return json({ IsErroredOnProcessing: true, ErrorMessage: [err.message] }, 500)
  }
}