import { useEffect, useState } from 'react'

function normalizeLatex(text) {
  return text
    .replace(/\\\[([^]*?)\\\]/gs, '\n$$$$\n$1\n$$$$\n')
    .replace(/\\\(([^]*?)\\\)/gs, '$$$1$')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/^___+$/gm, '')
}

export default function MathRenderer({ text }) {
  const [katexLoaded, setKatexLoaded] = useState(false)
  const [InlineMath, setInlineMath] = useState(null)
  const [BlockMath, setBlockMath] = useState(null)

  useEffect(() => {
    let isMounted = true

    import('react-katex').then((mod) => {
      if (!isMounted) return
      setInlineMath(() => mod.InlineMath)
      setBlockMath(() => mod.BlockMath)
      setKatexLoaded(true)
    })

    import('katex/dist/katex.min.css')

    return () => {
      isMounted = false
    }
  }, [])

  if (!text) return null
  if (!katexLoaded) return <span className="whitespace-pre-wrap">{text}</span>

  const normalized = normalizeLatex(text)
  const parts = []
  const regex = /\$\$([\s\S]+?)\$\$|\$([^\n$]+)\$/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      const textContent = normalized.slice(lastIndex, match.index)
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent })
      }
    }
    if (match[1]) {
      parts.push({ type: 'block', content: match[1].trim() })
    } else if (match[2]) {
      parts.push({ type: 'inline', content: match[2].trim() })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < normalized.length) {
    const remaining = normalized.slice(lastIndex)
    if (remaining.trim()) {
      parts.push({ type: 'text', content: remaining })
    }
  }

  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === 'block') {
          return (
            <span key={i} className="block my-4 overflow-x-auto text-center py-2">
              <BlockMath math={part.content} />
            </span>
          )
        }
        if (part.type === 'inline') {
          try {
            return <InlineMath key={i} math={part.content} />
          } catch {
            return <span key={i} className="font-mono text-violet-700 text-xs">{part.content}</span>
          }
        }
        return (
          <span key={i} className="whitespace-pre-wrap">{part.content}</span>
        )
      })}
    </span>
  )
}