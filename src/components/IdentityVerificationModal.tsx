import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import IdentityVerificationPrompt from './IdentityVerificationPrompt'

// Opens whenever an API call is rejected with IDENTITY_VERIFICATION_REQUIRED
// (api.ts dispatches the event), e.g. a buyer unlocking a listing or a seller
// accepting an offer before verifying, and right after a plan purchase.
// Also opens on IDENTITY_NAME_MISMATCH: the buyer is verified but the account
// name, ID name and cardholder name aren't the same person.
const IdentityVerificationModal = () => {
  const { isIdentityVerified } = useAuth()
  const [open, setOpen] = useState(false)
  const [mismatch, setMismatch] = useState<string[] | null>(null)

  useEffect(() => {
    const show = () => { setMismatch(null); setOpen(true) }
    const showMismatch = (e: Event) => {
      const problems = (e as CustomEvent).detail
      setMismatch(Array.isArray(problems) ? problems : [])
      setOpen(true)
    }
    window.addEventListener('identity-verification-required', show)
    window.addEventListener('identity-name-mismatch', showMismatch)
    return () => {
      window.removeEventListener('identity-verification-required', show)
      window.removeEventListener('identity-name-mismatch', showMismatch)
    }
  }, [])

  useEffect(() => {
    if (isIdentityVerified && !mismatch) setOpen(false)
  }, [isIdentityVerified, mismatch])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl bg-gray-50 rounded-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {mismatch ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Names Don't Match</h2>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Your ID is verified, but to unlock MCs the name on your Domilea account, your government ID
              and the card you paid with must all be the same person.
            </p>
            {mismatch.length > 0 && (
              <ul className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md mx-auto mb-4 text-left list-disc list-inside">
                {mismatch.map((p) => <li key={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</li>)}
              </ul>
            )}
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Our team has been notified and will review your account. Questions? Email{' '}
              <a href="mailto:info@domilea.com" className="underline">info@domilea.com</a>.
            </p>
          </div>
        ) : (
          <IdentityVerificationPrompt embedded />
        )}
      </div>
    </div>
  )
}

export default IdentityVerificationModal
