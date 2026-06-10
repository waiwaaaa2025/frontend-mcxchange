import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CheckCircle,
  CreditCard,
  Loader2,
  AlertCircle,
  Receipt,
  ExternalLink
} from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import { useSellerEarnings } from '../hooks/useSellerEarnings'
import { format, formatDistanceToNow, subMonths, isAfter, startOfMonth } from 'date-fns'

type ViewTab = 'deals' | 'payments'

const SellerEarningsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')
  const [activeTab, setActiveTab] = useState<ViewTab>('deals')

  const {
    transactions,
    totals,
    stripePayments,
    loading,
    stripeLoading,
    error,
  } = useSellerEarnings()

  // Calculate period-filtered data
  const getFilteredTransactions = () => {
    if (selectedPeriod === 'all') return transactions

    const now = new Date()
    let startDate: Date

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = subMonths(now, 1)
        break
      case 'year':
        startDate = subMonths(now, 12)
        break
      default:
        return transactions
    }

    return transactions.filter(t => isAfter(t.completedAt, startDate))
  }

  const filteredTransactions = getFilteredTransactions()

  // Calculate earnings for selected period
  const periodEarnings = filteredTransactions.reduce((sum, t) => sum + t.netEarnings, 0)

  // Calculate monthly data for chart (last 7 months)
  const monthlyData = Array.from({ length: 7 }, (_, i) => {
    const date = subMonths(new Date(), 6 - i)
    const monthStart = startOfMonth(date)
    const monthEnd = startOfMonth(subMonths(date, -1))

    const monthTransactions = transactions.filter(t =>
      isAfter(t.completedAt, monthStart) && !isAfter(t.completedAt, monthEnd)
    )

    const amount = monthTransactions.reduce((sum, t) => sum + t.netEarnings, 0)

    return {
      month: format(date, 'MMM'),
      amount,
    }
  })

  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1)

  // Calculate stats
  const completedCount = transactions.length
  const thisMonthEarnings = monthlyData[monthlyData.length - 1]?.amount || 0
  const lastMonthEarnings = monthlyData[monthlyData.length - 2]?.amount || 0
  const growthPercent = lastMonthEarnings > 0
    ? Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    : 0

  // Calculate total Stripe payments
  const totalStripePayments = stripePayments.reduce((sum, p) => sum + p.amount, 0)
  const listingFeePayments = stripePayments.filter(p => p.type === 'listing_fee')
  const totalListingFees = listingFeePayments.reduce((sum, p) => sum + p.amount, 0)

  const stats = [
    {
      icon: DollarSign,
      label: 'Total Earnings',
      value: `$${totals.net.toLocaleString()}`,
      change: `${completedCount} completed deals`,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: CheckCircle,
      label: 'Gross Revenue',
      value: `$${totals.gross.toLocaleString()}`,
      change: `-$${totals.fees.toLocaleString()} in fees`,
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50'
    },
    {
      icon: Receipt,
      label: 'Listing Fees Paid',
      value: `$${totalListingFees.toLocaleString()}`,
      change: `${listingFeePayments.length} listings`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      icon: TrendingUp,
      label: 'This Month',
      value: `$${thisMonthEarnings.toLocaleString()}`,
      change: growthPercent >= 0 ? `+${growthPercent}% growth` : `${growthPercent}% change`,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    }
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
            <span className="ml-3 text-gray-500">Loading earnings data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Earnings</h3>
            <p className="text-gray-500">{error}</p>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Earnings</h2>
            <p className="text-gray-500">Track your sales, revenue, and payment history</p>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard hover={false}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.change}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Monthly Chart */}
        <GlassCard className="mb-8" hover={false}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'year', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    selectedPeriod === period
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.amount / maxAmount) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-lg mb-2 min-h-[4px]"
                  style={{
                    opacity: data.amount === 0 ? 0.2 : 1
                  }}
                />
                <div className="text-xs text-gray-500 mb-1">{data.month}</div>
                <div className="text-xs font-semibold text-gray-900">
                  {data.amount > 0 ? `$${(data.amount / 1000).toFixed(0)}K` : '-'}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'deals'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Completed Deals ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Stripe Payments ({stripePayments.length})
          </button>
        </div>

        {/* Completed Deals Tab */}
        {activeTab === 'deals' && (
          <GlassCard hover={false}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Completed Deals</h3>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No completed deals yet</p>
                <p className="text-gray-400 text-sm">Completed transactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">MC #{transaction.mcNumber}</h4>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-600">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{transaction.listingTitle}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>Buyer: {transaction.buyerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(transaction.completedAt, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right sm:ml-4">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">
                          ${transaction.netEarnings.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          Gross: ${transaction.agreedPrice.toLocaleString()} | Fee: ${transaction.platformFee.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Stripe Payments Tab */}
        {activeTab === 'payments' && (
          <GlassCard hover={false}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Stripe Payment History</h3>

            {stripeLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-secondary-500" />
                <span className="ml-2 text-gray-500">Loading payment history...</span>
              </div>
            ) : stripePayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No Stripe payments found</p>
                <p className="text-gray-400 text-sm">Listing fees and other payments will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stripePayments.map((payment) => (
                  <div key={payment.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">
                            {payment.type === 'listing_fee' ? 'Listing Fee' : 'Payment'}
                          </h4>
                          {payment.mcNumber && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 text-secondary-600">
                              MC #{payment.mcNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {payment.description || 'Payment processed'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          {payment.paymentMethod && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span className="capitalize">{payment.paymentMethod.brand} ****{payment.paymentMethod.last4}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(payment.created, 'MMM d, yyyy')}</span>
                          </div>
                          <span className="text-gray-400">
                            {formatDistanceToNow(payment.created, { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right sm:ml-4">
                        <div className="text-2xl font-bold text-secondary-600 mb-1">
                          ${payment.amount.toLocaleString()}
                        </div>
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-secondary-500 hover:text-secondary-600 flex items-center justify-start sm:justify-end gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  )
}

export default SellerEarningsPage
