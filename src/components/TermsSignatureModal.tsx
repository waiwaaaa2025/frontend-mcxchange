import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FileSignature, UserCheck, CreditCard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Shown after login until the member has signed everything pending, with one
// typed signature (must match the name on their ID when we have one):
//  - Terms of Service + Privacy Policy (every member once)
//  - Account name updated to the legal name on their ID (if it was changed)
//  - Card authorization (if the cardholder name doesn't match their ID)
// It can't be dismissed, only signed or logged out of. Admins are never asked.
const SKIP_PATHS = ['/terms', '/privacy', '/login', '/register', '/reset-password', '/forgot-password']

interface Status {
  required: boolean
  tos: boolean
  nameChange: { accountName: string; signupName: string } | null
  card: { cardholderName: string; idName: string } | null
  signatureMustMatch: string | null
}

const TermsSignatureModal = () => {
  const { user, isAuthenticated, logout, refreshUser } = useAuth()
  const { pathname } = useLocation()
  const [status, setStatus] = useState<Status | null>(null)
  const [signature, setSignature] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [ackName, setAckName] = useState(false)
  const [authorizeCard, setAuthorizeCard] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setStatus(null)
    if (!isAuthenticated || !user || user.role === 'admin') return
    api.getTermsSignatureStatus()
      .then((r) => { if (active) setStatus(r.data as Status) })
      .catch(() => {})
    return () => { active = false }
  }, [isAuthenticated, user?.id, user?.role])

  if (!status?.required || SKIP_PATHS.some((p) => pathname.startsWith(p))) return null

  const submit = async () => {
    setError(null)
    const name = signature.trim().replace(/\s+/g, ' ')
    if (status.tos && !agreed) return setError('Check the box to agree to the Terms.')
    if (status.nameChange && !ackName) return setError('Check the box to confirm your account name.')
    if (status.card && !authorizeCard) return setError('Check the box to confirm you are authorized to use this card.')
    if (name.length < 3 || !name.includes(' ')) return setError('Type your full legal name (first and last).')
    setSaving(true)
    try {
      await api.signTerms(name, { agreed, ackName, authorizeCard })
      setStatus(null)
      if (status.nameChange) void refreshUser()
    } catch (e: any) {
      setError(e.message || 'Could not save your signature. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const title = status.card
    ? 'Confirm Your Payment Card'
    : status.nameChange
    ? 'Confirm Your Account Name'
    : 'Sign Our Updated Terms'

  return (
    <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 my-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">A quick one-time step to keep your account in good standing.</p>
          </div>
        </div>

        <div className="space-y-4">
          {status.nameChange && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
                <UserCheck className="w-4 h-4 text-blue-600" /> We updated your account name
              </div>
              <p className="text-sm text-gray-700 mb-2">
                To match your verified government ID, your account name is now{' '}
                <strong>{status.nameChange.accountName}</strong> (you signed up as "{status.nameChange.signupName}").
              </p>
              <label className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={ackName} onChange={(e) => setAckName(e.target.checked)} />
                <span>I confirm <strong>{status.nameChange.accountName}</strong> is my correct legal name.</span>
              </label>
            </div>
          )}

          {status.card && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
                <CreditCard className="w-4 h-4 text-amber-600" /> Card in a different name
              </div>
              <p className="text-sm text-gray-700 mb-2">
                The card used on your account is in the name <strong>{status.card.cardholderName}</strong>,
                which doesn't match your ID (<strong>{status.card.idName}</strong>).
              </p>
              <label className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={authorizeCard} onChange={(e) => setAuthorizeCard(e.target.checked)} />
                <span>
                  I confirm this card is mine, or that I am authorized by the cardholder ({status.card.cardholderName}) to use it.
                  All charges to it for my Domilea account are authorized, and I will not dispute them.
                </span>
              </label>
            </div>
          )}

          {status.tos && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-700 mb-2">
                Please review the Domilea{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Terms of Service</a> and{' '}
                <a href="/privacy" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Privacy Policy</a>,
                including the Payment Terms, Subscription Billing and Dispute Prohibition policies. All payments are final.
              </p>
              <label className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>I have read and agree to the Terms of Service and Privacy Policy.</span>
              </label>
            </div>
          )}
        </div>

        <label className="block text-sm font-medium text-gray-700 mt-5 mb-1">
          Type your full legal name as your signature
          {status.signatureMustMatch && <span className="text-gray-500 font-normal"> (as on your ID: {status.signatureMustMatch})</span>}
        </label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          placeholder={status.signatureMustMatch || 'First and last name'}
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
