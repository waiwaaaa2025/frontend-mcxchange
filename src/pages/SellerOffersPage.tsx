import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Loader2,
  Inbox
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

interface SellerOffer {
  id: string
  listingId: string
  amount: number
  status: string
  message?: string
  createdAt: string
  listing?: {
    mcNumber: string
    title: string
    askingPrice?: number
  }
  buyer?: {
    id: string
    name: string
  }
}

const SellerOffersPage = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('all')
  const [offers, setOffers] = useState<SellerOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true)
        const statusParam = activeFilter === 'all' ? undefined : activeFilter
        const response = await api.getSellerOffers({ status: statusParam })
        setOffers(response.data || [])
      } catch {
        setOffers([])
      } finally {
        setLoading(false)
      }
    }
    fetchOffers()
  }, [activeFilter])

  const pendingCount = offers.filter(o => o.status === 'PENDING').length
  const acceptedCount = offers.filter(o => o.status === 'ACCEPTED').length
  const rejectedCount = offers.filter(o => o.status === 'REJECTED').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600'
      case 'ACCEPTED': return 'text-emerald-600'
      case 'REJECTED': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )
      case 'ACCEPTED':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Accepted
          </span>
        )
      case 'REJECTED':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 border border-red-200 text-red-600 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Offers Received</h2>
        <p className="text-gray-500 text-sm">Review and manage offers on your listings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">Accepted</p>
          <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeFilter === filter
                ? 'bg-secondary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter === 'all' ? 'All' : filter.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          <p className="text-gray-500 mt-3">Loading offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Inbox className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No offers yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              When buyers submit offers on your listings, they'll appear here for you to review, accept, or decline.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-gray-900">
                        MC #{offer.listing?.mcNumber || 'N/A'}
                      </h3>
                      {getStatusBadge(offer.status)}
                    </div>
                    {offer.listing?.title && (
                      <p className="text-sm text-gray-500">{offer.listing.title}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatRelativeTime(offer.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    {offer.listing?.askingPrice && (
                      <>
                        <p className="text-xs text-gray-400">Asking</p>
                        <p className="text-sm text-gray-500">${offer.listing.askingPrice.toLocaleString()}</p>
                      </>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Offer</p>
                    <p className="text-xl font-bold text-secondary-600">
                      ${(offer.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Buyer */}
                {offer.buyer?.name && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{offer.buyer.name}</span>
                  </div>
                )}

                {/* Message */}
                {offer.message && (
                  <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{offer.message}</p>
                    </div>
                  </div>
                )}

                {/* Actions for pending offers */}
                {offer.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <Button size="sm" fullWidth>
                      <CheckCircle className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button size="sm" fullWidth variant="outline">
                      <DollarSign className="w-4 h-4 mr-1" /> Counter
                    </Button>
                    <Button size="sm" fullWidth variant="outline">
                      <XCircle className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SellerOffersPage
