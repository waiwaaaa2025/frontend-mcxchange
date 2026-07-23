import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import 'framer-motion'
import {
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  Hash,
  User,
  CreditCard,
  Coins,
  XCircle,
  Loader2,
  CheckCheck,
  Plus,
  Minus,
  ArrowLeft,
  X,
  Ban,
  Crown
} from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import Input from '../components/ui/Input'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

interface UserSummary {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
}

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  listingId?: string
  listingTitle?: string
  mcNumber?: string
  status: 'new' | 'in-progress' | 'responded' | 'closed'
  userEmail?: string
  userPhone?: string
  hasActiveSubscription?: boolean
  hasCredits?: boolean
  isVip?: boolean
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  sender?: {
    id: string
    name: string
    avatar?: string | null
  }
}

interface UserQuickInfo {
  id: string
  name: string
  email: string
  phone?: string
  totalCredits: number
  usedCredits: number
  subscription?: {
    id: string
    plan: string
    status: string
    currentPeriodEnd?: string
  } | null
}

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  responded: { label: 'Responded', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle }
}

const AdminMessagesPage = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)
  const [userResults, setUserResults] = useState<UserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [composeMessage, setComposeMessage] = useState('')

  // Quick user info popup state
  const [showUserQuickInfo, setShowUserQuickInfo] = useState(false)
  const [userQuickInfo, setUserQuickInfo] = useState<UserQuickInfo | null>(null)
  const [userQuickInfoLoading, setUserQuickInfoLoading] = useState(false)

  // Credits adjustment state
  const [creditAmount, setCreditAmount] = useState<string>('')
  const [creditReason, setCreditReason] = useState<string>('')
  const [creditAdjusting, setCreditAdjusting] = useState(false)

  // Cancel subscription state
  const [cancellingSubscription, setCancellingSubscription] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  // Mobile view state - show detail view on mobile
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getMessageConversations()
        const fetched = response.data || []

        const listingIds = Array.from(
          new Set(fetched.map((conv) => conv.listingId).filter(Boolean))
        ) as string[]

        const listingMap = new Map<string, { title?: string; mcNumber?: string }>()
        await Promise.all(
          listingIds.map(async (listingId) => {
            try {
              const listingResponse = await api.getListing(listingId)
              listingMap.set(listingId, {
                title: listingResponse.data?.title,
                mcNumber: listingResponse.data?.mcNumber,
              })
            } catch {
              listingMap.set(listingId, {})
            }
          })
        )

        const mapped: Conversation[] = fetched.map((conv) => ({
          ...conv,
          listingTitle: conv.listingId ? listingMap.get(conv.listingId)?.title : undefined,
          mcNumber: conv.listingId ? listingMap.get(conv.listingId)?.mcNumber : undefined,
          status: conv.unreadCount > 0 ? 'new' : 'responded',
        }))

        setConversations(mapped)
        if (mapped.length > 0 && !selectedConversationId) {
          setSelectedConversationId(mapped[0].participantId)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load inquiries')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // Handle navigation from AdminUsersPage "Send Message" button
  useEffect(() => {
    const state = location.state as { composeToUser?: { id: string; name: string; email: string } } | null
    if (state?.composeToUser) {
      setSelectedUser({
        id: state.composeToUser.id,
        name: state.composeToUser.name,
        email: state.composeToUser.email,
        role: '',
        status: '',
      })
      setShowComposeModal(true)
      // Clear the state so refreshing doesn't re-open the modal
      window.history.replaceState({}, '')
    }
  }, [location.state])

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) return
      try {
        const response = await api.getMessageConversation(selectedConversationId)
        setMessages(response.data || [])
        setConversations((prev) =>
          prev.map((conv) =>
            conv.participantId === selectedConversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        )

        const userDetailsResponse = await api.getAdminUserDetails(selectedConversationId)
        const userDetails = userDetailsResponse?.data || {}
        const hasActiveSubscription = userDetails?.subscription?.status === 'ACTIVE'
        const availableCredits = (userDetails?.totalCredits || 0) - (userDetails?.usedCredits || 0)
        const hasCredits = availableCredits > 0
        const isVip =
          userDetails?.subscription?.plan === 'VIP_ACCESS' &&
          userDetails?.subscription?.status === 'ACTIVE'

        setConversations((prev) =>
          prev.map((conv) =>
            conv.participantId === selectedConversationId
              ? {
                  ...conv,
                  userEmail: userDetails?.email,
                  userPhone: userDetails?.phone,
                  participantName: userDetails?.name || conv.participantName,
                  hasActiveSubscription,
                  hasCredits,
                  isVip,
                }
              : conv
          )
        )
      } catch (err: any) {
        setError(err.message || 'Failed to load messages')
      }
    }

    loadMessages()
  }, [selectedConversationId])

  const selectedConversation = conversations.find(
    (conv) => conv.participantId === selectedConversationId
  )

  // Handle selecting a conversation (also shows mobile detail)
  const handleSelectConversation = (participantId: string) => {
    setSelectedConversationId(participantId)
    setShowMobileDetail(true)
  }

  // Handle back button on mobile
  const handleMobileBack = () => {
    setShowMobileDetail(false)
  }

  const filteredConversations = conversations.filter((conversation) => {
    const matchesStatus = filterStatus === 'all' || conversation.status === filterStatus
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === '' ||
      conversation.participantName.toLowerCase().includes(term) ||
      (conversation.mcNumber || '').includes(searchTerm) ||
      (conversation.userEmail || '').toLowerCase().includes(term)
    return matchesStatus && matchesSearch
  })

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return
    try {
      setSending(true)
      const response = await api.sendMessage(
        selectedConversation.participantId,
        replyMessage.trim(),
        selectedConversation.listingId
      )
      const newMessage = response.data as Message
      setMessages((prev) => [...prev, newMessage])
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === selectedConversation.participantId
            ? {
                ...conv,
                lastMessage: newMessage.content,
                lastMessageAt: newMessage.createdAt,
                status: 'responded',
              }
            : conv
        )
      )
      setReplyMessage('')
    } catch (err: any) {
      setError(err.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleOpenCompose = async () => {
    setShowComposeModal(true)
  }

  const handleSendNewMessage = async () => {
    if (!selectedUser || !composeMessage.trim()) return
    try {
      setSending(true)
      const response = await api.sendMessage(
        selectedUser.id,
        composeMessage.trim()
      )
      const newMessage = response.data as Message

      setConversations((prev) => {
        const existing = prev.find((conv) => conv.participantId === selectedUser.id)
        if (existing) {
          return prev.map((conv) =>
            conv.participantId === selectedUser.id
              ? {
                  ...conv,
                  lastMessage: newMessage.content,
                  lastMessageAt: newMessage.createdAt,
                  status: 'responded',
                }
              : conv
          )
        }
        return [
          {
            id: selectedUser.id,
            participantId: selectedUser.id,
            participantName: selectedUser.name,
            participantAvatar: null,
            lastMessage: newMessage.content,
            lastMessageAt: newMessage.createdAt,
            unreadCount: 0,
            status: 'responded',
            userEmail: selectedUser.email,
            userPhone: selectedUser.phone,
          },
          ...prev,
        ]
      })

      setSelectedConversationId(selectedUser.id)
      setShowComposeModal(false)
      setComposeMessage('')
      setSelectedUser(null)
      setUserSearch('')
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!showComposeModal) return

    const term = userSearch.trim()
    if (term.length < 2) {
      setUserResults([])
      setUserError(null)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setUserLoading(true)
        setUserError(null)
        const response = await api.getAdminUsers({ search: term, limit: 20 }) as any
        const users = response.users || response.data || []
        setUserResults(users)
      } catch (err: any) {
        setUserError(err.message || 'Failed to search users')
      } finally {
        setUserLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [showComposeModal, userSearch])

  const handleStatusChange = (conversationId: string, newStatus: Conversation['status']) => {
    setConversations(prev => prev.map(conv =>
      conv.participantId === conversationId
        ? { ...conv, status: newStatus }
        : conv
    ))

    setShowStatusDropdown(null)
  }

  const handleCancelSubscription = async (userId: string) => {
    try {
      setCancellingSubscription(true)
      await api.cancelUserSubscription(userId)

      // Send cancellation notice in the chat
      const conv = conversations.find(c => c.participantId === userId)
      if (conv) {
        try {
          const msgResponse = await api.sendMessage(
            userId,
            'Your subscription has been cancelled. If you believe this was done in error or have any questions, please reply here.',
            conv.listingId
          )
          const newMessage = msgResponse.data as Message
          setMessages(prev => [...prev, newMessage])
          setConversations(prev => prev.map(c =>
            c.participantId === userId
              ? { ...c, lastMessage: newMessage.content, lastMessageAt: newMessage.createdAt, hasActiveSubscription: false }
              : c
          ))
        } catch {
          // Message send failed, still update subscription status
          setConversations(prev => prev.map(c =>
            c.participantId === userId
              ? { ...c, hasActiveSubscription: false }
              : c
          ))
        }
      } else {
        setConversations(prev => prev.map(c =>
          c.participantId === userId
            ? { ...c, hasActiveSubscription: false }
            : c
        ))
      }

      // Update quick info if loaded
      if (userQuickInfo && userQuickInfo.id === userId) {
        setUserQuickInfo(prev => prev ? {
          ...prev,
          subscription: prev.subscription ? { ...prev.subscription, status: 'CANCELLED' } : null
        } : null)
      }
      setShowCancelConfirm(null)
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
      setError('Failed to cancel subscription')
    } finally {
      setCancellingSubscription(false)
    }
  }

  const handleShowUserQuickInfo = async (userId: string) => {
    try {
      setShowUserQuickInfo(true)
      setUserQuickInfoLoading(true)
      setUserQuickInfo(null)
      setCreditAmount('')
      setCreditReason('')

      const response = await api.getAdminUserDetails(userId)
      const userData = response.data || response

      setUserQuickInfo({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        totalCredits: userData.totalCredits || 0,
        usedCredits: userData.usedCredits || 0,
        subscription: userData.subscription ? {
          id: userData.subscription.id,
          plan: userData.subscription.plan,
          status: userData.subscription.status,
          currentPeriodEnd: userData.subscription.currentPeriodEnd,
        } : null,
      })
    } catch (err: any) {
      console.error('Failed to load user info:', err)
    } finally {
      setUserQuickInfoLoading(false)
    }
  }

  const handleAdjustCredits = async (isAdding: boolean) => {
    if (!userQuickInfo || !creditAmount || !creditReason.trim()) return

    const amount = parseInt(creditAmount, 10)
    if (isNaN(amount) || amount <= 0) return

    const adjustmentAmount = isAdding ? amount : -amount

    try {
      setCreditAdjusting(true)
      const response = await api.adjustUserCredits(userQuickInfo.id, adjustmentAmount, creditReason.trim()) as any
      const result = response.data || response

      // Update local state with new credits
      setUserQuickInfo({
        ...userQuickInfo,
        totalCredits: result.newTotal,
        usedCredits: result.usedCredits,
      })

      // Update conversation state too
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === userQuickInfo.id
            ? { ...conv, hasCredits: result.availableCredits > 0 }
            : conv
        )
      )

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

  const stats = {
    total: conversations.length,
    new: conversations.filter(i => i.status === 'new').length,
    inProgress: conversations.filter(i => i.status === 'in-progress').length,
    responded: conversations.filter(i => i.status === 'responded').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MC Inquiries</h1>
          <p className="text-sm sm:text-base text-gray-500">Manage all messages from potential buyers</p>
        </div>
        <Button onClick={handleOpenCompose} className="w-full sm:w-auto py-3 sm:py-2">
          <Send className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.new}</div>
              <div className="text-sm text-gray-500">New</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.responded}</div>
              <div className="text-sm text-gray-500">Responded</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inquiry List - Hidden on mobile when viewing detail */}
        <div className={`lg:col-span-1 space-y-4 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
          {/* Search & Filter */}
          <Card className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, MC#..."
                className="w-full pl-10 pr-4 py-3 sm:py-2 text-base rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                style={{ fontSize: '16px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {['all', 'new', 'in-progress', 'responded', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors active:scale-95 ${
                    filterStatus === status
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* Inquiry List */}
          <div className="space-y-2 max-h-[50vh] sm:max-h-[600px] overflow-y-auto">
            {loading ? (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Loading inquiries...</p>
              </Card>
            ) : error ? (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{error}</p>
              </Card>
            ) : filteredConversations.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No inquiries found</p>
              </Card>
            ) : (
              filteredConversations.map((conversation) => {
                // StatusIcon available for future use
void statusConfig[conversation.status].icon
                return (
                  <Card
                    key={conversation.participantId}
                    hover
                    className={`p-4 cursor-pointer transition-all active:scale-[0.98] ${
                      selectedConversationId === conversation.participantId ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation.participantId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{conversation.participantName.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 text-sm">{conversation.participantName}</span>
                            {conversation.isVip && (
                              <span
                                title="VIP / Deal Access Pass holder"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200"
                              >
                                <Crown className="w-3 h-3" />
                                VIP
                              </span>
                            )}
                            {conversation.hasActiveSubscription !== undefined && (
                              conversation.hasActiveSubscription || conversation.hasCredits ? (
                                <span title="Active subscription or has credits">
                                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                                </span>
                              ) : (
                                <span title="No active subscription, no credits">
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                                </span>
                              )
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {conversation.mcNumber ? `MC #${conversation.mcNumber}` : 'MC Inquiry'}
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[conversation.status].color}`}>
                        {statusConfig[conversation.status].label}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{conversation.lastMessage}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{format(new Date(conversation.lastMessageAt), 'MMM d, yyyy h:mm a')}</span>
                      {conversation.unreadCount > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Inquiry Detail - Hidden on mobile unless viewing detail */}
        <div className={`lg:col-span-2 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Mobile Back Button */}
                    <button
                      onClick={handleMobileBack}
                      className="lg:hidden w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-white">{selectedConversation.participantName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{selectedConversation.participantName}</h2>
                        {selectedConversation.isVip && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <Crown className="w-3.5 h-3.5" />
                            VIP
                          </span>
                        )}
                        {selectedConversation.hasActiveSubscription !== undefined && (
                          selectedConversation.hasActiveSubscription || selectedConversation.hasCredits ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <CheckCheck className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              <XCircle className="w-3.5 h-3.5" />
                              No Sub/Credits
                            </span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {selectedConversation.mcNumber ? `MC ${selectedConversation.mcNumber}` : 'MC Inquiry'}
                        </span>
                        <span>{format(new Date(selectedConversation.lastMessageAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(showStatusDropdown === selectedConversation.participantId ? null : selectedConversation.participantId)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 ${statusConfig[selectedConversation.status].color}`}
                    >
                      {statusConfig[selectedConversation.status].label}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showStatusDropdown === selectedConversation.participantId && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                        {(['new', 'in-progress', 'responded', 'closed'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(selectedConversation.participantId, status)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              status === 'new' ? 'bg-blue-500' :
                              status === 'in-progress' ? 'bg-yellow-500' :
                              status === 'responded' ? 'bg-emerald-500' : 'bg-gray-500'
                            }`} />
                            {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cancel Subscription Button */}
                  {selectedConversation.hasActiveSubscription && (
                    <div className="relative">
                      {showCancelConfirm === selectedConversation.participantId ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCancelSubscription(selectedConversation.participantId)}
                            disabled={cancellingSubscription}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {cancellingSubscription ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            Confirm
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(null)}
                            className="px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCancelConfirm(selectedConversation.participantId)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cancel Sub
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Contact Info - Mobile-friendly grid */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
                  {selectedConversation.userEmail && (
                    <a
                      href={`mailto:${selectedConversation.userEmail}`}
                      className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-indigo-600 active:text-indigo-700 transition-colors bg-gray-50 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{selectedConversation.userEmail}</span>
                    </a>
                  )}
                  {selectedConversation.userPhone && (
                    <a
                      href={`tel:${selectedConversation.userPhone}`}
                      className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-indigo-600 active:text-indigo-700 transition-colors bg-gray-50 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedConversation.userPhone}</span>
                    </a>
                  )}
                  {selectedConversation.listingId && (
                    <a
                      href={`/mc/${selectedConversation.listingId}`}
                      target="_blank"
                      className="flex items-center gap-2 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 active:text-indigo-800 transition-colors bg-indigo-50 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      View Listing
                    </a>
                  )}
                  {/* Quick User Info Button */}
                  <button
                    onClick={() => handleShowUserQuickInfo(selectedConversation.participantId)}
                    className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 active:text-emerald-800 transition-colors bg-emerald-50 hover:bg-emerald-100 px-3 py-2 sm:py-1.5 rounded-lg"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    User Info
                  </button>
                </div>
              </div>

              {/* Messages - Mobile optimized height */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[50vh] sm:max-h-[400px]">
                {messages.map((msg) => {
                  const isAdmin = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex gap-2 sm:gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!isAdmin && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{selectedConversation.participantName.charAt(0)}</span>
                        </div>
                      )}
                      <div className={`${isAdmin ? 'max-w-[85%] sm:max-w-[80%]' : 'flex-1 max-w-[85%] sm:max-w-none'}`}>
                        <div className={`${isAdmin ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' : 'bg-gray-100 rounded-2xl rounded-tl-none'} p-3 sm:p-4`}>
                          <p className="text-sm sm:text-base break-words">{msg.content}</p>
                        </div>
                        <div className={`text-xs text-gray-400 mt-1 ${isAdmin ? 'text-right mr-2' : 'ml-2'}`}>
                          {isAdmin ? 'Admin' : selectedConversation.participantName} • {format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">A</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Reply Input - Mobile optimized with sticky behavior */}
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-white">
                <div className="flex gap-2 sm:gap-3">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={2}
                    className="flex-1 text-base"
                    style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sending}
                    className="self-end px-3 sm:px-4 h-10 sm:h-auto"
                  >
                    <Send className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-8 sm:p-12">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Select an Inquiry</h3>
                <p className="text-sm sm:text-base text-gray-500">Choose an inquiry from the list to view details and respond</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showComposeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowComposeModal(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl">
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 -m-6 mb-6 p-4 sm:p-6 border-b border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">New Message</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Start a conversation with any user</p>
                  </div>
                  <button
                    onClick={() => setShowComposeModal(false)}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pb-safe">
                {selectedUser ? (
                  <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-200">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{selectedUser.name}</div>
                      <div className="text-xs text-gray-500">{selectedUser.email}</div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Input
                        placeholder="Search users by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
                        className="text-base"
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    <div className="max-h-40 sm:max-h-52 overflow-y-auto rounded-lg border border-gray-200">
                      {userSearch.trim().length < 2 ? (
                        <div className="p-4 text-sm text-gray-500">Type at least 2 characters to search</div>
                      ) : userLoading ? (
                        <div className="p-4 text-sm text-gray-500">Searching users...</div>
                      ) : userError ? (
                        <div className="p-4 text-sm text-red-500">{userError}</div>
                      ) : userResults.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No users found</div>
                      ) : (
                        userResults.map((userItem) => (
                          <button
                            key={userItem.id}
                            onClick={() => setSelectedUser(userItem)}
                            className="w-full px-4 py-4 sm:py-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100"
                          >
                            <div className="text-sm font-semibold text-gray-900">{userItem.name}</div>
                            <div className="text-xs text-gray-500">{userItem.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                <Textarea
                  placeholder={selectedUser ? `Message ${selectedUser.name}...` : 'Select a user to start messaging'}
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  rows={3}
                  disabled={!selectedUser}
                  className="text-base"
                  style={{ fontSize: '16px' }}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => setShowComposeModal(false)}
                    className="py-3 sm:py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleSendNewMessage}
                    disabled={!selectedUser || !composeMessage.trim() || sending}
                    className="py-3 sm:py-2"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* User Quick Info Popup */}
      {showUserQuickInfo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowUserQuickInfo(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl">
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 -m-6 mb-6 p-4 sm:p-6 border-b border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">User Info</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Credits & Subscription Status</p>
                  </div>
                  <button
                    onClick={() => setShowUserQuickInfo(false)}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {userQuickInfoLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : userQuickInfo ? (
                <div className="space-y-4">
                  {/* User Details */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{userQuickInfo.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{userQuickInfo.name}</div>
                        <div className="text-sm text-gray-500">{userQuickInfo.email}</div>
                      </div>
                    </div>
                    {userQuickInfo.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {userQuickInfo.phone}
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-gray-900">Credits</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{userQuickInfo.totalCredits}</div>
                        <div className="text-xs text-gray-500">Total Credits</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{userQuickInfo.totalCredits - userQuickInfo.usedCredits}</div>
                        <div className="text-xs text-gray-500">Available</div>
                      </div>
                    </div>

                    {/* Quick Credit Adjustment */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="text-xs font-medium text-gray-500 mb-2">Quick Adjust Credits</div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          min="1"
                          className="flex-1 px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Reason (required)"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-2"
                        style={{ fontSize: '16px' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdjustCredits(true)}
                          disabled={!creditAmount || !creditReason.trim() || creditAdjusting}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-3 sm:py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {creditAdjusting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAdjustCredits(false)}
                          disabled={!creditAmount || !creditReason.trim() || creditAdjusting || (userQuickInfo.totalCredits - userQuickInfo.usedCredits) === 0}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-3 sm:py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {creditAdjusting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Minus className="w-4 h-4" />
                              Remove
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {userQuickInfo.totalCredits === 0 && userQuickInfo.usedCredits === 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        No credits available
                      </div>
                    )}
                  </div>

                  {/* Subscription */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-indigo-500" />
                      <span className="font-semibold text-gray-900">Subscription</span>
                    </div>
                    {userQuickInfo.subscription ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Plan</span>
                          <span className="font-semibold text-gray-900 capitalize">{userQuickInfo.subscription.plan}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            userQuickInfo.subscription.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {userQuickInfo.subscription.status}
                          </span>
                        </div>
                        {userQuickInfo.subscription.currentPeriodEnd && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Renews</span>
                            <span className="text-sm text-gray-900">
                              {new Date(userQuickInfo.subscription.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        No active subscription
                      </div>
                    )}
                  </div>

                  {/* Summary Alert */}
                  {!userQuickInfo.subscription && (userQuickInfo.totalCredits - userQuickInfo.usedCredits) === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-red-700">No Active Subscription & No Credits</div>
                          <div className="text-sm text-red-600 mt-1">
                            This user cannot unlock listings or make purchases without credits or an active subscription.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load user information
                </div>
              )}

              <div className="mt-6 pb-safe">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowUserQuickInfo(false)}
                  className="py-3 sm:py-2"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMessagesPage
