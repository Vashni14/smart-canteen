/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      /* ── Brand Colors ──────────────────────────────────── */
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50:  '#FFF3EE',
          100: '#FFE4D6',
          200: '#FFC9AD',
          300: '#FFAD84',
          400: '#FF915B',
          500: '#FF6B35',
          600: '#E5501A',
          700: '#C23B0E',
          800: '#9A2D09',
          900: '#721F04',
        },
        secondary: {
          DEFAULT: '#2E3A59',
          50:  '#EEF0F5',
          100: '#D4D9E8',
          200: '#A9B3D1',
          300: '#7E8DBA',
          400: '#5367A3',
          500: '#2E3A59',
          600: '#253047',
          700: '#1C2535',
          800: '#131A24',
          900: '#0A0F12',
        },
        accent: {
          DEFAULT: '#FFD166',
          light:   '#FFE5A0',
          dark:    '#E5B84D',
        },
        canteen: {
          bg:      '#F8F9FB',
          card:    '#FFFFFF',
          border:  '#E8ECF0',
          muted:   '#8A94A6',
          success: '#2ECC71',
          danger:  '#E74C3C',
          warning: '#F39C12',
          info:    '#3498DB',
        },
      },

      /* ── Typography ────────────────────────────────────── */
      fontFamily: {
        sans:    ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      /* ── Spacing ───────────────────────────────────────── */
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '68':  '17rem',
        '76':  '19rem',
        '88':  '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      /* ── Border Radius ─────────────────────────────────── */
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      /* ── Shadows ───────────────────────────────────────── */
      boxShadow: {
        'sm':         '0 1px 4px rgba(0,0,0,0.05)',
        'card':       '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
        'primary':    '0 4px 14px rgba(255,107,53,0.35)',
        'primary-lg': '0 8px 24px rgba(255,107,53,0.45)',
        'nav':        '0 2px 20px rgba(0,0,0,0.08)',
        'sidebar':    '4px 0 20px rgba(0,0,0,0.08)',
        'modal':      '0 20px 60px rgba(0,0,0,0.18)',
        'input':      '0 0 0 3px rgba(255,107,53,0.15)',
        'none':       'none',
      },

      /* ── Animations ────────────────────────────────────── */
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out both',
        'fade-out':      'fadeOut 0.2s ease-in both',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':    'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in':      'slideIn 0.3s ease-out both',
        'slide-in-right':'slideInRight 0.3s ease-out both',
        'scale-in':      'scaleIn 0.25s ease-out both',
        'pulse-soft':    'pulseSoft 2.5s ease-in-out infinite',
        'bounce-dot':    'bounceDot 1.4s infinite ease-in-out both',
        'spin-slow':     'spin 3s linear infinite',
        'wiggle':        'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeOut:      { from: { opacity: '1' }, to: { opacity: '0' } },
        slideUp:      {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown:    {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn:      {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn:      {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft:    {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        bounceDot:    {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0' },
          '40%':           { transform: 'scale(1)', opacity: '1' },
        },
        wiggle:       {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%':      { transform: 'rotate(4deg)' },
        },
      },

      /* ── Transitions ───────────────────────────────────── */
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      /* ── Z-index ───────────────────────────────────────── */
      zIndex: {
        'dropdown': '100',
        'sticky':   '200',
        'overlay':  '300',
        'modal':    '400',
        'toast':    '500',
      },

      /* ── Max Widths ────────────────────────────────────── */
      maxWidth: {
        'xxs': '16rem',
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
}
