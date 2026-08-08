export const config = {
  runtime: 'edge',
}

export default function handler() {
  return new Response(
    JSON.stringify({ status: 'alive', time: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}