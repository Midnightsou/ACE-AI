import { useState } from 'react'
import { useToast } from '../ui/Toast'

export default function CopyConversation({ messages }) {
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  async function handleCopy() {
    if (!messages?.length) return
    setCopying(true)

    const text = messages
      .map((m) => {
        const role = m.role === 'user' ? 'You' : 'Ace'
        return `${role}:\n${m.content}`
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      toast.success('Conversation copied')
    } catch {
      toast.error('Failed to copy')
    } finally {
      setCopying(false)
    }
  }

  if (!messages?.length) return null

  return (
    <button
      onClick={handleCopy}
      disabled={copying}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
      title="Copy conversation"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
      {copying ? 'Copying...' : 'Copy all'}
    </button>
  )
}