import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
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
import ReportedItemsPanel from '../components/admin/ReportedItemsPanel'

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
  const [activeTab, setActiveTab] = useState<'pending' | 'outreach' | 'reported'>('pending')
  const [openReports, setOpenReports] = useState(0)

  useEffect(() => {
    api.getAdminOpenReportCount().then((r) => setOpenReports(r.data?.count ?? 0)).catch(() => {})
  }, [])

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
    external?: boolean
  }
  type SubscriptionAnalytics = {
    byPlan: SubscriptionBucket[]
    totals: Record<string, number>
    totalSubscriptions: number
    mrrCents: number
    mrrDollars: number
    externalMrrDollars?: number
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
                {!!subAnalytics.externalMrrDollars && (
                  <div className="text-[11px] text-gray-400">
                    + ${subAnalytics.externalMrrDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })} external (not in MRR)
                  </div>
                )}
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
            const perPlan = new Map<string, { plan: string; active: number; canceled: number; other: number; mrr: number; external: boolean }>()
            for (const b of subAnalytics.byPlan) {
              const row = perPlan.get(b.plan) || { plan: b.plan, active: 0, canceled: 0, other: 0, mrr: 0, external: !!b.external }
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
            // External products (another business on the same Stripe account) sort last
            // and stay out of the Domilea share.
            const rows = Array.from(perPlan.values()).sort((a, b) => Number(a.external) - Number(b.external) || b.active - a.active)
            const totalActive = rows.reduce((s, r) => s + (r.external ? 0 : r.active), 0)

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
                        const pct = !row.external && totalActive > 0 ? (row.active / totalActive) * 100 : 0
                        const mostPopular = idx === 0 && row.active > 0
                        return (
                          <tr key={row.plan} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 capitalize">
                                  {row.plan.replace(/_/g, ' ').toLowerCase()}
                                </span>
                                {row.external && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                    External · not in MRR
                                  </span>
                                )}
                                {mostPopular && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                    Most popular
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900 font-semibold">{row.active}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {row.external ? <span className="text-xs text-gray-400">—</span> : (
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs">{pct.toFixed(0)}%</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-500">{row.canceled}</td>
                            <td className="py-3 px-4 text-gray-500">{row.other}</td>
                            <td className={`py-3 pl-4 text-right font-medium ${row.external ? 'text-gray-400' : 'text-gray-900'}`}>
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
            Reported Items{openReports > 0 ? ` (${openReports})` : ''}
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
            <ReportedItemsPanel onCountChange={setOpenReports} />
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminDashboard
