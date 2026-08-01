import { useDojo } from '../../../hooks/useDojo'
import { useToast } from '../../../components/ui/Toast'
import {
  buildSummaryPrompt,
  buildKeyConceptsPrompt,
  buildQuizPrompt,
} from '../../../prompts/tools/dojoPrompt'

const TAB_CONFIG = {
  summary: {
    label: 'Summary',
    icon: '📋',
    description: 'A comprehensive summary of all your sources',
    buttonLabel: 'Generate summary',
    promptBuilder: buildSummaryPrompt,
  },
  concepts: {
    label: 'Key concepts',
    icon: '💡',
    description: 'The most important ideas and terms from your sources',
    buttonLabel: 'Extract key concepts',
    promptBuilder: buildKeyConceptsPrompt,
  },
  quiz: {
    label: 'Quiz',
    icon: '❓',
    description: 'Test your understanding with AI-generated questions',
    buttonLabel: 'Generate quiz',
    promptBuilder: buildQuizPrompt,
  },
}

export default function DojoGenerateTab({ tabId }) {
  const { generateContent, generatingTab, generatedContent, readySources } = useDojo()
  const { toast } = useToast()

  const config = TAB_CONFIG[tabId]
  const content = generatedContent[tabId]
  const isGenerating = generatingTab === tabId

  if (!config) return null

  async function handleCopy() {
    if (!content) return
    await navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  if (readySources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="text-3xl">{config.icon}</span>
        <p className="text-sm font-medium text-zinc-600">Add sources first</p>
        <p className="text-xs text-zinc-400 max-w-xs">
          Upload your content on the left, then generate a {config.label.toLowerCase()}.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-zinc-800">
            {config.icon} {config.label}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{config.description}</p>
        </div>
        {content && !isGenerating && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-600 transition-colors"
          >
            Copy
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!content && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl">
              {config.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">
                Ready to generate
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Ace will analyze all {readySources.length} source{readySources.length !== 1 ? 's' : ''} and create your {config.label.toLowerCase()}.
              </p>
            </div>
            <button
              onClick={() => generateContent(tabId, config.promptBuilder)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>✨</span>
              {config.buttonLabel}
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-zinc-500 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Generating {config.label.toLowerCase()} from {readySources.length} source{readySources.length !== 1 ? 's' : ''}...
            </div>
            {content && (
              <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                {content}
                <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
              </div>
            )}
          </div>
        )}

        {content && !isGenerating && (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
              {content}
            </div>
            <button
              onClick={() => generateContent(tabId, config.promptBuilder)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-center"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}