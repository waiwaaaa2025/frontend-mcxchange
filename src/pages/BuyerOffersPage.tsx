import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Search,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatDistanceToNow } from 'date-fns'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Offer {
  id: string
  listingId: string
  amount: number
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'WITHDRAWN'
  counterAmount?: number
  counterMessage?: string
  isBuyNow?: boolean
  expiresAt?: string
  createdAt: string
  listing: {
    id: string
    mcNumber: string
    dotNumber?: string
    title: string
    askingPrice?: number
    listingPrice?: number
    price?: number
    status: string
    city?: string
    state?: string
    isPremium?: boolean
  }
  seller: {
    id: string
    name: string
    verified: boolean
    trustScore: number
  }
  transaction?: {
    id: string
    status: string
  }
}

const BuyerOffersPage = () => {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'approved' | 'rejected' | 'countered'>('all')
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [acceptingCounterId, setAcceptingCounterId] = useState<string | null>(null)

  const fetchOffers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getBuyerOffers()
      if (response.success && response.data) {
        setOffers(response.data)
      }
    } catch (err: any) {
      console.error('Error fetching offers:', err)
      setError(err.message || 'Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [])

  const handleWithdraw = async (offerId: string) => {
    if (!confirm('Are you sure you want to withdraw this offer?')) return

    try {
      setWithdrawingId(offerId)
      const response = await api.withdrawOffer(offerId)
      if (response.success) {
        toast.success('Offer withdrawn successfully')
        fetchOffers()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw offer')
    } finally {
      setWithdrawingId(null)
    }
  }

  const handleAcceptCounter = async (offerId: string) => {
    try {
      setAcceptingCounterId(offerId)
      const response = await api.acceptCounterOffer(offerId)
      if (response.success) {
        toast.success('Counter offer accepted! Waiting for seller confirmation.')
        fetchOffers()
      }
    } catch (err: any) {
      if (err.code !== 'IDENTITY_VERIFICATION_REQUIRED') toast.error(err.message || 'Failed to accept counter offer')
    } finally {
      setAcceptingCounterId(null)
    }
  }

  const filteredOffers = offers.filter(offer => {
    if (activeFilter === 'all') return true
    return offer.status.toLowerCase() === activeFilter
  })

  const getStatusColor = (status: string, isBuyNow?: boolean) => {
    const normalizedStatus = status.toLowerCase()
    if (isBuyNow && normalizedStatus === 'pending') {
      return 'text-purple-600' // Special color for pending Buy Now
    }
    switch (normalizedStatus) {
      case 'pending':
        return 'text-yellow-600'
      case 'accepted':
        return 'text-green-600'
      case 'approved':
        return 'text-green-600'
      case 'rejected':
        return 'text-red-600'
      case 'countered':
        return 'text-blue-600'
      case 'expired':
        return 'text-gray-500'
      case 'withdrawn':
        return 'text-gray-500'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status: string, isBuyNow?: boolean) => {
    const normalizedStatus = status.toLowerCase()
    if (isBuyNow && normalizedStatus === 'pending') {
      return 'bg-purple-100'
    }
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-100'
      case 'accepted':
        return 'bg-green-100'
      case 'approved':
        return 'bg-green-100'
      case 'rejected':
        return 'bg-red-100'
      case 'countered':
        return 'bg-blue-100'
      default:
        return 'bg-gray-100'
    }
  }

  const getStatusIcon = (status: string, isBuyNow?: boolean) => {
    const normalizedStatus = status.toLowerCase()
    if (isBuyNow && normalizedStatus === 'pending') {
      return <Clock className="w-4 h-4" /> // Awaiting admin review
    }
    switch (normalizedStatus) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'countered':
        return <MessageSquare className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string, isBuyNow?: boolean) => {
    const normalizedStatus = status.toLowerCase()
    if (isBuyNow && normalizedStatus === 'pending') {
      return 'Awaiting Admin Review'
    }
    if (isBuyNow && normalizedStatus === 'approved') {
      return 'Buy Now Approved'
    }
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const stats = [
    {
      label: 'Total Offers',
      value: offers.length,
      color: 'text-gray-900'
    },
    {
      label: 'Pending',
      value: offers.filter(o => o.status === 'PENDING').length,
      color: 'text-yellow-600'
    },
    {
      label: 'Accepted',
      value: offers.filter(o => o.status === 'ACCEPTED' || o.status === 'APPROVED').length,
      color: 'text-green-600'
    },
    {
      label: 'Buy Now',
      value: offers.filter(o => o.isBuyNow).length,
      color: 'text-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading offers...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Offers</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button onClick={fetchOffers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">My Offers</h2>
            <p className="text-sm sm:text-base text-gray-500">Track and manage your submitted offers</p>
          </div>
          <Button variant="outline" onClick={fetchOffers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</div>
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {(['all', 'pending', 'accepted', 'approved', 'countered', 'rejected'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium capitalize transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === filter
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Offers List */}
        <div className="space-y-4">
          {filteredOffers.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No offers yet</h3>
                <p className="text-gray-500 mb-6">
                  Browse the marketplace and make offers on listings you're interested in
                </p>
                <Link to="/marketplace">
                  <Button>
                    <Search className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            filteredOffers.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  {/* Mobile: status + amount summary at top */}
                  <div className="flex items-center justify-between mb-3 sm:hidden">
                    <span className={`${getStatusBgColor(offer.status, offer.isBuyNow)} px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 ${getStatusColor(offer.status, offer.isBuyNow)}`}>
                      {getStatusIcon(offer.status, offer.isBuyNow)}
                      <span>{getStatusLabel(offer.status, offer.isBuyNow)}</span>
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">${(offer.amount ?? 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">
                        Ask: ${(offer.listing.askingPrice ?? offer.listing.listingPrice ?? offer.listing.price ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">MC-{offer.listing.mcNumber}</h3>
                        {offer.isBuyNow && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            Buy Now
                          </span>
                        )}
                        {/* Status badge - desktop only (mobile shows at top) */}
                        <span className={`hidden sm:flex ${getStatusBgColor(offer.status, offer.isBuyNow)} px-3 py-1 rounded-full text-sm items-center gap-1.5 ${getStatusColor(offer.status, offer.isBuyNow)}`}>
                          {getStatusIcon(offer.status, offer.isBuyNow)}
                          <span>{getStatusLabel(offer.status, offer.isBuyNow)}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 truncate">{offer.listing.title}</p>
                      {offer.listing.city && offer.listing.state && (
                        <p className="text-xs text-gray-500 mb-2">{offer.listing.city}, {offer.listing.state}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Submitted {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Pricing - desktop only (mobile shows at top) */}
                    <div className="hidden sm:block text-right ml-4">
                      <div className="text-sm text-gray-500 mb-1">Listing Price</div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        ${(offer.listing.askingPrice ?? offer.listing.listingPrice ?? offer.listing.price ?? 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        {offer.isBuyNow ? 'Buy Now Price' : 'Your Offer'}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${(offer.amount ?? 0).toLocaleString()}
                      </div>
                      {offer.status === 'COUNTERED' && offer.counterAmount && (
                        <>
                          <div className="text-sm text-gray-500 mt-2 mb-1">Counter Offer</div>
                          <div className="text-xl font-bold text-blue-600">
                            ${(offer.counterAmount ?? 0).toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Counter offer - mobile inline display */}
                  {offer.status === 'COUNTERED' && offer.counterAmount && (
                    <div className="sm:hidden mb-4 bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm text-blue-700 font-medium">Counter Offer</span>
                      <span className="text-lg font-bold text-blue-600">${(offer.counterAmount ?? 0).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Seller Info */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Seller</div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="font-bold text-gray-600">
                            {offer.seller.name.charAt(0)}
                          </span>
                        </div>
                        <div className="font-semibold text-gray-900">{offer.seller.name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {offer.message && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Your Message</div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">{offer.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Counter Message */}
                  {offer.status === 'COUNTERED' && offer.counterMessage && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Seller's Counter Message</div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-700">{offer.counterMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Buy Now Status Message */}
                  {offer.isBuyNow && offer.status === 'PENDING' && (
                    <div className="mb-4 bg-purple-50 border border-purple-100 rounded-lg p-3">
                      <p className="text-sm text-purple-700">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Your Buy Now request is being reviewed by our admin team. You'll be notified once it's approved.
                      </p>
                    </div>
                  )}

                  {/* Offer Approved - Transaction Ready */}
                  {(offer.status === 'ACCEPTED' || offer.status === 'APPROVED') && offer.transaction && (
                    <div className="mb-4 bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        {offer.transaction.status === 'AWAITING_DEPOSIT'
                          ? 'Your offer has been approved! Go to the Round Table to proceed with the transaction.'
                          : 'Transaction in progress. View the Round Table to track progress and next steps.'}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Primary action first on mobile */}
                    {(offer.status === 'ACCEPTED' || offer.status === 'APPROVED') && offer.transaction && (
                      <Button
                        fullWidth
                        onClick={() => navigate(`/transaction/${offer.transaction!.id}`)}
                        className="sm:flex-1 py-3 sm:py-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {offer.transaction.status === 'AWAITING_DEPOSIT' ? 'Go to Round Table' : 'View Transaction'}
                      </Button>
                    )}

                    {offer.status === 'COUNTERED' && (
                      <Button
                        fullWidth
                        onClick={() => handleAcceptCounter(offer.id)}
                        disabled={acceptingCounterId === offer.id}
                        className="sm:flex-1 py-3 sm:py-2"
                      >
                        {acceptingCounterId === offer.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Accept Counter
                      </Button>
                    )}

                    <Link to={`/listing/${offer.listingId}`} className="sm:flex-1">
                      <Button fullWidth variant="outline" className="py-3 sm:py-2">
                        <Eye className="w-4 h-4 mr-2" />
                        View Listing
                      </Button>
                    </Link>

                    {offer.status === 'COUNTERED' && (
                      <Button fullWidth variant="outline" className="sm:flex-1 py-3 sm:py-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        New Offer
                      </Button>
                    )}

                    {(offer.status === 'PENDING' || offer.status === 'COUNTERED') && (
                      <Button
                        fullWidth
                        variant="ghost"
                        onClick={() => handleWithdraw(offer.id)}
                        disabled={withdrawingId === offer.id}
                        className="sm:flex-1 py-3 sm:py-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {withdrawingId === offer.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Withdraw
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default BuyerOffersPage
