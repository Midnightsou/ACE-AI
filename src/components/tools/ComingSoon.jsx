export default function ComingSoon({ tool }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 gap-4 text-center px-6">
      <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl">
        {tool.icon}
      </div>
      <div>
        <p className="font-semibold text-zinc-800 text-lg">{tool.name}</p>
        <p className="text-sm text-zinc-500 mt-1">{tool.description}</p>
      </div>
      <span className="text-xs bg-violet-100 text-violet-600 px-3 py-1.5 rounded-full font-medium">
        Coming soon
      </span>
    </div>
  )
}