import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Shield, Loader2, ExternalLink, X } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import api, { AdminContentReport } from '../../services/api'

type StatusFilter = 'OPEN' | 'DISMISSED' | 'ACTIONED' | 'ALL'

interface ReportedItemsPanelProps {
  onCountChange?: (openCount: number) => void
}

const RESOLUTION_LABELS: Record<string, string> = {
  DISMISSED: 'Dismissed',
  TAKEN_DOWN: 'Listing taken down',
  SELLER_BLOCKED: 'Seller blocked',
  TAKEN_DOWN_AND_BLOCKED: 'Taken down + seller blocked',
}

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const ReportedItemsPanel = ({ onCountChange }: ReportedItemsPanelProps) => {
  const [filter, setFilter] = useState<StatusFilter>('OPEN')
  const [reports, setReports] = useState<AdminContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFor, setActionFor] = useState<AdminContentReport | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getAdminReports({ status: filter })
      setReports(res.data || [])
      if (filter === 'OPEN') onCountChange?.(res.pagination?.total ?? res.data?.length ?? 0)
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [filter, onCountChange])

  useEffect(() => {
    load()
  }, [load])

  const refreshCount = () =>
    api.getAdminOpenReportCount().then((r) => onCountChange?.(r.data?.count ?? 0)).catch(() => {})

  const dismiss = async (r: AdminContentReport) => {
    const extra = r.openReportsOnTarget > 1 ? ` This also dismisses the other ${r.openReportsOnTarget - 1} open report(s) on it.` : ''
    if (!window.confirm(`Dismiss the report on ${r.target?.label || 'this item'}?${extra}`)) return
    setBusyId(r.id)
    try {
      const res = await api.dismissReport(r.id)
      setFlash(res.message)
      await load()
      refreshCount()
    } catch (err: any) {
      setFlash(err?.message || 'Failed to dismiss')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['OPEN', 'ACTIONED', 'DISMISSED', 'ALL'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'OPEN' ? 'Open' : f === 'ACTIONED' ? 'Actioned' : f === 'DISMISSED' ? 'Dismissed' : 'All'}
          </button>
        ))}
      </div>

      {flash && (
        <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <span className="text-gray-700">{flash}</span>
          <button onClick={() => setFlash(null)} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss message">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <Card>
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              {filter === 'OPEN' ? 'No open reports' : 'No reports here'}
            </p>
            {filter === 'OPEN' && (
              <p className="text-sm text-gray-500 mt-1">When a user reports a listing it shows up here.</p>
            )}
          </div>
        </Card>
      ) : (
        reports.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 break-words">
                    {r.target?.label || `${r.targetType === 'LISTING' ? 'Listing' : 'Equipment'} (deleted)`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                    {r.targetType === 'LISTING' ? 'MC listing' : 'Equipment'}
                  </span>
                  {r.status === 'OPEN' ? (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        r.severity === 'critical'
                          ? 'bg-red-50 border border-red-200 text-red-700'
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {r.severity}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                      {RESOLUTION_LABELS[r.resolution || ''] || r.status}
                    </span>
                  )}
                  {r.status === 'OPEN' && r.openReportsOnTarget > 1 && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-600 text-white">
                      {r.openReportsOnTarget} open reports
                    </span>
                  )}
                </div>

                <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
                  <dt className="text-gray-500">Reason</dt>
                  <dd className="text-gray-800 font-medium">{r.reasonLabel}</dd>
                  {r.details && (
                    <>
                      <dt className="text-gray-500">Details</dt>
                      <dd className="text-gray-700 whitespace-pre-wrap break-words">{r.details}</dd>
                    </>
                  )}
                  <dt className="text-gray-500">Reported by</dt>
                  <dd className="text-gray-700 break-all">
                    {r.reporter ? (
                      <Link to={`/admin/users/${r.reporter.id}`} className="hover:underline">
                        {r.reporter.name} · {r.reporter.email}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </dd>
                  <dt className="text-gray-500">Seller</dt>
                  <dd className="text-gray-700 break-all">
                    {r.reportedUser ? (
                      <Link to={`/admin/users/${r.reportedUser.id}`} className="hover:underline">
                        {r.reportedUser.name} · {r.reportedUser.email}
                        {r.reportedUser.status === 'BLOCKED' && <span className="ml-2 text-red-600 font-medium">(blocked)</span>}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                  {r.target?.status && (
                    <>
                      <dt className="text-gray-500">Listing status</dt>
                      <dd className="text-gray-700">{r.target.status}</dd>
                    </>
                  )}
                  <dt className="text-gray-500">Reported</dt>
                  <dd className="text-gray-700">{timeAgo(r.createdAt)}</dd>
                  {r.status !== 'OPEN' && (
                    <>
                      <dt className="text-gray-500">Resolved</dt>
                      <dd className="text-gray-700">
                        {r.resolvedAt ? timeAgo(r.resolvedAt) : ''}
                        {r.resolver ? ` by ${r.resolver.name}` : ''}
                        {r.adminNotes ? ` — ${r.adminNotes}` : ''}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {r.target && (
                <a
                  href={r.target.adminUrl || r.target.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View listing <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {r.status === 'OPEN' && (
                <>
                  <Button fullWidth onClick={() => setActionFor(r)} disabled={busyId === r.id}>
                    Take Action
                  </Button>
                  <Button fullWidth variant="ghost" onClick={() => dismiss(r)} disabled={busyId === r.id}>
                    {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Dismiss'}
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))
      )}

      {actionFor && (
        <TakeActionModal
          report={actionFor}
          onClose={() => setActionFor(null)}
          onDone={async (message) => {
            setActionFor(null)
            setFlash(message)
            await load()
            refreshCount()
          }}
        />
      )}
    </div>
  )
}

const TakeActionModal = ({
  report,
  onClose,
  onDone,
}: {
  report: AdminContentReport
  onClose: () => void
  onDone: (message: string) => void
}) => {
  const attached = report.targetType === 'EQUIPMENT' && !!report.target?.attachedToListingId
  const [takeDown, setTakeDown] = useState(!attached)
  const [blockSeller, setBlockSeller] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!takeDown && !blockSeller) return setError('Choose at least one action')
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.actionReport(report.id, { takeDown, blockSeller, notes: notes.trim() || undefined })
      onDone(res.message || 'Action taken')
    } catch (err: any) {
      setError(err?.message || 'Action failed')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-8"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-1">Take action</h2>
        <p className="text-sm text-gray-500 mb-4 break-words">{report.target?.label}</p>

        <div className="space-y-2 mb-4">
          <label className={`flex items-start gap-3 px-3 py-2 rounded-xl border text-sm ${attached ? 'opacity-60' : 'cursor-pointer'} border-gray-200`}>
            <input
              type="checkbox"
              checked={takeDown}
              disabled={attached}
              onChange={(e) => setTakeDown(e.target.checked)}
              className="mt-0.5 accent-black"
            />
            <span>
              <span className="font-medium text-gray-900">Take down the listing</span>
              <span className="block text-gray-500">
                {attached
                  ? 'This item is part of an MC listing — take down the MC listing instead.'
                  : report.targetType === 'LISTING'
                    ? 'Sets the MC listing to SUSPENDED so it leaves the marketplace.'
                    : 'Rejects the equipment item so it leaves the marketplace.'}
              </span>
            </span>
          </label>
          <label className={`flex items-start gap-3 px-3 py-2 rounded-xl border border-gray-200 text-sm ${report.reportedUser ? 'cursor-pointer' : 'opacity-60'}`}>
            <input
              type="checkbox"
              checked={blockSeller}
              disabled={!report.reportedUser}
              onChange={(e) => setBlockSeller(e.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <span>
              <span className="font-medium text-gray-900">Block the seller</span>
              <span className="block text-gray-500">
                {report.reportedUser ? `${report.reportedUser.name} is signed out and can't log in.` : 'No seller attached.'}
              </span>
            </span>
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-action-notes">
          Admin notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="report-action-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        {report.openReportsOnTarget > 1 && (
          <p className="text-xs text-gray-500 mt-2">
            Closes all {report.openReportsOnTarget} open reports on this listing.
          </p>
        )}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <Button variant="outline" fullWidth onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReportedItemsPanel
