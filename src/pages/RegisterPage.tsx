import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User as UserIcon, AlertCircle, Phone, FileText, Shield, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import { DomileaIcon } from '../components/ui/DomileaLogo'
import ScrollToAgreeModal from '../components/ScrollToAgreeModal'
import { SellerTermsContent, BuyerTermsContent } from '../components/LegalDocumentContent'
import { PrivacyContent } from '../components/LegalDocumentContent'
import { UserRole } from '../types'

// Email validation regex - comprehensive check for valid email format
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

// List of disposable/temporary email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'yopmail.com', 'temp-mail.org', 'fakeinbox.com',
  'sharklasers.com', 'trashmail.com', 'getnada.com', 'maildrop.cc',
  'dispostable.com', 'mintemail.com', 'mytemp.email', 'tempail.com'
]

// Validate email format and check for disposable domains
const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  // Check basic format
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  // Extract domain
  const domain = email.split('@')[1]?.toLowerCase()

  // Check for disposable email domains
  if (domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return { isValid: false, error: 'Please use a permanent email address, not a temporary one' }
  }

  // Check domain has at least one dot (e.g., gmail.com, not gmail)
  if (domain && !domain.includes('.')) {
    return { isValid: false, error: 'Please enter a valid email domain' }
  }

  return { isValid: true }
}

const RegisterPage = () => {
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const redirectUrl = searchParams.get('redirect')
  // Only allow buyer, seller, or compliance_manager from URL params
  const initialRole: UserRole =
    roleParam === 'seller' ? 'seller'
    : roleParam === 'compliance' || roleParam === 'compliance_manager' ? 'compliance_manager'
    : 'buyer'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>(initialRole)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsRead, setTermsRead] = useState(false)
  const [privacyRead, setPrivacyRead] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [smsMarketingConsent, setSmsMarketingConsent] = useState(false)
  const [smsTransactionalConsent, setSmsTransactionalConsent] = useState(false)

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  // Validate email on blur
  const handleEmailBlur = () => {
    const validation = validateEmail(email)
    setEmailError(validation.error || '')
  }

  // Clear email error when user starts typing again
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError('')
    }
  }

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailError('')

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Invalid email')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)

    try {
      // Register returns the user with their role
      const user = await register(email, password, name, role, phone)

      // If there's a redirect URL, use it (after validating it's a local path)
      if (redirectUrl && redirectUrl.startsWith('/')) {
        navigate(redirectUrl)
        return
      }

      // Navigate based on the user's role from the API response
      switch (user.role) {
        case 'seller':
          navigate('/seller/welcome')
          break
        case 'buyer':
          navigate('/buyer/welcome')
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
      setError(err.message || 'Registration failed. Please try again.')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h1>
          <p className="text-gray-500">Join the Domilea.CO marketplace</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Select
              label="I want to"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole)
                setTermsRead(false)
                setTermsAccepted(false)
              }}
              options={[
                { value: 'buyer', label: 'Buy a trucking business' },
                { value: 'seller', label: 'Sell my trucking business' },
                { value: 'compliance_manager', label: 'Manage compliance for one or more carriers' },
              ]}
            />

            <Input
              label="Full Name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<UserIcon className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              {emailError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={handlePhoneChange}
              icon={<Phone className="w-4 h-4" />}
              required
            />

            {/* SMS Consent */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsMarketingConsent}
                  onChange={(e) => setSmsMarketingConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I consent to receive marketing text messages from <span className="font-semibold">Domilea.CO</span> at the phone number provided. Up to 4 messages per month. Message &amp; data rates may apply. Reply <span className="font-semibold">STOP</span> to unsubscribe. Text <span className="font-semibold">HELP</span> for assistance.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsTransactionalConsent}
                  onChange={(e) => setSmsTransactionalConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I consent to receive non-marketing text messages from <span className="font-semibold">Domilea.CO</span> about my order updates, appointment reminders, and other transactional notifications. Up to 4 messages per month. Message &amp; data rates may apply. Reply <span className="font-semibold">STOP</span> to unsubscribe. Text <span className="font-semibold">HELP</span> for assistance.
                </span>
              </label>
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            {/* Legal Documents Section */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Required: Review Legal Documents</p>
                <p className="text-xs text-gray-500 mt-1">You must read both documents before you can create an account.</p>
              </div>

              {/* Read Terms Button */}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className={`w-full py-4 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                  termsRead
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {termsRead ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-base font-medium">
                  {termsRead
                    ? (role === 'seller' ? 'Seller User Agreement' : 'Buyer Terms of Service')
                    : (role === 'seller' ? 'Read Seller User Agreement' : 'Read Buyer Terms of Service')}
                </span>
                {termsRead && (
                  <span className="ml-auto text-sm font-semibold text-green-600">Read</span>
                )}
              </button>

              {/* Read Privacy Button */}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className={`w-full py-4 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                  privacyRead
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {privacyRead ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <Shield className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-base font-medium">
                  {privacyRead ? 'Privacy Policy' : 'Read Privacy Policy'}
                </span>
                {privacyRead && (
                  <span className="ml-auto text-sm font-semibold text-green-600">Read</span>
                )}
              </button>

              {/* Agreement Checkbox */}
              <div className={`text-sm ${termsRead && privacyRead ? 'opacity-100' : 'opacity-50'}`}>
                <label className={`flex items-start gap-3 ${termsRead && privacyRead ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      if (termsRead && privacyRead) {
                        setTermsAccepted(e.target.checked)
                      }
                    }}
                    disabled={!termsRead || !privacyRead}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black disabled:opacity-50"
                  />
                  <span className="text-gray-700">
                    I agree to the {role === 'seller' ? 'Seller User Agreement' : 'Buyer Terms of Service'} and Privacy Policy, including all payment terms, subscription billing policies, deposit and refund policies, and dispute resolution provisions contained therein.
                  </span>
                </label>
                {!(termsRead && privacyRead) && (
                  <p className="text-xs text-amber-600 mt-1.5 ml-7">Please read both documents above first</p>
                )}
                {termsRead && privacyRead && (
                  <p className="text-xs text-green-600 mt-1.5 ml-7">You have read both documents</p>
                )}
              </div>
            </div>

            {/* Modals */}
            <ScrollToAgreeModal
              isOpen={showTermsModal}
              onClose={() => setShowTermsModal(false)}
              onFullyScrolled={() => setTermsRead(true)}
              title={role === 'seller' ? 'Seller User Agreement' : 'Buyer Terms of Service'}
              icon={<FileText className="w-5 h-5 text-gray-600" />}
            >
              {role === 'seller' ? <SellerTermsContent /> : <BuyerTermsContent />}
            </ScrollToAgreeModal>

            <ScrollToAgreeModal
              isOpen={showPrivacyModal}
              onClose={() => setShowPrivacyModal(false)}
              onFullyScrolled={() => setPrivacyRead(true)}
              title="Privacy Policy"
              icon={<Shield className="w-5 h-5 text-gray-600" />}
            >
              <PrivacyContent />
            </ScrollToAgreeModal>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign Up
            </Button>

            <div className="text-center text-xs text-gray-400 -mt-2">
              <Link to="/privacy" target="_blank" className="underline hover:text-gray-600">Privacy Policy</Link>
              {' | '}
              <Link to="/terms" target="_blank" className="underline hover:text-gray-600">Terms of Service</Link>
            </div>

            <div className="text-center text-sm text-gray-500">
              Have an account?{' '}
              <Link to="/login" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Log in
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default RegisterPage
