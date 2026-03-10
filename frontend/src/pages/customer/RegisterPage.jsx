import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import toast from 'react-hot-toast'
import { ROLE_HOME } from '@utils/index'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim())      e.name    = 'Full name is required'
    if (!form.email)            e.email   = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)         e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password })
      toast.success(`Account created! Welcome, ${user.name} 🎉`)
      navigate(ROLE_HOME[user.role] || '/menu', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed'
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

  const pwStrength = (() => {
    const pw = form.password
    if (!pw) return null
    if (pw.length < 6)  return { label: 'Too short', color: 'bg-canteen-danger', w: 'w-1/4' }
    if (pw.length < 8)  return { label: 'Weak',      color: 'bg-canteen-warning', w: 'w-1/2' }
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Fair', color: 'bg-accent-dark', w: 'w-3/4' }
    return { label: 'Strong', color: 'bg-canteen-success', w: 'w-full' }
  })()

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-canteen-bg py-12 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card card-body p-8">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-primary">
              🎓
            </div>
            <h1 className="text-2xl font-display font-bold text-secondary">Create your account</h1>
            <p className="text-canteen-muted text-sm mt-1">Start ordering from your college canteen</p>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="alert-danger mb-4">⚠ {errors.general}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left"><UserIcon /></span>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your full name"
                  className={`form-input-icon-l ${errors.name ? 'border-canteen-danger' : ''}`}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="form-error">⚠ {errors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">College Email</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left"><MailIcon /></span>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@college.edu"
                  className={`form-input-icon-l ${errors.email ? 'border-canteen-danger' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left"><LockIcon /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  className={`form-input-icon-l pr-10 ${errors.password ? 'border-canteen-danger' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-canteen-muted hover:text-secondary">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Strength bar */}
              {pwStrength && (
                <div className="mt-1.5 space-y-0.5">
                  <div className="h-1.5 bg-canteen-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color} ${pwStrength.w}`} />
                  </div>
                  <p className="text-xs text-canteen-muted">{pwStrength.label}</p>
                </div>
              )}
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon-left"><LockIcon /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Re-enter password"
                  className={`form-input-icon-l ${errors.confirm ? 'border-canteen-danger' : ''}`}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirm && <p className="form-error">⚠ {errors.confirm}</p>}
            </div>

            {/* Terms */}
            <p className="text-xs text-canteen-muted">
              By registering you agree to our{' '}
              <span className="text-primary font-semibold cursor-pointer hover:underline">Terms of Service</span>
            </p>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Creating account…
                </span>
              ) : '🎉 Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-canteen-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function UserIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
}
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
function Spinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
}
