import { useState, useEffect, useRef } from 'react'
import { useDojo } from '../../../hooks/useDojo'
import { buildMindMapPrompt } from '../../../prompts/tools/dojoPrompt'

function parseMindMap(text) {
  if (!text) return null

  const lines = text.split('\n').filter(Boolean)
  const centreMatch = lines[0]?.match(/CENTRE:\s*(.+)/i)
  if (!centreMatch) return null

  const centre = centreMatch[1].trim()
  const branches = []
  let currentBranch = null
  let currentSub = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const branchMatch = line.match(/^BRANCH\s+\d+:\s*(.+)/i)
    const subMatch = line.match(/^\s{2}-\s+(.+)/)
    const leafMatch = line.match(/^\s{4}-\s+(.+)/)

    if (branchMatch) {
      currentBranch = { label: branchMatch[1].trim(), children: [] }
      currentSub = null
      branches.push(currentBranch)
    } else if (leafMatch && currentSub) {
      currentSub.children = currentSub.children || []
      currentSub.children.push(leafMatch[1].trim())
    } else if (subMatch && currentBranch) {
      currentSub = { label: subMatch[1].trim(), children: [] }
      currentBranch.children.push(currentSub)
    }
  }

  return { centre, branches }
}

const BRANCH_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#0891b2', '#9333ea',
]

function MindMapViz({ data }) {
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 })

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement.getBoundingClientRect()
        setDimensions({ w: rect.width, h: Math.max(500, rect.height) })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (!data) return null

  const cx = dimensions.w / 2
  const cy = dimensions.h / 2
  const branchRadius = Math.min(dimensions.w, dimensions.h) * 0.28
  const subRadius = branchRadius * 0.65
  const leafRadius = subRadius * 0.6

  const nodes = []
  const edges = []

  // Centre node
  nodes.push({ id: 'centre', x: cx, y: cy, label: data.centre, type: 'centre' })

  data.branches.forEach((branch, bi) => {
    const angle = (bi / data.branches.length) * Math.PI * 2 - Math.PI / 2
    const bx = cx + Math.cos(angle) * branchRadius
    const by = cy + Math.sin(angle) * branchRadius
    const color = BRANCH_COLORS[bi % BRANCH_COLORS.length]

    nodes.push({ id: `b${bi}`, x: bx, y: by, label: branch.label, type: 'branch', color })
    edges.push({ from: 'centre', to: `b${bi}`, color })

    branch.children?.forEach((sub, si) => {
      const subAngle = angle + (si - (branch.children.length - 1) / 2) * 0.45
      const sx = bx + Math.cos(subAngle) * subRadius
      const sy = by + Math.sin(subAngle) * subRadius

      nodes.push({ id: `b${bi}s${si}`, x: sx, y: sy, label: sub.label, type: 'sub', color })
      edges.push({ from: `b${bi}`, to: `b${bi}s${si}`, color })

      sub.children?.forEach((leaf, li) => {
        const leafAngle = subAngle + (li - (sub.children.length - 1) / 2) * 0.3
        const lx = sx + Math.cos(leafAngle) * leafRadius
        const ly = sy + Math.sin(leafAngle) * leafRadius

        nodes.push({ id: `b${bi}s${si}l${li}`, x: lx, y: ly, label: leaf, type: 'leaf', color })
        edges.push({ from: `b${bi}s${si}`, to: `b${bi}s${si}l${li}`, color })
      })
    })
  })

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  function wrapText(text, maxChars = 14) {
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

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={dimensions.h}
      viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
    >
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = nodeMap[edge.from]
        const to = nodeMap[edge.to]
        if (!from || !to) return null
        return (
          <line
            key={i}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke={edge.color}
            strokeWidth={to.type === 'leaf' ? 1 : to.type === 'sub' ? 1.5 : 2}
            strokeOpacity={0.5}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const lines = wrapText(node.label, node.type === 'centre' ? 16 : 13)
        const lineH = 14
        const padX = node.type === 'centre' ? 16 : node.type === 'branch' ? 12 : 8
        const padY = node.type === 'centre' ? 10 : 7
        const boxW = Math.max(...lines.map((l) => l.length * 6.5)) + padX * 2
        const boxH = lines.length * lineH + padY * 2

        const bgColor = node.type === 'centre'
          ? '#7c3aed'
          : node.type === 'branch'
            ? node.color
            : node.type === 'sub'
              ? `${node.color}22`
              : `${node.color}11`

        const textColor = node.type === 'centre' || node.type === 'branch'
          ? '#ffffff'
          : node.color

        const fontSize = node.type === 'centre' ? 13 : node.type === 'branch' ? 11 : 10

        return (
          <g key={node.id}>
            <rect
              x={node.x - boxW / 2}
              y={node.y - boxH / 2}
              width={boxW}
              height={boxH}
              rx={node.type === 'centre' ? 14 : node.type === 'branch' ? 10 : 6}
              fill={bgColor}
              stroke={node.type === 'leaf' || node.type === 'sub' ? node.color : 'none'}
              strokeWidth={1}
              strokeOpacity={0.4}
              filter="url(#shadow)"
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={node.x}
                y={node.y - ((lines.length - 1) * lineH) / 2 + li * lineH + fontSize / 3}
                textAnchor="middle"
                fill={textColor}
                fontSize={fontSize}
                fontWeight={node.type === 'centre' ? 700 : node.type === 'branch' ? 600 : 400}
                fontFamily="Inter, sans-serif"
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
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
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="text-3xl">🗺</span>
        <p className="text-sm font-medium text-zinc-600">Add sources first</p>
        <p className="text-xs text-zinc-400 max-w-xs">Upload content then generate a visual mind map of the key concepts.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-zinc-800">🗺 Mind Map</p>
          <p className="text-xs text-zinc-400 mt-0.5">Visual concept map of your sources</p>
        </div>
        {content && !isGenerating && (
          <div className="flex items-center gap-3">
            <button onClick={handleCopy} className="text-xs text-zinc-400 hover:text-violet-600 transition-colors">
              {copied ? '✓ Copied' : 'Copy text'}
            </button>
            <button
              onClick={() => generateContent('mindmap', buildMindMapPrompt)}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {!content && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl">🗺</div>
            <div>
              <p className="text-sm font-medium text-zinc-700">Generate mind map</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Ace maps the relationships between key concepts in your sources into a visual diagram.
              </p>
            </div>
            <button
              onClick={() => generateContent('mindmap', buildMindMapPrompt)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>✨</span> Generate mind map
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-400">Mapping concepts...</p>
            </div>
          </div>
        )}

        {parsed && !isGenerating && (
          <div className="w-full h-full overflow-auto bg-zinc-50">
            <MindMapViz data={parsed} />
          </div>
        )}
      </div>
    </div>
  )
}