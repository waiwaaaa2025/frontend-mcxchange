import { useRef, useState } from 'react'

/**
 * Gates any paid checkout behind an affirmative payment-terms signature.
 *
 * Usage:
 *   const { requestConsent, modalProps, consentError } = usePaymentConsent()
 *   // on buy click (after your own auth check):
 *   requestConsent('CarrierPulse', async (signature) => {
 *     const res = await api.createCarrierPulseCheckout(signature)
 *     if (res.data?.url) window.location.href = res.data.url
 *     else throw new Error('No checkout URL received')
 *   })
 *   // in JSX: <PaymentConsentModal {...modalProps} />
 *
 * The action typically redirects to Stripe on success, so control won't return.
 * If it throws, the modal closes and `consentError` holds the message.
 */
export function usePaymentConsent() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [label, setLabel] = useState<string | undefined>(undefined)
  const [consentError, setConsentError] = useState<string | null>(null)
  const actionRef = useRef<((signature: string) => Promise<void>) | null>(null)

  const requestConsent = (
    productLabel: string,
    action: (signature: string) => Promise<void>
  ) => {
    actionRef.current = action
    setLabel(productLabel)
    setSubmitting(false)
    setConsentError(null)
    setOpen(true)
  }

  const onAgree = async (signature: string) => {
    const action = actionRef.current
    if (!action) return
    setSubmitting(true)
    setConsentError(null)
    try {
      await action(signature)
    } catch (err: any) {
      console.error('Checkout error:', err)
      setConsentError(err?.message || 'Failed to start checkout')
      setSubmitting(false)
      setOpen(false)
    }
  }

  const modalProps = {
    isOpen: open,
    onClose: () => setOpen(false),
    onAgree,
    productLabel: label,
    submitting,
  }

  return { requestConsent, modalProps, consentError }
}

export default usePaymentConsent
