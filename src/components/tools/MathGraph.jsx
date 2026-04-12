import { useState, useEffect } from 'react'

export default function MathGraph({ expression }) {
  const [points, setPoints] = useState({ x: [], y: [] })
  const [error, setError] = useState(null)
  const [PlotComponent, setPlotComponent] = useState(null)

  useEffect(() => {
    import('react-plotly.js').then((mod) => {
      setPlotComponent(() => mod.default)
    })
  }, [])

  useEffect(() => {
    if (!expression) return

    try {
      const cleanExpr = expression
        .replace(/y\s*=\s*/i, '')
        .replace(/\^/g, '**')
        .replace(/(\d)(x)/g, '$1*$2')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\be\b/g, 'Math.E')
        .replace(/\bpi\b/g, 'Math.PI')

      const xVals = []
      const yVals = []
      const step = 0.1

      for (let x = -10; x <= 10; x += step) {
        try {
          // eslint-disable-next-line no-new-func
          const y = new Function('x', `return ${cleanExpr}`)(x)
          if (isFinite(y) && !isNaN(y)) {
            xVals.push(parseFloat(x.toFixed(4)))
            yVals.push(parseFloat(y.toFixed(4)))
          } else {
            xVals.push(parseFloat(x.toFixed(4)))
            yVals.push(null)
          }
        } catch {
          xVals.push(parseFloat(x.toFixed(4)))
          yVals.push(null)
        }
      }

      setPoints({ x: xVals, y: yVals })
      setError(null)
    } catch (err) {
      setError('Could not plot this expression')
    }
  }, [expression])

  if (error) return (
    <div className="text-xs text-red-400 px-3 py-2">{error}</div>
  )

  if (!PlotComponent) return (
    <div className="h-48 flex items-center justify-center text-xs text-zinc-400">
      Loading graph...
    </div>
  )

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 my-2 bg-white">
      <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-xs text-zinc-500 font-mono">y = {expression.replace(/y\s*=\s*/i, '')}</p>
        <span className="text-xs text-zinc-400">Graph</span>
      </div>
      <PlotComponent
        data={[{
          x: points.x,
          y: points.y,
          type: 'scatter',
          mode: 'lines',
          line: { color: '#7c3aed', width: 2 },
          connectgaps: false,
        }]}
        layout={{
          autosize: true,
          height: 260,
          margin: { l: 40, r: 20, t: 20, b: 40 },
          xaxis: {
            zeroline: true,
            zerolinecolor: '#d1d5db',
            gridcolor: '#f3f4f6',
            range: [-10, 10],
          },
          yaxis: {
            zeroline: true,
            zerolinecolor: '#d1d5db',
            gridcolor: '#f3f4f6',
            autorange: true,
          },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
          font: { family: 'Inter, sans-serif', size: 11 },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}