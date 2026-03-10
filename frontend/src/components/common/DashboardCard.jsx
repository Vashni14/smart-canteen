export default function DashboardCard({
  title,
  value,
  icon,
  iconBg = 'bg-primary/10',
  trend,
  trendLabel,
  trendUp = true,
  subtitle,
  onClick,
}) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={`stat-card animate-slide-up w-full text-left ${onClick ? 'hover:shadow-card-hover transition-shadow cursor-pointer' : ''}`}
    >
      {/* Icon */}
      <div className={`stat-icon ${iconBg}`}>
        <span>{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="stat-label">{title}</p>
        <p className="stat-value">{value ?? '—'}</p>

        {trend !== undefined && (
          <p className={trendUp ? 'stat-trend-up' : 'stat-trend-down'}>
            <TrendArrow up={trendUp} />
            {trend}% {trendLabel || (trendUp ? 'increase' : 'decrease')}
          </p>
        )}

        {subtitle && !trend && (
          <p className="text-xs text-canteen-muted mt-1">{subtitle}</p>
        )}
      </div>
    </Tag>
  )
}

function TrendArrow({ up }) {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d={up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
    </svg>
  )
}
