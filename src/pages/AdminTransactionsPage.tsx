import { useEffect, useMemo, useState } from 'react'
import {
  DollarSign,
  Search,
  RefreshCw,
  Calendar,
  User,
  Mail,
  Phone,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Receipt,
  CreditCard,
  MapPin,
  Globe,
  ExternalLink,
  Building2,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  UserCheck,
  Ban,
  Loader2,
  Send
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'
import { toast } from 'react-hot-toast'
import type { StripeTransaction } from '../types'

interface Transaction {
  id: string
  status: string
  agreedPrice?: number | string
  depositAmount?: number | string
  platformFee?: number | string | null
  finalPaymentAmount?: number | string | null
  depositPaidAt?: string | null
  finalPaidAt?: string | null
  depositPaymentMethod?: string | null
  finalPaymentMethod?: string | null
  createdAt: string
  updatedAt: string
  listing?: {
    id: string
    mcNumber: string
    title: string
  }
  buyer?: {
    id: string
    name: string
    email: string
  }
  seller?: {
    id: string
    name: string
    email: string
  }
}

const formatMoney = (value?: number | string | null) => {
  const amount = Number(value || 0)
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').toLowerCase()
}

// Stripe reports paid money as 'succeeded' (payment intents/charges) or 'paid' (checkout sessions).
// The Stripe tab only shows money that actually landed, so everything else is filtered out.
const isPaidStripeTransaction = (txn: StripeTransaction) =>
  ['succeeded', 'paid'].includes((txn.status || '').toLowerCase())

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-trust-high/20 text-trust-high">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      )
    case 'DISPUTED':
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
          <AlertTriangle className="w-3 h-3" />
          Disputed
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-400/20 text-yellow-400">
          <Clock className="w-3 h-3" />
          {formatStatus(status)}
        </span>
      )
  }
}

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stripe transactions state
  const [activeTab, setActiveTab] = useState<'platform' | 'stripe'>('stripe')
  const [stripeTransactions, setStripeTransactions] = useState<StripeTransaction[]>([])
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [stripeBalance, setStripeBalance] = useState<{ available: number; pending: number } | null>(null)
  const [stripeSearchQuery, setStripeSearchQuery] = useState('')
  const [selectedStripeTransaction, setSelectedStripeTransaction] = useState<string | null>(null)

  // Send emails state
  const [sendingEmailsFor, setSendingEmailsFor] = useState<string | null>(null)

  // Handle sending notification emails for a transaction
  const handleSendEmails = async (txnId: string) => {
    setSendingEmailsFor(txnId)
    try {
      const response = await api.adminSendTransactionEmails(txnId)
      if (response.success) {
        toast.success(response.message || 'Notification emails sent!')
      } else {
        toast.error('Failed to send emails')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification emails')
    } finally {
      setSendingEmailsFor(null)
    }
  }

  // Block user for mismatch state
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null)
  const [blockMessage, setBlockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Handle block user for mismatch
  const handleBlockUser = async (txn: StripeTransaction) => {
    if (!txn.matchedUser) {
      setBlockMessage({ type: 'error', text: 'No matched user found to block' })
      return
    }

    const cardholderName = txn.paymentMethod?.cardholderName || txn.billing.name || 'Unknown'
    const userName = txn.matchedUser.name

    if (!confirm(`Are you sure you want to block ${userName}?\n\nThis will:\n- Block their account immediately\n- Send them an email with a dispute link\n- Allow them to submit a dispute to restore their account in 24 hours\n\nReason: Cardholder name mismatch ("${cardholderName}" vs "${userName}")`)) {
      return
    }

    setBlockingUserId(txn.matchedUser.id)
    setBlockMessage(null)

    try {
      const response = await api.blockUserForMismatch({
        userId: txn.matchedUser.id,
        stripeTransactionId: txn.id,
        cardholderName,
        userName,
      })

      if (response.data.alreadyExists) {
        setBlockMessage({ type: 'error', text: 'User already has a pending dispute' })
      } else {
        setBlockMessage({
          type: 'success',
          text: `User ${userName} has been blocked. Dispute ID: ${response.data.dispute.id}`
        })
      }
    } catch (err: any) {
      setBlockMessage({ type: 'error', text: err.message || 'Failed to block user' })
    } finally {
      setBlockingUserId(null)
    }
  }

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getAdminTransactions({ limit: 200 })
        setTransactions(response.data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [])

  // Load Stripe transactions and balance
  useEffect(() => {
    const loadStripeData = async () => {
      try {
        setStripeLoading(true)
        setStripeError(null)

        const [transactionsRes, balanceRes] = await Promise.all([
          // Only paid transactions — backend maps 'succeeded' to paid checkout sessions too
          api.getStripeTransactions({ limit: 100, status: 'succeeded' }),
          api.getStripeBalance()
        ])

        setStripeTransactions((transactionsRes.data || []).filter(isPaidStripeTransaction))
        if (balanceRes.data) {
          setStripeBalance(balanceRes.data)
        }
      } catch (err: any) {
        setStripeError(err.message || 'Failed to load Stripe transactions')
      } finally {
        setStripeLoading(false)
      }
    }

    if (activeTab === 'stripe') {
      loadStripeData()
    }
  }, [activeTab])

  // Filtered Stripe transactions based on search
  const filteredStripeTransactions = useMemo(() => {
    if (!stripeSearchQuery.trim()) return stripeTransactions

    const search = stripeSearchQuery.toLowerCase()
    return stripeTransactions.filter((txn) =>
      txn.id.toLowerCase().includes(search) ||
      (txn.customer.email || '').toLowerCase().includes(search) ||
      (txn.customer.name || '').toLowerCase().includes(search) ||
      (txn.billing.email || '').toLowerCase().includes(search) ||
      (txn.billing.name || '').toLowerCase().includes(search) ||
      (txn.description || '').toLowerCase().includes(search) ||
      (txn.metadata?.mcNumber || '').toLowerCase().includes(search)
    )
  }, [stripeTransactions, stripeSearchQuery])

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const rangeStart = (() => {
      switch (dateRange) {
        case 'today':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate())
        case 'week': {
          const start = new Date(now)
          start.setDate(now.getDate() - 7)
          return start
        }
        case 'month':
          return new Date(now.getFullYear(), now.getMonth(), 1)
        case 'year':
          return new Date(now.getFullYear(), 0, 1)
        default:
          return null
      }
    })()

    return transactions.filter((txn) => {
      const matchesStatus = statusFilter === 'all' || txn.status === statusFilter
      const search = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !search ||
        txn.id.toLowerCase().includes(search) ||
        (txn.listing?.mcNumber || '').toLowerCase().includes(search) ||
        (txn.listing?.title || '').toLowerCase().includes(search) ||
        (txn.buyer?.name || '').toLowerCase().includes(search) ||
        (txn.buyer?.email || '').toLowerCase().includes(search) ||
        (txn.seller?.name || '').toLowerCase().includes(search)

      if (!rangeStart) {
        return matchesStatus && matchesSearch
      }

      const createdAt = new Date(txn.createdAt)
      return createdAt >= rangeStart && matchesStatus && matchesSearch
    })
  }, [transactions, searchQuery, statusFilter, dateRange])

  const stats = useMemo(() => {
    const completed = transactions.filter((txn) => txn.status === 'COMPLETED')
    const pending = transactions.filter((txn) => txn.status !== 'COMPLETED' && txn.status !== 'CANCELLED')
    const totalVolume = completed.reduce((sum, txn) => sum + Number(txn.agreedPrice || 0), 0)
    const totalFees = completed.reduce((sum, txn) => sum + Number(txn.platformFee || 0), 0)
    return {
      totalVolume,
      totalFees,
      completedCount: completed.length,
      pendingCount: pending.length,
    }
  }, [transactions])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Transactions</h1>
            <p className="text-gray-500">All marketplace and Stripe payment transactions</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              if (activeTab === 'stripe') {
                setStripeLoading(true)
                api.getStripeTransactions({ limit: 100, status: 'succeeded' })
                  .then(res => setStripeTransactions((res.data || []).filter(isPaidStripeTransaction)))
                  .finally(() => setStripeLoading(false))
              }
            }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${stripeLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stripe')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'stripe'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Stripe Payments
          </button>
          <button
            onClick={() => setActiveTab('platform')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'platform'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Platform Transactions
          </button>
        </div>

        {/* Stats - Changes based on active tab */}
        {activeTab === 'stripe' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-6 h-6 text-trust-high" />
              </div>
              <div className="text-2xl font-bold text-trust-high">
                ${stripeBalance ? (stripeBalance.available / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="text-xs text-gray-500">Available Balance</div>
            </Card>

            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                ${stripeBalance ? (stripeBalance.pending / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="text-xs text-gray-500">Pending Balance</div>
            </Card>

            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-500">
                {stripeTransactions.filter(t => t.status === 'succeeded' || t.status === 'paid').length}
              </div>
              <div className="text-xs text-gray-500">Successful Payments</div>
            </Card>

            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-6 h-6 text-primary-400" />
              </div>
              <div className="text-2xl font-bold text-primary-400">{stripeTransactions.length}</div>
              <div className="text-xs text-gray-500">Total Transactions</div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-trust-high" />
              </div>
              <div className="text-2xl font-bold text-trust-high">${stats.totalVolume.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Completed Volume</div>
            </Card>

            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-400">${stats.totalFees.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Platform Fees</div>
            </Card>

            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-500">{stats.completedCount}</div>
              <div className="text-xs text-gray-500">Completed Deals</div>
            </Card>

            <Card className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">{stats.pendingCount}</div>
              <div className="text-xs text-gray-500">Open Deals</div>
            </Card>
          </div>
        )}

        {/* Stripe Payments Tab Content */}
        {activeTab === 'stripe' && (
          <>
            {/* Stripe Filters */}
            <Card className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by email, name, transaction ID, or MC#..."
                    value={stripeSearchQuery}
                    onChange={(e) => setStripeSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2 bg-trust-high/10 border border-trust-high/30 rounded-lg px-4 py-2 text-sm text-trust-high font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Paid transactions only
                </div>
              </div>
            </Card>

            {/* Stripe Transactions List */}
            {stripeLoading ? (
              <Card>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-900/20 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold mb-2">Loading Stripe transactions...</h3>
                  <p className="text-gray-500">Fetching payment data from Stripe</p>
                </div>
              </Card>
            ) : stripeError ? (
              <Card>
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Unable to load Stripe data</h3>
                  <p className="text-gray-500">{stripeError}</p>
                </div>
              </Card>
            ) : filteredStripeTransactions.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-900/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Stripe transactions found</h3>
                  <p className="text-gray-500">No payments match your filters</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredStripeTransactions.map((txn) => (
                  <Card key={txn.id} hover className="cursor-pointer">
                    <div
                      className="flex items-center gap-4"
                      onClick={() => setSelectedStripeTransaction(selectedStripeTransaction === txn.id ? null : txn.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.status === 'succeeded' || txn.status === 'paid' ? 'bg-green-100' :
                        txn.status === 'pending' || txn.status === 'unpaid' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <CreditCard className={`w-4 h-4 ${
                          txn.status === 'succeeded' || txn.status === 'paid' ? 'text-green-600' :
                          txn.status === 'pending' || txn.status === 'unpaid' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">
                            {txn.customer.name || txn.billing.name || txn.customer.email || 'Unknown Customer'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            txn.status === 'succeeded' || txn.status === 'paid' ? 'bg-green-100 text-green-700' :
                            txn.status === 'pending' || txn.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {txn.status}
                          </span>
                          {txn.refunded && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                              Refunded
                            </span>
                          )}
                          {/* Name match indicator */}
                          {txn.nameMatchStatus === 'match' && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1" title="Cardholder matches platform user">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                          {txn.nameMatchStatus === 'partial' && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1" title="Partial name match">
                              <ShieldAlert className="w-3 h-3" />
                              Partial
                            </span>
                          )}
                          {txn.nameMatchStatus === 'mismatch' && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1" title="Cardholder name doesn't match user">
                              <ShieldAlert className="w-3 h-3" />
                              Mismatch
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{txn.customer.email || txn.billing.email || 'No email'}</span>
                          <span>•</span>
                          <span>{new Date(txn.createdDate).toLocaleDateString()}</span>
                          {txn.metadata?.mcNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono">MC#{txn.metadata.mcNumber}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-trust-high">{txn.amountFormatted}</div>
                        <div className="text-xs text-gray-400">{txn.currency}</div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedStripeTransaction === txn.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Customer Info */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <User className="w-4 h-4 text-primary-400" />
                              Customer
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="text-gray-900 font-medium">{txn.customer.name || 'Unknown'}</div>
                              {txn.customer.email && (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Mail className="w-3 h-3" />
                                  {txn.customer.email}
                                </div>
                              )}
                              {txn.customer.phone && (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Phone className="w-3 h-3" />
                                  {txn.customer.phone}
                                </div>
                              )}
                              {txn.customer.id && (
                                <div className="text-xs text-gray-400 font-mono mt-2">
                                  ID: {txn.customer.id}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Billing Address */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary-400" />
                              Billing Address
                            </h4>
                            {txn.billing.address ? (
                              <div className="space-y-1 text-sm text-gray-600">
                                {txn.billing.name && <div className="font-medium text-gray-900">{txn.billing.name}</div>}
                                {txn.billing.address.line1 && <div>{txn.billing.address.line1}</div>}
                                {txn.billing.address.line2 && <div>{txn.billing.address.line2}</div>}
                                <div>
                                  {[txn.billing.address.city, txn.billing.address.state, txn.billing.address.postalCode]
                                    .filter(Boolean).join(', ')}
                                </div>
                                {txn.billing.address.country && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Globe className="w-3 h-3" />
                                    {txn.billing.address.country}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">No billing address provided</div>
                            )}
                          </div>

                          {/* Payment Method */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-primary-400" />
                              Payment Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              {txn.paymentMethod ? (
                                <>
                                  {txn.paymentMethod.brand && txn.paymentMethod.last4 && (
                                    <div className="flex items-center gap-2">
                                      <span className="capitalize font-medium">{txn.paymentMethod.brand}</span>
                                      <span className="text-gray-500">•••• {txn.paymentMethod.last4}</span>
                                    </div>
                                  )}
                                  {txn.paymentMethod.expMonth && txn.paymentMethod.expYear && (
                                    <div className="text-gray-500">
                                      Expires {txn.paymentMethod.expMonth}/{txn.paymentMethod.expYear}
                                    </div>
                                  )}
                                  {txn.paymentMethod.cardholderName && (
                                    <div className="text-gray-700">
                                      <span className="text-gray-500">Cardholder:</span>{' '}
                                      <span className="font-medium">{txn.paymentMethod.cardholderName}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-500">Card details not available</div>
                              )}
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Amount:</span>
                                  <span className="font-bold text-gray-900">{txn.amountFormatted}</span>
                                </div>
                                {txn.refunded && (
                                  <div className="flex justify-between text-orange-600">
                                    <span>Refunded:</span>
                                    <span>${(txn.refundedAmount / 100).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cardholder Verification */}
                        <div className={`rounded-lg p-4 ${
                          txn.nameMatchStatus === 'match' ? 'bg-green-50 border border-green-200' :
                          txn.nameMatchStatus === 'partial' ? 'bg-yellow-50 border border-yellow-200' :
                          txn.nameMatchStatus === 'mismatch' ? 'bg-red-50 border border-red-200' :
                          'bg-gray-50 border border-gray-200'
                        }`}>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            {txn.nameMatchStatus === 'match' ? (
                              <ShieldCheck className="w-4 h-4 text-green-600" />
                            ) : txn.nameMatchStatus === 'partial' ? (
                              <ShieldAlert className="w-4 h-4 text-yellow-600" />
                            ) : txn.nameMatchStatus === 'mismatch' ? (
                              <ShieldAlert className="w-4 h-4 text-red-600" />
                            ) : (
                              <ShieldQuestion className="w-4 h-4 text-gray-500" />
                            )}
                            Cardholder Verification
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block mb-1">Cardholder Name (from card)</span>
                              <span className="font-medium text-gray-900">
                                {txn.paymentMethod?.cardholderName || txn.billing.name || 'Not provided'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Platform User</span>
                              {txn.matchedUser ? (
                                <div>
                                  <span className="font-medium text-gray-900">{txn.matchedUser.name}</span>
                                  <span className="text-gray-500 text-xs block">{txn.matchedUser.email}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">No matching user found</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Match Status:</span>
                              {txn.nameMatchStatus === 'match' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Names Match
                                </span>
                              ) : txn.nameMatchStatus === 'partial' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <AlertTriangle className="w-3 h-3" />
                                  Partial Match
                                </span>
                              ) : txn.nameMatchStatus === 'mismatch' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <XCircle className="w-3 h-3" />
                                  Names Don't Match
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <ShieldQuestion className="w-3 h-3" />
                                  Unable to Verify
                                </span>
                              )}
                            </div>
                            {txn.nameMatchStatus === 'mismatch' && (
                              <div className="mt-2">
                                <p className="text-xs text-red-600 mb-3">
                                  The cardholder name does not match the platform user. This may indicate unauthorized card usage.
                                </p>
                                {txn.matchedUser && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleBlockUser(txn)
                                    }}
                                    disabled={blockingUserId === txn.matchedUser.id}
                                    className="!bg-red-500 !text-white hover:!bg-red-600 border-none"
                                  >
                                    {blockingUserId === txn.matchedUser.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Blocking...
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Block User for Mismatch
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Block action message */}
                          {blockMessage && selectedStripeTransaction === txn.id && (
                            <div className={`mt-3 p-3 rounded-lg text-sm ${
                              blockMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {blockMessage.text}
                            </div>
                          )}
                        </div>

                        {/* Transaction Metadata */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary-400" />
                            Transaction Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">Transaction ID</span>
                              <span className="font-mono text-xs break-all">{txn.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Type</span>
                              <span className="capitalize">{txn.type.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Date</span>
                              <span>{new Date(txn.createdDate).toLocaleString()}</span>
                            </div>
                            {txn.description && (
                              <div>
                                <span className="text-gray-500 block">Description</span>
                                <span>{txn.description}</span>
                              </div>
                            )}
                          </div>
                          {Object.keys(txn.metadata).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-gray-500 text-xs block mb-2">Metadata</span>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(txn.metadata).map(([key, value]) => (
                                  <span key={key} className="px-2 py-1 bg-gray-200 rounded text-xs">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {txn.receiptUrl && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <a
                                href={txn.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 text-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Receipt
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Platform Transactions Tab Content */}
        {activeTab === 'platform' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by MC#, buyer, seller, or transaction ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="AWAITING_DEPOSIT">Awaiting Deposit</option>
                  <option value="DEPOSIT_RECEIVED">Deposit Received</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="BUYER_APPROVED">Buyer Approved</option>
                  <option value="SELLER_APPROVED">Seller Approved</option>
                  <option value="BOTH_APPROVED">Both Approved</option>
                  <option value="ADMIN_FINAL_REVIEW">Admin Final Review</option>
                  <option value="PAYMENT_PENDING">Payment Pending</option>
                  <option value="PAYMENT_RECEIVED">Payment Received</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DISPUTED">Disputed</option>
                </select>

                {/* Date Range */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </Card>

            {/* Transactions List */}
            {loading ? (
          <Card>
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-900/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Loading transactions...</h3>
              <p className="text-gray-500">Fetching the latest data</p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-900/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Unable to load transactions</h3>
              <p className="text-gray-500">{error}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((txn) => (
              <Card key={txn.id} hover className="cursor-pointer">
                <div
                  className="flex items-center gap-4"
                  onClick={() => setSelectedTransaction(selectedTransaction === txn.id ? null : txn.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">
                        {txn.listing?.title || `Transaction ${txn.id}`}
                      </span>
                      {getStatusBadge(txn.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-mono text-xs">{txn.id}</span>
                      <span>•</span>
                      <span>{txn.buyer?.name || 'Buyer'}</span>
                      <span>•</span>
                      <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-trust-high">
                      ${formatMoney(txn.agreedPrice)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Fee: ${formatMoney(txn.platformFee)}
                    </div>
                  </div>
                </div>

                {selectedTransaction === txn.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary-400" />
                          Buyer
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-900">{txn.buyer?.name || 'Unknown buyer'}</div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{txn.buyer?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary-400" />
                          Seller
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-900">{txn.seller?.name || 'Unknown seller'}</div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{txn.seller?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-primary-400" />
                          Amounts
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Agreed:</span>
                            <span className="text-gray-900">${formatMoney(txn.agreedPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Deposit:</span>
                            <span className="text-gray-900">${formatMoney(txn.depositAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Final:</span>
                            <span className="text-gray-900">${formatMoney(txn.finalPaymentAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {txn.listing && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary-400" />
                            Listing
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="text-gray-900 font-semibold">MC #{txn.listing.mcNumber}</div>
                            <div className="text-gray-500">{txn.listing.title}</div>
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary-400" />
                          Payment Status
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Deposit:</span>
                            <span className="text-gray-900">
                              {txn.depositPaidAt ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Final:</span>
                            <span className="text-gray-900">
                              {txn.finalPaidAt ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Deposit Method:</span>
                            <span className="text-gray-900">{txn.depositPaymentMethod || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Final Method:</span>
                            <span className="text-gray-900">{txn.finalPaymentMethod || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {new Date(txn.createdAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Updated: {new Date(txn.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleSendEmails(txn.id) }}
                        disabled={sendingEmailsFor === txn.id}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {sendingEmailsFor === txn.id ? (
                          <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="w-3 h-3 mr-1.5" /> Send Notification Emails</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {filteredTransactions.length === 0 && (
              <Card>
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-900/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Transactions Found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              </Card>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminTransactionsPage
