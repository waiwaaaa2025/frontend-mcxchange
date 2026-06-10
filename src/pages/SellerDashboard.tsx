import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Eye,
  MessageSquare,
  Package,
  CheckCircle,
  Clock,
  Loader2,
  Send,
  User,
  Inbox,
  Pencil,
  Trash2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import MCCard from '../components/MCCard'
import api from '../services/api'
import { MCListing } from '../types'
import CarrierPulseOnboardingModal from '../components/CarrierPulseOnboardingModal'
import MCPricingEstimator from '../components/MCPricingEstimator'
import EditListingModal from '../components/EditListingModal'

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
  }
  buyer?: {
    id: string
    name: string
  }
}

interface DashboardStats {
  listings: {
    total: number
    active: number
    pending: number
    sold: number
  }
  offers: {
    total: number
    pending: number
    accepted: number
  }
  totalViews: number
  totalEarnings: number
}

const SellerDashboard = () => {
  const { user } = useAuth()

  // Carrier Pulse onboarding modal - show on first two visits if no listings yet
  const [showCarrierPulse, setShowCarrierPulse] = useState(() => {
    const dismissCount = parseInt(localStorage.getItem('mcx_carrier_pulse_dismiss_count') || '0', 10)
    return dismissCount < 2
  })

  // API data state
  const [myListings, setMyListings] = useState<MCListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit listing modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingListingId, setEditingListingId] = useState('')

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteListing = async (listingId: string) => {
    setDeleting(true)
    try {
      await api.deleteListing(listingId)
      setDeleteConfirmId(null)
      setMyListings(prev => prev.filter(l => l.id !== listingId))
    } catch (err: any) {
      console.error('Failed to delete listing:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Stats and offers state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentOffers, setRecentOffers] = useState<SellerOffer[]>([])
  const [offersLoading, setOffersLoading] = useState(true)

  // Fetch seller's listings from API
  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getSellerListings({ limit: 2 })

        const transformedListings: MCListing[] = (response.data || [])
          .map((listing: any) => ({
            id: listing.id,
            mcNumber: listing.mcNumber,
            sellerId: listing.sellerId || user?.id || '',
            title: listing.title || `MC Authority #${listing.mcNumber}`,
            description: listing.description || '',
            price: listing.askingPrice || listing.price || 0,
            yearsActive: listing.yearsActive || 0,
            fleetSize: listing.fleetSize || 0,
            operationType: listing.operationType || [],
            safetyRating: listing.safetyRating || 'satisfactory',
            insuranceStatus: listing.insuranceStatus || 'active',
            verified: listing.verified || false,
            isPremium: listing.isPremium || false,
            isVip: listing.isVip || false,
            trustScore: listing.trustScore || 70,
            trustLevel: 'medium',
            verificationBadges: listing.verificationBadges || [],
            state: listing.state || '',
            amazonStatus: listing.amazonStatus || 'none',
            amazonRelayScore: listing.amazonRelayScore || null,
            highwaySetup: listing.highwaySetup || false,
            sellingWithEmail: listing.sellingWithEmail || false,
            sellingWithPhone: listing.sellingWithPhone || false,
            documents: listing.documents || [],
            status: listing.status || 'active',
            visibility: listing.visibility || 'public',
            views: listing.views || 0,
            saves: listing.saves || 0,
            createdAt: new Date(listing.createdAt),
            updatedAt: new Date(listing.updatedAt || listing.createdAt),
            seller: {
              id: user?.id || listing.sellerId,
              name: user?.name || 'Unknown Seller',
              email: user?.email || '',
              role: 'seller' as const,
              verified: user?.verified || false,
              trustScore: user?.trustScore || 70,
              memberSince: user?.memberSince || new Date(),
              completedDeals: user?.completedDeals || 0,
              reviews: [],
              identityVerified: user?.identityVerified || false
            }
          }))

        setMyListings(transformedListings)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
        setError('Failed to load your listings')
        setMyListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchMyListings()
  }, [user?.id, user?.name, user?.email, user?.verified, user?.trustScore, user?.memberSince])

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.getSellerDashboard()
        if (response.success && response.data) {
          setDashboardStats(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      }
    }

    fetchDashboardStats()
  }, [])

  // Fetch seller's offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setOffersLoading(true)
        const response = await api.getSellerOffers({ limit: 5 })
        if (response.success && response.data) {
          setRecentOffers(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch offers:', err)
      } finally {
        setOffersLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const stats = [
    { icon: Package, label: 'Active Listings', value: String(dashboardStats?.listings?.active ?? 0), change: `${dashboardStats?.listings?.pending ?? 0} pending review`, color: 'text-secondary-600', bgColor: 'bg-secondary-50' },
    { icon: Eye, label: 'Total Views', value: (dashboardStats?.totalViews ?? 0).toLocaleString(), change: 'All time', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { icon: MessageSquare, label: 'Pending Offers', value: String(dashboardStats?.offers?.pending ?? 0), change: `${dashboardStats?.offers?.total ?? 0} total offers`, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ]

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {user?.name}!</h2>
            <p className="text-gray-500">Here's what's happening with your listings today.</p>
          </div>
          <Link to="/seller/carrier-pulse" className="w-full sm:w-auto">
            <Button size="lg" fullWidth className="sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.change}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pricing Estimator + Listings/Offers Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Listings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pricing Estimator */}
            <MCPricingEstimator />
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
              <Link to="/seller/listings" className="text-secondary-600 hover:text-secondary-700 text-sm font-medium">View All</Link>
            </div>

            {loading ? (
              <Card>
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Loading your listings...</p>
                </div>
              </Card>
            ) : error ? (
              <Card>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error loading listings</h3>
                  <p className="text-gray-500 mb-6">{error}</p>
                </div>
              </Card>
            ) : myListings.length > 0 ? (
              <div className="space-y-4">
                {myListings.map((listing) => (
                  <div key={listing.id} className="relative">
                    <MCCard listing={listing} />
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingListingId(listing.id)
                          setEditModalOpen(true)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      {deleteConfirmId === listing.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            disabled={deleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 border border-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600 shadow-sm transition-colors disabled:opacity-50"
                          >
                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(listing.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h3>
                  <p className="text-gray-500 mb-6">Create your first listing to start selling</p>
                  <Link to="/seller/carrier-pulse">
                    <Button><Plus className="w-4 h-4 mr-2" />Create Listing</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Recent Offers */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Offers</h2>
            <Card>
              {offersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                  <p className="text-gray-500 mt-2">Loading offers...</p>
                </div>
              ) : recentOffers.length > 0 ? (
                <div className="space-y-4">
                  {recentOffers.map((offer) => (
                    <div key={offer.id} className="rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">MC #{offer.listing?.mcNumber || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{offer.buyer?.name || 'Unknown Buyer'}</div>
                        </div>
                        {offer.status === 'PENDING' ? (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : offer.status === 'ACCEPTED' ? (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Accepted
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 flex items-center gap-1">
                            {offer.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-secondary-600 font-bold">${(offer.amount ?? 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{formatRelativeTime(offer.createdAt)}</div>
                      </div>
                      {offer.status === 'PENDING' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" fullWidth>Accept</Button>
                          <Button size="sm" fullWidth variant="outline">Decline</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No offers yet</p>
                  <p className="text-sm text-gray-400">Offers from buyers will appear here</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/seller/offers" className="text-secondary-600 hover:text-secondary-700 text-sm font-medium">View All Offers →</Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Messages — Seller ↔ Admin */}
        <SellerAdminMessages />
      </div>

      {/* Carrier Pulse Onboarding Modal — shows first 2 visits until seller has listings */}
      <CarrierPulseOnboardingModal
        isOpen={showCarrierPulse && myListings.length === 0 && !loading}
        onClose={() => {
          setShowCarrierPulse(false)
          const prev = parseInt(localStorage.getItem('mcx_carrier_pulse_dismiss_count') || '0', 10)
          localStorage.setItem('mcx_carrier_pulse_dismiss_count', String(prev + 1))
        }}
      />

      <EditListingModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        listingId={editingListingId}
        onSuccess={() => {
          // Re-fetch listings after edit
          api.getSellerListings({ limit: 2 }).then(response => {
            const transformed = (response.data || []).map((l: any) => ({
              id: l.id, mcNumber: l.mcNumber, sellerId: l.sellerId || user?.id || '',
              title: l.title || `MC Authority #${l.mcNumber}`, description: l.description || '',
              price: l.askingPrice || l.price || 0, yearsActive: l.yearsActive || 0,
              fleetSize: l.fleetSize || 0, operationType: l.operationType || [],
              safetyRating: l.safetyRating || 'satisfactory', insuranceStatus: l.insuranceStatus || 'active',
              verified: l.verified || false, isPremium: l.isPremium || false, isVip: l.isVip || false,
              trustScore: l.trustScore || 50, trustLevel: 'medium',
              views: l.views || 0, saves: l.saves || 0, state: l.state || '',
              createdAt: new Date(l.createdAt), verificationBadges: [],
              amazonStatus: l.amazonStatus || 'none', amazonRelayScore: l.amazonRelayScore || null,
              highwaySetup: l.highwaySetup || false, sellingWithEmail: l.sellingWithEmail || false,
              sellingWithPhone: l.sellingWithPhone || false, documents: l.documents || [],
              status: l.status || 'active', visibility: l.visibility || 'public',
              updatedAt: new Date(l.updatedAt || l.createdAt),
              seller: { id: user?.id || l.sellerId, name: user?.name || '', email: user?.email || '',
                role: 'seller' as const, verified: user?.verified || false, trustScore: user?.trustScore || 50,
                memberSince: user?.memberSince || new Date(), completedDeals: 0, reviews: [], identityVerified: false },
            })) as MCListing[]
            setMyListings(transformed)
          }).catch(() => {})
        }}
      />
    </div>
  )
}

// ============================================================
// Inline messaging component — seller ↔ admin
// ============================================================
interface ConversationMsg {
  id: string
  senderId: string
  content: string
  createdAt: string
}

function SellerAdminMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ConversationMsg[]>([])
  const [adminId, setAdminId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.getMessageConversations()
        const convos = res.data || []
        if (convos.length > 0) {
          setAdminId(convos[0].participantId)
        }
      } catch {
        // No conversations yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!adminId) return
    const loadMessages = async () => {
      try {
        const res = await api.getMessageConversation(adminId, { limit: 50 })
        setMessages(res.data || [])
        api.markConversationAsRead(adminId).catch(() => {})
      } catch {
        setMessages([])
      }
    }
    loadMessages()
  }, [adminId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content) return

    setSending(true)
    try {
      if (adminId) {
        await api.sendMessage(adminId, content)
      } else {
        await api.sendInquiryToAdmin(undefined, content)
      }
      setNewMessage('')

      const convRes = await api.getMessageConversations()
      const convos = convRes.data || []
      if (!adminId && convos.length > 0) {
        setAdminId(convos[0].participantId)
      }

      const partnerId = adminId || convos[0]?.participantId
      if (partnerId) {
        const msgRes = await api.getMessageConversation(partnerId, { limit: 50 })
        setMessages(msgRes.data || [])
      }
    } catch {
      // Silently handle
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-secondary-600" />
        Messages
      </h2>

      <Card>
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
            <p className="text-gray-500 mt-2">Loading messages...</p>
          </div>
        ) : (
          <div>
            <div className="h-80 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50 p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Send a message to the Domilea team below</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-secondary-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'}`}>
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="w-3 h-3 text-secondary-500" />
                            <span className="text-xs font-semibold text-secondary-600">Domilea Support</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                disabled={sending}
              />
              <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SellerDashboard
