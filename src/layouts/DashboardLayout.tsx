import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import EvaDrawer, { EvaTriggerButton } from '../components/agents/EvaDrawer'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  FileText,
  Shield,
  Users,
  AlertTriangle,
  Search,
  Bell,
  Receipt,
  CreditCard,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Unlock,
  Handshake,
  Send,
  Scale,
  ShieldAlert,
  Activity,
  LucideIcon,
  Calendar,
  FileSearch,
  Briefcase,
  Fuel,
  ShieldCheck,
  UserSearch,
  Truck,
  ClipboardList,
  User,
  Phone,
  Banknote,
  Bot,
  Sparkles,
  Building2,
  Umbrella,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DomileaLogoFull, DomileaIcon } from '../components/ui/DomileaLogo'
import TalkToMariaModal from '../components/TalkToMariaModal'
import clsx from 'clsx'
import api from '../services/api'

interface DashboardLayoutProps {
  children?: React.ReactNode
}

interface MenuItem {
  icon: LucideIcon
  label: string
  path: string
  badge?: string
  badgeColor?: string
}

interface MenuCategory {
  label: string
  icon: LucideIcon
  items: MenuItem[]
}

type MenuStructure = (MenuItem | MenuCategory)[]

const DashboardLayout = ({ children }: DashboardLayoutProps = {}) => {
  const { user, logout, isProfileComplete } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Sales Pipeline', 'Moderation']))
  const [isConsultationOpen, setIsConsultationOpen] = useState(false)
  const [buyerSubscription, setBuyerSubscription] = useState<{ plan?: string; status?: string } | null>(null)
  const [buyerSubscriptionLoading, setBuyerSubscriptionLoading] = useState(false)
  const [hasStandaloneCarrierPulse, setHasStandaloneCarrierPulse] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [newTransactionCount, setNewTransactionCount] = useState(0)
  const [activeClosingsCount, setActiveClosingsCount] = useState(0)
  const [paidConsultationsCount, setPaidConsultationsCount] = useState(0)
  const [pendingAdminOffersCount, setPendingAdminOffersCount] = useState(0)
  const [evaDrawerOpen, setEvaDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (user?.role !== 'buyer') {
      setBuyerSubscription(null)
      return
    }

    let isActive = true
    const fetchSubscription = async () => {
      try {
        setBuyerSubscriptionLoading(true)
        const response = await api.getSubscription()
        const subscription = response.data?.subscription || null
        if (isActive) {
          setBuyerSubscription(subscription ? { plan: subscription.plan, status: subscription.status } : null)
        }
      } catch (error) {
        if (isActive) {
          setBuyerSubscription(null)
        }
      } finally {
        if (isActive) {
          setBuyerSubscriptionLoading(false)
        }
      }
    }

    const fetchCarrierPulseAccess = async () => {
      try {
        const res = await api.getCarrierPulseAccess()
        if (isActive && res.success && res.data) {
          setHasStandaloneCarrierPulse(res.data.hasAccess && res.data.reason === 'standalone')
        }
      } catch {
        // ignore
      }
    }

    fetchSubscription()
    fetchCarrierPulseAccess()

    return () => {
      isActive = false
    }
  }, [user?.role])

  // Fetch nav badge counts (messages, transactions, closings) and refresh every 30s
  useEffect(() => {
    if (!user?.role) {
      setUnreadMessageCount(0)
      setNewTransactionCount(0)
      setActiveClosingsCount(0)
      setPaidConsultationsCount(0)
      setPendingAdminOffersCount(0)
      return
    }

    let isActive = true
    const fetchCounts = async () => {
      try {
        const res = await api.getNavBadgeCounts()
        if (isActive && res.data) {
          setUnreadMessageCount(res.data.unreadMessages || 0)
          setNewTransactionCount(res.data.newTransactions || 0)
          setActiveClosingsCount(res.data.activeClosings || 0)
          setPaidConsultationsCount(res.data.paidConsultations || 0)
          setPendingAdminOffersCount(res.data.pendingAdminOffers || 0)
        }
      } catch {
        // ignore
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [user?.role])

  // Define menu items based on user role
  const getMenuItems = (): MenuStructure => {
    const planLower = buyerSubscription?.plan?.toLowerCase()
    const isActive = buyerSubscription?.status === 'ACTIVE'

    const hasPremiumAccess =
      (planLower === 'premium' || planLower === 'enterprise' || planLower === 'vip_access') && isActive

    const hasEnterpriseAccess =
      (planLower === 'enterprise' || planLower === 'vip_access') && isActive

    // CarrierPulse is included with any active subscription
    const hasPulseAccess = isActive || hasStandaloneCarrierPulse

    // Lead Generator is its own product (separate from the admin Leads CRM).
    // Either tier (Buyer / Broker) — or VIP_ACCESS — grants access.
    const hasLeadGenAccess =
      (planLower === 'lead_generator_buyer' ||
        planLower === 'lead_generator_broker' ||
        planLower === 'vip_access') &&
      isActive

    switch (user?.role) {
      case 'seller':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/seller/dashboard' },
          { icon: Package, label: 'My Listings', path: '/seller/listings' },
          { icon: Plus, label: 'Create Listing', path: '/seller/carrier-pulse' },
          { icon: MessageSquare, label: 'Offers', path: '/seller/offers' },
          { icon: Handshake, label: 'Transactions', path: '/seller/transactions', ...(newTransactionCount > 0 ? { badge: String(newTransactionCount), badgeColor: 'bg-red-500' } : {}) },
          { icon: Banknote, label: 'Payout Setup', path: '/seller/payout-setup' },
          { icon: FileText, label: 'Documents', path: '/seller/documents' },
          { icon: MessageSquare, label: 'Messages', path: '/seller/messages', ...(unreadMessageCount > 0 ? { badge: String(unreadMessageCount), badgeColor: 'bg-red-500' } : {}) },
          {
            label: 'Product',
            icon: Briefcase,
            items: [
              { icon: Fuel, label: 'Fuel Program', path: '/product/fuel-program' },
              { icon: ShieldCheck, label: 'Safety Services', path: '/product/safety' },
              { icon: UserSearch, label: 'Recruiting', path: '/product/recruiting' },
              { icon: Truck, label: 'Dispatch', path: '/product/dispatch' },
              { icon: ClipboardList, label: 'Back Office', path: '/product/admin' },
            ]
          },
        ]
      case 'buyer':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/buyer/dashboard' },
          ...(hasEnterpriseAccess && !buyerSubscriptionLoading
            ? [{ icon: Crown, label: 'VIP Marketplace', path: '/buyer/vip-marketplace' }]
            : []),
          { icon: Unlock, label: 'Unlocked MCs', path: '/buyer/unlocked' },
          { icon: ShoppingCart, label: 'My Offers', path: '/buyer/offers' },
          { icon: Handshake, label: 'Transactions', path: '/buyer/transactions', ...(newTransactionCount > 0 ? { badge: String(newTransactionCount), badgeColor: 'bg-red-500' } : {}) },
          { icon: Package, label: 'Purchases', path: '/buyer/purchases' },
          { icon: MessageSquare, label: 'Messages', path: '/buyer/messages', ...(unreadMessageCount > 0 ? { badge: String(unreadMessageCount), badgeColor: 'bg-red-500' } : {}) },
          { icon: CreditCard, label: 'Subscription', path: '/buyer/subscription' },
          ...(hasPremiumAccess && !buyerSubscriptionLoading
            ? [{ icon: FileSearch, label: 'Credit Reports', path: '/buyer/creditsafe' }]
            : [{ icon: FileSearch, label: 'Credit Reports', path: '/buyer/credit-report', badge: '$35/report' as const }]),
          hasPulseAccess
            ? { icon: Activity, label: 'CarrierPulse', path: '/buyer/carrier-pulse' }
            : { icon: Activity, label: 'CarrierPulse', path: '/buyer/carrier-pulse', badge: 'New' as const },
          hasLeadGenAccess
            ? { icon: UserSearch, label: 'Lead Generator', path: '/buyer/lead-generator' }
            : { icon: UserSearch, label: 'Lead Generator', path: '/buyer/lead-generator', badge: 'New' as const },
          {
            label: 'Product',
            icon: Briefcase,
            items: [
              { icon: Fuel, label: 'Fuel Program', path: '/product/fuel-program' },
              { icon: ShieldCheck, label: 'Safety Services', path: '/product/safety' },
              { icon: UserSearch, label: 'Recruiting', path: '/product/recruiting' },
              { icon: Truck, label: 'Dispatch', path: '/product/dispatch' },
              { icon: ClipboardList, label: 'Back Office', path: '/product/admin' },
            ]
          },
        ]
      case 'compliance_manager':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/compliance/dashboard' },
          { icon: Building2, label: 'Companies', path: '/compliance/companies' },
          { icon: UserSearch, label: 'Drivers', path: '/compliance/drivers' },
          { icon: ClipboardList, label: 'Documents', path: '/compliance/documents' },
          { icon: Sparkles, label: 'Dia', path: '/compliance/dia' },
        ]
      case 'admin':
        return [
          { icon: Umbrella, label: 'Insurance Leads', path: '/admin/insurance-leads' },
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
          // Team — expanded with sub-items so the AI workspace is one collapsible section
          {
            label: 'Team',
            icon: Bot,
            items: [
              { icon: Bot, label: 'Overview', path: '/admin/team' },
              { icon: Sparkles, label: 'Eva', path: '/admin/team/eva' },
              { icon: UserSearch, label: 'Scout', path: '/admin/team/scout' },
              { icon: Activity, label: 'Activity', path: '/admin/team/activity' },
              { icon: ClipboardList, label: 'Jobs', path: '/admin/team/jobs' },
              { icon: Briefcase, label: 'Catalog', path: '/admin/team/catalog' },
              { icon: Banknote, label: 'Spend', path: '/admin/team/spend' },
            ]
          },
          { icon: Plus, label: 'Create Listing', path: '/admin/create-listing' },
          { icon: Activity, label: 'CarrierPulse', path: '/admin/carrier-pulse' },
          // Sales Pipeline category
          {
            label: 'Sales Pipeline',
            icon: Handshake,
            items: [
              { icon: MessageSquare, label: 'Inquiries', path: '/admin/messages', ...(unreadMessageCount > 0 ? { badge: String(unreadMessageCount), badgeColor: 'bg-red-500' } : {}) },
              { icon: Send, label: 'Offers', path: '/admin/offers', ...(pendingAdminOffersCount > 0 ? { badge: String(pendingAdminOffersCount), badgeColor: 'bg-red-500' } : {}) },
              { icon: Scale, label: 'Active Closings', path: '/admin/active-closings', ...(activeClosingsCount > 0 ? { badge: String(activeClosingsCount), badgeColor: 'bg-red-500' } : {}) },
              { icon: Handshake, label: 'Transactions', path: '/admin/transactions', ...(newTransactionCount > 0 ? { badge: String(newTransactionCount), badgeColor: 'bg-red-500' } : {}) },
            ]
          },
          // Finance category
          {
            label: 'Finance',
            icon: DollarSign,
            items: [
              { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
              { icon: Receipt, label: 'Invoices', path: '/admin/invoices' },
            ]
          },
          // Moderation category
          {
            label: 'Moderation',
            icon: Shield,
            items: [
              { icon: AlertTriangle, label: 'Pending Review', path: '/admin/pending' },
              { icon: Shield, label: 'Reported Items', path: '/admin/reported' },
              { icon: ShieldAlert, label: 'Account Disputes', path: '/admin/disputes' },
              { icon: Crown, label: 'Premium Requests', path: '/admin/premium-requests' },
              { icon: Phone, label: 'Broker Outreach', path: '/admin/broker-outreach' },
              { icon: MessageSquare, label: 'Consultations', path: '/admin/consultations', ...(paidConsultationsCount > 0 ? { badge: String(paidConsultationsCount), badgeColor: 'bg-red-500' } : {}) },
            ]
          },
          // Tools category
          {
            label: 'Tools',
            icon: Search,
            items: [
              { icon: UserSearch, label: 'Leads', path: '/admin/leads' },
              { icon: Search, label: 'Due Diligence', path: '/admin/due-diligence' },
              { icon: CreditCard, label: 'Credit Reports', path: '/admin/creditsafe' },
              { icon: Send, label: 'Telegram Channel', path: '/admin/telegram' },
              { icon: Users, label: 'Facebook Groups', path: '/admin/facebook' },
              { icon: ShieldAlert, label: 'Chameleon Check', path: '/admin/chameleon-check' },
              { icon: Shield, label: 'Safety Improvement Report', path: '/admin/safety-report' },
            ]
          },
          // Management category
          {
            label: 'Management',
            icon: Users,
            items: [
              { icon: Users, label: 'Users', path: '/admin/users' },
              { icon: Activity, label: 'Activity Log', path: '/admin/activity-log' },
              { icon: Package, label: 'Listings', path: '/admin/listings' },
              { icon: UserSearch, label: 'Lead Generator Saves', path: '/admin/lead-generator' },
              { icon: FileText, label: 'Reports', path: '/admin/reports' },
              { icon: Settings, label: 'Settings', path: '/admin/settings' },
            ]
          },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  // Check if any item in a category is active
  const isCategoryActive = (category: MenuCategory) => {
    return category.items.some(item => isActivePath(item.path))
  }

  // Check if item is a category (has items array)
  const isCategory = (item: MenuItem | MenuCategory): item is MenuCategory => {
    return 'items' in item
  }

  // Render a single menu item
  const renderMenuItem = (item: MenuItem, indented: boolean = false) => {
    const isActive = isActivePath(item.path)
    const Icon = item.icon

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={clsx(
          'flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200',
          indented && !isCollapsed && 'ml-4',
          isActive
            ? 'bg-black text-white'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Icon className={clsx('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-500')} />
        {!isCollapsed && (
          <>
            <span className={clsx('font-medium text-inherit', indented ? 'text-sm' : '')}>{item.label}</span>
            {item.badge && (
              <span className={clsx('ml-auto px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full text-white leading-none', item.badgeColor || 'bg-indigo-500')}>{item.badge}</span>
            )}
          </>
        )}
      </Link>
    )
  }

  // Render a category with collapsible items
  const renderCategory = (category: MenuCategory) => {
    const isExpanded = expandedCategories.has(category.label)
    const hasActiveItem = isCategoryActive(category)
    const Icon = category.icon

    return (
      <div key={category.label} className="space-y-1">
        <button
          onClick={() => toggleCategory(category.label)}
          className={clsx(
            'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200',
            hasActiveItem
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <div className="flex items-center space-x-3">
            <Icon className={clsx('h-4 w-4 flex-shrink-0', hasActiveItem ? 'text-gray-900' : 'text-gray-500')} />
            {!isCollapsed && (
              <span className="font-medium">{category.label}</span>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown
              className={clsx(
                'h-4 w-4 text-gray-400 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pt-1">
                {category.items.map(item => renderMenuItem(item, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show tooltip-like dropdown when collapsed */}
        {isCollapsed && (
          <div className="relative group">
            <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[160px]">
                <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1">
                  {category.label}
                </div>
                {category.items.map(item => {
                  const isActive = isActivePath(item.path)
                  const ItemIcon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <ItemIcon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-50 flex flex-col',
          'hidden lg:flex',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          sidebarOpen && '!flex w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
          <Link to="/" className="flex items-center text-gray-900">
            {isCollapsed ? (
              <DomileaIcon size={32} />
            ) : (
              <DomileaLogoFull height={26} />
            )}
          </Link>
          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* User Profile Card */}
        {!isCollapsed && (
          <div className="px-4 py-4 flex-shrink-0">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-600 font-semibold text-sm">
                    {user?.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - scrollable */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (isCategory(item)) {
              return renderCategory(item)
            } else {
              return renderMenuItem(item)
            }
          })}
        </nav>

        {/* Consultation Button - Buyers Only */}
        {user?.role === 'buyer' && (
          <div className="px-3 py-3 border-t border-gray-100">
            <button
              onClick={() => setIsConsultationOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium transition-all duration-200 shadow-sm"
            >
              <Calendar className="h-5 w-5" />
              {!isCollapsed && <span>Book Consultation</span>}
            </button>
          </div>
        )}

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1 flex-shrink-0">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
              isActivePath('/profile')
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <div className="relative">
              <Settings className={clsx('h-5 w-5 flex-shrink-0', isActivePath('/profile') ? 'text-white' : 'text-gray-600')} />
              {!isProfileComplete && user?.role !== 'admin' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-inherit">Settings</span>
                {!isProfileComplete && user?.role !== 'admin' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">!</span>
                )}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-gray-600" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={clsx('transition-all duration-300', isCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center text-gray-900">
              <DomileaLogoFull height={24} />
            </div>

            {/* Search - hidden on mobile */}
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile search button */}
            <button className="sm:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => user?.role === 'admin' ? navigate('/admin/messages') : undefined}>
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </button>
            {/* Trial badge for compliance managers */}
            {user?.trialEndsAt && (() => {
              const ms = new Date(user.trialEndsAt).getTime() - Date.now()
              const days = Math.ceil(ms / 86_400_000)
              const expired = days <= 0
              return (
                <span
                  title={`Trial ${expired ? 'expired' : 'ends'} ${new Date(user.trialEndsAt).toLocaleDateString()}`}
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                    expired ? 'bg-red-50 text-red-700 border border-red-200'
                    : days <= 3 ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {expired ? 'Trial expired' : `Trial · ${days}d left`}
                </span>
              )
            })()}
            <EvaTriggerButton onClick={() => setEvaDrawerOpen(true)} />
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="relative group">
              <button className="flex items-center space-x-3 cursor-pointer">
                <div className="w-9 h-9 bg-secondary-100 rounded-full flex items-center justify-center">
                  <span className="text-secondary-600 font-semibold text-sm">{user?.name.charAt(0)}</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-400" />
                  Profile
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Eva drawer — global slide-over from the right */}
        <EvaDrawer open={evaDrawerOpen} onClose={() => setEvaDrawerOpen(false)} />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* Consultation Modal */}
      <TalkToMariaModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </div>
  )
}

export default DashboardLayout
