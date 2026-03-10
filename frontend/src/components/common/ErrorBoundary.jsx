import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // In production you'd log to Sentry/LogRocket here
    console.error('[ErrorBoundary caught]', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, info: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { error } = this.state
    const isDev     = import.meta.env.DEV

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5 animate-fade-in">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-canteen-danger/10 rounded-3xl flex items-center justify-center text-4xl">
            💥
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-secondary">
              Something went wrong
            </h2>
            <p className="text-canteen-muted text-sm">
              An unexpected error occurred in this part of the page. Your other tabs and data are safe.
            </p>
          </div>

          {/* Dev-only error detail */}
          {isDev && error && (
            <div className="text-left bg-red-50 border border-red-200 rounded-xl p-4 overflow-auto max-h-40">
              <p className="text-xs font-mono text-canteen-danger font-bold mb-1">{error.name}</p>
              <p className="text-xs font-mono text-red-700 whitespace-pre-wrap">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="btn-primary"
            >
              🔄 Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-outline"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
