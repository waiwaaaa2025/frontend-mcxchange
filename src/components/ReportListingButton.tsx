import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flag, Loader2, X, CheckCircle } from 'lucide-react'
import Button from './ui/Button'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

interface ReportListingButtonProps {
  targetType: 'LISTING' | 'EQUIPMENT'
  targetId: string
  className?: string
}

const FALLBACK_REASONS = [
  { value: 'FRAUD', label: 'Fraud or scam' },
  { value: 'FAKE_DOCUMENTS', label: 'Fake or altered documents' },
  { value: 'MISREPRESENTED', label: 'Misleading or inaccurate details' },
  { value: 'STOLEN_IDENTITY', label: 'Not the real owner / stolen identity' },
  { value: 'ALREADY_SOLD', label: 'Already sold or unavailable' },
  { value: 'OFF_PLATFORM', label: 'Asked to deal off-platform' },
  { value: 'OTHER', label: 'Other' },
]

const ReportListingButton = ({ targetType, targetId, className = '' }: ReportListingButtonProps) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [reasons, setReasons] = useState(FALLBACK_REASONS)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    api.getReportReasons().then((r) => r.data?.length && setReasons(r.data)).catch(() => {})
  }, [open])

  const start = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    setReason('')
    setDetails('')
    setError(null)
    setDone(null)
    setOpen(true)
  }

  const submit = async () => {
    if (!reason) return setError('Pick a reason')
    if (reason === 'OTHER' && !details.trim()) return setError('Tell us what is wrong')
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.createReport({ targetType, targetId, reason, details: details.trim() || undefined })
      setDone(res.message || 'Thanks — our team will review this listing.')
    } catch (err: any) {
      setError(err?.message || 'Could not send the report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={`inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors ${className}`}
      >
        <Flag className="w-4 h-4" />
        Report listing
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-listing-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 id="report-listing-title" className="text-lg font-bold text-gray-900">
                Report this listing
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-gray-700">{done}</p>
                <Button className="mt-5" fullWidth onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Reports are confidential — the seller won't see who sent them.
                </p>
                <fieldset className="space-y-2 mb-4">
                  <legend className="sr-only">Reason</legend>
                  {reasons.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer text-sm ${
                        reason === r.value ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-red-600"
                      />
                      {r.label}
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-details">
                  Details {reason === 'OTHER' ? '' : <span className="text-gray-400 font-normal">(optional)</span>}
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="What did you notice?"
                />
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                <div className="flex gap-3 mt-5">
                  <Button variant="outline" fullWidth onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button variant="danger" fullWidth onClick={submit} disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send report'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ReportListingButton
