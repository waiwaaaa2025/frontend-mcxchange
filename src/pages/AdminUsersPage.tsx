import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  User,
  Search,
  CheckCircle,
  Clock,
  Ban,
  Shield,
  ShieldOff,
  Eye,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  Package,
  Crown,
  X,
  Download,
  MoreVertical,
  MessageSquare,
  DollarSign,
  Star,
  TrendingUp,
  UserPlus,
  Edit as PencilIcon,
  Trash2,
  CreditCard,
  History,
  FileText,
  RefreshCw,
  AlertCircle,
  Coins,
  Plus,
  Minus,
  Loader2,
  Unlock,
  ArrowUpCircle,
  ArrowDownCircle,
  MapPin,
  Key
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import api from '../services/api'
import BuyerRequirementsForm from '../components/BuyerRequirementsForm'
import type { BuyerPreferencesData } from '../types'

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING'
  verified: boolean
  trustScore: number
  memberSince: string
  lastLoginAt?: string
  companyName?: string
  mcNumber?: string
  dotNumber?: string
  identityVerified?: boolean
  identityVerificationStatus?: string
  identityVerifiedAt?: string
  subscription?: {
    plan: string
    status: string
  } | null
  _count?: {
    listings: number
    sentOffers: number
    buyerTransactions: number
    sellerTransactions: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const AdminUsersPage = () => {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId?: string }>()
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'sellers' | 'admins' | 'blocked' | 'pending' | 'paid'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'name' | 'memberSince' | 'lastActive' | 'trustScore'>('memberSince')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // API state
  const [users, setUsers] = useState<UserData[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    buyers: 0,
    sellers: 0,
    admins: 0,
    blocked: 0,
    pending: 0,
    verified: 0,
    paid: 0,
  })

  // Credits adjustment state
  const [creditAmount, setCreditAmount] = useState<string>('')
  const [creditReason, setCreditReason] = useState<string>('')
  const [creditAdjusting, setCreditAdjusting] = useState(false)

  // Manual deposit state
  type DepositListing = {
    transactionId: string
    listingId: string
    depositAmount: number
    agreedPrice: number
    mc: {
      mcNumber: string
      dotNumber: string
      legalName: string
      title: string
      askingPrice: number
      location: string
    } | null
  }
  const [depositListings, setDepositListings] = useState<DepositListing[]>([])
  const [depositListingsLoading, setDepositListingsLoading] = useState(false)
  const [depositForm, setDepositForm] = useState({
    transactionId: '',
    amount: '',
    paymentMethod: 'WIRE' as 'WIRE' | 'ZELLE' | 'CHECK' | 'STRIPE',
    reference: '',
    notes: '',
  })
  const [depositSaving, setDepositSaving] = useState(false)
  const [depositFeedback, setDepositFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Role editing state
  const [editingRole, setEditingRole] = useState<string>('')
  const [roleUpdating, setRoleUpdating] = useState(false)

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', companyName: '' })
  const [profileSaving, setProfileSaving] = useState(false)

  // Admin password reset state
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false)
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [resetPasswordSaving, setResetPasswordSaving] = useState(false)
  const [resetPasswordFeedback, setResetPasswordFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Activity log modal state
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityLogLoading, setActivityLogLoading] = useState(false)
  const [activityLog, setActivityLog] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
    totalCredits: number;
    usedCredits: number;
    availableCredits: number;
    unlockedMCs: Array<{
      id: string;
      listingId: string;
      mcNumber: string;
      title: string;
      legalName: string;
      location: string;
      askingPrice: number;
      status: string;
      creditsUsed: number;
      unlockedAt: string;
      viewCount: number;
    }>;
    creditTransactions: Array<{
      id: string;
      type: string;
      amount: number;
      balance: number;
      description: string;
      mcNumber: string | null;
      listingTitle: string | null;
      createdAt: string;
    }>;
  } | null>(null)
  const [activityTab, setActivityTab] = useState<'unlocked' | 'transactions'>('unlocked')

  // Buyer preferences (admin view)
  const [buyerPrefs, setBuyerPrefs] = useState<BuyerPreferencesData | null>(null)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [userMatches, setUserMatches] = useState<{
    hasPreferences: boolean;
    matches: Array<{ listing: any; matchScore: number; matchReasons: string[] }>;
  } | null>(null)

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      // Map tab to role/status filter
      let role: string | undefined
      let status: string | undefined
      let subscriptionStatus: string | undefined

      switch (activeTab) {
        case 'buyers':
          role = 'BUYER'
          break
        case 'sellers':
          role = 'SELLER'
          break
        case 'admins':
          role = 'ADMIN'
          break
        case 'blocked':
          status = 'BLOCKED'
          break
        case 'pending':
          status = 'PENDING'
          break
        case 'paid':
          subscriptionStatus = 'ACTIVE'
          break
      }

      const response = await api.getAdminUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        role,
        status,
        subscriptionStatus,
      })

      setUsers(response.users)
      setPagination(response.pagination)

      // Calculate stats from all users (fetch without filters for stats)
      const allResponse = await api.getAdminUsers({ limit: 1000 })
      const allUsers = allResponse.users

      setStats({
        total: allUsers.length,
        active: allUsers.filter((u: UserData) => u.status === 'ACTIVE').length,
        buyers: allUsers.filter((u: UserData) => u.role === 'BUYER').length,
        sellers: allUsers.filter((u: UserData) => u.role === 'SELLER').length,
        admins: allUsers.filter((u: UserData) => u.role === 'ADMIN').length,
        blocked: allUsers.filter((u: UserData) => u.status === 'BLOCKED').length,
        pending: allUsers.filter((u: UserData) => u.status === 'PENDING').length,
        verified: allUsers.filter((u: UserData) => u.verified).length,
        paid: allUsers.filter((u: UserData) => u.subscription?.status === 'ACTIVE').length,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [activeTab, pagination.page, searchTerm])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchUsers()
      } else {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])


  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      INACTIVE: 'bg-gray-100 text-gray-500 border-gray-200',
      BLOCKED: 'bg-red-100 text-red-700 border-red-200',
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      BUYER: 'bg-purple-100 text-purple-700 border-purple-200',
      SELLER: 'bg-blue-100 text-blue-700 border-blue-200',
      ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
    return styles[role] || 'bg-gray-100 text-gray-700'
  }

  const getSubscriptionBadge = (plan: string) => {
    const styles: Record<string, string> = {
      STARTER: 'bg-blue-50 text-blue-700 border-blue-200',
      PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200',
      ENTERPRISE: 'bg-amber-50 text-amber-700 border-amber-200',
      VIP_ACCESS: 'bg-pink-50 text-pink-700 border-pink-200',
    }
    return styles[plan] || 'bg-gray-100 text-gray-500 border-gray-200'
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500'
      case 'PAST_DUE': return 'bg-red-500'
      case 'CANCELLED':
      case 'EXPIRED':
      default: return 'bg-gray-400'
    }
  }

  const formatPlanName = (plan: string) => {
    return plan.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\bVip\b/, 'VIP')
  }

  const handleBlockUser = async (userId: string) => {
    try {
      await api.blockUser(userId, 'Blocked by admin')
      fetchUsers()
      setShowActionMenu(null)
    } catch (err: any) {
      console.error('Failed to block user:', err)
      alert(err.message || 'Failed to block user')
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.unblockUser(userId)
      fetchUsers()
      setShowActionMenu(null)
    } catch (err: any) {
      console.error('Failed to unblock user:', err)
      alert(err.message || 'Failed to unblock user')
    }
  }

  const handleVerifyUser = async (userId: string) => {
    try {
      await api.verifySeller(userId)
      fetchUsers()
      setShowActionMenu(null)
    } catch (err: any) {
      console.error('Failed to verify user:', err)
      alert(err.message || 'Failed to verify user')
    }
  }

  const handleCancelSubscription = async (userId: string, planName: string) => {
    if (!confirm(`Cancel this user's ${planName} subscription? This will immediately cancel it in Stripe and cannot be undone.`)) return
    try {
      const res = await api.cancelUserSubscription(userId)
      fetchUsers()
      if (showDetailModal && selectedUser?.id === userId) {
        const details = await api.getAdminUserDetails(userId)
        setUserDetails(details)
      }
      alert(res?.data?.message || 'Subscription cancelled')
    } catch (err: any) {
      console.error('Failed to cancel subscription:', err)
      alert(err.message || 'Failed to cancel subscription')
    }
  }

  const handleDeleteUser = async (user: UserData) => {
    if (user.role === 'ADMIN') {
      alert('Admin accounts cannot be deleted from the users panel.')
      return
    }
    const ok = confirm(
      `Delete ${user.name} (${user.email})?\n\nThis cancels any active subscription, anonymizes their personal info, suspends the account, and logs them out everywhere. Historical records (offers, transactions, listings) are kept for audit. This cannot be undone.`
    )
    if (!ok) return
    try {
      await api.deleteUser(user.id)
      setShowActionMenu(null)
      if (selectedUser?.id === user.id) {
        setShowDetailModal(false)
        setSelectedUser(null)
        setUserDetails(null)
      }
      fetchUsers()
    } catch (err: any) {
      console.error('Failed to delete user:', err)
      alert(err.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    const { newPassword, confirmPassword } = resetPasswordForm
    if (newPassword.length < 8) {
      setResetPasswordFeedback({ type: 'error', msg: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setResetPasswordFeedback({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    try {
      setResetPasswordSaving(true)
      setResetPasswordFeedback(null)
      const res = await api.adminResetUserPassword(selectedUser.id, newPassword)
      setResetPasswordFeedback({ type: 'success', msg: res?.data?.message || 'Password reset successfully.' })
      setResetPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      console.error('Failed to reset password:', err)
      setResetPasswordFeedback({ type: 'error', msg: err.message || 'Failed to reset password' })
    } finally {
      setResetPasswordSaving(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser || !editingRole || editingRole === selectedUser.role) return
    try {
      setRoleUpdating(true)
      await api.updateUserRole(selectedUser.id, editingRole)
      setSelectedUser({ ...selectedUser, role: editingRole as UserData['role'] })
      // Refresh user details and list
      const details = await api.getAdminUserDetails(selectedUser.id)
      setUserDetails(details)
      fetchUsers()
    } catch (err: any) {
      console.error('Failed to update role:', err)
      alert(err.message || 'Failed to update role')
    } finally {
      setRoleUpdating(false)
    }
  }

  const handleEditProfile = () => {
    if (!selectedUser) return
    setEditForm({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      phone: selectedUser.phone || '',
      companyName: selectedUser.companyName || '',
    })
    setIsEditingProfile(true)
  }

  const handleSaveProfile = async () => {
    if (!selectedUser) return
    try {
      setProfileSaving(true)
      await api.updateUser(selectedUser.id, editForm)
      setSelectedUser({ ...selectedUser, ...editForm })
      const details = await api.getAdminUserDetails(selectedUser.id)
      setUserDetails(details)
      fetchUsers()
      setIsEditingProfile(false)
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      alert(err.message || 'Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const openUserDetail = async (user: UserData) => {
    setSelectedUser(user)
    setIsEditingProfile(false)
    setShowDetailModal(true)
    setCreditAmount('')
    setCreditReason('')
    setEditingRole(user.role)
    setBuyerPrefs(null)
    setUserMatches(null)
    setDepositListings([])
    setDepositForm({ transactionId: '', amount: '', paymentMethod: 'WIRE', reference: '', notes: '' })
    setDepositFeedback(null)
    try {
      const details = await api.getAdminUserDetails(user.id)
      setUserDetails(details)
    } catch (err) {
      console.error('Failed to fetch user details:', err)
    }
    if (user.role === 'BUYER') {
      try {
        const [prefsRes, matchesRes] = await Promise.all([
          api.getAdminUserPreferences(user.id),
          api.getAdminUserMatches(user.id, 5),
        ])
        setBuyerPrefs(prefsRes?.data ?? null)
        setUserMatches(matchesRes?.data ?? null)
      } catch (err) {
        console.error('Failed to fetch buyer preferences/matches:', err)
      }
    }
    const isPaid = user.subscription?.status === 'ACTIVE'
    if (isPaid) {
      try {
        setDepositListingsLoading(true)
        const res = await api.getUserListingsForDeposit(user.id)
        setDepositListings(res?.data ?? [])
      } catch (err) {
        console.error('Failed to fetch deposit listings:', err)
      } finally {
        setDepositListingsLoading(false)
      }
    }
  }

  // Open the detail modal directly from a deep link (e.g. /admin/users/:id),
  // where we only have the user id and not the full list row.
  const openUserDetailById = async (id: string) => {
    try {
      const details = await api.getAdminUserDetails(id)
      const d = details?.data || details
      if (!d?.id) return
      const userObj: UserData = {
        id: d.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        role: d.role,
        status: d.status,
        verified: d.verified,
        trustScore: d.trustScore ?? 0,
        memberSince: d.memberSince || d.createdAt,
        companyName: d.companyName,
        mcNumber: d.mcNumber,
        dotNumber: d.dotNumber,
        identityVerified: d.identityVerified,
        subscription: d.subscription ?? null,
      }
      await openUserDetail(userObj)
    } catch (err) {
      console.error('Failed to open user detail by id:', err)
    }
  }

  // Auto-open the detail modal when navigated to /admin/users/:userId
  useEffect(() => {
    if (userId) {
      openUserDetailById(userId)
    } else {
      setShowDetailModal(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleRecordManualDeposit = async () => {
    if (!selectedUser) return
    const amountNum = parseFloat(depositForm.amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setDepositFeedback({ type: 'error', msg: 'Enter a valid amount' })
      return
    }
    if (!depositForm.transactionId && !depositForm.notes.trim()) {
      setDepositFeedback({ type: 'error', msg: 'Pick an MC listing or add notes describing the MC' })
      return
    }
    try {
      setDepositSaving(true)
      setDepositFeedback(null)
      const res = await api.recordManualDeposit(selectedUser.id, {
        amount: amountNum,
        paymentMethod: depositForm.paymentMethod,
        transactionId: depositForm.transactionId || undefined,
        reference: depositForm.reference.trim() || undefined,
        notes: depositForm.notes.trim() || undefined,
      }) as any
      setDepositFeedback({ type: 'success', msg: res?.message || 'Deposit recorded' })
      setDepositForm({ transactionId: '', amount: '', paymentMethod: 'WIRE', reference: '', notes: '' })
      try {
        const listingsRes = await api.getUserListingsForDeposit(selectedUser.id)
        setDepositListings(listingsRes?.data ?? [])
      } catch {}
    } catch (err: any) {
      console.error('Failed to record manual deposit:', err)
      setDepositFeedback({ type: 'error', msg: err?.message || 'Failed to record deposit' })
    } finally {
      setDepositSaving(false)
    }
  }

  const handleSaveBuyerPreferences = async (data: Partial<BuyerPreferencesData>) => {
    if (!selectedUser) return
    try {
      setPrefsSaving(true)
      const res = await api.updateAdminUserPreferences(selectedUser.id, data)
      setBuyerPrefs(res?.data ?? null)
      const matchesRes = await api.getAdminUserMatches(selectedUser.id, 5)
      setUserMatches(matchesRes?.data ?? null)
    } catch (err: any) {
      console.error('Failed to save preferences:', err)
      alert(err?.message || 'Failed to save preferences')
    } finally {
      setPrefsSaving(false)
    }
  }

  const handleAdjustCredits = async (isAdding: boolean) => {
    if (!userDetails || !creditAmount || !creditReason.trim()) return

    const amount = parseInt(creditAmount, 10)
    if (isNaN(amount) || amount <= 0) return

    const adjustmentAmount = isAdding ? amount : -amount
    const userId = userDetails.data?.id || userDetails.id

    try {
      setCreditAdjusting(true)
      const response = await api.adjustUserCredits(userId, adjustmentAmount, creditReason.trim()) as any
      const result = response.data || response

      // Update userDetails with new credits
      setUserDetails((prev: any) => {
        if (!prev) return prev
        const data = prev.data || prev
        return {
          ...prev,
          data: {
            ...data,
            totalCredits: result.newTotal,
            usedCredits: result.usedCredits,
          },
          totalCredits: result.newTotal,
          usedCredits: result.usedCredits,
        }
      })

      // Clear inputs
      setCreditAmount('')
      setCreditReason('')
    } catch (err: any) {
      console.error('Failed to adjust credits:', err)
      alert(err.message || 'Failed to adjust credits')
    } finally {
      setCreditAdjusting(false)
    }
  }

  const openActivityLog = async (user: UserData) => {
    setSelectedUser(user)
    setShowActivityModal(true)
    setActivityLogLoading(true)
    setActivityTab('unlocked')
    try {
      const response = await api.getUserActivityLog(user.id)
      setActivityLog(response.data)
    } catch (err) {
      console.error('Failed to fetch activity log:', err)
      setActivityLog(null)
    } finally {
      setActivityLogLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const tabs = [
    { key: 'all', label: 'All Users', count: stats.total, icon: Users },
    { key: 'buyers', label: 'Buyers', count: stats.buyers, icon: ShoppingCart },
    { key: 'sellers', label: 'Sellers', count: stats.sellers, icon: Package },
    { key: 'paid', label: 'Paid', count: stats.paid, icon: Crown },
    { key: 'admins', label: 'Admins', count: stats.admins, icon: Shield },
    { key: 'blocked', label: 'Blocked', count: stats.blocked, icon: Ban },
    { key: 'pending', label: 'Pending', count: stats.pending, icon: Clock }
  ]

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">View and manage all platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchUsers}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500">Buyers</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.buyers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">Sellers</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.sellers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-500">Admins</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-teal-500" />
            <span className="text-xs text-gray-500">Verified</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500">Blocked</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as typeof sortField)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="memberSince">Member Since</option>
              <option value="name">Name</option>
              <option value="lastActive">Last Active</option>
              <option value="trustScore">Trust Score</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Users List */}
      {!loading && (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} hover className="cursor-pointer">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    user.status === 'BLOCKED'
                      ? 'bg-red-100 text-red-600'
                      : user.status === 'INACTIVE'
                      ? 'bg-gray-100 text-gray-400'
                      : user.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-600'
                      : user.role === 'ADMIN'
                      ? 'bg-indigo-100 text-indigo-600'
                      : user.role === 'SELLER'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}
                  onClick={() => openUserDetail(user)}
                >
                  {getInitials(user.name)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0" onClick={() => openUserDetail(user)}>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>

                    {/* Role Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>

                    {/* Status Badge — only show for non-active */}
                    {user.status !== 'ACTIVE' && (
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border flex items-center gap-1 ${getStatusBadge(user.status)}`}>
                        {user.status === 'BLOCKED' && <Ban className="w-3 h-3" />}
                        {user.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                      </span>
                    )}

                    {/* Stripe Identity Badge */}
                    {user.identityVerified ? (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        ID Verified
                      </span>
                    ) : user.identityVerificationStatus === 'pending' || user.identityVerificationStatus === 'processing' ? (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ID {user.identityVerificationStatus === 'processing' ? 'Processing' : 'Pending'}
                      </span>
                    ) : user.identityVerificationStatus === 'requires_input' ? (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        ID Failed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Not Verified
                      </span>
                    )}

                    {/* Subscription Tier Badge */}
                    {user.subscription ? (
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border flex items-center gap-1 ${getSubscriptionBadge(user.subscription.plan)}`}>
                        <Crown className="w-3 h-3" />
                        {formatPlanName(user.subscription.plan)}
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${getSubscriptionStatusColor(user.subscription.status)}`} />
                        {user.subscription.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelSubscription(user.id, formatPlanName(user.subscription!.plan))
                            }}
                            title="Cancel subscription (Stripe + DB)"
                            className="ml-1 -mr-0.5 p-0.5 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
                        No Plan
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.companyName && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{user.companyName}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Member since {formatDate(user.memberSince)}</span>
                    </div>
                    {user.lastLoginAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last login {formatDate(user.lastLoginAt)}</span>
                      </div>
                    )}
                    {user._count && user.role === 'SELLER' && (
                      <>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>{user._count.listings} listings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          <span>{user._count.sellerTransactions} sales</span>
                        </div>
                      </>
                    )}
                    {user._count && user.role === 'BUYER' && (
                      <>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          <span>{user._count.buyerTransactions} purchases</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{user._count.sentOffers} offers</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>


                {/* Actions */}
                <div className="flex items-center gap-2 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openUserDetail(user)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openUserDetail(user)
                      setTimeout(() => handleEditProfile(), 100)
                    }}
                    title="Edit User"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowActionMenu(showActionMenu === user.id ? null : user.id)
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {/* Action Menu */}
                    <AnimatePresence>
                      {showActionMenu === user.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openUserDetail(user)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowActionMenu(null)
                              navigate('/admin/messages', {
                                state: {
                                  composeToUser: {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                  }
                                }
                              })
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Send Message
                          </button>
                          <button
                            onClick={() => {
                              setShowActionMenu(null)
                              openUserDetail(user)
                              setTimeout(() => handleEditProfile(), 100)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit User
                          </button>
                          {!user.verified && user.status !== 'BLOCKED' && user.role === 'SELLER' && (
                            <button
                              onClick={() => handleVerifyUser(user.id)}
                              className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Verify Seller
                            </button>
                          )}
                          <hr className="my-2" />
                          {user.status === 'BLOCKED' ? (
                            <button
                              onClick={() => handleUnblockUser(user.id)}
                              className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                            >
                              <ShieldOff className="w-4 h-4" />
                              Unblock User
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" />
                              Block User
                            </button>
                          )}
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {users.length === 0 && !loading && (
            <Card>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search' : 'No users in this category'}
                </p>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDetailModal(false)
              setUserDetails(null)
              setShowResetPasswordForm(false)
              setResetPasswordForm({ newPassword: '', confirmPassword: '' })
              setResetPasswordFeedback(null)
              if (userId) navigate('/admin/users')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 p-4 rounded-t-2xl text-white ${
                selectedUser.role === 'ADMIN'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                  : selectedUser.role === 'SELLER'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                      {getInitials(selectedUser.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                        {selectedUser.verified && (
                          <Shield className="w-5 h-5 text-emerald-300" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <span>{selectedUser.role.charAt(0) + selectedUser.role.slice(1).toLowerCase()}</span>
                        <span>•</span>
                        <span>{selectedUser.status.charAt(0) + selectedUser.status.slice(1).toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setUserDetails(null)
                      if (userId) navigate('/admin/users')
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">

                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        Contact Information
                      </span>
                      {!isEditingProfile ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleEditProfile()
                          }}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <PencilIcon className="w-3 h-3" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={profileSaving}
                            className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            {profileSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </button>
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </h3>
                    {isEditingProfile ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Email</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
                          <input
                            type="text"
                            value={editForm.companyName}
                            onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{selectedUser.email}</span>
                        </div>
                        {selectedUser.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{selectedUser.phone}</span>
                          </div>
                        )}
                        {selectedUser.companyName && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{selectedUser.companyName}</span>
                          </div>
                        )}
                        {userDetails?.data?.mcNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span className="text-gray-700">MC# {userDetails.data.mcNumber}</span>
                            {userDetails?.data?.dotNumber && (
                              <span className="text-gray-400">/ DOT# {userDetails.data.dotNumber}</span>
                            )}
                          </div>
                        )}
                        {userDetails?.data?.city && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              {[userDetails.data.city, userDetails.data.state, userDetails.data.zipCode].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {userDetails?.data?.companyAddress && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">Company: {userDetails.data.companyAddress}</span>
                          </div>
                        )}
                        {userDetails?.data?.ein && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">EIN: {userDetails.data.ein}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Account Details
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Role</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            <option value="BUYER">Buyer</option>
                            <option value="SELLER">Seller</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {editingRole !== selectedUser.role && (
                            <button
                              onClick={handleUpdateRole}
                              disabled={roleUpdating}
                              className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                              {roleUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Member Since</span>
                        <span className="text-gray-700">{formatDate(selectedUser.memberSince)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Login</span>
                        <span className="text-gray-700">{formatDate(selectedUser.lastLoginAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Email Verified</span>
                        <span className={userDetails?.data?.emailVerified ? 'text-emerald-600' : 'text-gray-400'}>
                          {userDetails?.data?.emailVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Seller Verified</span>
                        <span className={selectedUser.verified ? 'text-emerald-600' : 'text-gray-400'}>
                          {selectedUser.verified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {selectedUser.verified && userDetails?.data?.sellerVerifiedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Seller Verified On</span>
                          <span className="text-gray-700">{formatDate(userDetails.data.sellerVerifiedAt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Stripe Identity</span>
                        {selectedUser.identityVerified ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Verified
                          </span>
                        ) : selectedUser.identityVerificationStatus === 'pending' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                            Pending
                          </span>
                        ) : selectedUser.identityVerificationStatus === 'processing' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                            Processing
                          </span>
                        ) : selectedUser.identityVerificationStatus === 'requires_input' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Failed
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Started</span>
                        )}
                      </div>
                      {selectedUser.identityVerified && userDetails?.data?.identityVerifiedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">ID Verified On</span>
                          <span className="text-gray-700">{formatDate(userDetails.data.identityVerifiedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-indigo-600" />
                    Subscription
                  </h3>
                  {userDetails?.data?.subscription || selectedUser.subscription ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className={`text-sm font-bold ${getSubscriptionBadge((userDetails?.data?.subscription || selectedUser.subscription)?.plan || '').includes('purple') ? 'text-purple-700' : (userDetails?.data?.subscription || selectedUser.subscription)?.plan === 'ENTERPRISE' ? 'text-amber-700' : (userDetails?.data?.subscription || selectedUser.subscription)?.plan === 'VIP_ACCESS' ? 'text-pink-700' : 'text-blue-700'}`}>
                          {formatPlanName((userDetails?.data?.subscription || selectedUser.subscription)?.plan || '')}
                        </p>
                        <p className="text-xs text-gray-500">Plan</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getSubscriptionStatusColor((userDetails?.data?.subscription || selectedUser.subscription)?.status || '')}`} />
                          <p className="text-sm font-bold text-gray-900">
                            {((userDetails?.data?.subscription || selectedUser.subscription)?.status || '').charAt(0) + ((userDetails?.data?.subscription || selectedUser.subscription)?.status || '').slice(1).toLowerCase().replace(/_/g, ' ')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">Status</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-gray-400 text-sm">No active subscription</p>
                    </div>
                  )}
                </div>

                {/* Buyer Requirements & Match Suggestions — only for BUYER role */}
                {selectedUser.role === 'BUYER' && (
                  <>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        Buyer Requirements & Notes
                      </h3>
                      <BuyerRequirementsForm
                        initialValues={buyerPrefs}
                        onSave={handleSaveBuyerPreferences}
                        showAdminNotes={true}
                        saving={prefsSaving}
                      />
                      {buyerPrefs?.lastEditedBy && buyerPrefs?.lastEditedAt && (
                        <p className="mt-3 text-xs text-gray-400">
                          Last edited by {buyerPrefs.lastEditedBy.toLowerCase()} on {formatDate(buyerPrefs.lastEditedAt)}
                        </p>
                      )}
                    </div>

                    {userMatches && userMatches.hasPreferences && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Top Matches for this Buyer
                        </h3>
                        {userMatches.matches.length === 0 ? (
                          <p className="text-sm text-gray-500">No active listings yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {userMatches.matches.map((m) => (
                              <div key={m.listing.id} className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    MC#{m.listing.mcNumber} — {m.listing.title || m.listing.legalName}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {m.listing.state} · ${Number(m.listing.listingPrice || m.listing.askingPrice).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 truncate" title={m.matchReasons.join(' · ')}>
                                    {m.matchReasons.slice(0, 4).join(' · ')}
                                  </p>
                                </div>
                                <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold ${
                                  m.matchScore >= 80 ? 'bg-emerald-600 text-white'
                                    : m.matchScore >= 60 ? 'bg-amber-500 text-white'
                                    : 'bg-gray-300 text-gray-700'
                                }`}>
                                  {m.matchScore}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Activity Stats */}
                {selectedUser._count && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Activity Statistics
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{selectedUser._count.listings}</p>
                        <p className="text-xs text-gray-500">Listings</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{selectedUser._count.sentOffers}</p>
                        <p className="text-xs text-gray-500">Offers Sent</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{selectedUser._count.buyerTransactions}</p>
                        <p className="text-xs text-gray-500">Purchases</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-gray-900">{selectedUser._count.sellerTransactions}</p>
                        <p className="text-xs text-gray-500">Sales</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credits Management */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    Credits Management
                  </h3>

                  {/* Current Credits Display */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {userDetails?.data?.totalCredits ?? userDetails?.totalCredits ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Total Credits</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-lg font-bold text-emerald-600">
                        {(userDetails?.data?.totalCredits ?? userDetails?.totalCredits ?? 0) -
                         (userDetails?.data?.usedCredits ?? userDetails?.usedCredits ?? 0)}
                      </p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>

                  {/* Quick Adjust */}
                  <div className="bg-white rounded-lg p-3 border border-amber-100">
                    <div className="text-xs font-medium text-gray-500 mb-2">Quick Adjust Credits</div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        min="1"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Reason (required)"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdjustCredits(true)}
                        disabled={!creditAmount || !creditReason.trim() || creditAdjusting}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {creditAdjusting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add Credits
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAdjustCredits(false)}
                        disabled={!creditAmount || !creditReason.trim() || creditAdjusting ||
                          ((userDetails?.data?.totalCredits ?? userDetails?.totalCredits ?? 0) -
                           (userDetails?.data?.usedCredits ?? userDetails?.usedCredits ?? 0)) === 0}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {creditAdjusting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Minus className="w-4 h-4" />
                            Remove Credits
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manual Deposit Recording — paid users only */}
                {selectedUser.subscription?.status === 'ACTIVE' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Record Off-Platform Deposit
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      User paid you directly (bank transfer, Zelle, wire, check). Pick the MC or, if it's not listed yet, describe it in notes.
                    </p>

                    <div className="bg-white rounded-lg p-3 border border-emerald-100 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">MC Listing (optional)</label>
                        <select
                          value={depositForm.transactionId}
                          onChange={(e) => {
                            const txId = e.target.value
                            const match = depositListings.find(l => l.transactionId === txId)
                            setDepositForm(prev => ({
                              ...prev,
                              transactionId: txId,
                              amount: match && !prev.amount ? String(match.depositAmount) : prev.amount,
                            }))
                          }}
                          disabled={depositListingsLoading}
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="">
                            {depositListingsLoading
                              ? 'Loading…'
                              : depositListings.length === 0
                                ? '— No awaiting-deposit MCs — use notes below'
                                : '— Not on platform (describe in notes) —'}
                          </option>
                          {depositListings.map((l) => (
                            <option key={l.transactionId} value={l.transactionId}>
                              {l.mc
                                ? `MC-${l.mc.mcNumber} · ${l.mc.legalName} · $${Number(l.depositAmount).toLocaleString()} deposit`
                                : `Transaction ${l.transactionId.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Amount ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={depositForm.amount}
                            onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Payment Method</label>
                          <select
                            value={depositForm.paymentMethod}
                            onChange={(e) => setDepositForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          >
                            <option value="WIRE">Wire</option>
                            <option value="ZELLE">Zelle</option>
                            <option value="CHECK">Check</option>
                            <option value="STRIPE">Stripe (manual)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">Reference / Confirmation # (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Zelle confirmation #"
                          value={depositForm.reference}
                          onChange={(e) => setDepositForm(prev => ({ ...prev, reference: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Notes {depositForm.transactionId ? '(optional)' : '(required — describe the MC)'}
                        </label>
                        <textarea
                          placeholder={depositForm.transactionId
                            ? 'Any extra context about the deposit'
                            : 'MC#, legal name, state, cargo type… anything to identify this MC'}
                          value={depositForm.notes}
                          onChange={(e) => setDepositForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      {depositFeedback && (
                        <div className={`text-xs px-3 py-2 rounded-lg ${
                          depositFeedback.type === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {depositFeedback.msg}
                        </div>
                      )}

                      <button
                        onClick={handleRecordManualDeposit}
                        disabled={depositSaving || !depositForm.amount || (!depositForm.transactionId && !depositForm.notes.trim())}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {depositSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                        {depositSaving ? 'Saving…' : 'Record Deposit'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Reset Password */}
                {showResetPasswordForm && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Key className="w-4 h-4 text-amber-700 mt-0.5" />
                        <div className="text-sm text-amber-900">
                          <p className="font-semibold">Reset password for {selectedUser.name}</p>
                          <p className="text-xs text-amber-800/80 mt-0.5">
                            Sets a new password immediately and logs the user out of all sessions. Share the new password with them out-of-band.
                          </p>
                        </div>
                      </div>
                      <Input
                        label="New password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={resetPasswordForm.newPassword}
                        onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                      />
                      <Input
                        label="Confirm password"
                        type="password"
                        placeholder="Re-enter password"
                        value={resetPasswordForm.confirmPassword}
                        onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                      />
                      {resetPasswordFeedback && (
                        <div
                          className={`text-sm rounded-lg p-2 ${
                            resetPasswordFeedback.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {resetPasswordFeedback.msg}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleResetPassword}
                          disabled={resetPasswordSaving || !resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {resetPasswordSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4 mr-2" />
                          )}
                          {resetPasswordSaving ? 'Saving…' : 'Set new password'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowResetPasswordForm(false)
                            setResetPasswordForm({ newPassword: '', confirmPassword: '' })
                            setResetPasswordFeedback(null)
                          }}
                          disabled={resetPasswordSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false)
                      navigate('/admin/messages', {
                        state: {
                          composeToUser: {
                            id: selectedUser.id,
                            name: selectedUser.name,
                            email: selectedUser.email,
                          }
                        }
                      })
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false)
                      openActivityLog(selectedUser)
                    }}
                  >
                    <History className="w-4 h-4 mr-2" />
                    View Activity Log
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResetPasswordFeedback(null)
                      setResetPasswordForm({ newPassword: '', confirmPassword: '' })
                      setShowResetPasswordForm((v) => !v)
                    }}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                  {!selectedUser.verified && selectedUser.status !== 'BLOCKED' && selectedUser.role === 'SELLER' && (
                    <Button
                      onClick={() => {
                        handleVerifyUser(selectedUser.id)
                        setSelectedUser({ ...selectedUser, verified: true })
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Seller
                    </Button>
                  )}
                  {selectedUser.status === 'BLOCKED' ? (
                    <Button
                      onClick={() => {
                        handleUnblockUser(selectedUser.id)
                        setSelectedUser({ ...selectedUser, status: 'ACTIVE' })
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Unblock User
                    </Button>
                  ) : selectedUser.role !== 'ADMIN' && (
                    <Button
                      variant="danger"
                      onClick={() => {
                        handleBlockUser(selectedUser.id)
                        setSelectedUser({ ...selectedUser, status: 'BLOCKED' })
                      }}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Block User
                    </Button>
                  )}
                  {selectedUser.role !== 'ADMIN' && (
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteUser(selectedUser)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Log Modal */}
      <AnimatePresence>
        {showActivityModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowActivityModal(false)
              setActivityLog(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Activity Log</h2>
                      <p className="text-white/80 text-sm">{selectedUser.name} ({selectedUser.email})</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowActivityModal(false)
                      setActivityLog(null)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Credits Summary */}
              {activityLog && (
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{activityLog.totalCredits}</p>
                      <p className="text-xs text-gray-500">Total Credits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{activityLog.usedCredits}</p>
                      <p className="text-xs text-gray-500">Used</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{activityLog.availableCredits}</p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActivityTab('unlocked')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activityTab === 'unlocked'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  Unlocked MCs ({activityLog?.unlockedMCs.length || 0})
                </button>
                <button
                  onClick={() => setActivityTab('transactions')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activityTab === 'transactions'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Credit Transactions ({activityLog?.creditTransactions.length || 0})
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activityLogLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                ) : !activityLog ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Failed to load activity log</p>
                  </div>
                ) : activityTab === 'unlocked' ? (
                  /* Unlocked MCs Tab */
                  <div className="space-y-3">
                    {activityLog.unlockedMCs.length === 0 ? (
                      <div className="text-center py-12">
                        <Unlock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No unlocked MCs yet</p>
                      </div>
                    ) : (
                      activityLog.unlockedMCs.map((mc) => (
                        <div
                          key={mc.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-bold text-indigo-600">MC-{mc.mcNumber}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  mc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                  mc.status === 'SOLD' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {mc.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 font-medium">{mc.title}</p>
                              {mc.legalName && (
                                <p className="text-xs text-gray-500">{mc.legalName}</p>
                              )}
                              {mc.location && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {mc.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {mc.viewCount} views
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Unlocked {formatDate(mc.unlockedAt)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {mc.creditsUsed} credit used
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Asking: <span className="font-semibold text-gray-900">${mc.askingPrice.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Credit Transactions Tab */
                  <div className="space-y-2">
                    {activityLog.creditTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No credit transactions yet</p>
                      </div>
                    ) : (
                      activityLog.creditTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.amount > 0
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {tx.amount > 0
                                ? <ArrowUpCircle className="w-5 h-5" />
                                : <ArrowDownCircle className="w-5 h-5" />
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount} credit{Math.abs(tx.amount) !== 1 ? 's' : ''}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  tx.type === 'PURCHASE' ? 'bg-blue-100 text-blue-700' :
                                  tx.type === 'USAGE' ? 'bg-orange-100 text-orange-700' :
                                  tx.type === 'REFUND' ? 'bg-green-100 text-green-700' :
                                  tx.type === 'BONUS' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {tx.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{tx.description}</p>
                              {tx.mcNumber && (
                                <p className="text-xs text-indigo-600 font-medium">
                                  MC-{tx.mcNumber} {tx.listingTitle && `- ${tx.listingTitle}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Balance: <span className="font-medium text-gray-900">{tx.balance}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  )
}

export default AdminUsersPage
