import MathRenderer from './MathRenderer'
import MathGraph from './MathGraph'

function extractGraphExpression(content) {
  const match = content.match(/GRAPH:\s*(.+)/i)
  return match ? match[1].trim() : null
}

function preprocessContent(content) {
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/^___+$/gm, '')
    .replace(/\*\*ANSWER/gi, 'ANSWER')
    .replace(/\*\*/g, '')
    .replace(/GRAPH:\s*.+/gi, '')
    .trim()
}

function splitIntoBlocks(content) {
  const blocks = []
  const lines = content.split('\n')
  let current = []
  let inLatexBlock = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('\\[')) {
      if (current.length > 0) {
        blocks.push({ type: 'text', content: current.join('\n') })
        current = []
      }
      inLatexBlock = true
      current.push(line)
      continue
    }

    if (inLatexBlock) {
      current.push(line)
      if (trimmed.endsWith('\\]')) {
        blocks.push({ type: 'latex_block', content: current.join('\n') })
        current = []
        inLatexBlock = false
      }
      continue
    }

    // Step lines get their own block
    if (/^step\s*\d+/i.test(trimmed)) {
      if (current.length > 0) {
        blocks.push({ type: 'text', content: current.join('\n') })
        current = []
      }
      blocks.push({ type: 'step', content: trimmed })
      continue
    }

    // Answer line gets its own block
    if (/^ANSWER/i.test(trimmed)) {
      if (current.length > 0) {
        blocks.push({ type: 'text', content: current.join('\n') })
        current = []
      }
      blocks.push({ type: 'answer', content: trimmed })
      continue
    }

    current.push(line)
  }

  if (current.length > 0) {
    blocks.push({ type: 'text', content: current.join('\n') })
  }

  return blocks
}

export default function MathMessage({ message, isStreaming }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-violet-600 text-white">
          {message.content}
        </div>
      </div>
    )
  }

  const graphExpression = extractGraphExpression(message.content)
  const cleaned = preprocessContent(message.content)
  const blocks = splitIntoBlocks(cleaned)

  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
        ∑
      </div>
      <div className="flex-1 max-w-[85%] flex flex-col gap-2">

        <div className="bg-white border border-zinc-100 shadow-sm px-5 py-4 rounded-2xl rounded-tl-sm">
          {blocks.map((block, i) => {
            if (!block.content.trim() && block.type === 'text') return null

            if (block.type === 'answer') {
              return (
                <div key={i} className="mt-4 pt-4 border-t border-zinc-100">
                  <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider flex-shrink-0 mt-0.5">
                      Answer
                    </span>
                    <div className="text-sm text-violet-800 font-medium flex-1">
                      <MathRenderer text={block.content.replace(/^ANSWER:\s*/i, '')} />
                    </div>
                  </div>
                </div>
              )
            }

            if (block.type === 'step') {
              const stepLabel = block.content.match(/^(step\s*\d+)/i)?.[1] || ''
              const stepContent = block.content.replace(/^step\s*\d+[:\s.]*/i, '').trim()
              return (
                <div key={i} className="mb-3 mt-1">
                  <p className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-1.5">
                    {stepLabel}
                  </p>
                  {stepContent && (
                    <div className="text-sm text-zinc-700 leading-relaxed pl-3 border-l-2 border-violet-200">
                      <MathRenderer text={stepContent} />
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={i} className="text-sm text-zinc-700 leading-relaxed mb-2">
                <MathRenderer text={block.content} />
                {isStreaming && i === blocks.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            )
          })}

          {isStreaming && blocks.length === 0 && (
            <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm align-middle" />
          )}
        </div>

        {graphExpression && !isStreaming && (
          <MathGraph expression={graphExpression} />
        )}
      </div>
    </div>
  )
}