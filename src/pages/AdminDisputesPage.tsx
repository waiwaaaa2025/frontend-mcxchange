import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  CreditCard,
  AlertTriangle,
  Loader2,
  Eye,
  Check,
  X,
  Download
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

interface Dispute {
  id: string
  userId: string
  stripeTransactionId: string
  cardholderName: string
  userName: string
  status: 'PENDING' | 'SUBMITTED' | 'RESOLVED' | 'REJECTED'
  disputeEmail?: string
  disputeInfo?: string
  disputeReason?: string
  submittedAt?: string
  autoUnblockAt?: string
  resolvedAt?: string
  resolvedBy?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    status: string
  }
  resolver?: {
    id: string
    name: string
    email: string
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      )
    case 'SUBMITTED':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
          <AlertTriangle className="w-3 h-3" />
          Submitted
        </span>
      )
    case 'RESOLVED':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </span>
      )
    case 'REJECTED':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
          {status}
        </span>
      )
  }
}

const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal state for resolve/reject
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [modalDisputeId, setModalDisputeId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const loadDisputes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getDisputes({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      })
      setDisputes(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisputes()
  }, [statusFilter])

  const filteredDisputes = disputes.filter(dispute => {
    if (!searchQuery.trim()) return true
    const search = searchQuery.toLowerCase()
    return (
      dispute.userName.toLowerCase().includes(search) ||
      dispute.cardholderName.toLowerCase().includes(search) ||
      (dispute.user?.email || '').toLowerCase().includes(search) ||
      (dispute.disputeEmail || '').toLowerCase().includes(search) ||
      dispute.id.toLowerCase().includes(search)
    )
  })

  const handleResolve = async () => {
    if (!modalDisputeId) return

    setProcessingId(modalDisputeId)
    setActionMessage(null)

    try {
      await api.resolveDispute(modalDisputeId, notes || undefined)
      setActionMessage({ type: 'success', text: 'Dispute resolved. User has been unblocked.' })
      setShowResolveModal(false)
      setNotes('')
      loadDisputes()
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to resolve dispute' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!modalDisputeId) return

    setProcessingId(modalDisputeId)
    setActionMessage(null)

    try {
      await api.rejectDispute(modalDisputeId, notes || undefined)
      setActionMessage({ type: 'success', text: 'Dispute rejected. User remains blocked.' })
      setShowRejectModal(false)
      setNotes('')
      loadDisputes()
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to reject dispute' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleProcessAutoUnblock = async () => {
    setProcessingId('auto-unblock')
    setActionMessage(null)

    try {
      const response = await api.processAutoUnblock()
      const count = response.data.filter(r => r.success).length
      setActionMessage({
        type: 'success',
        text: count > 0
          ? `Processed ${count} dispute(s) for auto-unblock.`
          : 'No disputes ready for auto-unblock.'
      })
      loadDisputes()
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to process auto-unblock' })
    } finally {
      setProcessingId(null)
    }
  }

  const openResolveModal = (disputeId: string) => {
    setModalDisputeId(disputeId)
    setNotes('')
    setShowResolveModal(true)
  }

  const openRejectModal = (disputeId: string) => {
    setModalDisputeId(disputeId)
    setNotes('')
    setShowRejectModal(true)
  }

  // Stats
  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'PENDING').length,
    submitted: disputes.filter(d => d.status === 'SUBMITTED').length,
    resolved: disputes.filter(d => d.status === 'RESOLVED').length,
    rejected: disputes.filter(d => d.status === 'REJECTED').length,
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Account Disputes</h1>
            <p className="text-gray-500">Manage blocked accounts and cardholder name mismatch disputes</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleProcessAutoUnblock}
              disabled={processingId === 'auto-unblock'}
            >
              {processingId === 'auto-unblock' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Process Auto-Unblock
            </Button>
            <Button
              variant="secondary"
              onClick={loadDisputes}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Stripe chargeback monitor — never miss an evidence deadline */}
        <StripeDisputeMonitor />

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="!p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Disputes</div>
          </Card>
          <Card className="!p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </Card>
          <Card className="!p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-xs text-gray-500">Submitted</div>
          </Card>
          <Card className="!p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-gray-500">Resolved</div>
          </Card>
          <Card className="!p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-500">Rejected</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or dispute ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </Card>

        {/* Disputes List */}
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <ShieldAlert className="w-16 h-16 text-gray-200 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-bold mb-2">Loading disputes...</h3>
              <p className="text-gray-500">Fetching dispute data</p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error loading disputes</h3>
              <p className="text-gray-500">{error}</p>
            </div>
          </Card>
        ) : filteredDisputes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ShieldAlert className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No disputes found</h3>
              <p className="text-gray-500">No disputes match your filters</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDisputes.map((dispute) => (
              <Card key={dispute.id} hover className="cursor-pointer">
                <div
                  className="flex items-center gap-4"
                  onClick={() => setSelectedDispute(selectedDispute === dispute.id ? null : dispute.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    dispute.status === 'PENDING' ? 'bg-yellow-100' :
                    dispute.status === 'SUBMITTED' ? 'bg-blue-100' :
                    dispute.status === 'RESOLVED' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <ShieldAlert className={`w-5 h-5 ${
                      dispute.status === 'PENDING' ? 'text-yellow-600' :
                      dispute.status === 'SUBMITTED' ? 'text-blue-600' :
                      dispute.status === 'RESOLVED' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{dispute.userName}</span>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{dispute.user?.email || 'Unknown email'}</span>
                      <span>•</span>
                      <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <div className="text-sm text-gray-500">Cardholder</div>
                    <div className="font-medium text-gray-900">{dispute.cardholderName}</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedDispute === dispute.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Mismatch Details */}
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-800">
                          <ShieldAlert className="w-4 h-4" />
                          Name Mismatch
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-red-600 block">Cardholder Name</span>
                            <span className="font-medium text-gray-900">{dispute.cardholderName}</span>
                          </div>
                          <div>
                            <span className="text-red-600 block">Account Name</span>
                            <span className="font-medium text-gray-900">{dispute.userName}</span>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary-400" />
                          User Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>{dispute.user?.name || dispute.userName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{dispute.user?.email || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-gray-400" />
                            <span className="font-mono text-xs">{dispute.stripeTransactionId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dispute Submission Info (if submitted) */}
                    {dispute.status !== 'PENDING' && dispute.disputeEmail && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-800">
                          <Mail className="w-4 h-4" />
                          Dispute Submission
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-blue-600 block">Contact Email</span>
                            <span className="text-gray-900">{dispute.disputeEmail}</span>
                          </div>
                          <div>
                            <span className="text-blue-600 block">Reason for Mismatch</span>
                            <p className="text-gray-900 whitespace-pre-wrap">{dispute.disputeReason}</p>
                          </div>
                          <div>
                            <span className="text-blue-600 block">Additional Information</span>
                            <p className="text-gray-900 whitespace-pre-wrap">{dispute.disputeInfo}</p>
                          </div>
                          {dispute.submittedAt && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Calendar className="w-3 h-3" />
                              Submitted: {new Date(dispute.submittedAt).toLocaleString()}
                            </div>
                          )}
                          {dispute.autoUnblockAt && dispute.status === 'SUBMITTED' && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Clock className="w-3 h-3" />
                              Auto-unblock: {new Date(dispute.autoUnblockAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resolution Info (if resolved/rejected) */}
                    {(dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') && (
                      <div className={`rounded-lg p-4 border mb-4 ${
                        dispute.status === 'RESOLVED'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                          dispute.status === 'RESOLVED' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {dispute.status === 'RESOLVED' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {dispute.status === 'RESOLVED' ? 'Resolution' : 'Rejection'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          {dispute.resolvedAt && (
                            <div>
                              <span className={dispute.status === 'RESOLVED' ? 'text-green-600' : 'text-red-600'}>
                                Date:
                              </span>{' '}
                              {new Date(dispute.resolvedAt).toLocaleString()}
                            </div>
                          )}
                          {dispute.resolver && (
                            <div>
                              <span className={dispute.status === 'RESOLVED' ? 'text-green-600' : 'text-red-600'}>
                                By:
                              </span>{' '}
                              {dispute.resolver.name}
                            </div>
                          )}
                          {dispute.adminNotes && (
                            <div>
                              <span className={dispute.status === 'RESOLVED' ? 'text-green-600' : 'text-red-600'}>
                                Notes:
                              </span>{' '}
                              {dispute.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {(dispute.status === 'PENDING' || dispute.status === 'SUBMITTED') && (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openResolveModal(dispute.id)
                          }}
                          disabled={processingId === dispute.id}
                          className="!bg-green-500 hover:!bg-green-600"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Resolve & Unblock
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openRejectModal(dispute.id)
                          }}
                          disabled={processingId === dispute.id}
                          className="!bg-red-500 !text-white hover:!bg-red-600 border-none"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <a
                          href={`/dispute/${dispute.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Dispute Page
                        </a>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {new Date(dispute.createdAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Updated: {new Date(dispute.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Resolve Dispute
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will unblock the user's account and restore their access to the platform.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add any notes about the resolution..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowResolveModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleResolve}
                disabled={processingId !== null}
                className="!bg-green-500 hover:!bg-green-600"
              >
                {processingId ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Resolve & Unblock
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Reject Dispute
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will reject the dispute. The user's account will remain blocked.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Add a reason for rejection..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleReject}
                disabled={processingId !== null}
                className="!bg-red-500 !text-white hover:!bg-red-600 border-none"
              >
                {processingId ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Reject Dispute
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Live Stripe chargeback monitor — lists disputes awaiting a merchant
// response with their evidence deadlines, so none expire unanswered.
// ============================================================
interface OpenDispute {
  id: string; amount: number; currency: string; reason: string; status: string;
  created: number; dueBy: number | null; submissionCount: number;
  userId: string | null; userName: string | null; userEmail: string | null;
}

function StripeDisputeMonitor() {
  const [disputes, setDisputes] = useState<OpenDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getOpenStripeDisputes()
      setDisputes(res.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load Stripe disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const money = (a: number, c: string) => `$${(a / 100).toFixed(2)} ${(c || '').toUpperCase()}`
  const daysLeft = (dueBy: number | null) => {
    if (!dueBy) return null
    return Math.ceil((dueBy * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
  }
  const dueLabel = (dueBy: number | null) => {
    if (!dueBy) return '—'
    const d = new Date(dueBy * 1000)
    return d.toISOString().slice(0, 10)
  }

  const handleDownload = async (d: OpenDispute) => {
    if (!d.userId) return
    setDownloadingId(d.id)
    try {
      await api.downloadUserDisputeEvidence(d.userId, d.userName || undefined)
    } catch (err: any) {
      alert(err.message || 'Failed to generate evidence')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">Stripe Chargebacks Needing Response</h2>
          {!loading && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              {disputes.length}
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="py-8 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading live from Stripe…
        </div>
      )}

      {!loading && error && (
        <div className="py-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && disputes.length === 0 && (
        <div className="py-6 text-center text-emerald-700 font-medium">
          <CheckCircle className="w-6 h-6 mx-auto mb-2" /> No open disputes need a response. 🎉
        </div>
      )}

      {!loading && !error && disputes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-amber-200">
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => {
                const dl = daysLeft(d.dueBy)
                const urgent = dl !== null && dl <= 3
                return (
                  <tr key={d.id} className="border-b border-amber-100 last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`font-semibold ${urgent ? 'text-red-600' : 'text-gray-800'}`}>{dueLabel(d.dueBy)}</span>
                      {dl !== null && (
                        <span className={`ml-2 text-xs ${urgent ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {dl < 0 ? 'overdue' : `${dl}d left`}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap font-medium">{money(d.amount, d.currency)}</td>
                    <td className="py-2 pr-3"><span className="capitalize">{(d.reason || '').replace(/_/g, ' ')}</span></td>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-gray-900">{d.userName || '—'}</div>
                      <div className="text-xs text-gray-500">{d.userEmail || 'unmatched'}</div>
                    </td>
                    <td className="py-2 pr-3">
                      {d.userId ? (
                        <Button variant="outline" onClick={() => handleDownload(d)} disabled={downloadingId === d.id}>
                          {downloadingId === d.id
                            ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            : <Download className="w-4 h-4 mr-1" />}
                          {downloadingId === d.id ? 'Generating…' : 'Evidence PDF'}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">no matched user</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-500">
            Pulled live from Stripe. Submit evidence in the Stripe Dashboard → Disputes before each due date.
          </p>
        </div>
      )}
    </Card>
  )
}

export default AdminDisputesPage
