import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// Fix LaTeX that the model outputs without proper braces
function fixLatex(expr) {
  if (!expr) return ''

  return expr
    // Fix \frac without braces: \frac\pi180 → \frac{\pi}{180}
    .replace(/\\frac([^{{\s])([^{{\s}]+)\s*([^{{\s}]+)/g, (_, a, b, c) => {
      return `\\frac{${a}${b}}{${c}}`
    })
    // Fix \frac{x}y → \frac{x}{y}
    .replace(/\\frac(\{[^}]+\})([^{{\s}])/g, (_, num, den) => {
      return `\\frac${num}{${den}}`
    })
    // Fix \text without braces: \textradians → \text{radians}
    .replace(/\\text([a-zA-Z]+)/g, (_, word) => `\\text{${word}}`)
    // Fix \sqrt without braces when followed by single char
    .replace(/\\sqrt([^{{\s}(])/g, (_, c) => `\\sqrt{${c}}`)
    // Remove duplicate expressions like \frac\pi4\frac\pi4
    .replace(/(.{10,})\1/g, '$1')
    .trim()
}

function normalizeLatex(text) {
  if (!text) return ''

  return text
    // Convert \[ \] display blocks (multiline)
    .replace(/\\\[([\s\S]+?)\\\]/gs, (_, inner) => `\n$$${inner.trim()}$$\n`)
    // Convert \( \) inline
    .replace(/\\\(([^]*?)\\\)/gs, (_, inner) => `$${inner.trim()}$`)
    // Strip markdown
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    // Remove duplicate LaTeX lines (model sometimes outputs same line twice)
    .split('\n')
    .filter((line, i, arr) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      // Remove if previous non-empty line is identical
      const prev = arr.slice(0, i).reverse().find((l) => l.trim())
      return trimmed !== prev?.trim()
    })
    .join('\n')
}

function parseLatexParts(text) {
  const parts = []
  // Match $$...$$ first (display), then $...$ (inline)
  const regex = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index)
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent })
      }
    }

    if (match[1] !== undefined) {
      parts.push({ type: 'block', content: fixLatex(match[1].trim()) })
    } else if (match[2] !== undefined) {
      parts.push({ type: 'inline', content: fixLatex(match[2].trim()) })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    if (remaining.trim()) {
      parts.push({ type: 'text', content: remaining })
    }
  }

  return parts
}

function SafeInlineMath({ math }) {
  try {
    return <InlineMath math={math} />
  } catch {
    // If KaTeX fails, show raw expression
    return <code className="text-violet-700 text-sm font-mono bg-violet-50 px-1 rounded">{math}</code>
  }
}

function SafeBlockMath({ math }) {
  try {
    return (
      <span className="block my-4 overflow-x-auto text-center py-2">
        <BlockMath math={math} />
      </span>
    )
  } catch {
    return (
      <code className="block text-violet-700 text-sm font-mono bg-violet-50 p-3 rounded-xl my-2 text-center">
        {math}
      </code>
    )
  }
}

export default function MathRenderer({ text }) {
  if (!text) return null

  const normalized = normalizeLatex(text)
  const parts = parseLatexParts(normalized)

  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === 'block') return <SafeBlockMath key={i} math={part.content} />
        if (part.type === 'inline') return <SafeInlineMath key={i} math={part.content} />
        return <span key={i} className="whitespace-pre-wrap">{part.content}</span>
      })}
    </span>
  )
}