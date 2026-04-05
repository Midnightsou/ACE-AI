import { useNavigate } from 'react-router-dom'
import { useToolStore } from '../../store/toolStore'

export default function ToolLayout({ tool, children, actions }) {
  const navigate = useNavigate()
  const setActiveTool = useToolStore((s) => s.setActiveTool)

  function handleBack() {
    setActiveTool('chat')
    navigate('/chat')
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-white flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{tool.icon}</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{tool.name}</p>
            <p className="text-xs text-zinc-400">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-50">
        {children}
      </div>

      {/* Bottom action bar */}
      {actions && (
        <div className="flex-shrink-0 border-t border-zinc-100 bg-white px-4 py-3">
          {actions}
        </div>
      )}
    </div>
  )
}