import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { DomileaIcon } from '../components/ui/DomileaLogo'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get redirect URL from query params (set by ProtectedRoute)
  const redirectUrl = searchParams.get('redirect')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Login returns the user with their actual role from the database
      const user = await login(email, password)

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

export default LoginPage
