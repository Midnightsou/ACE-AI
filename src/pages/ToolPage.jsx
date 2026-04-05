import { useParams, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { getToolById } from '../tools/registry'
import Sidebar from '../components/sidebar/Sidebar'
import ComingSoon from '../components/tools/ComingSoon'
import CVMaker from '../components/tools/CVMaker'
import CVAnalyser from '../components/tools/CVAnalyser'
import CoverLetter from '../components/tools/CoverLetter'
import EssayWriter from '../components/tools/EssayWriter'

const toolComponents = {
  'cv-maker': CVMaker,
  'cv-analyser': CVAnalyser,
  'cover-letter': CoverLetter,
  'essay-writer': EssayWriter,
}

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!tool) return <Navigate to="/chat" replace />

  const ToolComponent = toolComponents[toolId]

  return (
    <div className="flex" style={{ height: '100dvh' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-zinc-100 bg-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-500 hover:text-zinc-800 transition-colors"
          >
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

        <div className="flex-1 overflow-hidden">
          {ToolComponent ? <ToolComponent /> : <ComingSoon tool={tool} />}
        </div>
      </div>
    </div>
  )
}