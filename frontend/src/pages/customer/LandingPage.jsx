import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { menuService } from '@services/index'
import FoodCard from '@components/common/FoodCard'
import { useCart } from '@context/CartContext'
import { ROLE_HOME } from '@utils/index'

const FEATURES = [
  { icon: '⚡', title: 'Fast Ordering',    desc: 'Place your order in seconds. No queues, no waiting.' },
  { icon: '🔴', title: 'Live Tracking',    desc: 'Watch your order status update in real time.' },
  { icon: '📱', title: 'QR Pickup',        desc: 'Scan your QR code at the counter for instant pickup.' },
  { icon: '🍽️', title: 'Fresh Daily Menu', desc: 'Menu updated every day with fresh canteen specials.' },
]

const STATS = [
  { value: '500+', label: 'Daily Orders' },
  { value: '4 min', label: 'Avg. Prep Time' },
  { value: '98%',  label: 'Happy Students' },
  { value: '30+',  label: 'Menu Items' },
]

export default function LandingPage() {
  const { user }          = useAuth()
  const navigate          = useNavigate()
  const { addItem }       = useCart()
  const [popular, setPopular] = useState([])

  // Redirect logged-in users to their home
  useEffect(() => {
    if (user) navigate(ROLE_HOME[user.role] || '/menu', { replace: true })
  }, [user, navigate])

  // Load popular items (first 4)
  useEffect(() => {
    menuService.getAll({ limit: 4 })
      .then(res => setPopular(res.data?.items || res.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="animate-fade-in">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-secondary min-h-[92vh] flex items-center">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="page-container relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-7 animate-slide-up">
              <div className="badge bg-accent/20 text-accent font-bold px-4 py-2 text-sm w-fit">
                🎓 Your College Canteen, Online
              </div>

              <h1 className="text-white" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
                Order Fresh Food,{' '}
                <span className="text-primary">Skip the Queue</span>
              </h1>

              <p className="text-secondary-200 text-lg leading-relaxed max-w-md">
                Browse today's menu, customize your order, pay online, and pick up with a QR code.
                Hot food, zero wait.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/menu" className="btn-primary btn-lg">
                  🍔 Order Now
                </Link>
                <Link to="/register" className="btn-white btn-lg">
                  Create Account
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {['🧑‍🎓','👩‍🎓','🧑‍💻','👩‍💻'].map((e, i) => (
                    <span key={i}
                      className="w-9 h-9 rounded-full bg-secondary-600 border-2 border-secondary flex items-center justify-center text-sm"
                      style={{ zIndex: 4 - i }}>
                      {e}
                    </span>
                  ))}
                </div>
                <p className="text-secondary-300 text-sm">
                  <span className="text-white font-bold">500+</span> students ordering daily
                </p>
              </div>
            </div>

            {/* Right: Visual card stack */}
            <div className="hidden lg:flex items-center justify-center animate-slide-in-right">
              <div className="relative w-80 h-80">
                {/* Back card */}
                <div className="absolute -top-4 -right-4 w-72 h-72 rounded-3xl gradient-primary opacity-40 rotate-6" />
                {/* Front card */}
                <div className="absolute inset-0 card p-6 flex flex-col justify-between shadow-modal">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-secondary">Today's Special</span>
                    <span className="badge-success">Live</span>
                  </div>
                  <div className="space-y-3">
                    {['Masala Dosa', 'Veg Biryani', 'Samosa (2pcs)'].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-canteen-border last:border-0">
                        <span className="text-sm font-semibold text-secondary">{item}</span>
                        <span className="badge-primary text-xs">Available</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/menu" className="btn-primary w-full justify-center">
                    View Full Menu →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="bg-primary py-10">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-white font-display font-bold text-3xl">{s.value}</p>
                <p className="text-primary-100 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="page-section bg-canteen-bg">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="section-title">Why SmartCanteen?</h2>
            <p className="section-subtitle">Built for students, run by your canteen.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="card card-body text-center hover:shadow-card-hover transition-shadow animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-3">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-secondary text-base mb-1">{f.title}</h3>
                <p className="text-sm text-canteen-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="page-section bg-white">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Three simple steps to your meal.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-canteen-border" />
            {[
              { step: '01', icon: '📲', title: 'Browse & Order', desc: 'Pick items from the menu, customize, and checkout in under a minute.' },
              { step: '02', icon: '👨‍🍳', title: 'Kitchen Prepares', desc: 'The kitchen gets notified instantly and starts preparing your order fresh.' },
              { step: '03', icon: '📦', title: 'Scan & Collect', desc: 'Get notified when ready. Show your QR code at the counter and collect.' },
            ].map((s, i) => (
              <div key={s.step} className="text-center relative z-10 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-20 h-20 mx-auto gradient-primary rounded-3xl flex items-center justify-center text-3xl shadow-primary mb-4">
                  {s.icon}
                </div>
                <span className="label-text block mb-1">Step {s.step}</span>
                <h3 className="font-display font-bold text-secondary text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-canteen-muted max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Items ────────────────────────────────────── */}
      {popular.length > 0 && (
        <section className="page-section bg-canteen-bg">
          <div className="page-container">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="section-title">Popular Today</h2>
                <p className="section-subtitle">Most ordered items right now</p>
              </div>
              <Link to="/menu" className="btn-outline btn-sm hidden sm:flex">
                Full Menu →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {popular.map(item => (
                <FoodCard key={item._id} item={item} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/menu" className="btn-primary btn-lg">
                View All Items
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="bg-secondary py-16">
        <div className="page-container text-center">
          <h2 className="text-white text-3xl font-display font-bold mb-3">
            Ready to Order?
          </h2>
          <p className="text-secondary-300 mb-7 text-lg">
            Join thousands of students already using SmartCanteen.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg">Get Started Free</Link>
            <Link to="/menu"     className="btn-white btn-lg">Browse Menu</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
