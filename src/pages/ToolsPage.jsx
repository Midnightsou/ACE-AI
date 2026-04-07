import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tools, toolCategories } from '../tools/registry'
import { useToolStore } from '../store/toolStore'
import Sidebar from '../components/sidebar/Sidebar'

const categoryIcons = {
  general: '⚡',
  productivity: '📋',
  technical: '🛠',
  creative: '🎨',
  business: '💼',
}

export default function ToolsPage() {
  const navigate = useNavigate()
  const { setActiveTool } = useToolStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelectTool(tool) {
    setActiveTool(tool.id)
    navigate(tool.path)
  }

  return (
    <div className="flex" style={{ height: '100dvh' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 bg-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-500 hover:text-zinc-800 transition-colors md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-base font-bold text-zinc-900">Tools</h1>
            <p className="text-xs text-zinc-400">Pick a tool to get started</p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 w-48 focus-within:border-violet-400 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="bg-transparent text-sm text-zinc-700 placeholder:text-zinc-400 outline-none w-full"
            />
          </div>
        </div>

        {/* Tools grid */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {search ? (
            /* Search results */
            <div className="flex flex-col gap-4">
              <p className="text-xs text-zinc-400">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => handleSelectTool(tool)} />
                ))}
              </div>
            </div>
          ) : (
            /* Grouped by category */
            <div className="flex flex-col gap-8">
              {toolCategories.map((cat) => {
                const catTools = tools.filter((t) => t.category === cat.id)
                if (!catTools.length) return null
                return (
                  <div key={cat.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{categoryIcons[cat.id]}</span>
                      <h2 className="text-sm font-semibold text-zinc-700">{cat.label}</h2>
                      <div className="flex-1 h-px bg-zinc-100 ml-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {catTools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} onClick={() => handleSelectTool(tool)} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolCard({ tool, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-violet-400 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-zinc-50 group-hover:bg-violet-50 rounded-xl flex items-center justify-center text-xl transition-colors">
          {tool.icon}
        </div>
        <svg
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeLinecap="round"
          className="group-hover:stroke-violet-400 transition-colors"
        >
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-800 group-hover:text-violet-700 transition-colors">
          {tool.name}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
          {tool.description}
        </p>
      </div>
    </button>
  )
}