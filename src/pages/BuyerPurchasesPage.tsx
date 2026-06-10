import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  ShoppingBag,
  CreditCard,
  Receipt,
  X,
  Printer,
  AlertCircle,
  DollarSign,
  Building2,
  Calendar,
  Hash,
  Loader2,
  ExternalLink,
  Truck,
  Zap,
  RefreshCw
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Payment {
  id: string
  type: 'DEPOSIT' | 'FINAL_PAYMENT' | 'CREDIT_PURCHASE' | 'SUBSCRIPTION' | 'LISTING_FEE'
  amount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  method?: 'STRIPE' | 'ZELLE' | 'WIRE' | 'CHECK'
  stripePaymentId?: string
  reference?: string
  verifiedAt?: string
  description?: string
  createdAt: string
}

interface Transaction {
  id: string
  status: string
  agreedPrice: number
  depositAmount: number
  platformFee?: number
  finalPaymentAmount?: number
  depositPaidAt?: string
  depositPaymentMethod?: string
  finalPaidAt?: string
  finalPaymentMethod?: string
  completedAt?: string
  createdAt: string
  listing: {
    id: string
    mcNumber: string
    dotNumber?: string
    title: string
    price?: number
  }
  seller: {
    id: string
    name: string
    email?: string
    phone?: string
    trustScore?: number
  }
  payments?: Payment[]
}

interface StripeCharge {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  receiptUrl: string | null
  created: string
  paymentMethod: { brand: string; last4: string } | null
  metadata: Record<string, string>
}

interface StripeHistory {
  charges: StripeCharge[]
  checkoutSessions: Array<{
    id: string
    amountTotal: number
    currency: string | null
    status: string | null
    paymentStatus: string
    mode: string
    created: string
    metadata: Record<string, string> | null
  }>
  subscriptions: Array<{
    id: string
    status: string
    plan: string
    currentPeriodStart: string
    currentPeriodEnd: string
    created: string
    cancelAtPeriodEnd: boolean
  }>
  stripeCustomerId: string
}

const BuyerPurchasesPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'stripe' | 'transactions'>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stripeHistory, setStripeHistory] = useState<StripeHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch both transactions and Stripe history in parallel
    setLoading(true)
    setStripeLoading(true)
    setError(null)

    try {
      const [txnResponse, stripeResponse] = await Promise.all([
        api.getBuyerTransactions({ limit: 100 }).catch((err) => {
          console.error('Failed to fetch transactions:', err)
          return { data: [] }
        }),
        api.getBuyerStripeHistory().catch((err) => {
          console.error('Failed to fetch stripe history:', err)
          return { data: null }
        }),
      ])

      console.log('Stripe History Response:', stripeResponse)
      console.log('Transactions Response:', txnResponse)

      setTransactions(txnResponse.data || [])
      setStripeHistory(stripeResponse.data || null)
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      setError(err.message || 'Failed to load purchases')
    } finally {
      setLoading(false)
      setStripeLoading(false)
    }
  }

  const totalStripePayments = stripeHistory?.charges
    .filter(c => c.status === 'succeeded')
    .reduce((sum, c) => sum + c.amount, 0) || 0

  const totalTransactionValue = transactions.reduce((sum, t) => sum + (t.agreedPrice || 0), 0)

  const completedTransactions = transactions.filter(t => t.status === 'COMPLETED')
  const activeTransactions = transactions.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')

  const stats = [
    {
      label: 'Stripe Payments',
      value: stripeHistory?.charges?.length || 0,
      subValue: `$${totalStripePayments.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      label: 'Active Transactions',
      value: activeTransactions.length,
      subValue: 'In progress',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Completed',
      value: completedTransactions.length,
      subValue: `$${completedTransactions.reduce((s, t) => s + t.agreedPrice, 0).toLocaleString()}`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Total Value',
      value: `$${totalTransactionValue.toLocaleString()}`,
      subValue: `${transactions.length} transactions`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
      'AWAITING_DEPOSIT': { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Awaiting Deposit' },
      'DEPOSIT_RECEIVED': { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Deposit Received' },
      'IN_REVIEW': { color: 'text-purple-700', bg: 'bg-purple-100', label: 'In Review' },
      'DOCUMENTS_PENDING': { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Documents Pending' },
      'BOTH_APPROVED': { color: 'text-indigo-700', bg: 'bg-indigo-100', label: 'Both Approved' },
      'PAYMENT_PENDING': { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Payment Pending' },
      'PAYMENT_RECEIVED': { color: 'text-green-700', bg: 'bg-green-100', label: 'Payment Received' },
      'COMPLETED': { color: 'text-green-700', bg: 'bg-green-100', label: 'Completed' },
      'CANCELLED': { color: 'text-red-700', bg: 'bg-red-100', label: 'Cancelled' },
      'DISPUTED': { color: 'text-red-700', bg: 'bg-red-100', label: 'Disputed' },
      'succeeded': { color: 'text-green-700', bg: 'bg-green-100', label: 'Succeeded' },
      'pending': { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Pending' },
      'failed': { color: 'text-red-700', bg: 'bg-red-100', label: 'Failed' },
      'active': { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
      'canceled': { color: 'text-red-700', bg: 'bg-red-100', label: 'Canceled' },
    }
    const config = statusConfig[status] || { color: 'text-gray-700', bg: 'bg-gray-100', label: status }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentTypeLabel = (metadata: Record<string, string> | null) => {
    if (!metadata) return 'Payment'
    if (metadata.type === 'deposit') return 'MC Deposit'
    if (metadata.type === 'listing_fee') return 'Listing Fee'
    if (metadata.type === 'subscription') return 'Subscription'
    return 'Payment'
  }

  const handleViewInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowInvoice(true)
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const printContent = invoiceRef.current
    if (!printContent || !selectedTransaction) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedTransaction.listing.mcNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1f2937; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; }
            .invoice-title { font-size: 20px; color: #6b7280; margin-top: 10px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { color: #6b7280; }
            .value { font-weight: 500; color: #1f2937; }
            .total-row { font-size: 18px; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #1f2937; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            .disclaimer { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center; }
            .disclaimer-text { color: #92400e; font-weight: 500; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Domilea</div>
            <div class="invoice-title">INVOICE / RECEIPT</div>
          </div>
          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="row"><span class="label">Invoice Number:</span><span class="value">${selectedTransaction.id.slice(0, 8).toUpperCase()}</span></div>
            <div class="row"><span class="label">Date:</span><span class="value">${new Date(selectedTransaction.createdAt).toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value">${selectedTransaction.status}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Trucking Business Details</div>
            <div class="row"><span class="label">MC Number:</span><span class="value">${selectedTransaction.listing.mcNumber}</span></div>
            ${selectedTransaction.listing.dotNumber ? `<div class="row"><span class="label">DOT Number:</span><span class="value">${selectedTransaction.listing.dotNumber}</span></div>` : ''}
            <div class="row"><span class="label">Title:</span><span class="value">${selectedTransaction.listing.title}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Seller Information</div>
            <div class="row"><span class="label">Seller Name:</span><span class="value">${selectedTransaction.seller.name}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Buyer Information</div>
            <div class="row"><span class="label">Buyer Name:</span><span class="value">${user?.name || 'N/A'}</span></div>
            <div class="row"><span class="label">Email:</span><span class="value">${user?.email || 'N/A'}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Payment Summary</div>
            <div class="row"><span class="label">Purchase Price:</span><span class="value">$${selectedTransaction.agreedPrice.toLocaleString()}</span></div>
            <div class="row"><span class="label">Deposit Paid:</span><span class="value">$${(selectedTransaction.depositAmount || 0).toLocaleString()}</span></div>
            <div class="row total-row"><span class="label">Total Amount:</span><span class="value">$${selectedTransaction.agreedPrice.toLocaleString()}</span></div>
          </div>
          <div class="disclaimer">
            <div class="disclaimer-text">ALL SALES ARE FINAL - NO REFUNDS</div>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Domilea - Your Trusted Trucking Business Marketplace</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">My Purchases & Payments</h2>
            <p className="text-gray-500">View all your Stripe payments and MC transactions in one place</p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading || stripeLoading} className="w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${(loading || stripeLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stripe Customer ID Banner */}
        {stripeHistory?.stripeCustomerId && (
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-700">Stripe Customer ID</div>
                  <div className="text-xs text-gray-500 font-mono break-all">{stripeHistory.stripeCustomerId}</div>
                </div>
              </div>
              {stripeHistory.subscriptions && stripeHistory.subscriptions.length > 0 && (
                <div className="sm:text-right">
                  <div className="text-sm font-medium text-indigo-600">
                    {stripeHistory.subscriptions[0].plan.charAt(0).toUpperCase() + stripeHistory.subscriptions[0].plan.slice(1)} Plan
                  </div>
                  <div className="text-xs text-gray-500">
                    Renews {new Date(stripeHistory.subscriptions[0].currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{stat.subValue}</div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'stripe', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? 'All Activity' : tab === 'stripe' ? 'Stripe Payments' : 'MC Transactions'}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {(loading || stripeLoading) && (
          <Card>
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading your purchases...</p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Purchases</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchData}>Try Again</Button>
            </div>
          </Card>
        )}

        {/* Content */}
        {!loading && !stripeLoading && !error && (
          <div className="space-y-6">
            {/* Stripe Payments Section */}
            {(activeTab === 'all' || activeTab === 'stripe') && stripeHistory?.charges && stripeHistory.charges.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Stripe Payment History
                  </h3>
                )}
                <div className="space-y-4">
                  {stripeHistory.charges.map((charge) => (
                    <Card key={charge.id} className="hover:shadow-lg transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CreditCard className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                              <span className="font-bold text-gray-900">
                                {getPaymentTypeLabel(charge.metadata)}
                              </span>
                              {getStatusBadge(charge.status)}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {charge.description || 'Stripe payment'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                              <span className="font-mono break-all">{charge.id}</span>
                              {charge.paymentMethod && (
                                <span className="flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  {charge.paymentMethod.brand.toUpperCase()} •••• {charge.paymentMethod.last4}
                                </span>
                              )}
                              <span>{new Date(charge.created).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-2xl font-bold text-gray-900">
                            ${charge.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">{charge.currency}</div>
                          {charge.receiptUrl && (
                            <a
                              href={charge.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Show related MC info if available */}
                      {charge.metadata?.mcNumber && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck className="w-4 h-4" />
                            <span>MC #{charge.metadata.mcNumber}</span>
                            {charge.metadata.transactionId && (
                              <Link
                                to={`/transaction/${charge.metadata.transactionId}`}
                                className="text-indigo-600 hover:text-indigo-700 ml-2"
                              >
                                View Transaction →
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* MC Transactions Section */}
            {(activeTab === 'all' || activeTab === 'transactions') && transactions.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-lg font-bold text-gray-900 mb-4 mt-8 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    Trucking Business Transactions
                  </h3>
                )}
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">MC #{transaction.listing.mcNumber}</h3>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <p className="text-gray-600 mb-3">{transaction.listing.title}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 block">Seller</span>
                                <span className="text-gray-900 font-medium">{transaction.seller.name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Purchase Date</span>
                                <span className="text-gray-900 font-medium">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {transaction.completedAt && (
                                <div>
                                  <span className="text-gray-500 block">Completed</span>
                                  <span className="text-gray-900 font-medium">
                                    {new Date(transaction.completedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500 block">Deposit Status</span>
                                <span className={`font-medium ${transaction.depositPaidAt ? 'text-green-600' : 'text-amber-600'}`}>
                                  {transaction.depositPaidAt ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right sm:ml-4 shrink-0">
                            <div className="text-xs text-gray-500 mb-1">Purchase Price</div>
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                              ${transaction.agreedPrice.toLocaleString()}
                            </div>
                            {transaction.depositPaidAt && (
                              <div className="text-xs text-green-600">
                                Deposit: ${(transaction.depositAmount || 0).toLocaleString()} paid
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment History Summary */}
                        {transaction.payments && transaction.payments.length > 0 && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <CreditCard className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">Payment History</span>
                            </div>
                            <div className="space-y-2">
                              {transaction.payments.slice(0, 3).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                      payment.status === 'COMPLETED' ? 'bg-green-500' :
                                      payment.status === 'PENDING' ? 'bg-amber-500' :
                                      'bg-gray-400'
                                    }`} />
                                    <span className="text-gray-600 capitalize">
                                      {payment.type.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                    {payment.method && (
                                      <span className="text-gray-400 text-xs">via {payment.method}</span>
                                    )}
                                    {payment.stripePaymentId && (
                                      <span className="text-gray-400 text-xs font-mono">
                                        {payment.stripePaymentId.slice(0, 15)}...
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-900 font-medium">
                                      ${Number(payment.amount).toLocaleString()}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      {new Date(payment.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                          <Link to={`/transaction/${transaction.id}`} className="flex-1">
                            <Button fullWidth variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View Transaction
                            </Button>
                          </Link>
                          <Button
                            fullWidth
                            variant="outline"
                            onClick={() => handleViewInvoice(transaction)}
                            className="flex-1"
                          >
                            <Receipt className="w-4 h-4 mr-2" />
                            View Invoice
                          </Button>
                          {transaction.status === 'COMPLETED' && (
                            <Button
                              fullWidth
                              onClick={() => handleViewInvoice(transaction)}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Receipt
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!stripeHistory?.charges?.length && !transactions.length) && (
              <Card>
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No purchases yet</h3>
                  <p className="text-gray-500 mb-6">
                    Your Stripe payments and MC transactions will appear here
                  </p>
                  <Link to="/marketplace">
                    <Button>Browse Marketplace</Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Empty state for specific tabs */}
            {activeTab === 'stripe' && !stripeHistory?.charges?.length && transactions.length > 0 && (
              <Card>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Stripe payments found</h3>
                  <p className="text-gray-500">
                    Stripe payment history will appear here once you make payments via Stripe
                  </p>
                </div>
              </Card>
            )}

            {activeTab === 'transactions' && !transactions.length && stripeHistory?.charges?.length && (
              <Card>
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No MC transactions yet</h3>
                  <p className="text-gray-500 mb-6">
                    Start browsing the marketplace to find your next trucking business
                  </p>
                  <Link to="/marketplace">
                    <Button>Browse Marketplace</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowInvoice(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Invoice / Receipt</h3>
                    <p className="text-sm text-gray-500">MC #{selectedTransaction.listing.mcNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button size="sm" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-1" />
                    Download PDF
                  </Button>
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Invoice Content */}
              <div ref={invoiceRef} className="p-6">
                {/* Company Header */}
                <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
                  <h1 className="text-2xl font-bold text-gray-900">Domilea</h1>
                  <p className="text-gray-500 mt-1">Your Trusted Trucking Business Marketplace</p>
                  <p className="text-lg font-semibold text-gray-700 mt-3">INVOICE / RECEIPT</p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Invoice #:</span>
                        <span className="text-sm font-medium">{selectedTransaction.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">{new Date(selectedTransaction.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Status:</span>
                        {getStatusBadge(selectedTransaction.status)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Buyer Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-gray-600">Name:</span> <span className="font-medium">{user?.name || 'N/A'}</span></p>
                      <p className="text-sm"><span className="text-gray-600">Email:</span> <span className="font-medium">{user?.email || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Trucking Business Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Trucking Business Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">MC Number</p>
                      <p className="font-bold text-lg">{selectedTransaction.listing.mcNumber}</p>
                    </div>
                    {selectedTransaction.listing.dotNumber && (
                      <div>
                        <p className="text-sm text-gray-600">DOT Number</p>
                        <p className="font-bold text-lg">{selectedTransaction.listing.dotNumber}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Title</p>
                      <p className="font-medium">{selectedTransaction.listing.title}</p>
                    </div>
                  </div>
                </div>

                {/* Seller Information */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Seller Information
                  </h4>
                  <p className="font-medium">{selectedTransaction.seller.name}</p>
                </div>

                {/* Payment Summary */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Summary
                  </h4>
                  <div className="border rounded-xl overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-medium">${selectedTransaction.agreedPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit Paid</span>
                        <span className="font-medium text-green-600">
                          ${(selectedTransaction.depositAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold">${selectedTransaction.agreedPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {selectedTransaction.payments && selectedTransaction.payments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment Transactions</h4>
                    <div className="border rounded-xl overflow-x-auto">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-600">Date</th>
                            <th className="text-left p-3 font-medium text-gray-600">Type</th>
                            <th className="text-left p-3 font-medium text-gray-600">Method</th>
                            <th className="text-left p-3 font-medium text-gray-600">Status</th>
                            <th className="text-right p-3 font-medium text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTransaction.payments.map((payment) => (
                            <tr key={payment.id} className="border-t">
                              <td className="p-3 text-gray-600">
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 capitalize">
                                {payment.type.replace(/_/g, ' ').toLowerCase()}
                              </td>
                              <td className="p-3 text-gray-600">
                                {payment.method || '-'}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                  payment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-medium">
                                ${Number(payment.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All Sales Final Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-amber-800">ALL SALES ARE FINAL</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    This purchase is non-refundable and non-reversible. By completing this transaction, you acknowledge and agree to our <a href="/terms" target="_blank" className="underline font-semibold">Terms of Service</a>, including that all final payments are final, chargebacks and bank disputes are prohibited, and Domilea is a marketing agency only — any product issues must be resolved directly with the seller.
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                  <p>Thank you for your purchase!</p>
                  <p className="mt-1">Domilea - Your Trusted Trucking Business Marketplace</p>
                  <p className="mt-2 text-xs">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BuyerPurchasesPage
