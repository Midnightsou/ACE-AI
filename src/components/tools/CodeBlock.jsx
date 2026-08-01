import { useState, useEffect } from 'react'
import { useToast } from '../../components/ui/Toast'

export default function CodeBlock({ code, language }) {
  const { toast } = useToast()
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState(null)
  const [style, setStyle] = useState(null)

  useEffect(() => {
    import('react-syntax-highlighter').then((mod) => {
      setSyntaxHighlighter(() => mod.Prism)
    })
    import('react-syntax-highlighter/dist/esm/styles/prism').then((mod) => {
      setStyle(() => mod.oneDark)
    })
  }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 my-2">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800">
        <span className="text-xs text-zinc-400 font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy
        </button>
      </div>

      {SyntaxHighlighter && style ? (
        <SyntaxHighlighter
          language={language || 'text'}
          style={style}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '16px',
          }}
          showLineNumbers={code.split('\n').length > 5}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className="bg-zinc-900 text-zinc-100 p-4 text-xs leading-relaxed overflow-x-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}