import { useState, useEffect, useRef, useCallback } from 'react'
import { useDojo } from '../../../hooks/useDojo'
import { buildMindMapPrompt } from '../../../prompts/tools/dojoPrompt'

/**
 * Advanced resilient parser handling flexible AI outputs
 */
function parseMindMap(text) {
  if (!text) return null

  const lines = text.split('\n').filter(Boolean)
  const centreMatch = lines[0]?.match(/(?:CENTRE|CENTER|PRIMARY DOMAIN|TOPIC):\s*(.+)/i) || lines[0]?.match(/^[0-9.]*\s*(.+)/)
  if (!centreMatch) return null

  const centre = centreMatch[1].replace(/^[#*0-9.-]+\s*/, '').trim()
  const branches = []
  let currentBranch = null
  let currentSub = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    
    const branchMatch = line.match(/^(?:BRANCH\s+\d+|[0-9]+\.[0-9]+|[A-Z]\.)\s*[:.-]?\s*(.+)/i) || line.match(/^[-*]\s+([^-*].+)/)
    const subMatch = line.match(/^\s{2,3}[-*•]?\s*(.+)/) || line.match(/^[0-9]+\.[0-9]+\.[0-9]+\s+(.+)/)
    const leafMatch = line.match(/^\s{4,}[-*•]?\s*(.+)/)

    if (branchMatch && !line.startsWith('  ')) {
      currentBranch = { label: branchMatch[1].replace(/^[#*0-9.-]+\s*/, '').trim(), children: [] }
      currentSub = null
      branches.push(currentBranch)
    } else if (leafMatch && currentSub) {
      currentSub.children = currentSub.children || []
      currentSub.children.push(leafMatch[1].replace(/^[#*0-9.-]+\s*/, '').trim())
    } else if (subMatch && currentBranch) {
      currentSub = { label: subMatch[1].replace(/^[#*0-9.-]+\s*/, '').trim(), children: [] }
      currentBranch.children.push(currentSub)
    }
  }

  return { centre, branches }
}

const BRANCH_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#e11d48', '#0891b2', '#9333ea', '#4f46e5',
]

/**
 * Pop-up Modal Card for Viewing Node Contents
 */
function NodeDetailModal({ node, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!node) return null

  const typeLabels = {
    centre: 'Core Topic',
    branch: 'Major Branch',
    sub: 'Subtopic Concept',
    leaf: 'Supporting Detail',
  }

  const badgeColor = node.color || '#7c3aed'

  return (
    <div 
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      {/* Modal Card Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-950 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-800 flex flex-col gap-5 transform transition-all animate-scale-up overflow-hidden"
        style={{ borderTop: `6px solid ${badgeColor}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <span 
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${badgeColor}15`, color: badgeColor, border: `1px solid ${badgeColor}30` }}
          >
            {typeLabels[node.type] || 'Concept'}
          </span>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-bold flex items-center justify-center transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Main Content (Untruncated Label) */}
        <div className="py-2">
          <p className="text-xl sm:text-2xl font-bold text-slate-100 leading-relaxed">
            {node.label}
          </p>
        </div>

        {/* Context Information (Parent & Connected Children) */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 text-sm">
          {node.parentLabel && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Branches from:</span>
              <p className="font-semibold text-slate-100 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700/60 inline-block w-fit">
                ↑ {node.parentLabel}
              </p>
            </div>
          )}

          {node.childrenLabels && node.childrenLabels.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Connected Ideas ({node.childrenLabels.length}):
              </span>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {node.childrenLabels.map((child, idx) => (
                  <span 
                    key={idx} 
                    className="bg-slate-900/80 text-slate-200 font-medium px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs sm:text-sm"
                  >
                    ↳ {child}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-sm font-bold rounded-2xl shadow-sm transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

function MindMapViz({ data }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragDistanceRef = useRef(0)

  // Auto-resize canvas
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ w: rect.width, h: Math.max(500, rect.height) })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Pan and Zoom functionality
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    setTransform((t) => ({
      ...t,
      scale: Math.min(Math.max(0.4, t.scale * zoomFactor), 2.5),
    }))
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragDistanceRef.current = 0
    dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
  }, [transform.x, transform.y])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    dragDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY)
    setTransform((t) => ({
      ...t,
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    }))
  }, [isDragging])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  if (!data || !data.branches || data.branches.length === 0) return null

  const cx = dimensions.w / 2
  const cy = dimensions.h / 2
  const branchRadius = Math.min(dimensions.w, dimensions.h) * 0.32
  const subRadius = branchRadius * 0.68
  const leafRadius = subRadius * 0.65

  const nodes = []
  const edges = []

  // Centre node
  nodes.push({ 
    id: 'centre', 
    x: cx, 
    y: cy, 
    label: data.centre, 
    type: 'centre',
    color: '#7c3aed',
    parentLabel: null,
    childrenLabels: data.branches.map(b => b.label)
  })

  data.branches.forEach((branch, bi) => {
    const angle = (bi / data.branches.length) * Math.PI * 2 - Math.PI / 2
    const bx = cx + Math.cos(angle) * branchRadius
    const by = cy + Math.sin(angle) * branchRadius
    const color = BRANCH_COLORS[bi % BRANCH_COLORS.length]

    nodes.push({ 
      id: `b${bi}`, 
      x: bx, 
      y: by, 
      label: branch.label, 
      type: 'branch', 
      color,
      parentLabel: data.centre,
      childrenLabels: branch.children?.map(c => c.label) || []
    })
    edges.push({ from: 'centre', to: `b${bi}`, color, type: 'branch' })

    branch.children?.forEach((sub, si) => {
      const subAngle = angle + (si - (branch.children.length - 1) / 2) * 0.42
      const sx = bx + Math.cos(subAngle) * subRadius
      const sy = by + Math.sin(subAngle) * subRadius

      nodes.push({ 
        id: `b${bi}s${si}`, 
        x: sx, 
        y: sy, 
        label: sub.label, 
        type: 'sub', 
        color,
        parentLabel: branch.label,
        childrenLabels: sub.children || []
      })
      edges.push({ from: `b${bi}`, to: `b${bi}s${si}`, color, type: 'sub' })

      sub.children?.forEach((leaf, li) => {
        const leafAngle = subAngle + (li - (sub.children.length - 1) / 2) * 0.28
        const lx = sx + Math.cos(leafAngle) * leafRadius
        const ly = sy + Math.sin(leafAngle) * leafRadius

        nodes.push({ 
          id: `b${bi}s${si}l${li}`, 
          x: lx, 
          y: ly, 
          label: leaf, 
          type: 'leaf', 
          color,
          parentLabel: sub.label,
          childrenLabels: []
        })
        edges.push({ from: `b${bi}s${si}`, to: `b${bi}s${si}l${li}`, color, type: 'leaf' })
      })
    })
  })

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  function wrapText(text, maxChars = 14) {
    if (!text) return ['Untitled']
    const words = text.split(' ')
    const lines = []
    let current = ''
    for (const word of words) {
      if ((current + word).length > maxChars && current) {
        lines.push(current.trim())
        current = word + ' '
      } else {
        current += word + ' '
      }
    }
    if (current.trim()) lines.push(current.trim())
    return lines
  }

  function createCurvePath(from, to) {
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    return `M ${from.x} ${from.y} Q ${midX} ${from.y}, ${midX} ${midY} T ${to.x} ${to.y}`
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full overflow-hidden bg-[#020617] select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Pop-up Node Card Modal */}
      <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-lg">
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.min(t.scale + 0.2, 2.5) }))}
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold rounded-xl active:scale-95 transition-all"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-9 h-9 flex items-center justify-center text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl active:scale-95 transition-all border-y border-slate-100"
          title="Reset View"
        >
          100%
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.max(t.scale - 0.2, 0.4) }))}
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold rounded-xl active:scale-95 transition-all"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      <svg width="100%" height={dimensions.h} viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}>
        <defs>
          <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`} className="transition-transform duration-75 ease-out">
          {/* Smooth Bezier Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap[edge.from]
            const to = nodeMap[edge.to]
            if (!from || !to) return null
            return (
              <path
                key={i}
                d={createCurvePath(from, to)}
                fill="none"
                stroke={edge.color}
                strokeWidth={edge.type === 'leaf' ? 1.5 : edge.type === 'sub' ? 2 : 3}
                strokeOpacity={edge.type === 'leaf' ? 0.4 : 0.65}
                strokeLinecap="round"
              />
            )
          })}

          {/* Interactive Nodes */}
          {nodes.map((node) => {
            const lines = wrapText(node.label, node.type === 'centre' ? 18 : node.type === 'branch' ? 14 : 12)
            const lineH = node.type === 'centre' ? 18 : 15
            const padX = node.type === 'centre' ? 20 : node.type === 'branch' ? 14 : 10
            const padY = node.type === 'centre' ? 14 : 10
            const boxW = Math.max(...lines.map((l) => l.length * (node.type === 'centre' ? 7.5 : 6.5))) + padX * 2
            const boxH = lines.length * lineH + padY * 2

            const isCentre = node.type === 'centre'
            const isBranch = node.type === 'branch'

            const bgColor = isCentre
              ? '#7c3aed'
              : isBranch
                ? node.color
                : '#ffffff'

            const textColor = isCentre || isBranch ? '#ffffff' : '#0f172a'
            const fontSize = isCentre ? 14 : isBranch ? 12 : 11

            return (
              <g 
                key={node.id} 
                onClick={(e) => {
                  e.stopPropagation()
                  // Only open pop-up if user didn't drag the map!
                  if (dragDistanceRef.current < 5) {
                    setSelectedNode(node)
                  }
                }}
                className="transition-transform hover:scale-105 duration-200 cursor-pointer group"
              >
                <rect
                  x={node.x - boxW / 2}
                  y={node.y - boxH / 2}
                  width={boxW}
                  height={boxH}
                  rx={isCentre ? 16 : isBranch ? 12 : 8}
                  fill={bgColor}
                  stroke={!isCentre && !isBranch ? node.color : 'none'}
                  strokeWidth={!isCentre && !isBranch ? 2 : 0}
                  filter="url(#node-shadow)"
                  className="group-hover:brightness-95 transition-all"
                />
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={node.x}
                    y={node.y - ((lines.length - 1) * lineH) / 2 + li * lineH + fontSize / 3}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={fontSize}
                    fontWeight={isCentre ? 800 : isBranch ? 700 : 600}
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {line}
                  </text>
                ))}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export default function DojoMindMap() {
  const { generateContent, generatingTab, generatedContent, readySources } = useDojo()
  const [copied, setCopied] = useState(false)

  const content = generatedContent['mindmap']
  const isGenerating = generatingTab === 'mindmap'
  const parsed = parseMindMap(content)

  async function handleCopy() {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (readySources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12 bg-[#020617]">
        <div className="w-16 h-16 bg-blue-950/80 text-blue-200 rounded-3xl flex items-center justify-center text-3xl shadow-inner mb-2 border border-blue-800">
          🗺
        </div>
        <p className="text-base font-bold text-slate-100">Add sources first</p>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed">
          Upload content on the left, then generate a visual mind map of your key concepts.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#020617] text-slate-100">
      {/* Top Bar */}
      <div className="px-4 sm:px-6 py-4 bg-slate-950/90 border-b border-blue-900/60 flex items-center justify-between flex-shrink-0 backdrop-blur-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <span>🗺</span> Mind Map
          </h2>
          <p className="text-[11px] sm:text-xs font-medium text-blue-300 mt-0.5">Click any node to view full details</p>
        </div>

        {content && !isGenerating && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-slate-200 hover:text-blue-200 transition-colors bg-slate-900/80 hover:bg-blue-950/70 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-800"
            >
              {copied ? '✓ Copied' : 'Copy Outline'}
            </button>
            <button
              onClick={() => generateContent('mindmap', buildMindMapPrompt)}
              className="text-xs font-bold text-slate-200 hover:text-blue-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-950/70 border border-transparent hover:border-blue-800"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col justify-center">
        
        {/* 1. Initial State */}
        {!content && !isGenerating && (
          <div className="flex flex-col items-center justify-center my-auto gap-5 text-center max-w-sm mx-auto p-6">
            <div className="w-16 h-16 bg-blue-950/80 text-blue-200 rounded-3xl flex items-center justify-center text-3xl shadow-md border border-blue-800">
              🗺
            </div>
            <div>
              <p className="text-base font-bold text-slate-100">Visualize concept relationships</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Ace will analyze your sources and generate an interactive diagram. Click any node to open its study card!
              </p>
            </div>
            <button
              onClick={() => generateContent('mindmap', buildMindMapPrompt)}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>✨</span> Generate mind map
            </button>
          </div>
        )}

        {/* 2. Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center my-auto gap-3">
            <div className="flex items-center gap-3 bg-slate-900/90 border-2 border-blue-800 shadow-md rounded-2xl px-6 py-4 text-sm font-bold text-blue-200">
              <div className="w-5 h-5 border-[2.5px] border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Mapping concept hierarchy...</span>
            </div>
            <p className="text-xs font-semibold text-slate-400">Extracting subtopics and branch connections</p>
          </div>
        )}

        {/* 3. Fallback/Error State */}
        {content && !parsed && !isGenerating && (
          <div className="flex flex-col items-center justify-center my-auto gap-4 text-center max-w-sm mx-auto p-6">
            <div className="w-16 h-16 bg-blue-950/80 text-blue-200 rounded-3xl flex items-center justify-center text-3xl shadow-md border border-blue-800">
              ⚠️
            </div>
            <div>
              <p className="text-base font-bold text-slate-100">Couldn't render diagram</p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                The layout format differed slightly from the expected visual tree structure. Let's try regenerating!
              </p>
            </div>
            <button
              onClick={() => generateContent('mindmap', buildMindMapPrompt)}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all"
            >
              Regenerate map
            </button>
          </div>
        )}

        {/* 4. Active Mind Map Visualizer */}
        {parsed && !isGenerating && (
          <div className="w-full h-full relative">
            <MindMapViz data={parsed} />
          </div>
        )}
      </div>
    </div>
  )
}