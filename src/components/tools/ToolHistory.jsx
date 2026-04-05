import { useEffect } from 'react'
import { useTool } from '../../hooks/useTool'

export default function ToolHistory({ toolId, onSelect, renderItem }) {
  const { history, loadHistory, deleteOutput } = useTool(toolId)

  useEffect(() => {
    loadHistory()
  }, [toolId])

  if (!history.length) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">Previous outputs</p>
      <div className="flex flex-col gap-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm group relative"
          >
            {/* Custom render per tool */}
            {renderItem ? renderItem(item) : (
              <p className="text-sm text-zinc-700 line-clamp-3 leading-relaxed">
                {item.output}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-50">
              <button
                onClick={() => onSelect?.(item)}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                Load this
              </button>
              <button
                onClick={() => deleteOutput(item.id)}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}