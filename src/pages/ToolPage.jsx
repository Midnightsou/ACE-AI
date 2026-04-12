import { useParams, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { getToolById } from '../tools/registry'
import Sidebar from '../components/sidebar/Sidebar'
import ComingSoon from '../components/tools/ComingSoon'
import CVMaker from '../components/tools/CVMaker'
import CVAnalyser from '../components/tools/CVAnalyser'
import CoverLetter from '../components/tools/CoverLetter'
import EssayWriter from '../components/tools/EssayWriter'
import Codex from '../components/tools/Codex'
import MathMode from '../components/tools/MathMode'
import ImageCreator from '../components/tools/ImageCreator'
import EmailComposer from '../components/tools/EmailComposer'
import Dojo from '../components/tools/dojo/Dojo'
  
const toolComponents = {
  'cv-maker': CVMaker,
  'cv-analyser': CVAnalyser,
  'cover-letter': CoverLetter,
  'essay-writer': EssayWriter,
  'codex': Codex,
  'math': MathMode,
  'image-creator': ImageCreator,
  'email-composer': EmailComposer,
  'dojo': Dojo,
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
       
       {!['codex', 'math', 'image-creator', 'dojo'].includes(toolId) && (
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
)}

        {toolId !== 'codex' && toolId !== 'math' && (
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
        )}

        {!['codex', 'math', 'image-creator'].includes(toolId) && (
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
)}


{toolId !== 'codex' && (
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
)}
        <div className="flex-1 overflow-hidden">
  {ToolComponent ? (
    toolId === 'codex'
      ? <ToolComponent />
      : <ToolComponent />
  ) : (
    <ComingSoon tool={tool} />
  )}
</div>
      </div>
    </div>
  )
}