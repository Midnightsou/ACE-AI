import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Tool crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">Something went wrong</p>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              This tool ran into an error. Your other sessions are unaffected.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Try again
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="text-left max-w-md w-full">
              <summary className="text-xs text-zinc-400 cursor-pointer">Error details</summary>
              <pre className="text-xs text-red-500 bg-red-50 p-3 rounded-lg mt-2 overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}