export default function DashboardHeader({ role, connected }) {
  const roleLabel = { chef: 'Kitchen Display', pickup: 'Pickup Counter', admin: 'Admin Panel' }
  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="bg-white border-b border-canteen-border px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="font-display font-bold text-secondary text-lg leading-none">
          {roleLabel[role] || 'Dashboard'}
        </h1>
        <p className="text-xs text-canteen-muted mt-0.5">{now}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-canteen-success' : 'bg-canteen-danger'} animate-pulse-soft`}
        />
        <span className="text-xs font-semibold text-canteen-muted">
          {connected ? 'Live' : 'Reconnecting…'}
        </span>
      </div>
    </header>
  )
}
