export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canteen-bg">
      <div className="text-center space-y-4">
        {/* Logo mark */}
        <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center shadow-primary animate-pulse-soft">
          <span className="text-3xl">🍽️</span>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce-dot"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
        <p className="text-canteen-muted text-sm font-semibold">Loading Smart Canteen…</p>
      </div>
    </div>
  )
}
