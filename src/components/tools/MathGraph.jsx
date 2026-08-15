import { useState, useEffect } from 'react'

export default function MathGraph({ expression }) {
  const [Plot, setPlot] = useState(null)
  const [points, setPoints] = useState({ x: [], y: [] })
  const [error, setError] = useState(null)

  // Load Plotly dynamically
  useEffect(() => {
    let mounted = true

    import('react-plotly.js')
      .then((mod) => {
        // Handle different Vite/module export formats
        const PlotComponent =
          typeof mod.default === 'function'
            ? mod.default
            : typeof mod === 'function'
              ? mod
              : mod.default?.default

        if (!PlotComponent) {
          throw new Error('Plot component not found')
        }

        if (mounted) {
          setPlot(() => PlotComponent)
        }
      })
      .catch((err) => {
        console.error('Failed to load Plotly:', err)

        if (mounted) {
          setError('Failed to load graph')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  // Generate graph points
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
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')

      const xVals = []
      const yVals = []

      for (let x = -10; x <= 10; x += 0.1) {
        try {
          const y = new Function(
            'x',
            `return ${cleanExpr}`
          )(x)

          xVals.push(
            parseFloat(x.toFixed(4))
          )

          yVals.push(
            Number.isFinite(y)
              ? parseFloat(y.toFixed(4))
              : null
          )
        } catch {
          xVals.push(
            parseFloat(x.toFixed(4))
          )

          yVals.push(null)
        }
      }

      setPoints({
        x: xVals,
        y: yVals,
      })

      setError(null)

    } catch (err) {
      console.error(
        'Graph calculation error:',
        err
      )

      setError(
        'Could not plot this expression'
      )
    }
  }, [expression])

  if (error) {
    return (
      <div className="text-xs text-red-400 px-3 py-2">
        {error}
      </div>
    )
  }

  if (!Plot) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-zinc-400 bg-white border border-zinc-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />

          Loading graph...
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 my-2 bg-white">

      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">

        <p className="text-xs text-zinc-500 font-mono">
          y = {
            expression.replace(
              /y\s*=\s*/i,
              ''
            )
          }
        </p>

        <span className="text-xs text-zinc-400">
          Graph
        </span>

      </div>

      {/* Plot */}
      <Plot
        data={[
          {
            x: points.x,
            y: points.y,
            type: 'scatter',
            mode: 'lines',
            line: {
              color: '#7c3aed',
              width: 2,
            },
            connectgaps: false,
          },
        ]}

        layout={{
          autosize: true,
          height: 260,

          margin: {
            l: 40,
            r: 20,
            t: 20,
            b: 40,
          },

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

          font: {
            family: 'Inter, sans-serif',
            size: 11,
          },
        }}

        config={{
          displayModeBar: false,
          responsive: true,
        }}

        style={{
          width: '100%',
        }}
      />

    </div>
  )
}