import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Fuel,
  Shield,
  Users,
  Truck,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Activity,
  FileSearch,
  Umbrella,
  Bot,
  DollarSign,
  SquareParking,
} from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button'
import { DomileaMainLogo } from './ui/DomileaLogo'

const Navbar = () => {
  const { user, logout, isAuthenticated, isIdentityVerified } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false)
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)

  const toolLinks = [
    { name: 'CarrierPulse', href: '/carrier-pulse-preview', icon: Activity, desc: 'Carrier intelligence platform', comingSoon: false },
    { name: 'Insurance Leads', href: '/insurance-leads-preview', icon: Umbrella, desc: 'Find carriers with lapsing insurance', comingSoon: false },
    { name: 'Credit Reports', href: '/credit-report-preview', icon: FileSearch, desc: 'Business credit intelligence — $35/report', comingSoon: false },
    { name: 'Eva AI', href: '/eva-ai', icon: Bot, desc: 'AI compliance management — coming soon', comingSoon: false },
  ]

  const serviceLinks = [
    { name: 'Parking', href: 'https://www.gospotty.com/', icon: SquareParking, desc: 'List or find truck parking', external: true },
    { name: 'Fuel Program', href: '/services/fuel-program', icon: Fuel, desc: 'Save on fuel costs' },
    { name: 'Safety Services', href: '/services/safety', icon: Shield, desc: 'DOT compliance' },
    { name: 'Recruiting', href: '/services/recruiting', icon: Users, desc: 'Find qualified drivers' },
    { name: 'Dispatch', href: '/services/dispatch', icon: Truck, desc: 'Keep trucks loaded' },
    { name: 'Admin Services', href: '/services/admin', icon: FileText, desc: 'Back office support' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'seller':
        return '/seller/dashboard'
      case 'buyer':
        return '/buyer/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center text-gray-900"
            >
              <DomileaMainLogo height={36} />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/marketplace"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Marketplace
            </Link>

            {/* Tools Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setToolsDropdownOpen(true)}
              onMouseLeave={() => setToolsDropdownOpen(false)}
            >
              <button
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                <span>Tools</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-600 leading-none">New</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {toolsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-80"
                  >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                      <div className="p-2">
                        {toolLinks.map((tool) => (
                          <Link
                            key={tool.name}
                            to={tool.href}
                            className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group ${tool.comingSoon ? 'opacity-60 pointer-events-none' : ''}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                              <tool.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{tool.name}</span>
                                {tool.comingSoon && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-600">Coming Soon</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{tool.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pricing Link */}
            <Link
              to="/pricing"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Pricing
            </Link>

            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <span>Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {servicesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-72"
                  >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                      <div className="p-2">
                        {serviceLinks.map((service) => {
                          const itemInner = (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                                <service.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{service.name}</div>
                                <div className="text-sm text-gray-500">{service.desc}</div>
                              </div>
                            </>
                          )
                          const itemClass = "flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          return service.external ? (
                            <a
                              key={service.name}
                              href={service.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={itemClass}
                            >
                              {itemInner}
                            </a>
                          ) : (
                            <Link
                              key={service.name}
                              to={service.href}
                              className={itemClass}
                            >
                              {itemInner}
                            </Link>
                          )
                        })}
                      </div>
                      <div className="border-t border-gray-100 p-3">
                        <Link
                          to="/services"
                          className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          View all services
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Carrier Search CTA Button */}
            <Link to="/services">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
              >
                <Search className="w-4 h-4 mr-2" />
                Carrier Search
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.name}</span>
                  {isAuthenticated && user?.role !== 'admin' && (
                    isIdentityVerified ? (
                      <span title="Identity Verified"><CheckCircle className="w-4 h-4 text-emerald-500" /></span>
                    ) : (
                      <Link to="/settings" onClick={(e) => e.stopPropagation()} title="Identity Not Verified">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      </Link>
                    )
                  )}
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Sign In button */}
          {!isAuthenticated && (
            <Link to="/login" className="md:hidden">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}

          {/* Mobile Dashboard button when logged in */}
          {isAuthenticated && (
            <Link to={getDashboardLink()} className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <LayoutDashboard className="h-5 w-5 text-gray-600" />
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-gray-100"
          >
            <div className="flex flex-col space-y-4">
              <Link
                to="/marketplace"
                className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>

              {/* Mobile Tools */}
              <div className="px-2">
                <span className="text-indigo-600 font-semibold py-1 flex items-center gap-2">Tools <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-600 leading-none">New</span></span>
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-100">
                  {toolLinks.map((tool) => (
                    <Link
                      key={tool.name}
                      to={tool.href}
                      className={`flex items-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-900 ${tool.comingSoon ? 'opacity-60 pointer-events-none' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <tool.icon className="w-4 h-4" />
                      {tool.name}
                      {tool.comingSoon && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-600">Soon</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Pricing */}
              <Link
                to="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              {/* Carrier Search CTA - Mobile */}
              <div className="px-2">
                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    fullWidth
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Carrier Search
                  </Button>
                </Link>
              </div>

              {/* Mobile Services */}
              <div className="px-2">
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-gray-900 font-medium py-1 block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-100">
                  {serviceLinks.map((service) => {
                    const itemClass = "flex items-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-900"
                    return service.external ? (
                      <a
                        key={service.name}
                        href={service.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={itemClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <service.icon className="w-4 h-4" />
                        {service.name}
                      </a>
                    ) : (
                      <Link
                        key={service.name}
                        to={service.href}
                        className={itemClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <service.icon className="w-4 h-4" />
                        {service.name}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-2 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth>Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button fullWidth>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
