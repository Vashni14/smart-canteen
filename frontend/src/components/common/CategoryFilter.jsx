import { CATEGORIES } from '@utils/index'

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold
            transition-all duration-200 whitespace-nowrap
            ${active === cat
              ? 'bg-primary text-white shadow-primary'
              : 'bg-white border border-canteen-border text-canteen-muted hover:border-primary hover:text-primary'}
          `}
        >
          {CATEGORY_ICONS[cat]} {cat}
        </button>
      ))}
    </div>
  )
}

const CATEGORY_ICONS = {
  All:       '🍽️ ',
  Breakfast: '🌅 ',
  Snacks:    '🍿 ',
  Lunch:     '🍱 ',
  Dinner:    '🍛 ',
  Beverages: '🧃 ',
  Desserts:  '🍮 ',
}
