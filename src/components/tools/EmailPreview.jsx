import { useToast } from '../../components/ui/Toast'

function parseEmail(content) {
  if (!content) return { subject: '', body: '' }
  const lines = content.split('\n')
  const subjectLine = lines.find((l) => l.toUpperCase().startsWith('SUBJECT:'))
  const subject = subjectLine
    ? subjectLine.replace(/^SUBJECT:\s*/i, '').trim()
    : ''
  const bodyStart = subjectLine
    ? lines.indexOf(subjectLine) + 1
    : 0
  const body = lines.slice(bodyStart).join('\n').trim()
  return { subject, body }
}

export default function EmailPreview({ content, streaming, recipientName, senderName }) {
  const { toast } = useToast()
  const { subject, body } = parseEmail(content)

  async function handleCopy() {
    if (!content) return
    await navigator.clipboard.writeText(
      subject ? `Subject: ${subject}\n\n${body}` : body
    )
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Email client header */}
      <div className="px-6 py-3 bg-white border-b border-zinc-100 flex items-center justify-between">
        <p className="text-xs text-zinc-400">Live preview</p>
        {content && !streaming && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-600 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy email
          </button>
        )}
      </div>

      {/* Email viewer */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 p-6">
        {!content ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl">
              📧
            </div>
            <p className="text-sm text-zinc-400">
              Your email will appear here
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden max-w-2xl mx-auto">

            {/* Email header */}
            <div className="px-6 py-4 border-b border-zinc-50">

              {/* To/From */}
              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-6 text-right">To:</span>
                  <span className="text-zinc-700 font-medium">
                    {recipientName || 'Recipient'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-6 text-right">Fr:</span>
                  <span className="text-zinc-700 font-medium">
                    {senderName || 'You'}
                  </span>
                </div>
              </div>

              {/* Subject */}
              {subject ? (
                <h2 className="text-base font-semibold text-zinc-900 leading-tight">
                  {subject}
                  {streaming && (
                    <span className="inline-block w-1.5 h-4 bg-violet-500 ml-1 animate-pulse rounded-sm align-middle" />
                  )}
                </h2>
              ) : (
                streaming && (
                  <div className="h-5 flex items-center">
                    <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm" />
                  </div>
                )
              )}
            </div>

            {/* Email body */}
            <div className="px-6 py-5">
              {body.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-3" />
                return (
                  <p key={i} className="text-sm text-zinc-700 leading-relaxed mb-1">
                    {line}
                  </p>
                )
              })}
              {streaming && !subject && !body && (
                <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm align-middle" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}