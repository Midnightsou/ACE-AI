import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// The most important function — fix malformed LaTeX before KaTeX sees it
function fixLatex(expr) {
  if (!expr) return ''

  let result = expr
    .trim()
    // Remove duplicate expressions the model sometimes outputs
    .replace(/^(.{5,}?)\s*\1$/, '$1')

  // Fix \frac without braces — most common issue
  // Pattern: \frac followed by non-brace tokens
  // \frac\pi180 → \frac{\pi}{180}
  // \frac45\pi180 → \frac{45\pi}{180} — harder case, handle step by step

  // First pass: \frac{x}y → \frac{x}{y} (second arg missing brace)
  result = result.replace(/\\frac(\{[^}]*\})([^{\\$\s])/g, '\\frac$1{$2}')

  // Second pass: \fracAB where A and B are single tokens (no braces at all)
  // Match \frac followed by two non-brace groups separated by nothing
  result = result.replace(
    /\\frac([^{\\$\s]+)\s*([^{\\$\s]+)/g,
    (match, num, den) => {
      // If either already has braces, skip
      if (num.startsWith('{') || den.startsWith('{')) return match
      return `\\frac{${num}}{${den}}`
    }
  )

  // Fix \text without braces: \textradians → \text{radians}
  result = result.replace(/\\text([a-zA-Z]+)/g, '\\text{$1}')

  // Fix \sqrt without braces for single chars: \sqrtx → \sqrt{x}
  result = result.replace(/\\sqrt([^{(\\$\s])/g, '\\sqrt{$1}')

  // Fix common broken commands from OCR/copy-paste
  const repairs = [
    [/\\f\s*r\s*a\s*c/g, '\\frac'],
    [/\\o\s*m\s*e\s*g\s*a/g, '\\omega'],
    [/\\a\s*l\s*p\s*h\s*a/g, '\\alpha'],
    [/\\b\s*e\s*t\s*a/g, '\\beta'],
    [/\\g\s*a\s*m\s*m\s*a/g, '\\gamma'],
    [/\\p\s*s\s*i/g, '\\psi'],
    [/\\h\s*b\s*a\s*r/g, '\\hbar'],
    [/\\n\s*a\s*b\s*l\s*a/g, '\\nabla'],
    [/\\p\s*a\s*r\s*t\s*i\s*a\s*l/g, '\\partial'],
    [/\\s\s*q\s*r\s*t/g, '\\sqrt'],
    [/\\i\s*n\s*f\s*t\s*y/g, '\\infty'],
    [/\\s\s*u\s*m/g, '\\sum'],
    [/\\i\s*n\s*t/g, '\\int'],
    [/\\l\s*a\s*m\s*b\s*d\s*a/g, '\\lambda'],
    [/\\p\s*i(?!\s*{)/g, '\\pi'],
    [/\\t\s*h\s*e\s*t\s*a/g, '\\theta'],
  ]

  repairs.forEach(([from, to]) => {
    result = result.replace(from, to)
  })

  return result
}

function normalizeLatex(text) {
  if (!text) return ''

  // Step 1: Convert \[...\] to $$...$$
  let result = text.replace(/\\\[([\s\S]*?)\\\]/gs, (_, inner) => {
    return `\n$$${inner.trim()}$$\n`
  })

  // Step 2: Convert \(...\) to $...$
  result = result.replace(/\\\(([\s\S]*?)\\\)/gs, (_, inner) => {
    return `$${inner.trim()}$`
  })

  // Step 3: Strip markdown formatting
  result = result
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')

  // Step 4: Remove consecutive duplicate lines (model often outputs same line twice)
  const lines = result.split('\n')
  const deduped = []
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const prevTrimmed = deduped[deduped.length - 1]?.trim()
    // Skip if this line is identical to previous non-empty line
    if (trimmed && trimmed === prevTrimmed) continue
    deduped.push(lines[i])
  }

  return deduped.join('\n')
}

function parseContent(text) {
  const parts = []
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      const textChunk = text.slice(lastIndex, match.index)
      if (textChunk) parts.push({ type: 'text', content: textChunk })
    }

    if (match[1] !== undefined) {
      // Display math $$...$$
      parts.push({ type: 'block', content: fixLatex(match[1].trim()) })
    } else if (match[2] !== undefined) {
      // Inline math $...$
      parts.push({ type: 'inline', content: fixLatex(match[2].trim()) })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts
}

function RenderInline({ math }) {
  try {
    return <InlineMath math={math} />
  } catch (e) {
    // KaTeX failed — show as styled code rather than crashing
    return (
      <code className="text-sm font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
        {math}
      </code>
    )
  }
}

function RenderBlock({ math }) {
  try {
    return (
      <span className="block my-4 overflow-x-auto py-2 text-center">
        <BlockMath math={math} />
      </span>
    )
  } catch (e) {
    return (
      <code className="block text-sm font-mono text-violet-700 bg-violet-50 p-4 rounded-xl my-3 text-center overflow-x-auto">
        {math}
      </code>
    )
  }
}

export default function MathRenderer({ text }) {
  if (!text) return null

  const normalized = normalizeLatex(text)
  const parts = parseContent(normalized)

  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === 'block') {
          return <RenderBlock key={i} math={part.content} />
        }
        if (part.type === 'inline') {
          return <RenderInline key={i} math={part.content} />
        }
        return (
          <span key={i} className="whitespace-pre-wrap leading-relaxed">
            {part.content}
          </span>
        )
      })}
    </span>
  )
}