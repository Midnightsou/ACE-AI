export default function ToolInputOutput({ inputPanel, outputPanel, loading }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Input panel — scrollable */}
      <div className="flex-shrink-0 overflow-y-auto border-b border-zinc-100 bg-white max-h-[45%]">
        <div className="p-4">
          {inputPanel}
        </div>
      </div>

      {/* Output panel — takes remaining space */}
      <div className="flex-1 overflow-y-auto bg-zinc-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Generating...</p>
          </div>
        ) : (
          <div className="p-4">
            {outputPanel}
          </div>
        )}
      </div>
    </div>
  )
}