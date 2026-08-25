import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  Eye,
  Heart,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import EditListingModal from '../components/EditListingModal'
import {
  AUTHORITY_TYPE_BADGE_LABELS,
  normalizeAuthorityType,
  hasCarrierOperations,
} from '../constants/authority'
import api from '../services/api'

interface Listing {
  id: string
  mcNumber: string
  dotNumber?: string
  title: string
  askingPrice?: number
  listingPrice?: number
  status: string
  views: number
  saves: number
  createdAt: string
  yearsInBusiness?: number
  yearsActive?: number
  fleetSize?: number
  authorityType?: string
  trustScore?: number
  _count?: {
    offers: number
    savedBy: number
  }
}

const SellerListingsPage = () => {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [activeFilter])

  const fetchListings = async () => {
    setLoading(true)
    setError(null)
    try {
      const statusParam = activeFilter === 'all' ? undefined : activeFilter.toUpperCase()
      const response = await api.getSellerListings({ status: statusParam })
      setListings(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch listings:', err)
      setError(err.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (listingId: string) => {
    setEditingListingId(listingId)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchListings()
  }

  const handleDelete = async (listingId: string) => {
    setDeleting(true)
    try {
      await api.deleteListing(listingId)
      setDeleteConfirmId(null)
      fetchListings()
    } catch (err: any) {
      console.error('Failed to delete listing:', err)
      setError(err.message || 'Failed to delete listing')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'text-green-600'
      case 'PENDING_REVIEW':
        return 'text-yellow-600'
      case 'SOLD':
        return 'text-blue-600'
      case 'RESERVED':
        return 'text-purple-600'
      case 'REJECTED':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING_REVIEW':
        return <Clock className="w-4 h-4" />
      case 'SOLD':
        return <DollarSign className="w-4 h-4" />
      case 'RESERVED':
        return <Clock className="w-4 h-4" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const formatStatus = (status: string) => {
    return status.toLowerCase().replace(/_/g, ' ')
  }

  const stats = [
    {
      label: 'Active Listings',
      value: listings.filter(l => l.status.toUpperCase() === 'ACTIVE').length,
      color: 'text-green-600'
    },
    {
      label: 'Pending Review',
      value: listings.filter(l => l.status.toUpperCase() === 'PENDING_REVIEW').length,
      color: 'text-yellow-600'
    },
    {
      label: 'Sold',
      value: listings.filter(l => l.status.toUpperCase() === 'SOLD').length,
      color: 'text-blue-600'
    },
    {
      label: 'Total Views',
      value: listings.reduce((sum, l) => sum + (l.views || 0), 0),
      color: 'text-primary-600'
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">My Listings</h2>
            <p className="text-sm sm:text-base text-gray-500">Manage your MC authority listings</p>
          </div>
          <Button onClick={() => navigate('/seller/carrier-pulse')} className="w-full sm:w-auto">
            <Package className="w-4 h-4 mr-2" />
            Create New Listing
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{stat.label}</div>
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(['all', 'active', 'pending_review', 'sold'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium capitalize transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <span className="ml-3 text-gray-500">Loading listings...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <GlassCard>
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>{error}</span>
            </div>
          </GlassCard>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <GlassCard>
            <div className="text-center py-12 px-4">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Listings Yet</h3>
              <p className="text-gray-500 mb-6">Create your first MC authority listing to get started.</p>
              <Button onClick={() => navigate('/seller/carrier-pulse')}>
                <Package className="w-4 h-4 mr-2" />
                Create New Listing
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Listings */}
        {!loading && !error && listings.length > 0 && (
          <div className="space-y-4">
            {listings.map((listing) => (
              <GlassCard key={listing.id} hover={true} className="p-4 sm:p-6">
                {/* Mobile Layout */}
                <div className="block lg:hidden">
                  {/* Header with MC Number and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-gray-900">MC #{listing.mcNumber}</h3>
                        {listing.authorityType && listing.authorityType !== 'MOTOR_CARRIER' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                            {AUTHORITY_TYPE_BADGE_LABELS[normalizeAuthorityType(listing.authorityType)]}
                          </span>
                        )}
                        <span className={`bg-gray-100 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(listing.status)}`}>
                          {getStatusIcon(listing.status)}
                          <span className="capitalize">{formatStatus(listing.status)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-lg font-bold text-primary-600">
                        ${(listing.askingPrice || listing.listingPrice || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.title}</p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{listing.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{listing._count?.savedBy || listing.saves || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{listing._count?.offers || 0}</span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(listing.yearsInBusiness || listing.yearsActive || listing.fleetSize) && (
                    <div className="flex gap-2 mb-3">
                      {(listing.yearsInBusiness || listing.yearsActive) && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                          <div className="text-xs text-gray-500">Years</div>
                          <div className="font-semibold text-gray-900 text-sm">{listing.yearsInBusiness || listing.yearsActive}</div>
                        </div>
                      )}
                      {listing.fleetSize && hasCarrierOperations(listing.authorityType) && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                          <div className="text-xs text-gray-500">Fleet</div>
                          <div className="font-semibold text-gray-900 text-sm">{listing.fleetSize} trucks</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - Mobile Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/mc/${listing.id}`)}
                      className="text-sm py-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {listing.status.toUpperCase() !== 'SOLD' && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(listing.id)}
                          className="text-sm py-2"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {deleteConfirmId === listing.id ? (
                          <div className="col-span-2 flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 text-sm py-2"
                              disabled={deleting}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleDelete(listing.id)}
                              className="flex-1 text-sm py-2 text-red-600 hover:bg-red-50"
                              disabled={deleting}
                            >
                              {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Confirm Delete'
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(listing.id)}
                            className="text-sm py-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                    {listing._count && listing._count.offers > 0 && listing.status.toUpperCase() === 'ACTIVE' && (
                      <Button
                        onClick={() => navigate('/seller/offers')}
                        className="col-span-2 text-sm py-2"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        View {listing._count.offers} Offer{listing._count.offers > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">MC #{listing.mcNumber}</h3>
                        {listing.authorityType && listing.authorityType !== 'MOTOR_CARRIER' && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                            {AUTHORITY_TYPE_BADGE_LABELS[normalizeAuthorityType(listing.authorityType)]}
                          </span>
                        )}
                        <span className={`bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 ${getStatusColor(listing.status)}`}>
                          {getStatusIcon(listing.status)}
                          <span className="capitalize">{formatStatus(listing.status)}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{listing.title}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>{listing.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4" />
                          <span>{listing._count?.savedBy || listing.saves || 0} saves</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          <span>{listing._count?.offers || 0} offers</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-xs text-gray-500 mb-1">Your Asking Price</div>
                      <div className="text-2xl font-bold text-primary-600 mb-2">
                        ${(listing.askingPrice || listing.listingPrice || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Listed {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {(listing.yearsInBusiness || listing.yearsActive || listing.fleetSize) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {(listing.yearsInBusiness || listing.yearsActive) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Years Active</div>
                          <div className="font-semibold text-gray-900">{listing.yearsInBusiness || listing.yearsActive} years</div>
                        </div>
                      )}
                      {listing.fleetSize && hasCarrierOperations(listing.authorityType) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Fleet Size</div>
                          <div className="font-semibold text-gray-900">{listing.fleetSize} trucks</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => navigate(`/mc/${listing.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    {listing.status.toUpperCase() !== 'SOLD' && (
                      <>
                        <Button
                          fullWidth
                          variant="secondary"
                          onClick={() => handleEdit(listing.id)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        {deleteConfirmId === listing.id ? (
                          <div className="flex gap-2 flex-1">
                            <Button
                              fullWidth
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={deleting}
                            >
                              Cancel
                            </Button>
                            <Button
                              fullWidth
                              variant="ghost"
                              onClick={() => handleDelete(listing.id)}
                              className="text-red-600 hover:bg-red-50"
                              disabled={deleting}
                            >
                              {deleting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            fullWidth
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(listing.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                    {listing._count && listing._count.offers > 0 && listing.status.toUpperCase() === 'ACTIVE' && (
                      <Button fullWidth onClick={() => navigate('/seller/offers')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        View Offers
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingListingId && (
        <EditListingModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingListingId(null)
          }}
          listingId={editingListingId}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

export default SellerListingsPage
