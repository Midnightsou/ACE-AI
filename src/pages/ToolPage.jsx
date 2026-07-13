import { lazy, Suspense, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getToolById } from '../tools/registry'
import Sidebar from '../components/sidebar/Sidebar'
import ComingSoon from '../components/tools/ComingSoon'

// Each tool only loads when navigated to
const toolComponents = {
  'cv-maker': lazy(() => import('../components/tools/CVMaker')),
  'cv-analyser': lazy(() => import('../components/tools/CVAnalyser')),
  'cover-letter': lazy(() => import('../components/tools/CoverLetter')),
  'essay-writer': lazy(() => import('../components/tools/EssayWriter')),
  'codex': lazy(() => import('../components/tools/Codex')),
  'math': lazy(() => import('../components/tools/MathMode')),
  'email-composer': lazy(() => import('../components/tools/EmailComposer')),
  'dojo': lazy(() => import('../components/tools/dojo/Dojo')),
}

function ToolSpinner() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400">Loading tool...</p>
      </div>
    </div>
  )
}

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!tool) return <Navigate to="/chat" replace />

  const ToolComponent = toolComponents[toolId]

  const hideHeader = ['codex', 'math', 'image-creator', 'dojo'].includes(toolId)

  return (
    <div className="flex" style={{ height: '100dvh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!hideHeader && (
          <div className="md:hidden flex items-center px-4 py-3 border-b border-zinc-100 bg-white flex-shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="text-zinc-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <div className="flex-1 flex items-center justify-center gap-2">
              <span>{tool.icon}</span>
              <span className="text-sm font-semibold text-zinc-900">{tool.name}</span>
            </div>
            <div className="w-5" />
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<ToolSpinner />}>
            {ToolComponent ? <ToolComponent /> : <ComingSoon tool={tool} />}
          </Suspense>
        </div>
      </div>
    </div>
  )
}