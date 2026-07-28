import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import TalkToMariaModal from './TalkToMariaModal'
import {
  Search,
  Activity,
  ShieldCheck,
  Bot,
  Briefcase,
  Database,
  Cpu,
  AlertTriangle,
  Network,
  Send,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Users,
  Handshake,
  LineChart,
  Wrench,
  Mail,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  UserSearch,
  ArrowLeftRight,
  Truck,
  CreditCard,
} from 'lucide-react'
import { DomileaMainLogo } from './ui/DomileaLogo'

type IconType = typeof Search

interface MenuItem {
  name: string
  desc?: string
  href: string
  icon?: IconType
  external?: boolean
  action?: 'consult'
}

const solutionsByProduct: MenuItem[] = [
  { name: 'Carrier Pulse', desc: 'Search 63M+ trucking data records to discover carriers and operating signals.', href: '/carrier-pulse-preview', icon: Search },
  { name: 'Domilea Exclusives', desc: 'Selected opportunities reviewed directly by Domilea.', href: '/marketplace', icon: Briefcase },
  { name: 'Deal Support', desc: 'Request Domilea to review, contact, and support an opportunity.', href: '/contact', icon: Handshake },
]

const solutionsByUseCase: MenuItem[] = [
  { name: 'Buyers & Strategic Acquirers', desc: 'Find companies worth pursuing and start with confidence.', href: '/marketplace', icon: Briefcase },
  { name: 'Investors', desc: 'Identify market trends and acquisition targets.', href: '/contact', icon: LineChart },
  { name: 'Safety & Compliance', desc: 'SMS, compliance, and operational health in one place.', href: '/product/safety', icon: Wrench },
  { name: 'Enterprise & API', desc: 'MorPro-powered intelligence APIs and trucking data infrastructure.', href: '/contact', icon: Network },
  { name: 'Drivers', desc: 'Now hiring owner-operators only — our technology and strategy are built to help owner-operators succeed in every way.', href: '/drivers', icon: Truck },
  { name: 'Driver Recruiting', desc: 'Hire qualified company drivers and owner-operators for your fleet.', href: '/product/recruiting', icon: Users },
]

const productItems: MenuItem[] = [
  { name: 'Carrier Pulse', desc: 'Search 63M+ trucking data records to discover carriers and operating signals.', href: '/carrier-pulse-preview', icon: Search },
  { name: 'Lead Generator', desc: 'Prospect carriers in bulk — Buyer ($49/mo) and Broker ($299/mo) plans.', href: '/lead-generator', icon: UserSearch },
  { name: 'Safety & Compliance', desc: 'SMS, authority, insurance, filings, and FMCSA changes in one place.', href: '/product/safety', icon: ShieldCheck },
  { name: 'MorPro API', desc: 'MorPro-powered APIs behind Domilea’s intelligence stack.', href: '/contact', icon: Network },
  { name: 'How to Buy a Trucking Business', desc: 'Step-by-step due diligence guide for acquiring a motor carrier.', href: '/resources/how-to-buy-a-trucking-business', icon: GraduationCap },
  { name: 'Book Consultation', desc: 'Talk to a Domilea expert about buying, monitoring, or growing your carrier.', href: '/contact', icon: Handshake, action: 'consult' },
]

const resourcesLearn: MenuItem[] = [
  { name: 'How Domilea Works', href: '/contact', icon: BookOpen },
  { name: 'Due Diligence Guide', href: '/resources/how-to-buy-a-trucking-business', icon: GraduationCap },
  { name: 'Carrier Health Score Guide', href: '/contact', icon: Activity },
  { name: 'SMS & Compliance Guide', href: '/contact', icon: ShieldCheck },
  { name: 'Trucking Acquisition Education', href: '/contact', icon: GraduationCap },
]

const resourcesCompany: MenuItem[] = [
  { name: 'About Domilea', href: '/contact' },
  { name: 'Contact', href: '/contact' },
  { name: 'Partners', href: '/contact' },
]

const resourcesSupport: MenuItem[] = [
  { name: 'Help Center', href: '/contact', icon: HelpCircle },
  { name: 'Request Support', href: '/contact', icon: Mail },
  { name: 'Compliance Disclaimer', href: '/terms', icon: ShieldCheck },
]

type MenuKey = 'solutions' | 'product' | 'resources' | null

const Navbar = () => {
  const { user, logout, isAuthenticated, switchRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [switching, setSwitching] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuKey>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<MenuKey>(null)
  const [consultOpen, setConsultOpen] = useState(false)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const authMenuRef = useRef<HTMLDivElement | null>(null)

  function openConsult() {
    setOpenMenu(null)
    setMobileOpen(false)
    setConsultOpen(true)
  }

  function openMenuWithDelay(key: MenuKey) {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpenMenu(key)
  }
  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 150)
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenMenu(null)
      setAuthMenuOpen(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  // Tapping anywhere outside the auth dropdown dismisses it.
  useEffect(() => {
    if (!authMenuOpen) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!authMenuRef.current?.contains(e.target as Node)) setAuthMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [authMenuOpen])

  // Any navigation closes the menus, so the destination page is never hidden
  // behind an open sheet the visitor has to dismiss by hand.
  useEffect(() => {
    setMobileOpen(false)
    setOpenMenu(null)
    setAuthMenuOpen(false)
  }, [location.pathname, location.search])

  // Keep the page behind the sheet from scrolling while it is open.
  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [mobileOpen])

  function toggleMobile() {
    setAuthMenuOpen(false)
    setMobileOpen(open => {
      const next = !open
      // Signed-out visitors are here to browse the products — show them
      // straight away instead of making them expand a second level.
      if (next) setMobileSection(isAuthenticated ? null : 'product')
      return next
    })
  }

  function handleLogout() {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  function dashboardLink(): string {
    if (!user) return '/'
    if (user.role === 'admin') return '/admin/dashboard'
    if (user.role === 'seller') return '/seller/dashboard'
    if (user.role === 'buyer') return '/buyer/dashboard'
    if (user.role === 'compliance_manager') return '/compliance/dashboard'
    return '/'
  }

  // If the current account can act as more than one role, show the *other*
  // role here so a single click flips the active session.
  function alternateRole(): 'buyer' | 'compliance_manager' | null {
    if (!user?.availableRoles) return null
    if (user.role === 'buyer' && user.availableRoles.includes('compliance_manager')) {
      return 'compliance_manager'
    }
    if (user.role === 'compliance_manager' && user.availableRoles.includes('buyer')) {
      return 'buyer'
    }
    return null
  }

  async function handleSwitchRole(target: 'buyer' | 'compliance_manager') {
    if (switching) return
    setSwitching(true)
    try {
      const updated = await switchRole(target)
      navigate(updated.role === 'compliance_manager' ? '/compliance/dashboard' : '/buyer/dashboard')
    } catch (err) {
      console.error('Role switch failed', err)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-domilea-line">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setOpenMenu(null)}>
            <DomileaMainLogo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/marketplace" className="px-3 py-2 text-sm font-medium text-domilea-ink/80 hover:text-domilea-ink rounded-lg" onMouseEnter={() => setOpenMenu(null)}>Marketplace</Link>
            <NavTrigger label="Product" isOpen={openMenu === 'product'} onEnter={() => openMenuWithDelay('product')} onLeave={scheduleClose} />
            <NavTrigger label="Solutions" isOpen={openMenu === 'solutions'} onEnter={() => openMenuWithDelay('solutions')} onLeave={scheduleClose} />
            <NavTrigger label="Resources" isOpen={openMenu === 'resources'} onEnter={() => openMenuWithDelay('resources')} onLeave={scheduleClose} />
            <Link to="/pricing" className="px-3 py-2 text-sm font-medium text-domilea-ink/80 hover:text-domilea-ink rounded-lg" onMouseEnter={() => setOpenMenu(null)}>Pricing</Link>
            <Link to="/contact" className="px-3 py-2 text-sm font-medium text-domilea-ink/80 hover:text-domilea-ink rounded-lg" onMouseEnter={() => setOpenMenu(null)}>Contact</Link>
          </div>

          {/* Right side auth — always shows Log in + Sign up; adds Dashboard/Sign out when authed */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Link to={dashboardLink()} className="text-sm font-medium text-domilea-ink/80 hover:text-domilea-ink flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {(() => {
                  const alt = alternateRole()
                  if (!alt) return null
                  const label = alt === 'compliance_manager' ? 'Switch to Compliance' : 'Switch to Buyer'
                  return (
                    <button
                      onClick={() => handleSwitchRole(alt)}
                      disabled={switching}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 disabled:opacity-50"
                      title={label}
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      {label}
                    </button>
                  )
                })()}
                <button onClick={handleLogout} className="text-sm text-domilea-muted hover:text-domilea-ink flex items-center gap-1.5" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
                <span className="h-5 w-px bg-domilea-line" aria-hidden />
              </>
            )}
            <Link to="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-2 transition-colors">Log in</Link>
            <Link to="/register" className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg px-4 py-2 shadow-lg shadow-indigo-500/30 transition-all">
              Sign up
            </Link>
          </div>

          {/* Mobile quick actions — Marketplace + Log in stay visible without opening the menu */}
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              to="/marketplace"
              onClick={() => setMobileOpen(false)}
              className="px-1.5 py-1.5 text-[13px] font-semibold text-domilea-ink whitespace-nowrap"
            >
              Marketplace
            </Link>
            {isAuthenticated ? (
              <Link
                to={dashboardLink()}
                onClick={() => setMobileOpen(false)}
                className="px-2.5 py-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-sm whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              // One compact chip holds both auth actions, so the header row stays
              // uncrowded on small screens and the menu needs no auth buttons.
              <div className="relative" ref={authMenuRef}>
                <button
                  onClick={() => { setMobileOpen(false); setAuthMenuOpen(o => !o) }}
                  aria-expanded={authMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50 rounded-lg whitespace-nowrap"
                >
                  Sign in
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${authMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {authMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-44 bg-white border border-domilea-line rounded-xl shadow-[0_12px_28px_-12px_rgba(11,18,32,0.25)] p-1.5 space-y-1"
                    >
                      <Link
                        to="/login"
                        role="menuitem"
                        onClick={() => setAuthMenuOpen(false)}
                        className="block w-full text-center px-3 py-2 rounded-lg text-[13px] font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        role="menuitem"
                        onClick={() => setAuthMenuOpen(false)}
                        className="block w-full text-center px-3 py-2 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm"
                      >
                        Sign up
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {/* Mobile burger */}
            <button
              className="text-domilea-ink p-1.5 -mr-1.5"
              onClick={toggleMobile}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mega menu panels */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-16 bg-white border-b border-domilea-line shadow-[0_8px_24px_-12px_rgba(11,18,32,0.12)]"
            onMouseEnter={() => openMenuWithDelay(openMenu)}
            onMouseLeave={scheduleClose}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {openMenu === 'solutions' && <SolutionsMega onPick={() => setOpenMenu(null)} />}
              {openMenu === 'product' && <ProductMega onPick={() => setOpenMenu(null)} />}
              {openMenu === 'resources' && <ResourcesMega onPick={() => setOpenMenu(null)} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-domilea-line bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <Link to="/marketplace" className="block px-3 py-2.5 text-sm font-medium text-domilea-ink" onClick={() => setMobileOpen(false)}>Marketplace</Link>
              <MobileSection label="Product" open={mobileSection === 'product'} onToggle={() => setMobileSection(s => (s === 'product' ? null : 'product'))}>
                <MobileGroup items={productItems} onPick={() => setMobileOpen(false)} />
              </MobileSection>
              <MobileSection label="Solutions" open={mobileSection === 'solutions'} onToggle={() => setMobileSection(s => (s === 'solutions' ? null : 'solutions'))}>
                <MobileGroup items={[...solutionsByProduct, ...solutionsByUseCase]} onPick={() => setMobileOpen(false)} />
              </MobileSection>
              <MobileSection label="Resources" open={mobileSection === 'resources'} onToggle={() => setMobileSection(s => (s === 'resources' ? null : 'resources'))}>
                <MobileGroup title="Learn" items={resourcesLearn} onPick={() => setMobileOpen(false)} />
                <MobileGroup title="Company" items={resourcesCompany} onPick={() => setMobileOpen(false)} />
                <MobileGroup title="Support" items={resourcesSupport} onPick={() => setMobileOpen(false)} />
              </MobileSection>
              <Link to="/pricing" className="block px-3 py-2.5 text-sm font-medium text-domilea-ink" onClick={() => setMobileOpen(false)}>Pricing</Link>
              <Link to="/contact" className="block px-3 py-2.5 text-sm font-medium text-domilea-ink" onClick={() => setMobileOpen(false)}>Contact</Link>
              {/* Account actions only — Log in and Sign up live in the header, so
                  browsing the menu never pushes a signed-out visitor to an account. */}
              {isAuthenticated && (
                <div className="pt-3 mt-3 border-t border-domilea-line space-y-2">
                  <Link to={dashboardLink()} onClick={() => setMobileOpen(false)} className="block w-full text-center bg-domilea-soft text-domilea-ink px-4 py-2.5 rounded-lg text-sm font-medium">Dashboard</Link>
                  <button onClick={handleLogout} className="block w-full text-center text-domilea-muted px-4 py-2.5 text-sm">Sign out</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function NavTrigger({ label, isOpen, onEnter, onLeave }: { label: string; isOpen: boolean; onEnter: () => void; onLeave: () => void }) {
  return (
    <button
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors ${isOpen ? 'text-domilea-ink' : 'text-domilea-ink/80 hover:text-domilea-ink'}`}
      aria-expanded={isOpen}
    >
      {label}
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
}

function SolutionsMega({ onPick }: { onPick: () => void }) {
  return (
    <div>
      <SectionLabel>Solutions</SectionLabel>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[...solutionsByProduct, ...solutionsByUseCase].map(item => (
          <MegaCard key={item.name} item={item} onClick={onPick} />
        ))}
      </div>
    </div>
  )
}

function ProductMega({ onPick }: { onPick: () => void }) {
  return (
    <div>
      <SectionLabel>Domilea Platform</SectionLabel>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {productItems.map(item => <MegaCard key={item.name} item={item} onClick={onPick} />)}
      </div>
    </div>
  )
}

function ResourcesMega({ onPick }: { onPick: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div>
        <SectionLabel>Learn</SectionLabel>
        <ul className="mt-4 space-y-2">
          {resourcesLearn.map(item => (
            <li key={item.name}>
              <Link to={item.href} onClick={onPick} className="text-sm text-domilea-ink/80 hover:text-domilea-ink flex items-center gap-2 py-1">
                {item.icon && <item.icon className="w-4 h-4 text-domilea-muted" />}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <SectionLabel>Company</SectionLabel>
        <ul className="mt-4 space-y-2">
          {resourcesCompany.map(item => (
            <li key={item.name}>
              <Link to={item.href} onClick={onPick} className="text-sm text-domilea-ink/80 hover:text-domilea-ink py-1 block">{item.name}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <SectionLabel>Support</SectionLabel>
        <ul className="mt-4 space-y-2">
          {resourcesSupport.map(item => (
            <li key={item.name}>
              <Link to={item.href} onClick={onPick} className="text-sm text-domilea-ink/80 hover:text-domilea-ink flex items-center gap-2 py-1">
                {item.icon && <item.icon className="w-4 h-4 text-domilea-muted" />}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MegaCard({ item, compact, onClick }: { item: MenuItem; compact?: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`group flex items-start gap-3 p-3 rounded-lg hover:bg-domilea-soft transition-colors ${compact ? '' : 'min-h-[68px]'}`}
    >
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-domilea-soft group-hover:bg-white border border-domilea-line flex items-center justify-center shrink-0 transition-colors">
          <Icon className="w-4 h-4 text-domilea-blue" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-domilea-ink">{item.name}</div>
        {item.desc && <div className="text-xs text-domilea-muted mt-0.5 leading-relaxed">{item.desc}</div>}
      </div>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-domilea-blue">{children}</div>
}

// Controlled by the navbar so only one section is expanded at a time — the
// sheet stays short enough that every entry is reachable without scrolling.
function MobileSection({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-domilea-line last:border-b-0">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-domilea-ink">
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-3 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileGroup({ title, items, onPick }: { title?: string; items: MenuItem[]; onPick: () => void }) {
  return (
    <div>
      {title && <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-domilea-blue mb-1">{title}</div>}
      <ul>
        {items.map(item => (
          <li key={item.name}>
            <Link to={item.href} onClick={onPick} className="flex items-center gap-2 px-3 py-2 text-sm text-domilea-ink/85 hover:bg-domilea-soft rounded">
              {item.icon && <item.icon className="w-4 h-4 text-domilea-muted shrink-0" />}
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Navbar
