export default function ErrorState({
  title   = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  fullPage = false,
  icon = '⚠️',
}) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 bg-canteen-danger/10 rounded-2xl flex items-center justify-center mb-4 animate-scale-in">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="font-display font-bold text-secondary text-lg mb-1">{title}</h3>
      <p className="text-sm text-canteen-muted max-w-sm mb-5">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          🔄 Try Again
        </button>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canteen-bg">
        <div className="card max-w-md w-full mx-4">
          {content}
        </div>
      </div>
    )
  }

  return <div className="card animate-fade-in">{content}</div>
}

/* ── Specialised variants ───────────────────────────────── */

export function NetworkError({ onRetry }) {
  return (
    <ErrorState
      icon="📡"
      title="No Connection"
      message="You appear to be offline. Check your internet connection and try again."
      onRetry={onRetry}
    />
  )
}

export function NotFoundError({ onRetry }) {
  return (
    <ErrorState
      icon="🔍"
      title="Not Found"
      message="The item you're looking for doesn't exist or may have been removed."
      onRetry={onRetry}
    />
  )
}

export function ServerError({ onRetry }) {
  return (
    <ErrorState
      icon="🔧"
      title="Server Error"
      message="Our server ran into a problem. Please try again in a moment."
      onRetry={onRetry}
    />
  )
}

export function UnauthorizedError() {
  return (
    <ErrorState
      icon="🔒"
      title="Access Denied"
      message="You don't have permission to view this page."
    />
  )
}
