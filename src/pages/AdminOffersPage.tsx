import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Eye,
  MessageSquare,
  CreditCard,
  ArrowRight,
  X,
  AlertCircle,
  Check,
  FileText,
  ShoppingCart,
  Loader2,
  RefreshCw,
  Trash2,
  Send,
  DollarSign,
  Crown
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

interface Offer {
  id: string
  amount: number
  sellerAmount?: number
  message?: string
  status: string
  isBuyNow?: boolean
  counterAmount?: number
  counterMessage?: string
  counterAt?: string
  expiresAt?: string
  respondedAt?: string
  adminReviewedBy?: string
  adminReviewedAt?: string
  adminNotes?: string
  listingId: string
  buyerId: string
  sellerId: string
  createdAt: string
  updatedAt: string
  listing?: {
    id: string
    mcNumber: string
    title: string
    price: number
    askingPrice?: number
    legalName?: string
    status: string
  }
  buyer?: {
    id: string
    name: string
    email: string
    phone?: string
    verified: boolean
    trustScore: number
    subscription?: {
      plan: string
      status: string
    } | null
  }
  seller?: {
    id: string
    name: string
    email: string
    phone?: string
    verified: boolean
  }
}

type FilterStatus = 'all' | 'PENDING_ADMIN' | 'FORWARDED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACCEPTED'

// A buyer is VIP when they hold the active VIP / Deal Access Pass ($399 one-time)
const isVipBuyer = (buyer?: Offer['buyer']) =>
  buyer?.subscription?.plan === 'VIP_ACCESS' && buyer?.subscription?.status === 'ACTIVE'

const VipBadge = () => (
  <span
    title="VIP / Deal Access Pass holder"
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"
  >
    <Crown className="w-3 h-3" />
    VIP
  </span>
)

const AdminOffersPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [sellerAmountInput, setSellerAmountInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedParty, setSelectedParty] = useState<'buyer' | 'seller' | null>(null)
  const [actionMode, setActionMode] = useState<'message' | 'credits'>('message')
  const [messageText, setMessageText] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchOffers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { page?: number; limit?: number; status?: string } = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await api.getAdminOffers(params)
      setOffers(response.data || [])
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [statusFilter, pagination.page])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      'PENDING_ADMIN': { label: 'Awaiting Admin', color: 'bg-orange-100 text-orange-700', icon: Clock },
      'FORWARDED': { label: 'Sent to Seller', color: 'bg-blue-100 text-blue-700', icon: Send },
      'PENDING': { label: 'Pending Seller', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'APPROVED': { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'REJECTED': { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
      'ACCEPTED': { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      'COUNTERED': { label: 'Countered', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
      'EXPIRED': { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: Clock },
      'WITHDRAWN': { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: X }
    }
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock }
  }

  const filteredOffers = offers.filter(offer => {
    const matchesSearch =
      offer.listing?.mcNumber?.includes(searchQuery) ||
      offer.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const stats = {
    pendingAdmin: offers.filter(o => o.status === 'PENDING_ADMIN').length,
    forwarded: offers.filter(o => o.status === 'FORWARDED').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    buyNow: offers.filter(o => o.isBuyNow).length
  }

  const handleApprove = async () => {
    if (!selectedOffer) return
    setProcessing(true)
    try {
      await api.approveOffer(selectedOffer.id, adminNotes || undefined)
      closeDetailModal()
      setAdminNotes('')
      fetchOffers()
    } catch (err: any) {
      alert(err.message || 'Failed to approve offer')
    } finally {
      setProcessing(false)
    }
  }

  const handleForward = async () => {
    if (!selectedOffer) return
    const amount = parseFloat(sellerAmountInput)
    if (!amount || amount <= 0) {
      alert('Please enter a valid seller amount')
      return
    }
    setProcessing(true)
    try {
      await api.forwardOfferToSeller(selectedOffer.id, amount, adminNotes || undefined)
      closeDetailModal()
      setAdminNotes('')
      setSellerAmountInput('')
      fetchOffers()
    } catch (err: any) {
      alert(err.message || 'Failed to forward offer')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedOffer) return
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setProcessing(true)
    try {
      await api.rejectOffer(selectedOffer.id, adminNotes)
      closeDetailModal()
      setAdminNotes('')
      fetchOffers()
    } catch (err: any) {
      alert(err.message || 'Failed to reject offer')
    } finally {
      setProcessing(false)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedOffer(null)
    setSelectedParty(null)
    setMessageText('')
    setCreditAmount('')
    setCreditReason('')
    setActionFeedback(null)
  }

  const handleAcceptOnBehalf = async () => {
    if (!selectedOffer) return
    const buyerPrice = Number(selectedOffer.counterAmount || selectedOffer.amount)
    const sellerPrice = Number(selectedOffer.sellerAmount || buyerPrice)
    const confirmed = confirm(
      `Accept this offer on behalf of the seller?\n\n` +
      `Buyer pays: $${buyerPrice.toLocaleString()}\n` +
      `Seller gets: $${sellerPrice.toLocaleString()}\n\n` +
      `This creates a transaction and notifies both parties.`
    )
    if (!confirmed) return
    setProcessing(true)
    try {
      await api.adminAcceptOfferOnBehalf(selectedOffer.id, adminNotes || undefined)
      closeDetailModal()
      setAdminNotes('')
      fetchOffers()
    } catch (err: any) {
      alert(err.message || 'Failed to accept offer on behalf of seller')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectOnBehalf = async () => {
    if (!selectedOffer) return
    const reason = prompt('Reason for rejecting on behalf of seller (optional, internal note):')
    if (reason === null) return
    setProcessing(true)
    try {
      await api.adminRejectOfferOnBehalf(selectedOffer.id, reason.trim() || undefined)
      closeDetailModal()
      setAdminNotes('')
      fetchOffers()
    } catch (err: any) {
      alert(err.message || 'Failed to reject offer on behalf of seller')
    } finally {
      setProcessing(false)
    }
  }

  const openParty = (party: 'buyer' | 'seller') => {
    setSelectedParty(prev => (prev === party ? null : party))
    setActionFeedback(null)
    if (party === 'seller' && selectedOffer?.listing?.status === 'SOLD') {
      setActionMode('credits')
      if (!creditReason) setCreditReason('Listing sold — credit refund')
    } else {
      setActionMode('message')
    }
  }

  const handleSendPartyMessage = async () => {
    if (!selectedOffer || !selectedParty) return
    const receiverId = selectedParty === 'buyer' ? selectedOffer.buyerId : selectedOffer.sellerId
    if (!messageText.trim()) {
      setActionFeedback({ type: 'error', text: 'Message cannot be empty' })
      return
    }
    setActionSubmitting(true)
    setActionFeedback(null)
    try {
      await api.sendMessage(receiverId, messageText.trim(), selectedOffer.listingId)
      setMessageText('')
      setActionFeedback({ type: 'success', text: 'Message sent (email also delivered).' })
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Failed to send message' })
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleAddCredits = async () => {
    if (!selectedOffer || !selectedParty) return
    const userId = selectedParty === 'buyer' ? selectedOffer.buyerId : selectedOffer.sellerId
    const amount = parseInt(creditAmount, 10)
    if (!amount || amount <= 0) {
      setActionFeedback({ type: 'error', text: 'Enter a positive credit amount' })
      return
    }
    if (!creditReason.trim()) {
      setActionFeedback({ type: 'error', text: 'Reason is required' })
      return
    }
    setActionSubmitting(true)
    setActionFeedback(null)
    try {
      await api.addBonusCredits(userId, amount, creditReason.trim())
      setCreditAmount('')
      setActionFeedback({ type: 'success', text: `${amount} credits added.` })
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Failed to add credits' })
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleDelete = async (offerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Are you sure you want to delete this offer? This cannot be undone.')) return
    try {
      await api.deleteOffer(offerId)
      setOffers(prev => prev.filter(o => o.id !== offerId))
      if (selectedOffer?.id === offerId) {
        closeDetailModal()
        setSelectedOffer(null)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete offer')
    }
  }

  if (loading && offers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Offer Management</h1>
          <p className="text-sm sm:text-base text-gray-500">Review and manage buyer offers and buy now requests</p>
        </div>
        <Button variant="outline" onClick={fetchOffers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Awaiting Review</p>
              <p className="text-2xl font-bold text-orange-700">{stats.pendingAdmin}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Sent to Seller</p>
              <p className="text-2xl font-bold text-blue-700">{stats.forwarded}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600">Accepted</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.accepted}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Buy Now Requests</p>
              <p className="text-2xl font-bold text-purple-700">{stats.buyNow}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by MC#, buyer, or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
            >
              <option value="all">All Status</option>
              <option value="PENDING_ADMIN">Awaiting Review</option>
              <option value="FORWARDED">Sent to Seller</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Offers Found</h3>
              <p className="text-gray-500">No offers match your current filters</p>
            </div>
          </Card>
        ) : (
          filteredOffers.map((offer, index) => {
            const statusConfig = getStatusBadge(offer.status)
            const StatusIcon = statusConfig.icon

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="cursor-pointer" onClick={() => {
                  setSelectedOffer(offer)
                  setAdminNotes(offer.adminNotes || '')
                  setShowDetailModal(true)
                }}>
                  {/* Mobile: status badge + amount at top for quick scanning */}
                  <div className="flex items-center justify-between mb-3 sm:hidden">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${Number(offer.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        Ask: ${Number(offer.listing?.askingPrice || offer.listing?.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* MC Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="font-semibold text-gray-900">MC #{offer.listing?.mcNumber || 'N/A'}</h3>
                            {offer.listing?.legalName && (
                              <span className="text-sm text-gray-600 truncate">— {offer.listing.legalName}</span>
                            )}
                            {offer.isBuyNow && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3" />
                                Buy Now
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{offer.listing?.title || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Buyer</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1 truncate">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{offer.buyer?.name || 'N/A'}</span>
                            {isVipBuyer(offer.buyer) && <VipBadge />}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Seller</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1 truncate">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{offer.seller?.name || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing - hidden on mobile (shown at top instead) */}
                    <div className="hidden sm:flex flex-col items-start lg:items-end gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Offer Amount</p>
                        <p className="text-xl font-bold text-gray-900">${Number(offer.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">
                          Asking: ${Number(offer.listing?.askingPrice || offer.listing?.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions - full width on mobile */}
                    <div className="flex items-center gap-2 sm:flex-col lg:flex-row">
                      {offer.status === 'PENDING_ADMIN' && (
                        <Button
                          size="sm"
                          fullWidth
                          className="sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOffer(offer)
                            setAdminNotes('')
                            setShowDetailModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleDelete(offer.id, e)}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm text-gray-500">
                    <span>Submitted: {new Date(offer.createdAt).toLocaleDateString()} at {new Date(offer.createdAt).toLocaleTimeString()}</span>
                    {offer.adminReviewedAt && (
                      <span className="flex items-center gap-1 text-gray-500">
                        Reviewed: {new Date(offer.adminReviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => closeDetailModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Drag handle for mobile */}
              <div className="sm:hidden flex justify-center pt-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Offer Details</h2>
                    {selectedOffer.isBuyNow && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        Buy Now Request
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => closeDetailModal()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
                {/* MC & Pricing */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          MC #{selectedOffer.listing?.mcNumber || 'N/A'}
                          {selectedOffer.listing?.legalName && (
                            <span className="text-gray-600 font-normal block sm:inline"> — {selectedOffer.listing.legalName}</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{selectedOffer.listing?.title || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right pl-13 sm:pl-0">
                      <p className="text-sm text-gray-500">Asking Price</p>
                      <p className="text-lg font-bold text-gray-900">${Number(selectedOffer.listing?.askingPrice || selectedOffer.listing?.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-gray-600">Buyer Offer</span>
                    <span className="text-2xl font-bold text-green-600">${Number(selectedOffer.amount).toLocaleString()}</span>
                  </div>
                  {selectedOffer.sellerAmount && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-gray-600">Seller Amount</span>
                      <span className="text-lg font-semibold text-indigo-600">${Number(selectedOffer.sellerAmount).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOffer.sellerAmount && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-500 text-sm">Platform Margin</span>
                      <span className="text-sm font-semibold text-emerald-600">${(Number(selectedOffer.amount) - Number(selectedOffer.sellerAmount)).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Buyer & Seller Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className={`bg-blue-50 rounded-xl p-3 sm:p-4 ${selectedParty === 'buyer' ? 'ring-2 ring-blue-400' : ''}`}>
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <h4 className="text-sm font-medium text-blue-800">Buyer</h4>
                      {isVipBuyer(selectedOffer.buyer) && <VipBadge />}
                    </div>
                    <button
                      type="button"
                      onClick={() => openParty('buyer')}
                      className="font-semibold text-gray-900 text-sm sm:text-base hover:text-blue-700 hover:underline text-left"
                    >
                      {selectedOffer.buyer?.name || 'N/A'}
                    </button>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedOffer.buyer?.email || 'N/A'}</p>
                    {selectedOffer.buyer?.phone && (
                      <p className="text-xs sm:text-sm text-gray-500">{selectedOffer.buyer.phone}</p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <span className="text-gray-500">Trust Score:</span>
                      <span className="font-medium text-gray-900">{selectedOffer.buyer?.trustScore || 0}%</span>
                    </div>
                  </div>
                  <div className={`bg-purple-50 rounded-xl p-3 sm:p-4 ${selectedParty === 'seller' ? 'ring-2 ring-purple-400' : ''}`}>
                    <h4 className="text-sm font-medium text-purple-800 mb-2 sm:mb-3">Seller</h4>
                    <button
                      type="button"
                      onClick={() => openParty('seller')}
                      className="font-semibold text-gray-900 text-sm sm:text-base hover:text-purple-700 hover:underline text-left"
                    >
                      {selectedOffer.seller?.name || 'N/A'}
                    </button>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedOffer.seller?.email || 'N/A'}</p>
                    {selectedOffer.seller?.phone && (
                      <p className="text-xs sm:text-sm text-gray-500">{selectedOffer.seller.phone}</p>
                    )}
                    {selectedOffer.listing?.status === 'SOLD' && (
                      <p className="mt-2 text-xs text-emerald-700 font-medium">✓ Listing sold — refund eligible</p>
                    )}
                  </div>
                </div>

                {/* Inline Action Panel — appears when buyer/seller name is clicked */}
                {selectedParty && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {selectedParty === 'buyer' ? selectedOffer.buyer?.name : selectedOffer.seller?.name}
                        <span className="text-gray-500 font-normal"> — quick action</span>
                      </h4>
                      <button
                        onClick={() => setSelectedParty(null)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setActionMode('message'); setActionFeedback(null) }}
                        className={`px-3 py-1.5 text-sm rounded-lg ${actionMode === 'message' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                      >
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Message
                      </button>
                      <button
                        onClick={() => { setActionMode('credits'); setActionFeedback(null) }}
                        className={`px-3 py-1.5 text-sm rounded-lg ${actionMode === 'credits' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                      >
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Add Credits
                      </button>
                    </div>

                    {actionMode === 'message' && (
                      <div className="space-y-2">
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={3}
                          placeholder={`Message ${selectedParty}...`}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 resize-none text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={handleSendPartyMessage}
                          loading={actionSubmitting}
                          disabled={!messageText.trim()}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send (email + in-app)
                        </Button>
                      </div>
                    )}

                    {actionMode === 'credits' && (
                      <div className="space-y-2">
                        {selectedParty === 'seller' && selectedOffer.listing?.status === 'SOLD' && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800">
                            Listing was sold. Use this to refund or grant bonus credits to the seller without leaving the offer.
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="number"
                            min="1"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            placeholder="Credits"
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 text-sm"
                          />
                          <input
                            type="text"
                            value={creditReason}
                            onChange={(e) => setCreditReason(e.target.value)}
                            placeholder="Reason"
                            className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 text-sm"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAddCredits}
                          loading={actionSubmitting}
                          disabled={!creditAmount || !creditReason.trim()}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Add Credits
                        </Button>
                      </div>
                    )}

                    {actionFeedback && (
                      <div className={`text-sm ${actionFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {actionFeedback.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Buyer Message */}
                {selectedOffer.message && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Buyer's Message</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700">{selectedOffer.message}</p>
                    </div>
                  </div>
                )}

                {/* Forward to Seller — set seller amount */}
                {selectedOffer.status === 'PENDING_ADMIN' && (
                  <div className="bg-indigo-50 rounded-xl p-4 space-y-4">
                    <div className="flex gap-3">
                      <Send className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-indigo-800">
                        <p className="font-medium mb-1">Forward to Seller</p>
                        <p className="text-indigo-700">
                          Set the amount the seller will see. The difference between the buyer's offer and the seller amount is your margin.
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seller Amount ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={sellerAmountInput}
                          onChange={(e) => setSellerAmountInput(e.target.value)}
                          placeholder={`Suggested: ${Number(selectedOffer.listing?.askingPrice || selectedOffer.amount).toLocaleString()}`}
                          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      {sellerAmountInput && parseFloat(sellerAmountInput) > 0 && (
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                          <span className="text-gray-500">Buyer pays: <strong className="text-gray-900">${Number(selectedOffer.amount).toLocaleString()}</strong></span>
                          <span className="text-gray-500">Seller gets: <strong className="text-gray-900">${parseFloat(sellerAmountInput).toLocaleString()}</strong></span>
                          <span className={`font-semibold ${Number(selectedOffer.amount) - parseFloat(sellerAmountInput) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Margin: ${(Number(selectedOffer.amount) - parseFloat(sellerAmountInput)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedOffer.status === 'PENDING_ADMIN' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Notes (required for rejection)</h4>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 resize-none"
                      placeholder="Add internal notes about this offer..."
                    />
                  </div>
                )}

                {selectedOffer.adminNotes && selectedOffer.status !== 'PENDING_ADMIN' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h4>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <p className="text-gray-700">{selectedOffer.adminNotes}</p>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                {selectedOffer.status === 'PENDING_ADMIN' && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Admin Review Flow</p>
                        <p className="text-blue-700">
                          <strong>Forward:</strong> Sets a seller amount and sends the offer to the seller for acceptance. <br />
                          <strong>Approve:</strong> Skips the seller and creates a transaction directly. <br />
                          <strong>Reject:</strong> Declines the offer and notifies the buyer.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100">
                {selectedOffer.status === 'PENDING_ADMIN' && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      fullWidth
                      onClick={handleForward}
                      loading={processing}
                      disabled={!sellerAmountInput || parseFloat(sellerAmountInput) <= 0}
                      className="bg-indigo-600 hover:bg-indigo-700 order-1 sm:order-3 sm:flex-1 py-3 sm:py-2"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Forward to Seller
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleApprove}
                      loading={processing}
                      className="order-2 sm:order-2 sm:w-auto py-3 sm:py-2"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Direct
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleReject}
                      loading={processing}
                      className="text-red-600 border-red-200 hover:bg-red-50 order-3 sm:order-1 sm:w-auto py-3 sm:py-2"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
                {(selectedOffer.status === 'FORWARDED' || selectedOffer.status === 'PENDING' || selectedOffer.status === 'COUNTERED') && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Seller Hasn't Responded</p>
                        <p className="text-amber-700">
                          Use these only if the seller is unreachable. Both buyer and seller will be notified.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        fullWidth
                        onClick={handleAcceptOnBehalf}
                        loading={processing}
                        className="bg-emerald-600 hover:bg-emerald-700 order-1 sm:order-2 sm:flex-1 py-3 sm:py-2"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept on Behalf
                      </Button>
                      <Button
                        fullWidth
                        variant="outline"
                        onClick={handleRejectOnBehalf}
                        loading={processing}
                        className="text-red-600 border-red-200 hover:bg-red-50 order-2 sm:order-1 sm:w-auto py-3 sm:py-2"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject on Behalf
                      </Button>
                      <Button
                        fullWidth
                        variant="outline"
                        onClick={() => closeDetailModal()}
                        className="order-3 sm:order-3 sm:w-auto py-3 sm:py-2"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
                {selectedOffer.status !== 'PENDING_ADMIN' && selectedOffer.status !== 'FORWARDED' && selectedOffer.status !== 'PENDING' && selectedOffer.status !== 'COUNTERED' && (
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={() => closeDetailModal()}
                    className="py-3 sm:py-2"
                  >
                    Close
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminOffersPage
