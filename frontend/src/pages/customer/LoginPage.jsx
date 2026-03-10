import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { ROLE_HOME } from '@utils/index'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const from         = location.state?.from?.pathname

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}! 👋`)
      navigate(from || ROLE_HOME[user.role] || '/menu', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email or password'
      toast.error(msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '', general: '' }))
  }

  // Demo quick-login
  const demoLogin = async (role) => {
    const demos = {
      customer: { email: 'student@college.edu', password: 'demo1234' },
      chef:     { email: 'chef@college.edu',    password: 'demo1234' },
      admin:    { email: 'admin@college.edu',   password: 'demo1234' },
    }
    setForm(demos[role])
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-canteen-bg py-12 px-4">
      <div className="w-full max-w-md animate-slide-up">

        {/* Card */}
        <div className="card card-body p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-primary">
              🍽️
            </div>
            <h1 className="text-2xl font-display font-bold text-secondary">Welcome back</h1>
            <p className="text-canteen-muted text-sm mt-1">Sign in to your SmartCanteen account</p>
          </div>

          {/* Demo login pills */}
          <div className="mb-5">
            <p className="label-text mb-2 text-center">Quick Demo Login</p>
            <div className="flex gap-2 justify-center">
              {['customer', 'chef', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => demoLogin(role)}
                  type="button"
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-canteen-border hover:border-primary hover:text-primary transition-colors capitalize"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="divider-sm mb-5" />

          {/* General error */}
          {errors.general && (
            <div className="alert-danger mb-4 text-sm">
              ⚠ {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left"><MailIcon /></span>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@college.edu"
                  className={`form-input-icon-l ${errors.email ? 'border-canteen-danger focus:ring-canteen-danger/30' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="input-icon-wrap">
                <span className="input-icon-left"><LockIcon /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  className={`form-input-icon-l pr-10 ${errors.password ? 'border-canteen-danger focus:ring-canteen-danger/30' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-canteen-muted hover:text-secondary"
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-canteen-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────── */
function MailIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
}
function LockIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
}
function EyeIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
}
function EyeOffIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
}
function Spinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
}
