import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  User,
  FileText,
  Users,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { TransactionStatus } from '../types'
import api from '../services/api'
import toast from 'react-hot-toast'

interface SellerTransaction {
  id: string
  mcNumber: string
  mcTitle: string
  buyerName: string
  offerAmount: number
  depositPaid: boolean
  status: TransactionStatus
  buyerApproved: boolean
  sellerApproved: boolean
  adminApproved: boolean
  createdAt: Date
  updatedAt: Date
}

const SellerTransactionsPage = () => {
  const { user: _user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [transactions, setTransactions] = useState<SellerTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Map backend status to frontend status
  const mapBackendStatus = (backendStatus: string): TransactionStatus => {
    const statusMap: Record<string, TransactionStatus> = {
      'TERMS_PENDING': 'awaiting-deposit',
      'AWAITING_DEPOSIT': 'awaiting-deposit',
      'DEPOSIT_RECEIVED': 'deposit-received',
      'IN_REVIEW': 'in-review',
      'APPROVED': 'both-approved',
      'AWAITING_FINAL_PAYMENT': 'payment-pending',
      'PAYMENT_RECEIVED': 'payment-received',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'DISPUTED': 'disputed'
    }
    return statusMap[backendStatus] || 'in-review'
  }

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getMyTransactions()
      if (response.success && response.data) {
        const mappedTransactions: SellerTransaction[] = response.data.map((txn: any) => ({
          id: txn.id,
          mcNumber: txn.listing?.mcNumber || 'Unknown',
          mcTitle: txn.listing?.title || `MC #${txn.listing?.mcNumber || 'Unknown'}`,
          buyerName: txn.buyer?.name || 'Unknown Buyer',
          offerAmount: txn.agreedPrice || txn.offer?.amount || 0,
          depositPaid: !!txn.depositPaidAt,
          status: mapBackendStatus(txn.status),
          buyerApproved: txn.buyerApproved || false,
          sellerApproved: txn.sellerApproved || false,
          adminApproved: txn.adminApproved || false,
          createdAt: new Date(txn.createdAt),
          updatedAt: new Date(txn.updatedAt)
        }))
        setTransactions(mappedTransactions)
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      setError(err.message || 'Failed to load transactions')
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const getStatusConfig = (status: TransactionStatus) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      'awaiting-deposit': { label: 'Awaiting Deposit', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'deposit-received': { label: 'Deposit Received', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      'in-review': { label: 'In Review', color: 'bg-blue-100 text-blue-700', icon: Eye },
      'buyer-approved': { label: 'Buyer Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'seller-approved': { label: 'Awaiting Buyer', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'both-approved': { label: 'Admin Review', color: 'bg-purple-100 text-purple-700', icon: Users },
      'admin-final-review': { label: 'Finalizing', color: 'bg-purple-100 text-purple-700', icon: FileText },
      'payment-pending': { label: 'Payment Pending', color: 'bg-orange-100 text-orange-700', icon: DollarSign },
      'payment-received': { label: 'Payment Received', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
      'disputed': { label: 'Disputed', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    }
    return configs[status] || configs['in-review']
  }

  const filteredTransactions = transactions.filter(txn => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return txn.status !== 'completed' && txn.status !== 'cancelled'
    if (statusFilter === 'completed') return txn.status === 'completed'
    return true
  })

  const stats = {
    active: transactions.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
    awaitingApproval: transactions.filter(t => t.buyerApproved && !t.sellerApproved).length,
    completed: transactions.filter(t => t.status === 'completed').length,
    totalValue: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.offerAmount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchTransactions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-gray-500">Track your MC sales and transaction progress</p>
        </div>
        <Button variant="outline" onClick={fetchTransactions} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Needs Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats.awaitingApproval}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Earned</p>
              <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Transactions' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions</h3>
              <p className="text-gray-500">You don't have any transactions matching this filter</p>
            </div>
          </Card>
        ) : (
          filteredTransactions.map((txn, index) => {
            const statusConfig = getStatusConfig(txn.status)
            const StatusIcon = statusConfig.icon
            const needsSellerAction = txn.buyerApproved && !txn.sellerApproved

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className={needsSellerAction ? 'border-2 border-yellow-400' : ''}>
                  {needsSellerAction && (
                    <div className="bg-yellow-50 -mx-6 -mt-6 px-6 py-2 mb-4 border-b border-yellow-200">
                      <p className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Action Required: Buyer has approved. Please review and approve.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* MC Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">MC #{txn.mcNumber}</h3>
                          <p className="text-sm text-gray-500">{txn.mcTitle}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="w-4 h-4" />
                          <span>Buyer: {txn.buyerName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <DollarSign className="w-4 h-4" />
                          <span>${txn.offerAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Approvals */}
                    <div className="flex flex-col items-start lg:items-end gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>

                      {/* Approval indicators */}
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`flex items-center gap-1 ${txn.buyerApproved ? 'text-green-600' : 'text-gray-400'}`}>
                          {txn.buyerApproved ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          Buyer
                        </span>
                        <span className={`flex items-center gap-1 ${txn.sellerApproved ? 'text-green-600' : 'text-gray-400'}`}>
                          {txn.sellerApproved ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          Seller
                        </span>
                        <span className={`flex items-center gap-1 ${txn.adminApproved ? 'text-green-600' : 'text-gray-400'}`}>
                          {txn.adminApproved ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          Admin
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full lg:w-auto">
                      <Link to={`/transaction/${txn.id}`} className="w-full lg:w-auto">
                        <Button variant={needsSellerAction ? 'primary' : 'outline'} className="w-full lg:w-auto">
                          {needsSellerAction ? (
                            <>
                              Review & Approve
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>Started: {txn.createdAt.toLocaleDateString()}</span>
                    <span>Last update: {txn.updatedAt.toLocaleDateString()}</span>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SellerTransactionsPage
