import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Crown,
  Mail,
  Phone,
  MessageSquare,
  Search,
  Shield,
  ShieldOff,
  Ban,
  Eye,
  Calendar,
  ShoppingCart,
  Package,
  Loader2,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

interface PendingListing {
  id: string
  mcNumber: string
  title: string
  description: string
  price: number
  yearsActive: number
  fleetSize: number
  safetyRating: string
  insuranceStatus: string
  status: 'pending-verification'
  submittedAt: string
  seller: {
    id: string
    name: string
    email: string
    trustScore: number
    verified: boolean
  }
}

// Dashboard stats interface
interface DashboardStats {
  pendingListings: number
  activeListings: number
  totalListings: number
  totalUsers: number
  activeUsers: number
  totalSellers: number
  totalBuyers: number
  pendingOffers: number
  totalOffers: number
  totalTransactions: number
  completedTransactions: number
  totalRevenue: number
  monthlyRevenue: number
  approvedToday?: number
  premiumRequests?: number
  reportedItems?: number
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pending' | 'premium' | 'outreach' | 'reported' | 'users'>('pending')

  // API data state
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Subscription analytics (live from Stripe)
  type SubscriptionBucket = {
    plan: string
    interval: 'monthly' | 'yearly' | 'unknown'
    status: string
    count: number
    mrr: number
  }
  type SubscriptionAnalytics = {
    byPlan: SubscriptionBucket[]
    totals: Record<string, number>
    totalSubscriptions: number
    mrrCents: number
    mrrDollars: number
    unmappedPriceIds: Array<{
      priceId: string
      count: number
      productName: string | null
      nickname: string | null
      unitAmount: number | null
      currency: string | null
      interval: string | null
    }>
  }
  const [subAnalytics, setSubAnalytics] = useState<SubscriptionAnalytics | null>(null)
  const [subAnalyticsLoading, setSubAnalyticsLoading] = useState(true)
  const [subAnalyticsError, setSubAnalyticsError] = useState<string | null>(null)

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true)
        const response = await api.getAdminDashboard()
        if (response.success && response.data) {
          setDashboardStats(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  // Fetch subscription analytics from Stripe (via admin endpoint)
  useEffect(() => {
    const fetchSubAnalytics = async () => {
      try {
        setSubAnalyticsLoading(true)
        setSubAnalyticsError(null)
        const response = await api.getSubscriptionAnalytics()
        if (response.success && response.data) {
          setSubAnalytics(response.data)
        } else {
          setSubAnalyticsError('Failed to load subscription analytics')
        }
      } catch (err: any) {
        console.error('Failed to fetch subscription analytics:', err)
        setSubAnalyticsError(err?.message || 'Failed to load subscription analytics')
      } finally {
        setSubAnalyticsLoading(false)
      }
    }

    fetchSubAnalytics()
  }, [])

  // Fetch pending listings from API
  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch pending listings from admin endpoint
        const response = await api.getAdminPendingListings()

        // Transform listings
        const transformed: PendingListing[] = (response.data || [])
          .slice(0, 3) // Limit to 3 for dashboard
          .map((listing: any) => ({
            id: listing.id,
            mcNumber: listing.mcNumber,
            title: listing.title || `Trucking Business #${listing.mcNumber}`,
            description: listing.description || '',
            price: listing.price || listing.askingPrice || 0,
            yearsActive: listing.yearsActive || 0,
            fleetSize: listing.fleetSize || 0,
            safetyRating: listing.safetyRating || 'satisfactory',
            insuranceStatus: listing.insuranceStatus || 'active',
            status: 'pending-verification' as const,
            submittedAt: listing.createdAt ? formatTimeAgo(listing.createdAt) : 'Recently',
            seller: {
              id: listing.seller?.id || listing.sellerId,
              name: listing.seller?.name || 'Unknown Seller',
              email: listing.seller?.email || '',
              trustScore: listing.seller?.trustScore || 70,
              verified: listing.seller?.verified || false
            }
          }))

        setPendingListings(transformed)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
        setError('Failed to load pending listings')
        setPendingListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchPendingListings()
  }, [])

  // Helper to format time ago
  const formatTimeAgo = (dateStr: string) => {
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
    {
      icon: Clock,
      label: 'Pending Review',
      value: statsLoading ? '...' : String(dashboardStats?.pendingListings ?? 0),
      change: `${dashboardStats?.activeListings ?? 0} active listings`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/admin/pending'
    },
    {
      icon: Package,
      label: 'Total Listings',
      value: statsLoading ? '...' : String(dashboardStats?.totalListings ?? 0),
      change: `${dashboardStats?.activeListings ?? 0} active`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/listings'
    },
    {
      icon: ShoppingCart,
      label: 'Total Offers',
      value: statsLoading ? '...' : String(dashboardStats?.totalOffers ?? 0),
      change: `${dashboardStats?.pendingOffers ?? 0} pending`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/admin/offers'
    },
    {
      icon: CheckCircle,
      label: 'Transactions',
      value: statsLoading ? '...' : String(dashboardStats?.completedTransactions ?? 0),
      change: `${dashboardStats?.totalTransactions ?? 0} total`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/admin/transactions'
    },
    {
      icon: Users,
      label: 'Total Users',
      value: statsLoading ? '...' : String(dashboardStats?.totalUsers ?? 0),
      change: `${dashboardStats?.totalSellers ?? 0} sellers, ${dashboardStats?.totalBuyers ?? 0} buyers`,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      link: '/admin/users'
    }
  ]


  const reportedItems = [
    {
      id: '1',
      type: 'listing',
      mcNumber: '123456',
      reason: 'Suspicious documents',
      reportedBy: 'John Doe',
      reportedAt: '1 day ago',
      severity: 'high'
    },
    {
      id: '2',
      type: 'user',
      userName: 'Fake Seller',
      reason: 'Multiple fake listings',
      reportedBy: 'Jane Smith',
      reportedAt: '3 days ago',
      severity: 'critical'
    }
  ]

  const premiumRequests = [
    {
      id: '1',
      mcNumber: '789012',
      buyerName: 'Michael Johnson',
      buyerEmail: 'michael@example.com',
      buyerPhone: '(555) 123-4567',
      sellerName: 'Premium Seller Inc',
      message: 'Interested in this premium MC. Looking for Amazon relay active authority.',
      requestedAt: '2 hours ago',
      status: 'pending'
    },
    {
      id: '2',
      mcNumber: '345678',
      buyerName: 'Sarah Williams',
      buyerEmail: 'sarah@trucking.com',
      buyerPhone: '(555) 987-6543',
      sellerName: 'Elite MC Authority',
      message: 'Would like to discuss pricing and transfer process for this premium listing.',
      requestedAt: '5 hours ago',
      status: 'pending'
    },
    {
      id: '3',
      mcNumber: '901234',
      buyerName: 'David Chen',
      buyerEmail: 'david.chen@logistics.com',
      buyerPhone: '(555) 456-7890',
      sellerName: 'Top Tier Transport',
      message: 'Serious buyer, ready to move forward. Please contact me ASAP.',
      requestedAt: '1 day ago',
      status: 'contacted'
    }
  ]

  // User Management State
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked' | 'sellers' | 'buyers'>('all')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const mockUsers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@trucking.com',
      phone: '(555) 123-4567',
      role: 'seller' as const,
      status: 'active' as const,
      verified: true,
      trustScore: 92,
      memberSince: 'Jan 2023',
      totalListings: 5,
      totalSales: 3,
      totalPurchases: 0,
      lastActive: '2 hours ago',
      avatar: 'JS'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@logistics.com',
      phone: '(555) 234-5678',
      role: 'buyer' as const,
      status: 'active' as const,
      verified: true,
      trustScore: 88,
      memberSince: 'Mar 2023',
      totalListings: 0,
      totalSales: 0,
      totalPurchases: 2,
      lastActive: '5 hours ago',
      avatar: 'SJ'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.w@carrier.net',
      phone: '(555) 345-6789',
      role: 'seller' as const,
      status: 'blocked' as const,
      verified: false,
      trustScore: 35,
      memberSince: 'Jun 2023',
      totalListings: 2,
      totalSales: 0,
      totalPurchases: 0,
      lastActive: '3 days ago',
      avatar: 'MW'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@freight.com',
      phone: '(555) 456-7890',
      role: 'buyer' as const,
      status: 'active' as const,
      verified: true,
      trustScore: 95,
      memberSince: 'Feb 2023',
      totalListings: 0,
      totalSales: 0,
      totalPurchases: 4,
      lastActive: '1 hour ago',
      avatar: 'ED'
    },
    {
      id: '5',
      name: 'Robert Brown',
      email: 'r.brown@transport.com',
      phone: '(555) 567-8901',
      role: 'seller' as const,
      status: 'active' as const,
      verified: true,
      trustScore: 78,
      memberSince: 'Apr 2023',
      totalListings: 8,
      totalSales: 6,
      totalPurchases: 1,
      lastActive: '30 mins ago',
      avatar: 'RB'
    },
    {
      id: '6',
      name: 'Lisa Anderson',
      email: 'lisa.a@mcauthority.com',
      phone: '(555) 678-9012',
      role: 'seller' as const,
      status: 'inactive' as const,
      verified: true,
      trustScore: 65,
      memberSince: 'Aug 2023',
      totalListings: 1,
      totalSales: 1,
      totalPurchases: 0,
      lastActive: '2 weeks ago',
      avatar: 'LA'
    }
  ]

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearch.toLowerCase())

    let matchesFilter = true
    if (userFilter === 'active') matchesFilter = user.status === 'active'
    else if (userFilter === 'blocked') matchesFilter = user.status === 'blocked'
    else if (userFilter === 'sellers') matchesFilter = user.role === 'seller'
    else if (userFilter === 'buyers') matchesFilter = user.role === 'buyer'

    return matchesSearch && matchesFilter
  })


  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Platform Overview</h2>
          <p className="text-gray-500">Monitor and manage Domilea activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                hover={!!stat.link}
                className={stat.link ? 'cursor-pointer' : ''}
                onClick={() => stat.link && navigate(stat.link)}
              >
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

        {/* Subscription Mix — live from Stripe */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subscription Mix</h3>
                <p className="text-xs text-gray-500">Live from Stripe — who's actually paying for what</p>
              </div>
            </div>
            {subAnalytics && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  ${subAnalytics.mrrDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })} MRR
                </div>
                <div className="text-xs text-gray-500">{subAnalytics.totalSubscriptions} total subs</div>
              </div>
            )}
          </div>

          {subAnalyticsLoading && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading subscription data from Stripe...
            </div>
          )}

          {subAnalyticsError && !subAnalyticsLoading && (
            <div className="py-4 px-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {subAnalyticsError}
            </div>
          )}

          {subAnalytics && !subAnalyticsLoading && (() => {
            // Aggregate by plan (combining monthly/yearly/status) for the main ranking
            const perPlan = new Map<string, { plan: string; active: number; canceled: number; other: number; mrr: number }>()
            for (const b of subAnalytics.byPlan) {
              const row = perPlan.get(b.plan) || { plan: b.plan, active: 0, canceled: 0, other: 0, mrr: 0 }
              if (b.status === 'active' || b.status === 'trialing') {
                row.active += b.count
                row.mrr += b.mrr
              } else if (b.status === 'canceled') {
                row.canceled += b.count
              } else {
                row.other += b.count
              }
              perPlan.set(b.plan, row)
            }
            const rows = Array.from(perPlan.values()).sort((a, b) => b.active - a.active)
            const totalActive = rows.reduce((s, r) => s + r.active, 0)

            if (rows.length === 0) {
              return (
                <div className="py-6 text-center text-sm text-gray-500">
                  No subscriptions found in Stripe yet.
                </div>
              )
            }

            return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                        <th className="py-2 pr-4 font-medium">Plan</th>
                        <th className="py-2 px-4 font-medium">Active</th>
                        <th className="py-2 px-4 font-medium">% of Active</th>
                        <th className="py-2 px-4 font-medium">Canceled</th>
                        <th className="py-2 px-4 font-medium">Other</th>
                        <th className="py-2 pl-4 font-medium text-right">MRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => {
                        const pct = totalActive > 0 ? (row.active / totalActive) * 100 : 0
                        const mostPopular = idx === 0 && row.active > 0
                        return (
                          <tr key={row.plan} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 capitalize">
                                  {row.plan.replace(/_/g, ' ').toLowerCase()}
                                </span>
                                {mostPopular && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                    Most popular
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900 font-semibold">{row.active}</td>
                            <td className="py-3 px-4 text-gray-600">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs">{pct.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-500">{row.canceled}</td>
                            <td className="py-3 px-4 text-gray-500">{row.other}</td>
                            <td className="py-3 pl-4 text-right text-gray-900 font-medium">
                              ${(row.mrr / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Status totals */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  {Object.entries(subAnalytics.totals).map(([status, count]) => (
                    <span key={status} className="px-2 py-1 rounded-md bg-gray-50 border border-gray-200">
                      <span className="font-medium text-gray-700 capitalize">{status}:</span> {count}
                    </span>
                  ))}
                </div>

                {/* Unmapped price IDs warning */}
                {subAnalytics.unmappedPriceIds.length > 0 && (
                  <div className="mt-4 py-3 px-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <div className="font-medium mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {subAnalytics.unmappedPriceIds.length} unmapped Stripe price{subAnalytics.unmappedPriceIds.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-amber-700">
                      These subs point at price IDs not configured in env vars (legacy or stale). Counts shown under "unknown" plan.
                      <ul className="mt-1 space-y-1">
                        {subAnalytics.unmappedPriceIds.map((u) => {
                          const label = u.productName || u.nickname || 'Unknown product'
                          const amount = u.unitAmount != null ? `$${(u.unitAmount / 100).toFixed(2)}` : null
                          const interval = u.interval ? `/${u.interval}` : (u.unitAmount != null ? ' one-time' : '')
                          const priceLabel = amount ? `${amount}${interval}` : null
                          return (
                            <li key={u.priceId} className="flex flex-wrap items-baseline gap-x-2">
                              <span className="font-medium text-amber-900">{label}</span>
                              {priceLabel && <span className="text-amber-700">{priceLabel}</span>}
                              <span className="text-amber-700">— {u.count} sub{u.count > 1 ? 's' : ''}</span>
                              <span className="font-mono text-[11px] text-amber-600">{u.priceId}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'premium'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            Premium Requests
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'outreach'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            Broker Outreach
          </button>
          <button
            onClick={() => setActiveTab('reported')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'reported'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Reported Items
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            User Management
          </button>
        </div>

        {/* Pending Review Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Listings Pending Verification</h2>

            {loading ? (
              <Card>
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Loading pending listings...</p>
                </div>
              </Card>
            ) : error ? (
              <Card>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error loading listings</h3>
                  <p className="text-gray-500">{error}</p>
                </div>
              </Card>
            ) : pendingListings.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-500">No listings pending verification</p>
                </div>
              </Card>
            ) : pendingListings.map((listing) => (
              <Card key={listing.id} hover={true} className="cursor-pointer">
                <div
                  onClick={() => navigate(`/admin/review/${listing.id}`)}
                  className="flex items-start justify-between mb-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 hover:text-secondary-600 transition-colors">MC #{listing.mcNumber}</h3>
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{listing.title}</p>
                    <p className="text-sm text-gray-500">{listing.description}</p>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-secondary-600">
                      ${(listing.price ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Submitted {listing.submittedAt}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Years Active</div>
                    <div className="font-semibold text-gray-900">{listing.yearsActive}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Fleet Size</div>
                    <div className="font-semibold text-gray-900">{listing.fleetSize}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Safety</div>
                    <div className="font-semibold text-gray-900 text-xs capitalize">
                      {listing.safetyRating.replace('-', ' ')}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Insurance</div>
                    <div className="font-semibold text-gray-900 text-xs capitalize">
                      {listing.insuranceStatus}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">Seller Information</div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                      <span className="font-bold text-secondary-600">
                        {listing.seller.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{listing.seller.name}</div>
                      <div className="text-xs text-gray-500">{listing.seller.email}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <p className="text-sm text-secondary-600 font-medium">Click to review listing →</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Premium Requests Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Premium Contact Requests</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/admin/premium-requests')}>
                  View All Requests
                </Button>
              </div>
            </div>

            {premiumRequests.map((request) => (
              <Card key={request.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">PREMIUM</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">MC #{request.mcNumber}</h3>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                          request.status === 'pending'
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {request.status === 'pending' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {request.status === 'pending' ? 'Pending' : 'Contacted'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      Seller: <span className="text-gray-700">{request.sellerName}</span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Buyer Information</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{request.buyerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-secondary-600">{request.buyerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{request.buyerPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-gray-600">{request.message}</p>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-500">
                      Requested {request.requestedAt}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button fullWidth variant="outline">
                    View Listing
                  </Button>
                  {request.status === 'pending' ? (
                    <Button fullWidth>Mark as Contacted</Button>
                  ) : (
                    <Button fullWidth variant="ghost">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Contacted
                    </Button>
                  )}
                  <Button fullWidth variant="ghost">
                    Dismiss
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Broker Outreach Tab */}
        {activeTab === 'outreach' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Broker Outreach</h2>
              <Button onClick={() => navigate('/admin/broker-outreach')}>
                Open Outreach Queue
              </Button>
            </div>
            <Card>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Pending Insurance Leads — Seller Outreach Requests
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Buyers using the Pending Insurance Leads tool can ask Domilea to contact a
                    carrier owner on their behalf. Those requests land in the outreach queue, where
                    staff can update status and notes through the full broker workflow.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/admin/broker-outreach')}>
                    Manage Broker Outreach Requests
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Reported Items Tab */}
        {activeTab === 'reported' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reported Items</h2>

            {reportedItems.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {item.type === 'listing' ? `MC #${item.mcNumber}` : item.userName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                          item.severity === 'critical'
                            ? 'bg-red-50 border border-red-200 text-red-700'
                            : 'bg-amber-50 border border-amber-200 text-amber-700'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {item.severity}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-gray-500">Reason:</span>
                        <span className="text-gray-700">{item.reason}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500">Reported by:</span>
                        <span className="text-gray-700">{item.reportedBy}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500">Time:</span>
                        <span className="text-gray-700">{item.reportedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button fullWidth variant="outline">
                    View Details
                  </Button>
                  <Button fullWidth>Take Action</Button>
                  <Button fullWidth variant="ghost">
                    Dismiss
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="text-sm text-gray-500">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'blocked', 'sellers', 'buyers'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setUserFilter(filter)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                        userFilter === filter
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} hover className="cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      user.status === 'blocked'
                        ? 'bg-red-100 text-red-600'
                        : user.status === 'inactive'
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-secondary-100 text-secondary-600'
                    }`}>
                      {user.avatar}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>

                        {/* Role Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          user.role === 'seller'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {user.role === 'seller' ? 'Seller' : 'Buyer'}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'blocked'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          {user.status === 'blocked' && <Ban className="w-3 h-3" />}
                          {user.status === 'active' && <CheckCircle className="w-3 h-3" />}
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>

                        {/* Verified Badge */}
                        {user.verified && (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{user.phone}</span>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Member since {user.memberSince}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last active {user.lastActive}</span>
                        </div>
                        {user.role === 'seller' && (
                          <>
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              <span>{user.totalListings} listings</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3" />
                              <span>{user.totalSales} sales</span>
                            </div>
                          </>
                        )}
                        {user.role === 'buyer' && (
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            <span>{user.totalPurchases} purchases</span>
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.status === 'blocked' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-200"
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Block
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded User Profile */}
                  {selectedUser === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* User Details */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Account Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">User ID:</span>
                              <span className="font-mono text-gray-700">{user.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Role:</span>
                              <span className="text-gray-700 capitalize">{user.role}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <span className={`capitalize ${
                                user.status === 'active' ? 'text-emerald-600' :
                                user.status === 'blocked' ? 'text-red-600' : 'text-gray-400'
                              }`}>{user.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Trust Score:</span>
                              <span className={`font-semibold ${
                                user.trustScore >= 80 ? 'text-emerald-600' :
                                user.trustScore >= 50 ? 'text-amber-600' : 'text-red-600'
                              }`}>{user.trustScore}/100</span>
                            </div>
                          </div>
                        </div>

                        {/* Activity Stats */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Listings:</span>
                              <span className="text-gray-700">{user.totalListings}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Sales:</span>
                              <span className="text-gray-700">{user.totalSales}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Purchases:</span>
                              <span className="text-gray-700">{user.totalPurchases}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Last Active:</span>
                              <span className="text-gray-700">{user.lastActive}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Full Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-1" />
                          Send Message
                        </Button>
                        {user.status === 'active' ? (
                          <>
                            <Button variant="ghost" size="sm" className="text-amber-600 hover:bg-amber-50">
                              <ShieldOff className="w-4 h-4 mr-1" />
                              Deactivate
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                              <Ban className="w-4 h-4 mr-1" />
                              Block User
                            </Button>
                          </>
                        ) : user.status === 'blocked' ? (
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50">
                            <Shield className="w-4 h-4 mr-1" />
                            Unblock User
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <Card>
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No users found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
