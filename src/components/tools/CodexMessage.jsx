import CodeBlock from './CodeBlock'

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^>\s+/gm, '')
    .replace(/_{1,2}(.+?)_{1,2}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseMessage(content) {
  const parts = []
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: stripMarkdown(content.slice(lastIndex, match.index)),
      })
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: stripMarkdown(content.slice(lastIndex)),
    })
  }

  return parts
}

export default function CodexMessage({ message, isStreaming }) {
  const isUser = message.role === 'user'
  const parts = parseMessage(message.content)
  const hasCode = parts.some((p) => p.type === 'code')

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-violet-600 text-white">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1 font-mono">
        {'</>'}
      </div>
      <div className={`flex-1 max-w-[85%] ${hasCode ? 'flex flex-col gap-2' : 'bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm'}`}>
        {parts.map((part, i) => {
          if (part.type === 'code') {
            return <CodeBlock key={i} code={part.content} language={part.language} />
          }
          if (!part.content.trim()) return null
          return (
  <div
    key={i}
    className={hasCode
      ? 'text-sm text-zinc-700 leading-relaxed bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl whitespace-pre-wrap'
      : 'text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap'
    }
  >
    {part.content}
    {isStreaming && i === parts.length - 1 && (
      <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
    )}
  </div>
)
        })}
        {isStreaming && parts.length === 0 && (
          <div className="bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl">
            <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm align-middle" />
          </div>
        )}
      </div>
      
    </div>
  )
}