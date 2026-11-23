import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FileSignature } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Every member (new or existing) signs the Terms of Service + Privacy Policy
// once with a typed signature. Shown after login until they've signed; it
// can't be dismissed, only signed or logged out of. Admins are never asked.
const SKIP_PATHS = ['/terms', '/privacy', '/login', '/register', '/reset-password', '/forgot-password']

const TermsSignatureModal = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { pathname } = useLocation()
  const [required, setRequired] = useState(false)
  const [signature, setSignature] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setRequired(false)
    if (!isAuthenticated || !user || user.role === 'admin') return
    api.getTermsSignatureStatus()
      .then((r) => { if (active) setRequired(!!r.data?.required) })
      .catch(() => {})
    return () => { active = false }
  }, [isAuthenticated, user?.id, user?.role])

  if (!required || SKIP_PATHS.some((p) => pathname.startsWith(p))) return null

  const submit = async () => {
    setError(null)
    const name = signature.trim().replace(/\s+/g, ' ')
    if (!agreed) return setError('Check the box to agree.')
    if (name.length < 3 || !name.includes(' ')) return setError('Type your full legal name (first and last).')
    setSaving(true)
    try {
      await api.signTerms(name)
      setRequired(false)
    } catch (e: any) {
      setError(e.message || 'Could not save your signature. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 my-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sign Our Updated Terms</h2>
            <p className="text-sm text-gray-500">One-time step for every Domilea member.</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          Please review and sign the Domilea{' '}
          <a href="/terms" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Terms of Service</a> and{' '}
          <a href="/privacy" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Privacy Policy</a>,
          including the Payment Terms, Subscription Billing and Dispute Prohibition policies. All payments are final.
        </p>

        <label className="flex items-start gap-2 text-sm text-gray-800 mb-4 cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I have read and agree to the Terms of Service and Privacy Policy.</span>
        </label>

        <label className="block text-sm font-medium text-gray-700 mb-1">Type your full legal name as your signature</label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          placeholder="First and last name"
          autoComplete="name"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg italic"
          style={{ fontFamily: 'cursive, serif' }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Your typed name is your electronic signature. We record the date, time and IP address, and email you a copy.
        </p>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex items-center justify-between gap-3 mt-6">
          <button type="button" onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-700">
            Log out
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Sign & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermsSignatureModal
