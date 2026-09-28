import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import IdentityVerificationPrompt from './IdentityVerificationPrompt'

// Opens whenever an API call is rejected with IDENTITY_VERIFICATION_REQUIRED
// (api.ts dispatches the event), e.g. a buyer making an offer or a seller
// accepting one before verifying.
const IdentityVerificationModal = () => {
  const { isIdentityVerified } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener('identity-verification-required', show)
    return () => window.removeEventListener('identity-verification-required', show)
  }, [])

  useEffect(() => {
    if (isIdentityVerified) setOpen(false)
  }, [isIdentityVerified])

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
        <IdentityVerificationPrompt embedded />
      </div>
    </div>
  )
}

export default IdentityVerificationModal
