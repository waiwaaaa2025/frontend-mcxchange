import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Unlock,
  Coins,
  Shield,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Hash
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import api from '../services/api'
import IpLookupPanel from '../components/admin/IpLookupPanel'

interface ActivityItem {
  id: string
  activityType: 'UNLOCK' | 'CREDIT' | 'ADMIN_ACTION'
  timestamp: string
  userId?: string
  userName?: string
  userEmail?: string
  listingId?: string
  mcNumber?: string
  listingTitle?: string
  location?: string
  creditsUsed?: number
  description?: string
  // Credit-specific
  creditType?: string
  amount?: number
  balance?: number
  // Admin action-specific
  actionType?: string
  targetType?: string
  targetId?: string
  adminId?: string
  adminName?: string
  adminEmail?: string
  targetUserName?: string
  targetUserEmail?: string
  reason?: string
  metadata?: any
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  totalUnlocks: number
  totalCredits: number
  totalAdminActions: number
}

const activityTypeOptions = [
  { value: 'all', label: 'All Activities' },
  { value: 'unlocks', label: 'MC Unlocks' },
  { value: 'credits', label: 'Credit Transactions' },
  { value: 'admin_actions', label: 'Admin Actions' },
]

const creditTypeOptions = [
  { value: '', label: 'All Credit Types' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'USAGE', label: 'Usage' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'EXPIRED', label: 'Expired' },
]

const adminActionOptions = [
  { value: '', label: 'All Admin Actions' },
  { value: 'APPROVE_LISTING', label: 'Approve Listing' },
  { value: 'REJECT_LISTING', label: 'Reject Listing' },
  { value: 'BLOCK_USER', label: 'Block User' },
  { value: 'UNBLOCK_USER', label: 'Unblock User' },
  { value: 'ADD_CREDITS', label: 'Add Credits' },
  { value: 'REMOVE_CREDITS', label: 'Remove Credits' },
  { value: 'VERIFY_SELLER', label: 'Verify Seller' },
  { value: 'APPROVE_OFFER', label: 'Approve Offer' },
  { value: 'REJECT_OFFER', label: 'Reject Offer' },
  { value: 'CREATE_USER', label: 'Create User' },
  { value: 'CREATE_LISTING', label: 'Create Listing' },
  { value: 'UPDATE_LISTING', label: 'Update Listing' },
]

const AdminActivityLogPage = () => {
  // Filter state
  const [activityType, setActivityType] = useState('all')
  const [searchUser, setSearchUser] = useState('')
  const [searchMC, setSearchMC] = useState('')
  const [actionType, setActionType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Data state
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [stats, setStats] = useState<Stats>({ totalUnlocks: 0, totalCredits: 0, totalAdminActions: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch activities
  const fetchActivities = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getActivityLog({
        type: activityType,
        userId: searchUser || undefined,
        mcNumber: searchMC || undefined,
        actionType: actionType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 50,
      })

      if (response.data) {
        setActivities(response.data.activities || [])
        setPagination(response.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
        setStats(response.data.stats || { totalUnlocks: 0, totalCredits: 0, totalAdminActions: 0 })
      }
    } catch (err: any) {
      console.error('Failed to fetch activity log:', err)
      setError(err.message || 'Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }, [activityType, searchUser, searchMC, actionType, dateFrom, dateTo])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleSearch = () => {
    fetchActivities(1)
  }

  const handleClearFilters = () => {
    setActivityType('all')
    setSearchUser('')
    setSearchMC('')
    setActionType('')
    setDateFrom('')
    setDateTo('')
  }

  const handlePageChange = (newPage: number) => {
    fetchActivities(newPage)
  }

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.activityType) {
      case 'UNLOCK':
        return <Unlock className="w-5 h-5 text-purple-500" />
      case 'CREDIT':
        if (activity.amount && activity.amount > 0) {
          return <ArrowUpCircle className="w-5 h-5 text-green-500" />
        }
        return <ArrowDownCircle className="w-5 h-5 text-red-500" />
      case 'ADMIN_ACTION':
        return <Shield className="w-5 h-5 text-blue-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getActivityColor = (activity: ActivityItem) => {
    switch (activity.activityType) {
      case 'UNLOCK':
        return 'border-l-purple-500 bg-purple-50'
      case 'CREDIT':
        if (activity.amount && activity.amount > 0) {
          return 'border-l-green-500 bg-green-50'
        }
        return 'border-l-red-500 bg-red-50'
      case 'ADMIN_ACTION':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Type', 'User', 'MC Number', 'Description', 'Amount', 'Details']
    const rows = activities.map(a => [
      formatDate(a.timestamp),
      a.activityType,
      a.userName || a.adminName || '',
      a.mcNumber || '',
      a.description || '',
      a.amount?.toString() || a.creditsUsed?.toString() || '',
      a.reason || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 mt-1">
            Track all platform activity - MC unlocks, credit transactions, and admin actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchActivities(pagination.page)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={activities.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <Unlock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600">MC Unlocks</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalUnlocks}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600">Credit Transactions</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalCredits}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Admin Actions</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalAdminActions}</p>
            </div>
          </div>
        </Card>
      </div>

      <IpLookupPanel />

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Main filter row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                label="Activity Type"
                options={activityTypeOptions}
              />
            </div>

            <div className="flex-1">
              <Input
                placeholder="Search by user name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                icon={<User className="w-4 h-4" />}
                label="User"
              />
            </div>

            <div className="flex-1">
              <Input
                placeholder="Search by MC number..."
                value={searchMC}
                onChange={(e) => setSearchMC(e.target.value)}
                icon={<Hash className="w-4 h-4" />}
                label="MC Number"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {activityType === 'credits' ? (
                      creditTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))
                    ) : activityType === 'admin_actions' ? (
                      adminActionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="">All Action Types</option>
                        <optgroup label="Credit Types">
                          {creditTypeOptions.slice(1).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Admin Actions">
                          {adminActionOptions.slice(1).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Activity List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No activity found matching your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-l-4 rounded-lg p-4 ${getActivityColor(activity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          {/* User info */}
                          {activity.userName && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {activity.userName}
                              {activity.userEmail && (
                                <span className="text-gray-400">({activity.userEmail})</span>
                              )}
                            </span>
                          )}

                          {/* Admin info for admin actions */}
                          {activity.activityType === 'ADMIN_ACTION' && activity.adminName && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-4 h-4 text-blue-500" />
                              by {activity.adminName}
                            </span>
                          )}

                          {/* MC Number */}
                          {activity.mcNumber && (
                            <span className="flex items-center gap-1 font-medium text-purple-600">
                              <Hash className="w-4 h-4" />
                              MC {activity.mcNumber}
                            </span>
                          )}

                          {/* Listing ID for unlocks - helps identify duplicate listings */}
                          {activity.activityType === 'UNLOCK' && activity.listingId && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              (Listing: {activity.listingId.slice(0, 8)}...)
                            </span>
                          )}

                          {/* Location */}
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {activity.location}
                            </span>
                          )}

                          {/* Timestamp */}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>

                        {/* Additional details */}
                        {activity.reason && (
                          <p className="mt-2 text-sm text-gray-500 italic">
                            Reason: {activity.reason}
                          </p>
                        )}

                        {/* Target user for admin actions */}
                        {activity.targetUserName && (
                          <p className="mt-1 text-sm text-gray-500">
                            Target: {activity.targetUserName} ({activity.targetUserEmail})
                          </p>
                        )}
                      </div>

                      {/* Credit amount badge */}
                      <div className="flex-shrink-0">
                        {activity.activityType === 'UNLOCK' && activity.creditsUsed && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                            <Coins className="w-4 h-4" />
                            -{activity.creditsUsed} credit{activity.creditsUsed > 1 ? 's' : ''}
                          </span>
                        )}

                        {activity.activityType === 'CREDIT' && activity.amount !== undefined && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            activity.amount > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            <Coins className="w-4 h-4" />
                            {activity.amount > 0 ? '+' : ''}{activity.amount}
                            {activity.balance !== undefined && (
                              <span className="text-gray-500 ml-1">(bal: {activity.balance})</span>
                            )}
                          </span>
                        )}

                        {activity.activityType === 'ADMIN_ACTION' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                            {activity.actionType?.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminActivityLogPage
