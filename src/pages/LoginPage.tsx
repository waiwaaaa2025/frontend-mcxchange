import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ShoppingCart, ShieldCheck, Truck, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { DomileaIcon } from '../components/ui/DomileaLogo'

type RoleHint = 'buyer' | 'seller' | 'compliance_manager'

const ROLE_OPTIONS: { value: RoleHint; label: string; icon: React.ReactNode }[] = [
  { value: 'buyer', label: 'Buyer', icon: <ShoppingCart className="w-4 h-4" /> },
  { value: 'seller', label: 'Seller', icon: <Truck className="w-4 h-4" /> },
  { value: 'compliance_manager', label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" /> },
]

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [roleHint, setRoleHint] = useState<RoleHint | null>(null)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const roleMenuRef = useRef<HTMLDivElement>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Close the role dropdown when clicking outside of it.
  useEffect(() => {
    if (!roleMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [roleMenuOpen])

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === roleHint) ?? null

  // Get redirect URL from query params (set by ProtectedRoute)
  const redirectUrl = searchParams.get('redirect')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user, needsSubscription } = await login(
        email,
        password,
        roleHint ?? undefined,
      )

      // User picked a role they don't have yet — send them to subscribe.
      if (needsSubscription === 'compliance_manager') {
        navigate('/carrier-pulse-preview')
        return
      }
      if (needsSubscription === 'buyer') {
        navigate('/pricing')
        return
      }

      // If there's a redirect URL, use it (after validating it's a local path)
      if (redirectUrl && redirectUrl.startsWith('/')) {
        navigate(redirectUrl)
        return
      }

      // Otherwise navigate based on the user's actual role from the database
      switch (user.role) {
        case 'seller':
          navigate('/seller/dashboard')
          break
        case 'buyer':
          navigate('/buyer/dashboard')
          break
        case 'admin':
          navigate('/admin/dashboard')
          break
        case 'compliance_manager':
          navigate('/compliance/dashboard')
          break
        default:
          navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <DomileaIcon size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your Domilea account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sign in as <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative" ref={roleMenuRef}>
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={roleMenuOpen}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <span className="flex items-center gap-2">
                    {selectedRole ? (
                      <>
                        {selectedRole.icon}
                        {selectedRole.label}
                      </>
                    ) : (
                      <span className="text-gray-400">Auto-detect</span>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {roleMenuOpen && (
                  <ul
                    role="listbox"
                    className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                  >
                    <RoleMenuItem
                      selected={roleHint === null}
                      onClick={() => { setRoleHint(null); setRoleMenuOpen(false) }}
                      label="Auto-detect"
                      muted
                    />
                    {ROLE_OPTIONS.map((opt) => (
                      <RoleMenuItem
                        key={opt.value}
                        selected={roleHint === opt.value}
                        onClick={() => { setRoleHint(opt.value); setRoleMenuOpen(false) }}
                        icon={opt.icon}
                        label={opt.label}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-gray-600">Remember me</span>
              </label>

              <Link to="/forgot-password" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>

            <div className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

interface RoleMenuItemProps {
  selected: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
  muted?: boolean
}

const RoleMenuItem = ({ selected, onClick, label, icon, muted }: RoleMenuItemProps) => (
  <li role="option" aria-selected={selected}>
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 ${
        selected ? 'bg-gray-50 text-black' : muted ? 'text-gray-400' : 'text-gray-700'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {selected && <Check className="w-4 h-4 text-black" />}
    </button>
  </li>
)

export default LoginPage
