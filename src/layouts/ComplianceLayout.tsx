import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  UserSearch,
  ClipboardList,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Truck,
  Shield,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'

type NavLeaf = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  matchPrefix?: string
}

const PRIMARY_NAV: NavLeaf[] = [
  { to: '/compliance/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/compliance/companies', label: 'Companies', icon: Building2, matchPrefix: '/compliance/companies' },
  { to: '/compliance/drivers', label: 'Drivers', icon: UserSearch, matchPrefix: '/compliance/drivers' },
  { to: '/compliance/documents', label: 'Documents', icon: ClipboardList },
  { to: '/compliance/dia', label: 'Dia', icon: Sparkles },
]

const SECONDARY_NAV: NavLeaf[] = [
  { to: '/profile', label: 'Settings', icon: Settings },
]

export default function ComplianceLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (item: NavLeaf) => {
    if (item.matchPrefix) return location.pathname.startsWith(item.matchPrefix)
    return location.pathname === item.to
  }

  const trialBadge = (() => {
    if (!user?.trialEndsAt) return null
    const ms = new Date(user.trialEndsAt).getTime() - Date.now()
    const days = Math.ceil(ms / 86_400_000)
    const expired = days <= 0
    return { expired, days, ends: new Date(user.trialEndsAt).toLocaleDateString() }
  })()

  return (
    <div className="linq-scope min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <Sidebar
        primary={PRIMARY_NAV}
        secondary={SECONDARY_NAV}
        isActive={isActive}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        userName={user?.name}
      />

      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 border-b"
          style={{
            borderColor: 'var(--linq-border)',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search carriers, drivers, documents…"
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-white/70 border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--linq-border)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {trialBadge && (
              <span
                title={`Trial ${trialBadge.expired ? 'expired' : 'ends'} ${trialBadge.ends}`}
                className={clsx(
                  'chip',
                  trialBadge.expired ? 'chip-bad' : trialBadge.days <= 3 ? 'chip-warn' : 'chip-accent'
                )}
              >
                {trialBadge.expired ? 'Trial expired' : `Trial · ${trialBadge.days}d`}
              </span>
            )}
            <button className="relative p-2 rounded-lg hover:bg-slate-100">
              <Bell className="w-5 h-5 text-slate-600" />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-cyan-500/20">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Compliance Manager
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Sidebar({
  primary,
  secondary,
  isActive,
  mobileOpen,
  onClose,
  onLogout,
  userName,
}: {
  primary: NavLeaf[]
  secondary: NavLeaf[]
  isActive: (i: NavLeaf) => boolean
  mobileOpen: boolean
  onClose: () => void
  onLogout: () => void
  userName?: string
}) {
  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 w-60 flex-col z-50',
        'border-r',
        mobileOpen ? 'flex' : 'hidden lg:flex'
      )}
      style={{
        borderColor: 'var(--linq-border)',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b" style={{ borderColor: 'var(--linq-border)' }}>
        <Link to="/compliance/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="leading-tight">
            <span className="block font-bold tracking-tight text-lg text-slate-900">Domilea</span>
            <span className="block text-[10px] tracking-wide -mt-0.5" style={{ color: 'var(--linq-muted)' }}>
              compliance workspace
            </span>
          </span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Primary nav */}
      <div className="px-3 pt-4">
        <div className="text-[10px] uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--linq-muted)' }}>
          Safety &amp; Compliance
        </div>
        <nav className="space-y-0.5">
          {primary.map((item) => (
            <SidebarLink key={item.to} item={item} active={isActive(item)} onClick={onClose} />
          ))}
        </nav>
      </div>

      {/* Bottom area */}
      <div className="mt-auto px-3 pb-4">
        <nav className="space-y-0.5">
          {secondary.map((item) => (
            <SidebarLink key={item.to} item={item} active={isActive(item)} onClick={onClose} />
          ))}
        </nav>
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 opacity-90" />
            <div className="leading-tight">
              <div className="text-[10px] opacity-80 uppercase tracking-wider">Signed in as</div>
              <div className="font-semibold text-sm truncate max-w-[140px]">{userName || 'Compliance manager'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-2 w-full text-center text-xs font-medium rounded-md bg-black/25 text-white/95 py-1.5 hover:bg-black/35 inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarLink({
  item,
  active,
  onClick,
}: {
  item: NavLeaf
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      )}
    >
      <Icon className={clsx('w-4 h-4', active ? 'text-cyan-700' : 'text-slate-500')} />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  )
}
