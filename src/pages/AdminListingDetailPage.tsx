import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Package,
  Save,
  Building2,
  User,
  Shield,
  Globe,
  Truck,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Heart,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Hash,
  FileText,
  ExternalLink,
  Search,
  ShieldCheck,
  ClipboardCheck,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  PieChart,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import { formatPrice } from '../utils/helpers'
import api from '../services/api'
import { useFMCSAData } from '../hooks/useFMCSAData'

interface Listing {
  id: string
  mcNumber: string
  dotNumber: string
  legalName: string
  dbaName: string | null
  title: string
  description: string | null
  askingPrice: string
  listingPrice: string | null
  price?: string
  status: string
  visibility: string
  isPremium: boolean
  isVip: boolean
  freeToUnlock: boolean
  city: string
  state: string
  address: string | null
  yearsActive: number
  fleetSize: number
  totalDrivers: number
  safetyRating: string
  saferScore: string | null
  insuranceOnFile: boolean
  bipdCoverage: number | null
  cargoCoverage: number | null
  bondAmount: number | null
  amazonStatus: string
  amazonRelayScore: string | null
  highwaySetup: boolean
  sellingWithEmail: boolean
  sellingWithPhone: boolean
  contactEmail: string | null
  contactPhone: string | null
  cargoTypes: string
  fmcsaData: string | null
  authorityHistory: string | null
  insuranceHistory: string | null
  reviewNotes: string | null
  views: number
  saves: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  soldAt: string | null
  seller: {
    id: string
    name: string
    email: string
    phone: string | null
    verified: boolean
    trustScore: number
    createdAt: string
    companyName: string | null
  }
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-green-500'
  if (score >= 40) return 'text-yellow-500'
  if (score >= 20) return 'text-orange-500'
  return 'text-red-500'
}

const AdminListingDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'fmcsa' | 'creditsafe'>('details')

  // FMCSA data (lazy-loaded when tab is active)
  const {
    carrier: fmcsaCarrier,
    authority: fmcsaAuthority,
    insurance: fmcsaInsurance,
    smsData: fmcsaSmsData,
    loading: fmcsaLoading,
    error: fmcsaError,
    refetch: fmcsaRefetch,
  } = useFMCSAData(listing?.mcNumber, activeTab === 'fmcsa')

  // CreditSafe state
  const [csSearchName, setCsSearchName] = useState('')
  const [csSearchResults, setCsSearchResults] = useState<any[] | null>(null)
  const [csIsSearching, setCsIsSearching] = useState(false)
  const [csSelectedCompany, setCsSelectedCompany] = useState<any | null>(null)
  const [csIsLoadingReport, setCsIsLoadingReport] = useState(false)
  const [csFullReport, setCsFullReport] = useState<any | null>(null)
  const [csError, setCsError] = useState<string | null>(null)

  // Seller reassignment state
  const [editSellerSearchTerm, setEditSellerSearchTerm] = useState('')
  const [editSellerSearchResults, setEditSellerSearchResults] = useState<any[]>([])
  const [editSellerSearchLoading, setEditSellerSearchLoading] = useState(false)
  const [editSelectedSeller, setEditSelectedSeller] = useState<any>(null)
  const [showEditSellerDropdown, setShowEditSellerDropdown] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    mcNumber: '',
    dotNumber: '',
    legalName: '',
    dbaName: '',
    title: '',
    description: '',
    askingPrice: '',
    listingPrice: '',
    city: '',
    state: '',
    address: '',
    yearsActive: '',
    fleetSize: '',
    totalDrivers: '',
    safetyRating: 'NONE',
    saferScore: '',
    insuranceOnFile: false,
    bipdCoverage: '',
    cargoCoverage: '',
    bondAmount: '',
    amazonStatus: 'NONE',
    amazonRelayScore: '',
    highwaySetup: false,
    sellingWithEmail: false,
    sellingWithPhone: false,
    contactEmail: '',
    contactPhone: '',
    cargoTypes: '',
    reviewNotes: '',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    isPremium: false,
    isVip: false,
    freeToUnlock: false,
  })

  useEffect(() => {
    if (id) {
      fetchListing()
    }
  }, [id])

  // Initialize seller reassignment state when listing loads
  useEffect(() => {
    if (listing?.seller) {
      setEditSelectedSeller(listing.seller)
    }
  }, [listing?.seller?.id])

  // Debounced seller search for reassignment
  useEffect(() => {
    if (!editSellerSearchTerm || editSellerSearchTerm.length < 2) {
      setEditSellerSearchResults([])
      setShowEditSellerDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setEditSellerSearchLoading(true)
        const response = await api.getAdminUsers({ search: editSellerSearchTerm, role: 'SELLER', limit: 10 })
        setEditSellerSearchResults(response.users || [])
        setShowEditSellerDropdown(true)
      } catch (err) {
        console.error('Seller search failed:', err)
        setEditSellerSearchResults([])
      } finally {
        setEditSellerSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [editSellerSearchTerm])

  // Auto-populate CreditSafe search name when tab opens
  useEffect(() => {
    if (activeTab === 'creditsafe' && listing?.legalName && !csSearchName) {
      setCsSearchName(listing.legalName)
    }
  }, [activeTab, listing?.legalName])

  const fetchListing = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getAdminListing(id!)
      const data = response.data

      setListing(data)

      // Parse cargoTypes
      let cargoTypesStr = ''
      if (data.cargoTypes) {
        try {
          const parsed = JSON.parse(data.cargoTypes)
          cargoTypesStr = Array.isArray(parsed) ? parsed.join(', ') : ''
        } catch {
          cargoTypesStr = ''
        }
      }

      // Populate form
      setFormData({
        mcNumber: data.mcNumber || '',
        dotNumber: data.dotNumber || '',
        legalName: data.legalName || '',
        dbaName: data.dbaName || '',
        title: data.title || '',
        description: data.description || '',
        askingPrice: data.askingPrice ? parseFloat(data.askingPrice).toString() : (data.price ? parseFloat(data.price).toString() : ''),
        listingPrice: data.listingPrice ? parseFloat(data.listingPrice).toString() : '',
        city: data.city || '',
        state: data.state || '',
        address: data.address || '',
        yearsActive: data.yearsActive?.toString() || '',
        fleetSize: data.fleetSize?.toString() || '',
        totalDrivers: data.totalDrivers?.toString() || '',
        safetyRating: data.safetyRating || 'NONE',
        saferScore: data.saferScore || '',
        insuranceOnFile: data.insuranceOnFile || false,
        bipdCoverage: data.bipdCoverage?.toString() || '',
        cargoCoverage: data.cargoCoverage?.toString() || '',
        bondAmount: data.bondAmount?.toString() || '',
        amazonStatus: data.amazonStatus || 'NONE',
        amazonRelayScore: data.amazonRelayScore || '',
        highwaySetup: data.highwaySetup || false,
        sellingWithEmail: data.sellingWithEmail || false,
        sellingWithPhone: data.sellingWithPhone || false,
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        cargoTypes: cargoTypesStr,
        reviewNotes: data.reviewNotes || '',
        status: data.status || 'DRAFT',
        visibility: data.visibility || 'PUBLIC',
        isPremium: data.isPremium || false,
        isVip: data.isVip || false,
        freeToUnlock: data.freeToUnlock || false,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Build update data
      const updateData: any = {
        sellerId: editSelectedSeller && listing?.seller && editSelectedSeller.id !== listing.seller.id ? editSelectedSeller.id : undefined,
        mcNumber: formData.mcNumber,
        dotNumber: formData.dotNumber,
        legalName: formData.legalName,
        dbaName: formData.dbaName || null,
        title: formData.title,
        description: formData.description || null,
        askingPrice: parseFloat(formData.askingPrice) || 0,
        listingPrice: formData.listingPrice ? parseFloat(formData.listingPrice) : null,
        city: formData.city,
        state: formData.state,
        address: formData.address || null,
        yearsActive: parseInt(formData.yearsActive) || 0,
        fleetSize: parseInt(formData.fleetSize) || 0,
        totalDrivers: parseInt(formData.totalDrivers) || 0,
        safetyRating: formData.safetyRating,
        saferScore: formData.saferScore || null,
        insuranceOnFile: formData.insuranceOnFile,
        bipdCoverage: formData.bipdCoverage ? parseFloat(formData.bipdCoverage) : null,
        cargoCoverage: formData.cargoCoverage ? parseFloat(formData.cargoCoverage) : null,
        bondAmount: formData.bondAmount ? parseFloat(formData.bondAmount) : null,
        amazonStatus: formData.amazonStatus,
        amazonRelayScore: formData.amazonRelayScore || null,
        highwaySetup: formData.highwaySetup,
        sellingWithEmail: formData.sellingWithEmail,
        sellingWithPhone: formData.sellingWithPhone,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        cargoTypes: formData.cargoTypes.split(',').map(t => t.trim()).filter(Boolean),
        reviewNotes: formData.reviewNotes || null,
        status: formData.status,
        visibility: formData.visibility,
        isPremium: formData.isPremium,
        isVip: formData.isVip,
        freeToUnlock: formData.freeToUnlock,
      }

      await api.updateAdminListing(id, updateData)
      setSuccessMessage('Listing updated successfully!')
      fetchListing() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to update listing')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // CreditSafe handlers
  const handleCsSearch = async () => {
    if (!csSearchName.trim()) return

    try {
      setCsIsSearching(true)
      setCsError(null)
      setCsSearchResults(null)
      setCsFullReport(null)
      setCsSelectedCompany(null)

      const response = await api.creditsafeSearchCompanies({
        countries: 'US',
        name: csSearchName.trim(),
        state: listing?.state,
        pageSize: 10,
      })

      if (response.success && response.data?.companies) {
        setCsSearchResults(response.data.companies)
      } else {
        setCsSearchResults([])
      }
    } catch (err: any) {
      setCsError(err.message || 'Failed to search CreditSafe')
    } finally {
      setCsIsSearching(false)
    }
  }

  const handleCsSelectCompany = async (company: any) => {
    const connectId = company.connectId || company.id
    if (!connectId) return

    try {
      setCsSelectedCompany(company)
      setCsIsLoadingReport(true)
      setCsError(null)

      const response = await api.creditsafeGetCreditReport(connectId)

      if (response.success && response.data) {
        setCsFullReport(response.data)
      } else {
        setCsError('Failed to load credit report')
      }
    } catch (err: any) {
      setCsError(err.message || 'Failed to load credit report')
    } finally {
      setCsIsLoadingReport(false)
    }
  }

  const handleCsBackToSearch = () => {
    setCsFullReport(null)
    setCsSelectedCompany(null)
    setCsError(null)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
      SOLD: 'bg-blue-100 text-blue-700',
      REJECTED: 'bg-red-100 text-red-700',
      DRAFT: 'bg-purple-100 text-purple-700',
      RESERVED: 'bg-orange-100 text-orange-700',
      SUSPENDED: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-500">Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="p-4 lg:p-8">
        <button
          onClick={() => navigate('/admin/listings')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Listing</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/admin/listings')}>Back to Listings</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/listings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              {formData.isPremium && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> PREMIUM
                </span>
              )}
              {formData.isVip && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
              {formData.freeToUnlock && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> FREE
                </span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(formData.status)}`}>
                {formData.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
              MC-{formData.mcNumber}
            </h1>
            <p className="text-gray-600">DOT-{formData.dotNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/create-listing?edit=${id}`)}
          >
            <Package className="w-4 h-4 mr-2" />
            Edit in Listing Form
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/mc/${id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Public Page
          </Button>
          {activeTab === 'details' && (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {successMessage && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </Card>
      )}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-xl p-1.5 sm:p-2 overflow-x-auto border border-gray-200 scrollbar-hide">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'details'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('fmcsa')}
          className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1 sm:gap-2 ${
            activeTab === 'fmcsa'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
          FMCSA
        </button>
        <button
          onClick={() => setActiveTab('creditsafe')}
          className={`flex-1 min-w-[80px] px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1 sm:gap-2 ${
            activeTab === 'creditsafe'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">CreditSafe</span>
          <span className="sm:hidden">Credit</span>
        </button>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Authority Numbers */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-indigo-600" />
                    Authority Numbers
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MC Number *</label>
                      <Input
                        value={formData.mcNumber}
                        onChange={(e) => handleInputChange('mcNumber', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number *</label>
                      <Input
                        value={formData.dotNumber}
                        onChange={(e) => handleInputChange('dotNumber', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </Card>

                {/* Company Info */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    Company Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name *</label>
                        <Input
                          value={formData.legalName}
                          onChange={(e) => handleInputChange('legalName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DBA Name</label>
                        <Input
                          value={formData.dbaName}
                          onChange={(e) => handleInputChange('dbaName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title *</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <Input
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <select
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select State</option>
                          {US_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <Input
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Business Details */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Business Details
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years Active</label>
                      <Input
                        type="number"
                        value={formData.yearsActive}
                        onChange={(e) => handleInputChange('yearsActive', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Size</label>
                      <Input
                        type="number"
                        value={formData.fleetSize}
                        onChange={(e) => handleInputChange('fleetSize', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Drivers</label>
                      <Input
                        type="number"
                        value={formData.totalDrivers}
                        onChange={(e) => handleInputChange('totalDrivers', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Types (comma separated)</label>
                    <Input
                      value={formData.cargoTypes}
                      onChange={(e) => handleInputChange('cargoTypes', e.target.value)}
                      placeholder="General Freight, Dry Van, Refrigerated"
                    />
                  </div>
                </Card>

                {/* Safety & Insurance */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Safety & Insurance
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Safety Rating</label>
                        <select
                          value={formData.safetyRating}
                          onChange={(e) => handleInputChange('safetyRating', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="NONE">None</option>
                          <option value="SATISFACTORY">Satisfactory</option>
                          <option value="CONDITIONAL">Conditional</option>
                          <option value="UNSATISFACTORY">Unsatisfactory</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SAFER Score</label>
                        <Input
                          value={formData.saferScore}
                          onChange={(e) => handleInputChange('saferScore', e.target.value)}
                          placeholder="e.g., 85"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.insuranceOnFile}
                            onChange={(e) => handleInputChange('insuranceOnFile', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Insurance on File</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BIPD Coverage ($)</label>
                        <Input
                          type="number"
                          value={formData.bipdCoverage}
                          onChange={(e) => handleInputChange('bipdCoverage', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Coverage ($)</label>
                        <Input
                          type="number"
                          value={formData.cargoCoverage}
                          onChange={(e) => handleInputChange('cargoCoverage', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bond Amount ($)</label>
                        <Input
                          type="number"
                          value={formData.bondAmount}
                          onChange={(e) => handleInputChange('bondAmount', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Platform Integrations */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    Platform Integrations
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Relay Status</label>
                        <select
                          value={formData.amazonStatus}
                          onChange={(e) => handleInputChange('amazonStatus', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="NONE">None</option>
                          <option value="PENDING">Pending</option>
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Relay Score</label>
                        <Input
                          value={formData.amazonRelayScore}
                          onChange={(e) => handleInputChange('amazonRelayScore', e.target.value)}
                          placeholder="e.g., Fantastic"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.highwaySetup}
                          onChange={(e) => handleInputChange('highwaySetup', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Highway Setup</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sellingWithEmail}
                          onChange={(e) => handleInputChange('sellingWithEmail', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Selling with Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sellingWithPhone}
                          onChange={(e) => handleInputChange('sellingWithPhone', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Selling with Phone</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                        <Input
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <Input
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Admin Notes */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Admin Review Notes
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (not visible to seller)</label>
                    <Textarea
                      value={formData.reviewNotes}
                      onChange={(e) => handleInputChange('reviewNotes', e.target.value)}
                      rows={4}
                      placeholder="Add internal notes about this listing..."
                    />
                  </div>
                </Card>
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                {/* Status & Pricing */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Status & Pricing
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING_REVIEW">Pending Review</option>
                        <option value="ACTIVE">Active</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="SOLD">Sold</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                      <select
                        value={formData.visibility}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                        <option value="UNLISTED">Unlisted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($) *</label>
                      <Input
                        type="number"
                        value={formData.askingPrice}
                        onChange={(e) => handleInputChange('askingPrice', e.target.value)}
                        required
                        placeholder="Seller's requested price"
                      />
                      <p className="text-xs text-gray-500 mt-1">Price requested by seller</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Listing Price ($)</label>
                      <Input
                        type="number"
                        value={formData.listingPrice}
                        onChange={(e) => handleInputChange('listingPrice', e.target.value)}
                        placeholder="Published price (optional)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Price shown to buyers (defaults to asking price if empty)</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPremium}
                          onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <Crown className="w-4 h-4 text-amber-500" /> Premium Listing
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isVip}
                          onChange={(e) => handleInputChange('isVip', e.target.checked)}
                          className="rounded text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <Crown className="w-4 h-4 text-yellow-500" /> VIP Listing
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.freeToUnlock}
                          onChange={(e) => handleInputChange('freeToUnlock', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" /> Free to Unlock
                        </span>
                      </label>
                    </div>
                  </div>
                </Card>

                {/* Statistics */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                        <Eye className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{listing?.views || 0}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                        <Heart className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{listing?.saves || 0}</p>
                      <p className="text-xs text-gray-500">Saves</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-900">
                        {listing?.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Updated</span>
                      <span className="text-gray-900">
                        {listing?.updatedAt ? new Date(listing.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {listing?.publishedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Published</span>
                        <span className="text-gray-900">
                          {new Date(listing.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Seller Info & Reassignment */}
                {listing?.seller && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Assigned Seller
                    </h2>
                    <div className="space-y-3">
                      {/* Current / Selected Seller */}
                      {editSelectedSeller && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg border ${editSelectedSeller.id !== listing.seller.id ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{editSelectedSeller.name}</p>
                            <p className="text-xs text-gray-500 truncate">{editSelectedSeller.email}</p>
                          </div>
                          {editSelectedSeller.id !== listing.seller.id && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full flex-shrink-0">Changed</span>
                          )}
                        </div>
                      )}

                      {/* Seller Search */}
                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Reassign seller</label>
                        <Input
                          placeholder="Search by name or email..."
                          value={editSellerSearchTerm}
                          onChange={(e: any) => setEditSellerSearchTerm(e.target.value)}
                        />
                        {editSellerSearchLoading && (
                          <div className="absolute right-3 top-7">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        )}
                        {showEditSellerDropdown && editSellerSearchResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {editSellerSearchResults.map((user: any) => (
                              <button
                                key={user.id}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                onClick={() => {
                                  setEditSelectedSeller({ id: user.id, name: user.name, email: user.email, phone: user.phone, companyName: user.companyName })
                                  setEditSellerSearchTerm('')
                                  setShowEditSellerDropdown(false)
                                  setEditSellerSearchResults([])
                                }}
                              >
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {showEditSellerDropdown && editSellerSearchResults.length === 0 && editSellerSearchTerm.length >= 2 && !editSellerSearchLoading && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-center text-sm text-gray-500">
                            No sellers found
                          </div>
                        )}
                      </div>

                      {/* Revert link */}
                      {editSelectedSeller && editSelectedSeller.id !== listing.seller.id && (
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                          onClick={() => setEditSelectedSeller(listing.seller)}
                        >
                          Revert to original seller
                        </button>
                      )}

                      <div className="pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/admin/users/${(editSelectedSeller || listing.seller).id}`)}
                        >
                          View Seller Profile
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Rejection Info */}
                {listing?.rejectionReason && (
                  <Card className="p-6 bg-red-50 border-red-200">
                    <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Rejection Reason
                    </h2>
                    <p className="text-red-700 text-sm">{listing.rejectionReason}</p>
                  </Card>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* FMCSA Tab */}
      {activeTab === 'fmcsa' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 -m-6 mb-0 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">FMCSA Carrier Data</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>MC #{formData.mcNumber}</span>
                      <span>•</span>
                      <span>DOT #{formData.dotNumber}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => fmcsaRefetch()}
                  disabled={fmcsaLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fmcsaLoading ? 'animate-spin' : ''}`} />
                  {fmcsaLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {fmcsaLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading FMCSA data...</span>
            </div>
          )}

          {/* Error State */}
          {fmcsaError && !fmcsaLoading && (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-3 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span>{fmcsaError}</span>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!fmcsaLoading && !fmcsaError && !fmcsaCarrier && (
            <Card className="p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No FMCSA Data Available</h3>
              <p className="text-gray-500">Could not find carrier data for MC-{formData.mcNumber}</p>
            </Card>
          )}

          {/* FMCSA Data Display */}
          {!fmcsaLoading && fmcsaCarrier && (
            <>
              {/* Operating Status */}
              <div className={`p-4 rounded-xl border ${
                fmcsaCarrier?.allowedToOperate === 'Y'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {fmcsaCarrier?.allowedToOperate === 'Y' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className={`font-bold ${
                      fmcsaCarrier?.allowedToOperate === 'Y' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {fmcsaCarrier?.allowedToOperate === 'Y' ? 'Authorized to Operate' : 'Not Authorized'}
                    </p>
                    <p className="text-sm text-gray-600">Operating Authority Status</p>
                  </div>
                </div>
              </div>

              {/* Carrier Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.totalDrivers ?? (parseInt(formData.totalDrivers) || 0)}</p>
                  <p className="text-sm text-gray-500">Drivers</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.totalPowerUnits ?? (parseInt(formData.fleetSize) || 0)}</p>
                  <p className="text-sm text-gray-500">Power Units</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{fmcsaCarrier?.carrierOperation || 'Interstate'}</p>
                  <p className="text-sm text-gray-500">Operation Type</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    {fmcsaCarrier?.mcs150Date ? format(new Date(fmcsaCarrier.mcs150Date), 'MM/dd/yyyy') : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">MCS-150 Date</p>
                </div>
              </div>

              {/* Authority Status */}
              {fmcsaAuthority && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    Authority Status
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Common Authority */}
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        {fmcsaAuthority.commonAuthorityStatus?.toLowerCase() === 'active' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-700">Common (Property)</span>
                      </div>
                      <p className={`text-sm font-semibold ${
                        fmcsaAuthority.commonAuthorityStatus?.toLowerCase() === 'active'
                          ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {fmcsaAuthority.commonAuthorityStatus || 'N/A'}
                      </p>
                      {fmcsaAuthority.commonAuthorityGrantDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Granted: {format(new Date(fmcsaAuthority.commonAuthorityGrantDate), 'MM/dd/yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Contract Authority */}
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        {fmcsaAuthority.contractAuthorityStatus?.toLowerCase() === 'active' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-700">Contract</span>
                      </div>
                      <p className={`text-sm font-semibold ${
                        fmcsaAuthority.contractAuthorityStatus?.toLowerCase() === 'active'
                          ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {fmcsaAuthority.contractAuthorityStatus || 'N/A'}
                      </p>
                      {fmcsaAuthority.contractAuthorityGrantDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Granted: {format(new Date(fmcsaAuthority.contractAuthorityGrantDate), 'MM/dd/yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Broker Authority */}
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        {fmcsaAuthority.brokerAuthorityStatus?.toLowerCase() === 'active' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-700">Broker</span>
                      </div>
                      <p className={`text-sm font-semibold ${
                        fmcsaAuthority.brokerAuthorityStatus?.toLowerCase() === 'active'
                          ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {fmcsaAuthority.brokerAuthorityStatus || 'N/A'}
                      </p>
                      {fmcsaAuthority.brokerAuthorityGrantDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Granted: {format(new Date(fmcsaAuthority.brokerAuthorityGrantDate), 'MM/dd/yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Information */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Insurance Coverage (FMCSA Filed)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">BIPD Coverage</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${((fmcsaCarrier?.bipdOnFile ?? (formData.bipdCoverage ? parseFloat(formData.bipdCoverage) : 0)) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Required: ${(fmcsaCarrier?.bipdRequired || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Cargo Coverage</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${((fmcsaCarrier?.cargoOnFile ?? (formData.cargoCoverage ? parseFloat(formData.cargoCoverage) : 0)) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Required: ${(fmcsaCarrier?.cargoRequired || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Bond/Surety</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${((fmcsaCarrier?.bondOnFile ?? (formData.bondAmount ? parseFloat(formData.bondAmount) : 0)) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Required: ${(fmcsaCarrier?.bondRequired || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Insurance History */}
                {fmcsaInsurance && fmcsaInsurance.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Active Insurance Policies</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {fmcsaInsurance.filter(ins => ins.status?.toLowerCase() === 'active').slice(0, 5).map((ins, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border border-gray-100 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium text-gray-800">{ins.insurerName}</p>
                            <p className="text-xs text-gray-500">{ins.insuranceType} • Policy: {ins.policyNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${(ins.coverageAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-green-600">{ins.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inspections & Crashes */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-orange-500" />
                  Inspection & Crash History
                </h3>

                {/* Inspection Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {(fmcsaCarrier?.driverInsp ?? 0) + (fmcsaCarrier?.vehicleInsp ?? 0) + (fmcsaCarrier?.hazmatInsp ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500">Total Inspections</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.driverInsp ?? 0}</p>
                    <p className="text-xs text-gray-500">Driver Inspections</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.vehicleInsp ?? 0}</p>
                    <p className="text-xs text-gray-500">Vehicle Inspections</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.hazmatInsp ?? 0}</p>
                    <p className="text-xs text-gray-500">Hazmat Inspections</p>
                  </div>
                </div>

                {/* OOS Rates */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Driver OOS Rate</span>
                      <span className={`font-bold ${
                        (fmcsaCarrier?.driverOosRate ?? 0) > 10 ? 'text-red-600' :
                        (fmcsaCarrier?.driverOosRate ?? 0) > 5 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {(fmcsaCarrier?.driverOosRate ?? 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (fmcsaCarrier?.driverOosRate ?? 0) > 10 ? 'bg-red-500' :
                          (fmcsaCarrier?.driverOosRate ?? 0) > 5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(fmcsaCarrier?.driverOosRate ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{fmcsaCarrier?.driverOosInsp ?? 0} OOS inspections</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vehicle OOS Rate</span>
                      <span className={`font-bold ${
                        (fmcsaCarrier?.vehicleOosRate ?? 0) > 25 ? 'text-red-600' :
                        (fmcsaCarrier?.vehicleOosRate ?? 0) > 15 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {(fmcsaCarrier?.vehicleOosRate ?? 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (fmcsaCarrier?.vehicleOosRate ?? 0) > 25 ? 'bg-red-500' :
                          (fmcsaCarrier?.vehicleOosRate ?? 0) > 15 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(fmcsaCarrier?.vehicleOosRate ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{fmcsaCarrier?.vehicleOosInsp ?? 0} OOS inspections</p>
                  </div>
                </div>

                {/* Crash Data */}
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Crash History (24 months)</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className={`text-xl font-bold ${(fmcsaCarrier?.crashTotal ?? 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {fmcsaCarrier?.crashTotal ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${(fmcsaCarrier?.fatalCrash ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmcsaCarrier?.fatalCrash ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Fatal</p>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${(fmcsaCarrier?.injuryCrash ?? 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {fmcsaCarrier?.injuryCrash ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Injury</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-700">
                        {fmcsaCarrier?.towCrash ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Tow-Away</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BASIC Scores */}
              {fmcsaSmsData?.basics && fmcsaSmsData.basics.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    BASIC Scores (Safety Measurement System)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fmcsaSmsData.basics.map((basic: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 truncate">{basic.basicName}</span>
                          {basic.exceedsThreshold && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium ml-1">
                              Alert
                            </span>
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          <span className={`text-2xl font-bold ${
                            basic.percentile > 75 ? 'text-red-600' :
                            basic.percentile > 50 ? 'text-orange-600' :
                            basic.percentile > 25 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {basic.percentile.toFixed(0)}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              basic.percentile > 75 ? 'bg-red-500' :
                              basic.percentile > 50 ? 'bg-orange-500' :
                              basic.percentile > 25 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(basic.percentile, 100)}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <span>{basic.totalInspections} insp • {basic.totalViolations} viol</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    * Lower BASIC percentiles are better. Percentiles above the threshold may trigger FMCSA intervention.
                  </p>
                </div>
              )}

              {/* Safety Summary */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">FMCSA Safety Summary</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This carrier has a <strong>{fmcsaCarrier?.safetyRating || 'Not Rated'}</strong> safety rating
                      {fmcsaCarrier?.safetyRatingDate && (
                        <> (as of {format(new Date(fmcsaCarrier.safetyRatingDate), 'MMMM d, yyyy')})</>
                      )}.
                      Operating with {fmcsaCarrier?.totalDrivers ?? 0} drivers and {fmcsaCarrier?.totalPowerUnits ?? 0} power units.
                      {fmcsaCarrier?.insuranceOnFile && ' Insurance is current and on file with FMCSA.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* CreditSafe Tab */}
      {activeTab === 'creditsafe' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Show report if loaded, otherwise show search */}
          {csFullReport ? (
            <>
              {/* Back to Search */}
              <button
                onClick={handleCsBackToSearch}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Search
              </button>

              {/* Header */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 -m-6 mb-0 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">CreditSafe Business Report</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Report loaded</span>
                          <span>•</span>
                          <span>MC #{formData.mcNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Credit Score Overview */}
              <Card>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {csFullReport.companyName || csSelectedCompany?.name || 'Company'}
                    </h3>
                    {csFullReport.tradingName && (
                      <p className="text-gray-500">{csFullReport.tradingName}</p>
                    )}
                  </div>
                  {csFullReport.lastUpdated && (
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Last Updated</div>
                      <div className="text-sm text-gray-500">
                        {new Date(csFullReport.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {csFullReport.creditScore && (
                  <div className={`rounded-xl p-6 border ${
                    csFullReport.creditScore.score >= 70 ? 'border-emerald-200 bg-emerald-50' :
                    csFullReport.creditScore.score >= 40 ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-2">Business Health Score</div>
                        <div className="flex items-baseline gap-3">
                          <span className={`text-5xl font-bold ${getScoreColor(csFullReport.creditScore.score)}`}>
                            {csFullReport.creditScore.score}
                          </span>
                          <span className="text-xl text-gray-400">/ {csFullReport.creditScore.maxScore || 100}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-2">Risk Level</div>
                        <div className={`text-2xl font-bold capitalize ${
                          csFullReport.creditScore.riskLevel === 'very-low' || csFullReport.creditScore.riskLevel === 'low' ? 'text-emerald-600' :
                          csFullReport.creditScore.riskLevel === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(csFullReport.creditScore.riskLevel || 'Unknown').replace('-', ' ')}
                        </div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mt-6">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${csFullReport.creditScore.score || 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            (csFullReport.creditScore.score || 0) >= 80 ? 'bg-emerald-500' :
                            (csFullReport.creditScore.score || 0) >= 60 ? 'bg-green-400' :
                            (csFullReport.creditScore.score || 0) >= 40 ? 'bg-yellow-400' :
                            (csFullReport.creditScore.score || 0) >= 20 ? 'bg-orange-400' : 'bg-red-400'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>Very High Risk</span>
                        <span>Very Low Risk</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Financial Summary */}
              {csFullReport.financialSummary && (
                <Card>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Annual Revenue</span>
                      </div>
                      <div className="text-xl font-bold text-emerald-600">
                        {formatPrice(csFullReport.financialSummary.annualRevenue || 0)}
                      </div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Net Worth</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(csFullReport.financialSummary.netWorth || 0)}
                      </div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Activity className="w-4 h-4" />
                        <span>Total Assets</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(csFullReport.financialSummary.totalAssets || 0)}
                      </div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <TrendingDown className="w-4 h-4" />
                        <span>Total Liabilities</span>
                      </div>
                      <div className="text-xl font-bold text-orange-400">
                        {formatPrice(csFullReport.financialSummary.totalLiabilities || 0)}
                      </div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Users className="w-4 h-4" />
                        <span>Employees</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {csFullReport.financialSummary.employeeCount ?? 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>Year Established</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {csFullReport.financialSummary.yearEstablished ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Payment Behavior */}
              {csFullReport.paymentBehavior && (
                <Card>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    Payment Behavior
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {csFullReport.paymentBehavior.onTimePayments ?? 0}%
                      </div>
                      <div className="text-xs text-gray-500">On-Time Payments</div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {csFullReport.paymentBehavior.latePayments ?? 0}%
                      </div>
                      <div className="text-xs text-gray-500">Late Payments</div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-400 mb-1">
                        {csFullReport.paymentBehavior.severelyLate ?? 0}%
                      </div>
                      <div className="text-xs text-gray-500">Severely Late</div>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {csFullReport.paymentBehavior.dbtScore ?? 0}
                      </div>
                      <div className="text-xs text-gray-500">Days Beyond Terms</div>
                    </div>
                  </div>

                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">Payment Index</span>
                      <span className="font-bold text-gray-900">{csFullReport.paymentBehavior.paymentIndex ?? 0}/100</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${csFullReport.paymentBehavior.paymentIndex ?? 0}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Legal Filings */}
              {csFullReport.legalFilings && (
                <Card>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-indigo-400" />
                    Legal Filings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-700">Bankruptcies</span>
                      <span className={`font-bold ${
                        (csFullReport.legalFilings.bankruptcies ?? 0) === 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {csFullReport.legalFilings.bankruptcies ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-700">Tax Liens</span>
                      <span className={`font-bold ${
                        (csFullReport.legalFilings.liens ?? csFullReport.legalFilings.taxLiens ?? 0) === 0 ? 'text-emerald-600' : 'text-yellow-500'
                      }`}>
                        {csFullReport.legalFilings.liens ?? csFullReport.legalFilings.taxLiens ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-700">Judgments</span>
                      <span className={`font-bold ${
                        (csFullReport.legalFilings.judgments ?? 0) === 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {csFullReport.legalFilings.judgments ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-700">UCC Filings</span>
                      <span className="font-bold text-gray-900">
                        {csFullReport.legalFilings.uccFilings ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-700">Suits</span>
                      <span className={`font-bold ${
                        (csFullReport.legalFilings.suits ?? 0) === 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {csFullReport.legalFilings.suits ?? 0}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Search Card */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 -m-6 mb-0 p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">CreditSafe Business Search</h2>
                      <p className="text-sm text-gray-500">Search for a company to view their credit report</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={csSearchName}
                      onChange={(e) => setCsSearchName(e.target.value)}
                      placeholder="Enter company name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleCsSearch()}
                    />
                  </div>
                  <Button
                    onClick={handleCsSearch}
                    disabled={csIsSearching || !csSearchName.trim()}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    {csIsSearching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
              </Card>

              {/* Error */}
              {csError && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{csError}</span>
                  </div>
                </Card>
              )}

              {/* Loading report */}
              {csIsLoadingReport && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-500">Loading credit report...</span>
                </div>
              )}

              {/* Search Results */}
              {csSearchResults && !csIsLoadingReport && (
                <>
                  {csSearchResults.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                      <p className="text-gray-500">Try adjusting your search terms</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">{csSearchResults.length} companies found</p>
                      {csSearchResults.map((company, idx) => (
                        <Card
                          key={company.id || idx}
                          className="p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                          onClick={() => handleCsSelectCompany(company)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{company.name}</h4>
                              {company.address?.simpleValue && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {company.address.simpleValue}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                {company.regNo && (
                                  <span className="text-xs text-gray-400">Reg: {company.regNo}</span>
                                )}
                                {company.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    company.status.toLowerCase() === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {company.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default AdminListingDetailPage
