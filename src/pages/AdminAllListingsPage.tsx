import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Eye,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Edit,
  Trash2,
  Crown,
  Mail,
  Phone,
  MapPin,
  Plus,
  X,
  Building2,
  User,
  Hash,
  Calendar,
  Truck,
  Shield,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserPlus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Globe,
  AlertTriangle,
  ShieldCheck,
  Banknote,
  Users,
  RefreshCw,
  Loader2,
  Copy,
  Zap,
  BadgeCheck,
  Send
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import {
  AUTHORITY_TYPE_OPTIONS,
  AUTHORITY_TYPE_BADGE_LABELS,
  AUTHORITY_TYPE_PILL_LABELS,
  normalizeAuthorityType,
  deriveAuthorityTypeFromHistory,
} from '../constants/authority'
import api from '../services/api'

interface Listing {
  id: string
  mcNumber: string
  dotNumber: string
  authorityType?: string
  title: string
  legalName: string
  dbaName: string
  price: number
  askingPrice: number
  listingPrice: number | null
  status: 'active' | 'pending' | 'reserved' | 'sold' | 'rejected' | 'draft'
  seller: {
    id: string
    name: string
    email: string
    phone: string
    trustScore: number
    verified: boolean
  }
  views: number
  saves: number
  offers: number
  createdAt: string
  updatedAt: string
  soldDate?: string
  rejectedDate?: string
  rejectionReason?: string
  yearsActive: number
  fleetSize: number
  totalDrivers: number
  safetyRating: string
  state: string
  city: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  isPremium: boolean
  isVip: boolean
  amazonStatus: string
  amazonRelayScore: string | null
  highwaySetup: boolean
  sellingWithEmail: boolean
  sellingWithPhone: boolean
  insuranceOnFile: boolean
  bipdCoverage: number
  cargoCoverage: number
  bondAmount?: number
  insuranceCompany?: string
  monthlyInsurancePremium?: number
  cargoTypes: string[]
  visibility?: string
  fmcsaData?: string
  authorityHistory?: string
  insuranceHistory?: string
  assignedAdmin?: string
}

interface User {
  id: string
  name: string
  email: string
  role: 'seller' | 'buyer' | 'admin'
}

const AdminAllListingsPage = () => {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'pending' | 'reserved' | 'rejected' | 'sold' | 'premium' | 'vip' | 'draft'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortField, setSortField] = useState<'mcNumber' | 'price' | 'createdAt' | 'views'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateUserWithListingModal, setShowCreateUserWithListingModal] = useState(false)
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [createUserError, setCreateUserError] = useState<string | null>(null)
  const [mcLookupLoading, setMcLookupLoading] = useState(false)
  const [mcLookupError, setMcLookupError] = useState<string | null>(null)
  const [mcLookupSuccess, setMcLookupSuccess] = useState(false)
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null)

  // Telegram share state
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramListing, setTelegramListing] = useState<Listing | null>(null)
  const [telegramMessage, setTelegramMessage] = useState('')
  const [telegramSharing, setTelegramSharing] = useState(false)
  const [telegramInspections, setTelegramInspections] = useState<number | null>(null)
  const [telegramInspectionsLoading, setTelegramInspectionsLoading] = useState(false)

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // New User + Listing form state - matches seller listing form
  const [newUserWithListing, setNewUserWithListing] = useState({
    // User fields
    email: '',
    name: '',
    password: generatePassword(),
    phone: '',
    companyName: '',
    createStripeAccount: true,
    // Basic Info
    mcNumber: '',
    dotNumber: '',
    state: '',
    city: '',
    title: '',
    description: '',
    askingPrice: '',
    // FMCSA Data (auto-filled)
    legalName: '',
    dbaName: '',
    physicalAddress: '',
    mailingAddress: '',
    carrierPhone: '',
    powerUnits: '',
    drivers: '',
    mcs150Date: '',
    operatingStatus: '',
    entityType: '',
    cargoCarried: [] as string[],
    // Authority Details
    yearsActive: '',
    fleetSize: '',
    safetyRating: 'satisfactory',
    insuranceStatus: 'active',
    // Amazon & Highway
    amazonStatus: '',
    amazonRelayScore: '',
    highwaySetup: '',
    // Selling with Email/Phone
    sellingWithEmail: '',
    sellingWithPhone: '',
    // Factoring
    hasFactoring: '',
    factoringCompany: '',
    // Status
    status: 'PENDING_REVIEW'
  })

  // MC Lookup function - matches CreateListingPage logic
  const handleMcLookup = async () => {
    if (!newUserWithListing.mcNumber && !newUserWithListing.dotNumber) {
      setMcLookupError('Please enter an MC or DOT number')
      return
    }

    setMcLookupLoading(true)
    setMcLookupError(null)
    setMcLookupSuccess(false)

    try {
      let response
      if (newUserWithListing.mcNumber) {
        response = await api.fmcsaLookupByMC(newUserWithListing.mcNumber.replace(/^MC-?/i, '').replace(/\D/g, ''))
      } else if (newUserWithListing.dotNumber) {
        response = await api.fmcsaLookupByDOT(newUserWithListing.dotNumber)
      }

      if (!response || !response.data) {
        setMcLookupError('No carrier found with that number. Please check and try again.')
        setMcLookupLoading(false)
        return
      }

      const carrier = response.data
      if (!carrier) {
        setMcLookupError('No carrier data found. Please verify the number and try again.')
        setMcLookupLoading(false)
        return
      }
      if (!carrier.dotNumber) {
        // Broker / freight-forwarder dockets have no USDOT and no carrier census
        // record. Informational only — the form stays manually fillable.
        setMcLookupError('No USDOT on file for this docket — fill in the details manually (expected for broker authorities).')
      }

      // Map the API response to form fields (same as CreateListingPage)
      const fullAddress = [carrier.physicalAddress, carrier.hqCity, carrier.hqState].filter(Boolean).join(', ')

      // Determine safety rating status
      let safetyRatingValue = 'not-rated'
      if (carrier.safetyRating) {
        const rating = carrier.safetyRating.toLowerCase()
        if (rating.includes('satisfactory')) safetyRatingValue = 'satisfactory'
        else if (rating.includes('conditional')) safetyRatingValue = 'conditional'
        else if (rating.includes('unsatisfactory')) safetyRatingValue = 'unsatisfactory'
      }

      // Determine operating status
      const operatingStatus = carrier.allowedToOperate === 'Y' ? 'AUTHORIZED' : 'NOT AUTHORIZED'

      // Determine insurance status
      const insuranceStatus = carrier.insuranceOnFile ? 'active' : 'expired'

      // Calculate years active from MCS-150 date
      let yearsActive = ''
      if (carrier.mcs150Date) {
        try {
          const mcsDate = new Date(carrier.mcs150Date)
          const now = new Date()
          const years = Math.floor((now.getTime() - mcsDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          if (years > 0) yearsActive = String(years)
        } catch (e) {
          // Ignore date parsing errors
        }
      }

      // Auto-generate title
      const mcNum = newUserWithListing.mcNumber || carrier.dotNumber
      const generatedTitle = `${carrier.legalName} - MC #${mcNum}`

      setNewUserWithListing(prev => ({
        ...prev,
        dotNumber: String(carrier.dotNumber || prev.dotNumber),
        legalName: carrier.legalName || '',
        dbaName: carrier.dbaName || '',
        physicalAddress: fullAddress,
        mailingAddress: fullAddress,
        carrierPhone: carrier.phone || '',
        powerUnits: String(carrier.totalPowerUnits || 0),
        drivers: String(carrier.totalDrivers || 0),
        mcs150Date: carrier.mcs150Date || '',
        operatingStatus: operatingStatus,
        entityType: carrier.carrierOperation || 'CARRIER',
        state: carrier.hqState || prev.state,
        city: carrier.hqCity || '',
        cargoCarried: carrier.cargoTypes || [],
        fleetSize: String(carrier.totalPowerUnits || 0),
        safetyRating: safetyRatingValue,
        insuranceStatus: insuranceStatus,
        yearsActive: yearsActive || prev.yearsActive,
        title: generatedTitle,
        companyName: carrier.legalName || carrier.dbaName || '',
      }))

      setMcLookupSuccess(true)
    } catch (err: any) {
      console.error('MC Lookup failed:', err)
      setMcLookupError(err.message || 'Failed to lookup MC number')
    } finally {
      setMcLookupLoading(false)
    }
  }

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allListings, setAllListings] = useState<Listing[]>([])

  // Users (no longer mock — seller search is used instead)

  // Helper to parse JSON fields safely
  const parseJsonField = (field: any): string[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  // Map API status to component status
  const mapStatus = (status: string): 'active' | 'pending' | 'reserved' | 'sold' | 'rejected' | 'draft' => {
    const statusMap: Record<string, 'active' | 'pending' | 'reserved' | 'sold' | 'rejected' | 'draft'> = {
      'ACTIVE': 'active',
      'PENDING_REVIEW': 'pending',
      'SOLD': 'sold',
      'REJECTED': 'rejected',
      'DRAFT': 'draft',
      'RESERVED': 'reserved',
      'SUSPENDED': 'rejected'
    }
    return statusMap[status] || 'draft'
  }

  // Fetch listings from API
  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get filter status for API
      const statusMap: Record<string, string> = {
        'all': '',
        'active': 'ACTIVE',
        'pending': 'PENDING_REVIEW',
        'reserved': 'RESERVED',
        'sold': 'SOLD',
        'rejected': 'REJECTED',
        'draft': 'DRAFT',
        'premium': '',
        'vip': ''
      }

      const params: any = { limit: 100 }
      if (activeFilter !== 'all' && activeFilter !== 'premium' && activeFilter !== 'vip') {
        params.status = statusMap[activeFilter]
      }
      if (activeFilter === 'premium') {
        params.isPremium = true
      }
      if (activeFilter === 'vip') {
        params.isVip = true
      }
      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await api.getAdminListings(params)
      const listingsData = response?.data || response?.listings || []

      // Transform API data to component format
      const transformedListings: Listing[] = listingsData.map((item: any) => ({
        id: item.id,
        mcNumber: item.mcNumber || '',
        dotNumber: item.dotNumber || '',
        title: item.title || `Trucking Business #${item.mcNumber}`,
        legalName: item.legalName || '',
        dbaName: item.dbaName || '',
        price: item.askingPrice || 0,
        askingPrice: item.askingPrice || 0,
        listingPrice: item.listingPrice || null,
        status: mapStatus(item.status),
        seller: {
          id: item.seller?.id || item.sellerId || '',
          name: item.seller?.name || 'Unknown',
          email: item.seller?.email || '',
          phone: item.seller?.phone || '',
          trustScore: item.seller?.trustScore || 70,
          verified: item.seller?.verified || false
        },
        views: item.views || 0,
        saves: item.saves || 0,
        offers: item.offerCount || 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString().split('T')[0] : '',
        soldDate: item.soldAt ? new Date(item.soldAt).toISOString().split('T')[0] : undefined,
        rejectedDate: item.status === 'REJECTED' ? item.updatedAt?.split('T')[0] : undefined,
        rejectionReason: item.rejectionReason || undefined,
        yearsActive: item.yearsActive || 0,
        fleetSize: item.fleetSize || 0,
        totalDrivers: item.totalDrivers || 0,
        safetyRating: item.safetyRating || 'Satisfactory',
        state: item.state || '',
        city: item.city || '',
        isPremium: item.isPremium || false,
        isVip: item.isVip || false,
        amazonStatus: item.amazonStatus?.toLowerCase() || 'none',
        amazonRelayScore: item.amazonRelayScore || null,
        highwaySetup: item.highwaySetup || false,
        sellingWithEmail: item.sellingWithEmail || false,
        sellingWithPhone: item.sellingWithPhone || false,
        insuranceOnFile: item.insuranceOnFile || false,
        bipdCoverage: item.bipdCoverage || 0,
        cargoCoverage: item.cargoCoverage || 0,
        cargoTypes: parseJsonField(item.cargoTypes),
        assignedAdmin: item.assignedAdmin || undefined
      }))

      setAllListings(transformedListings)
    } catch (err: any) {
      console.error('Failed to fetch listings:', err)
      setError(err.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  // Fetch listings on mount and when filter changes
  useEffect(() => {
    fetchListings()
  }, [activeFilter])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionDropdown(null)
    if (openActionDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openActionDropdown])

  // Open Telegram modal and fetch inspections
  const handleToggleVip = async (listing: Listing) => {
    try {
      await api.updateAdminListing(listing.id, { isVip: !listing.isVip })
      // Update local state
      setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, isVip: !l.isVip } : l))
    } catch (err: any) {
      console.error('Failed to toggle VIP:', err)
    }
  }

  const openTelegramModal = async (listing: Listing) => {
    setTelegramListing(listing)
    setShowTelegramModal(true)
    setTelegramInspections(null)
    setTelegramInspectionsLoading(true)

    try {
      // Get DOT number from listing or via MC lookup, then fetch SMS data for accurate totalInspections
      let dotNumber = listing.dotNumber
      if (!dotNumber) {
        const mcResponse = await api.fmcsaLookupByMC(listing.mcNumber.replace(/^MC-?/i, '').replace(/\D/g, ''))
        if (mcResponse.success && mcResponse.data) {
          dotNumber = mcResponse.data.dotNumber
        }
      }
      if (dotNumber) {
        const smsResponse = await api.fmcsaGetSMSData(dotNumber)
        if (smsResponse.success && smsResponse.data) {
          setTelegramInspections(smsResponse.data.totalInspections || 0)
        } else {
          setTelegramInspections(0)
        }
      } else {
        setTelegramInspections(0)
      }
    } catch (error) {
      console.error('Failed to fetch inspection data:', error)
      setTelegramInspections(0)
    } finally {
      setTelegramInspectionsLoading(false)
    }
  }

  // Handle Telegram share
  const handleTelegramShare = async () => {
    if (!telegramListing) return
    setTelegramSharing(true)
    try {
      const result = await api.shareListingToTelegram(telegramListing.id, telegramMessage || undefined)
      if (result.success) {
        toast.success('Listing shared to Telegram!')
        setShowTelegramModal(false)
        setTelegramMessage('')
        setTelegramListing(null)
      } else {
        toast.error(result.message || 'Failed to share')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to share to Telegram')
    } finally {
      setTelegramSharing(false)
    }
  }

  // New listing form state
  const [newListing, setNewListing] = useState({
    mcNumber: '',
    dotNumber: '',
    legalName: '',
    dbaName: '',
    title: '',
    description: '',
    price: '',
    state: '',
    city: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    yearsActive: '',
    fleetSize: '',
    totalDrivers: '',
    safetyRating: 'satisfactory',
    amazonStatus: 'none',
    amazonRelayScore: '',
    highwaySetup: false,
    isPremium: false,
    isVip: false,
    sellingWithEmail: true,
    sellingWithPhone: true,
    bipdCoverage: '',
    cargoCoverage: '',
    bondAmount: '',
    insuranceCompany: '',
    monthlyInsurancePremium: '',
    cargoTypes: [] as string[],
    visibility: 'public',
    hasFactoring: '',
    factoringCompany: '',
    entryAuditCompleted: '',
    applicationDate: '',
    grantDate: '',
    effectiveDate: '',
    revocationDate: '',
    assignedTo: '',
    notes: '',
    authorityType: 'MOTOR_CARRIER' as 'MOTOR_CARRIER' | 'BROKER' | 'MOTOR_CARRIER_AND_BROKER' | 'FREIGHT_FORWARDER',
  })
  const [addListingAuthorityTypeTouched, setAddListingAuthorityTypeTouched] = useState(false)

  // Add Listing modal states
  const [addListingLoading, setAddListingLoading] = useState(false)
  const [addListingError, setAddListingError] = useState<string | null>(null)
  const [addListingFmcsaLoading, setAddListingFmcsaLoading] = useState(false)
  const [addListingFmcsaError, setAddListingFmcsaError] = useState<string | null>(null)
  const [addListingFmcsaSuccess, setAddListingFmcsaSuccess] = useState(false)
  const [addListingAuthorityHistory, setAddListingAuthorityHistory] = useState<any>(null)
  const [addListingFmcsaCarrierData, setAddListingFmcsaCarrierData] = useState<any>(null)

  // Seller search state (for Add Listing)
  const [sellerSearchTerm, setSellerSearchTerm] = useState('')
  const [sellerSearchResults, setSellerSearchResults] = useState<any[]>([])
  const [sellerSearchLoading, setSellerSearchLoading] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)

  // Seller reassignment state (for Edit mode)
  const [editSellerSearchTerm, setEditSellerSearchTerm] = useState('')
  const [editSellerSearchResults, setEditSellerSearchResults] = useState<any[]>([])
  const [editSellerSearchLoading, setEditSellerSearchLoading] = useState(false)
  const [editSelectedSeller, setEditSelectedSeller] = useState<any>(null)
  const [showEditSellerDropdown, setShowEditSellerDropdown] = useState(false)

  // Debounced seller search
  useEffect(() => {
    if (!sellerSearchTerm || sellerSearchTerm.length < 2) {
      setSellerSearchResults([])
      setShowSellerDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSellerSearchLoading(true)
        const response = await api.getAdminUsers({ search: sellerSearchTerm, role: 'SELLER', limit: 10 })
        setSellerSearchResults(response.users || [])
        setShowSellerDropdown(true)
      } catch (err) {
        console.error('Seller search failed:', err)
        setSellerSearchResults([])
      } finally {
        setSellerSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [sellerSearchTerm])

  // Debounced seller search for edit mode reassignment
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
        console.error('Edit seller search failed:', err)
        setEditSellerSearchResults([])
      } finally {
        setEditSellerSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [editSellerSearchTerm])

  // FMCSA lookup for Add Listing modal
  const handleAddListingFmcsaLookup = async () => {
    const lookupValue = newListing.mcNumber || newListing.dotNumber
    if (!lookupValue) {
      setAddListingFmcsaError('Please enter an MC or DOT number')
      return
    }

    setAddListingFmcsaLoading(true)
    setAddListingFmcsaError(null)
    setAddListingFmcsaSuccess(false)
    setAddListingAuthorityHistory(null)
    setAddListingFmcsaCarrierData(null)

    try {
      let response
      // Detect if it's likely a DOT number (7+ digits) or MC number
      if (newListing.mcNumber) {
        response = await api.fmcsaLookupByMC(newListing.mcNumber.replace(/^MC-?/i, '').replace(/\D/g, ''))
      } else if (newListing.dotNumber) {
        response = await api.fmcsaLookupByDOT(newListing.dotNumber)
      }

      if (!response || !response.data) {
        setAddListingFmcsaError('No carrier found with that number. Please check and try again.')
        setAddListingFmcsaLoading(false)
        return
      }

      const carrier = response.data
      if (!carrier) {
        setAddListingFmcsaError('No carrier data found. Please verify the number and try again.')
        setAddListingFmcsaLoading(false)
        return
      }
      if (!carrier.dotNumber) {
        // Broker / freight-forwarder dockets have no USDOT — informational only.
        setAddListingFmcsaError('No USDOT on file for this docket — fill in the details manually (expected for broker authorities).')
      }

      // Map safety rating
      let safetyRatingValue = 'not-rated'
      if (carrier.safetyRating) {
        const rating = carrier.safetyRating.toLowerCase()
        if (rating.includes('satisfactory')) safetyRatingValue = 'satisfactory'
        else if (rating.includes('conditional')) safetyRatingValue = 'conditional'
        else if (rating.includes('unsatisfactory')) safetyRatingValue = 'unsatisfactory'
      }

      // Calculate years active from MCS-150 date
      let yearsActive = ''
      if (carrier.mcs150Date) {
        try {
          const mcsDate = new Date(carrier.mcs150Date)
          const now = new Date()
          const years = Math.floor((now.getTime() - mcsDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          if (years > 0) yearsActive = String(years)
        } catch (e) {
          // Ignore date parsing errors
        }
      }

      // Auto-generate title
      const mcNum = newListing.mcNumber || carrier.dotNumber
      const generatedTitle = `${carrier.legalName} - MC #${mcNum}`

      setNewListing(prev => ({
        ...prev,
        dotNumber: String(carrier.dotNumber || prev.dotNumber),
        legalName: carrier.legalName || '',
        dbaName: carrier.dbaName || '',
        city: carrier.hqCity || '',
        state: carrier.hqState || prev.state,
        address: carrier.physicalAddress || '',
        contactPhone: carrier.phone || prev.contactPhone,
        totalDrivers: String(carrier.totalDrivers || 0),
        fleetSize: String(carrier.totalPowerUnits || 0),
        safetyRating: safetyRatingValue,
        bipdCoverage: String(carrier.bipdOnFile || 0),
        cargoCoverage: String(carrier.cargoOnFile || 0),
        bondAmount: String(carrier.bondOnFile || 0),
        cargoTypes: carrier.cargoTypes || [],
        title: generatedTitle,
        yearsActive: yearsActive || prev.yearsActive,
      }))

      // Store raw carrier data for persistence
      setAddListingFmcsaCarrierData(carrier)

      // Fetch authority history in background
      const dotNum = carrier.dotNumber || newListing.dotNumber
      if (dotNum) {
        try {
          const authResponse = await api.fmcsaGetAuthorityHistory(dotNum).catch(() => null)
          if (authResponse?.data) {
            setAddListingAuthorityHistory(authResponse.data)
            // Auto-fill authority date fields if available
            const auth = authResponse.data
            const derivedType = deriveAuthorityTypeFromHistory(auth)
            setNewListing(prev => ({
              ...prev,
              applicationDate: auth.applicationDate || prev.applicationDate,
              grantDate: auth.grantDate || auth.commonAuthorityGrantDate || prev.grantDate,
              effectiveDate: auth.effectiveDate || prev.effectiveDate,
              revocationDate: auth.revocationDate || auth.commonAuthorityRevokedDate || prev.revocationDate,
              authorityType: addListingAuthorityTypeTouched ? prev.authorityType : derivedType,
            }))
          }
        } catch (e) {
          console.warn('Failed to fetch authority history:', e)
        }
      }

      setAddListingFmcsaSuccess(true)
    } catch (err: any) {
      const message = err.message || 'Failed to lookup carrier data'
      // 404 / "not found" is an expected user scenario, not an app error
      if (message.toLowerCase().includes('not found')) {
        setAddListingFmcsaError('No carrier found with that number. Please check and try again.')
      } else {
        console.warn('FMCSA Lookup failed:', message)
        setAddListingFmcsaError(message)
      }
    } finally {
      setAddListingFmcsaLoading(false)
    }
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredListings = allListings
    .filter(listing => {
      let matchesFilter = false
      if (activeFilter === 'all') {
        matchesFilter = true
      } else if (activeFilter === 'premium') {
        matchesFilter = listing.isPremium
      } else if (activeFilter === 'vip') {
        matchesFilter = listing.isVip
      } else {
        matchesFilter = listing.status === activeFilter
      }
      const matchesSearch =
        listing.mcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.dotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'mcNumber':
          comparison = a.mcNumber.localeCompare(b.mcNumber)
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'views':
          comparison = a.views - b.views
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const stats = [
    { label: 'Total', value: allListings.length, color: 'bg-gray-100 text-gray-700' },
    { label: 'Active', value: allListings.filter(l => l.status === 'active').length, color: 'bg-green-100 text-green-700' },
    { label: 'Pending', value: allListings.filter(l => l.status === 'pending').length, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Reserved', value: allListings.filter(l => l.status === 'reserved').length, color: 'bg-orange-100 text-orange-700' },
    { label: 'Sold', value: allListings.filter(l => l.status === 'sold').length, color: 'bg-blue-100 text-blue-700' },
    { label: 'Rejected', value: allListings.filter(l => l.status === 'rejected').length, color: 'bg-red-100 text-red-700' },
    { label: 'Draft', value: allListings.filter(l => l.status === 'draft').length, color: 'bg-purple-100 text-purple-700' },
    { label: 'Premium', value: allListings.filter(l => l.isPremium).length, color: 'bg-amber-100 text-amber-700' },
    { label: 'VIP', value: allListings.filter(l => l.isVip).length, color: 'bg-yellow-100 text-yellow-700' },
  ]

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      reserved: 'bg-orange-100 text-orange-700',
      sold: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      draft: 'bg-purple-100 text-purple-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const openDetailModal = (listing: Listing) => {
    setSelectedListing(listing)
    setShowDetailModal(true)
    setIsEditMode(false)
    setEditForm(null)
    setEditError(null)
  }

  const enterEditMode = (listing: Listing) => {
    // Parse authority history if stored as JSON string
    let parsedAuth: any = null
    if (listing.authorityHistory) {
      try { parsedAuth = typeof listing.authorityHistory === 'string' ? JSON.parse(listing.authorityHistory) : listing.authorityHistory } catch { parsedAuth = null }
    }
    setEditForm({
      mcNumber: listing.mcNumber || '',
      dotNumber: listing.dotNumber || '',
      legalName: listing.legalName || '',
      dbaName: listing.dbaName || '',
      title: listing.title || '',
      description: (listing as any).description || '',
      askingPrice: String(listing.askingPrice || listing.price || ''),
      city: listing.city || '',
      state: listing.state || '',
      address: listing.address || '',
      contactEmail: listing.contactEmail || '',
      contactPhone: listing.contactPhone || '',
      yearsActive: String(listing.yearsActive || ''),
      fleetSize: String(listing.fleetSize || ''),
      totalDrivers: String(listing.totalDrivers || ''),
      safetyRating: listing.safetyRating?.toLowerCase() || 'not-rated',
      bipdCoverage: String(listing.bipdCoverage || ''),
      cargoCoverage: String(listing.cargoCoverage || ''),
      bondAmount: String(listing.bondAmount || ''),
      insuranceCompany: listing.insuranceCompany || '',
      monthlyInsurancePremium: String(listing.monthlyInsurancePremium || ''),
      amazonStatus: listing.amazonStatus?.toLowerCase() || 'none',
      amazonRelayScore: listing.amazonRelayScore || '',
      highwaySetup: listing.highwaySetup || false,
      isPremium: listing.isPremium || false,
      isVip: listing.isVip || false,
      sellingWithEmail: listing.sellingWithEmail || false,
      sellingWithPhone: listing.sellingWithPhone || false,
      visibility: listing.visibility?.toLowerCase() || 'public',
      cargoTypes: listing.cargoTypes || [],
      status: listing.status || 'active',
      // Authority date fields from parsed authority history
      applicationDate: parsedAuth?.applicationDate || '',
      grantDate: parsedAuth?.grantDate || parsedAuth?.commonAuthorityGrantDate || '',
      effectiveDate: parsedAuth?.effectiveDate || '',
      revocationDate: parsedAuth?.revocationDate || parsedAuth?.commonAuthorityRevokedDate || '',
      authorityType: (listing as any).authorityType || 'MOTOR_CARRIER',
    })
    setIsEditMode(true)
    setEditError(null)
    // Initialize seller reassignment state with current seller
    setEditSelectedSeller(listing.seller)
    setEditSellerSearchTerm('')
    setEditSellerSearchResults([])
    setShowEditSellerDropdown(false)
  }

  const handleSaveEdit = async () => {
    if (!selectedListing || !editForm) return
    setEditLoading(true)
    setEditError(null)

    try {
      // Build authority history JSON with dates
      let authorityHistoryUpdate: string | undefined
      if (editForm.applicationDate || editForm.grantDate || editForm.effectiveDate || editForm.revocationDate) {
        let existingAuth: any = {}
        if (selectedListing.authorityHistory) {
          try { existingAuth = typeof selectedListing.authorityHistory === 'string' ? JSON.parse(selectedListing.authorityHistory) : selectedListing.authorityHistory } catch { existingAuth = {} }
        }
        authorityHistoryUpdate = JSON.stringify({
          ...existingAuth,
          applicationDate: editForm.applicationDate || undefined,
          grantDate: editForm.grantDate || undefined,
          effectiveDate: editForm.effectiveDate || undefined,
          revocationDate: editForm.revocationDate || undefined,
        })
      }

      const response = await api.updateAdminListing(selectedListing.id, {
        sellerId: editSelectedSeller && editSelectedSeller.id !== selectedListing.seller.id ? editSelectedSeller.id : undefined,
        mcNumber: editForm.mcNumber || undefined,
        dotNumber: editForm.dotNumber || undefined,
        legalName: editForm.legalName || undefined,
        dbaName: editForm.dbaName || undefined,
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        askingPrice: editForm.askingPrice ? parseFloat(editForm.askingPrice) : undefined,
        city: editForm.city || undefined,
        state: editForm.state || undefined,
        address: editForm.address || undefined,
        contactEmail: editForm.contactEmail || undefined,
        contactPhone: editForm.contactPhone || undefined,
        yearsActive: editForm.yearsActive ? parseInt(editForm.yearsActive) : undefined,
        fleetSize: editForm.fleetSize ? parseInt(editForm.fleetSize) : undefined,
        totalDrivers: editForm.totalDrivers ? parseInt(editForm.totalDrivers) : undefined,
        safetyRating: editForm.safetyRating || undefined,
        bipdCoverage: editForm.bipdCoverage ? parseInt(editForm.bipdCoverage) : undefined,
        cargoCoverage: editForm.cargoCoverage ? parseInt(editForm.cargoCoverage) : undefined,
        bondAmount: editForm.bondAmount ? parseInt(editForm.bondAmount) : undefined,
        insuranceCompany: editForm.insuranceCompany || undefined,
        monthlyInsurancePremium: editForm.monthlyInsurancePremium ? parseFloat(editForm.monthlyInsurancePremium) : undefined,
        amazonStatus: editForm.amazonStatus?.toUpperCase() || undefined,
        amazonRelayScore: editForm.amazonRelayScore || undefined,
        highwaySetup: editForm.highwaySetup,
        sellingWithEmail: editForm.sellingWithEmail,
        sellingWithPhone: editForm.sellingWithPhone,
        isPremium: editForm.isPremium,
        isVip: editForm.isVip,
        visibility: editForm.visibility || undefined,
        cargoTypes: editForm.cargoTypes?.length > 0 ? editForm.cargoTypes : undefined,
        authorityType: editForm.authorityType || undefined,
        status: editForm.status?.toUpperCase() || undefined,
        authorityHistory: authorityHistoryUpdate,
      })

      if (response.success) {
        toast.success('Listing updated successfully!')
        setIsEditMode(false)
        setEditForm(null)
        setShowDetailModal(false)
        fetchListings()
      } else {
        setEditError('Failed to update listing')
      }
    } catch (err: any) {
      console.error('Failed to update listing:', err)
      setEditError(err.message || 'Failed to update listing')
    } finally {
      setEditLoading(false)
    }
  }

  const resetAddListingForm = () => {
    setNewListing({
      mcNumber: '',
      dotNumber: '',
      legalName: '',
      dbaName: '',
      title: '',
      description: '',
      price: '',
      state: '',
      city: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      yearsActive: '',
      fleetSize: '',
      totalDrivers: '',
      safetyRating: 'satisfactory',
      amazonStatus: 'none',
      amazonRelayScore: '',
      highwaySetup: false,
      isPremium: false,
      isVip: false,
      sellingWithEmail: true,
      sellingWithPhone: true,
      bipdCoverage: '',
      cargoCoverage: '',
      bondAmount: '',
      insuranceCompany: '',
      monthlyInsurancePremium: '',
      cargoTypes: [],
      visibility: 'public',
      hasFactoring: '',
      factoringCompany: '',
      entryAuditCompleted: '',
      applicationDate: '',
      grantDate: '',
      effectiveDate: '',
      revocationDate: '',
      assignedTo: '',
      notes: '',
      authorityType: 'MOTOR_CARRIER',
    })
    setAddListingError(null)
    setAddListingFmcsaSuccess(false)
    setAddListingFmcsaError(null)
    setAddListingAuthorityHistory(null)
    setAddListingFmcsaCarrierData(null)
    setAddListingAuthorityTypeTouched(false)
    setSelectedSeller(null)
    setSellerSearchTerm('')
    setSellerSearchResults([])
  }

  const handleAddListing = async () => {
    const missingFields: string[] = []
    if (!newListing.mcNumber) missingFields.push('MC Number')
    if (!selectedSeller) missingFields.push('Seller (search and select a seller)')
    if (!newListing.price) missingFields.push('Asking Price')

    if (missingFields.length > 0) {
      setAddListingError(`Missing required fields: ${missingFields.join(', ')}`)
      return
    }

    const askingPrice = parseFloat(newListing.price)
    if (isNaN(askingPrice) || askingPrice <= 0) {
      setAddListingError('Please enter a valid asking price')
      return
    }

    setAddListingLoading(true)
    setAddListingError(null)

    try {
      const response = await api.createAdminListing({
        sellerId: selectedSeller.id,
        mcNumber: newListing.mcNumber,
        dotNumber: newListing.dotNumber || undefined,
        legalName: newListing.legalName || undefined,
        dbaName: newListing.dbaName || undefined,
        title: newListing.title || `${newListing.legalName} - MC #${newListing.mcNumber}`,
        description: newListing.description || undefined,
        askingPrice,
        city: newListing.city || undefined,
        state: newListing.state || undefined,
        address: newListing.address || undefined,
        contactEmail: newListing.contactEmail || undefined,
        contactPhone: newListing.contactPhone || undefined,
        yearsActive: newListing.yearsActive ? parseInt(newListing.yearsActive) : undefined,
        fleetSize: newListing.fleetSize ? parseInt(newListing.fleetSize) : undefined,
        totalDrivers: newListing.totalDrivers ? parseInt(newListing.totalDrivers) : undefined,
        safetyRating: newListing.safetyRating || undefined,
        insuranceOnFile: (parseInt(newListing.bipdCoverage) || 0) > 0 || (parseInt(newListing.cargoCoverage) || 0) > 0,
        bipdCoverage: newListing.bipdCoverage ? parseInt(newListing.bipdCoverage) : undefined,
        cargoCoverage: newListing.cargoCoverage ? parseInt(newListing.cargoCoverage) : undefined,
        bondAmount: newListing.bondAmount ? parseInt(newListing.bondAmount) : undefined,
        insuranceCompany: newListing.insuranceCompany || undefined,
        monthlyInsurancePremium: newListing.monthlyInsurancePremium ? parseFloat(newListing.monthlyInsurancePremium) : undefined,
        amazonStatus: newListing.amazonStatus?.toUpperCase() || undefined,
        amazonRelayScore: newListing.amazonRelayScore || undefined,
        highwaySetup: newListing.highwaySetup,
        sellingWithEmail: newListing.sellingWithEmail,
        sellingWithPhone: newListing.sellingWithPhone,
        cargoTypes: newListing.cargoTypes.length > 0 ? newListing.cargoTypes : undefined,
        authorityType: newListing.authorityType,
        isPremium: newListing.isPremium,
        isVip: newListing.isVip,
        visibility: newListing.visibility || 'public',
        hasFactoring: newListing.hasFactoring || undefined,
        factoringCompany: newListing.factoringCompany || undefined,
        entryAuditCompleted: newListing.entryAuditCompleted || undefined,
        status: 'ACTIVE',
        adminNotes: newListing.notes || undefined,
        fmcsaData: addListingFmcsaCarrierData ? JSON.stringify(addListingFmcsaCarrierData) : undefined,
        authorityHistory: JSON.stringify({
          ...(addListingAuthorityHistory || {}),
          applicationDate: newListing.applicationDate || undefined,
          grantDate: newListing.grantDate || undefined,
          effectiveDate: newListing.effectiveDate || undefined,
          revocationDate: newListing.revocationDate || undefined,
        }),
      })

      if (response.success) {
        toast.success('Listing created successfully!')
        setShowAddModal(false)
        resetAddListingForm()
        fetchListings()
      } else {
        setAddListingError('Failed to create listing')
      }
    } catch (err: any) {
      console.error('Failed to create listing:', err)
      setAddListingError(err.message || 'Failed to create listing')
    } finally {
      setAddListingLoading(false)
    }
  }

  // Handle creating user with listing
  const handleCreateUserWithListing = async () => {
    try {
      setCreateUserLoading(true)
      setCreateUserError(null)

      const askingPriceValue = parseFloat(newUserWithListing.askingPrice)
      if (isNaN(askingPriceValue) || askingPriceValue <= 0) {
        setCreateUserError('Please enter a valid asking price')
        setCreateUserLoading(false)
        return
      }

      const response = await api.createAdminUserWithListing({
        user: {
          email: newUserWithListing.email,
          name: newUserWithListing.name,
          password: newUserWithListing.password,
          phone: newUserWithListing.phone || undefined,
          companyName: newUserWithListing.companyName || undefined,
        },
        listing: {
          mcNumber: newUserWithListing.mcNumber,
          dotNumber: newUserWithListing.dotNumber || undefined,
          legalName: newUserWithListing.legalName || undefined,
          dbaName: newUserWithListing.dbaName || undefined,
          title: newUserWithListing.title,
          description: newUserWithListing.description || undefined,
          askingPrice: askingPriceValue,
          city: newUserWithListing.city || undefined,
          state: newUserWithListing.state || undefined,
          address: newUserWithListing.physicalAddress || undefined,
          yearsActive: newUserWithListing.yearsActive ? parseInt(newUserWithListing.yearsActive) : undefined,
          fleetSize: newUserWithListing.powerUnits ? parseInt(newUserWithListing.powerUnits) : undefined,
          totalDrivers: newUserWithListing.drivers ? parseInt(newUserWithListing.drivers) : undefined,
          safetyRating: newUserWithListing.safetyRating || undefined,
          insuranceOnFile: newUserWithListing.insuranceStatus === 'active',
          amazonStatus: newUserWithListing.amazonStatus?.toUpperCase() || undefined,
          amazonRelayScore: newUserWithListing.amazonRelayScore || undefined,
          highwaySetup: newUserWithListing.highwaySetup === 'yes',
          sellingWithEmail: newUserWithListing.sellingWithEmail === 'yes',
          sellingWithPhone: newUserWithListing.sellingWithPhone === 'yes',
          status: newUserWithListing.status,
        },
        createStripeAccount: newUserWithListing.createStripeAccount,
      })

      if (response.success) {
        // Close modal and refresh listings
        setShowCreateUserWithListingModal(false)
        setMcLookupSuccess(false)
        setMcLookupError(null)
        setNewUserWithListing({
          email: '',
          name: '',
          password: generatePassword(),
          phone: '',
          companyName: '',
          createStripeAccount: true,
          mcNumber: '',
          dotNumber: '',
          state: '',
          city: '',
          title: '',
          description: '',
          askingPrice: '',
          legalName: '',
          dbaName: '',
          physicalAddress: '',
          mailingAddress: '',
          carrierPhone: '',
          powerUnits: '',
          drivers: '',
          mcs150Date: '',
          operatingStatus: '',
          entityType: '',
          cargoCarried: [],
          yearsActive: '',
          fleetSize: '',
          safetyRating: 'satisfactory',
          insuranceStatus: 'active',
          amazonStatus: '',
          amazonRelayScore: '',
          highwaySetup: '',
          sellingWithEmail: '',
          sellingWithPhone: '',
          hasFactoring: '',
          factoringCompany: '',
          status: 'PENDING_REVIEW'
        })
        fetchListings()

        // Show Stripe onboarding URL if available
        if (response.data.stripeAccount?.onboardingUrl) {
          const openStripe = window.confirm(
            `User and listing created successfully!\n\nThe seller needs to complete Stripe onboarding.\n\nOpen Stripe onboarding link?`
          )
          if (openStripe) {
            window.open(response.data.stripeAccount.onboardingUrl, '_blank')
          }
        }
      } else {
        setCreateUserError('Failed to create user and listing')
      }
    } catch (err: any) {
      console.error('Failed to create user with listing:', err)
      setCreateUserError(err.message || 'Failed to create user and listing')
    } finally {
      setCreateUserLoading(false)
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-400" />
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">All Listings</h1>
          <p className="text-gray-600 mt-1">View and manage all trucking business listings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchListings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
            {viewMode === 'table' ? 'Card View' : 'Table View'}
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Listing
          </Button>
          <Button onClick={() => setShowCreateUserWithListingModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Create User + Listing
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchListings} className="ml-auto">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`px-4 py-2 rounded-lg ${stat.color} flex items-center gap-2`}
          >
            <span className="font-bold">{stat.value}</span>
            <span className="text-sm">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by MC, DOT, company name, seller, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'pending', 'reserved', 'sold', 'rejected', 'draft', 'premium', 'vip'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'premium' && <Crown className="w-3 h-3 inline mr-1" />}
                {filter === 'vip' && <Crown className="w-3 h-3 inline mr-1" />}
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading listings...</p>
          </div>
        </Card>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('mcNumber')}
                  >
                    <div className="flex items-center gap-1">
                      MC/DOT <SortIcon field="mcNumber" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Owner/Seller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      Asking <SortIcon field="price" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Listing Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('views')}
                  >
                    <div className="flex items-center gap-1">
                      Stats <SortIcon field="views" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Created <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/listing/${listing.id}`)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {listing.isPremium && <span title="Premium"><Crown className="w-4 h-4 text-amber-500" /></span>}
                        {listing.isVip && <span title="VIP"><Crown className="w-4 h-4 text-yellow-500" /></span>}
                        <div>
                          <p className="font-semibold text-gray-900">MC-{listing.mcNumber}</p>
                          {listing.dotNumber ? (
                            <p className="text-xs text-gray-500">DOT-{listing.dotNumber}</p>
                          ) : (
                            <p className="text-xs text-indigo-600 font-medium">
                              {AUTHORITY_TYPE_BADGE_LABELS[normalizeAuthorityType(listing.authorityType)]}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{listing.legalName}</p>
                      {listing.dbaName && (
                        <p className="text-xs text-gray-500">DBA: {listing.dbaName}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{listing.seller.name}</p>
                          <p className="text-xs text-gray-500">{listing.seller.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900">{listing.city}, {listing.state}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        {listing.isPremium ? 'Contact' : `$${listing.askingPrice.toLocaleString()}`}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {listing.listingPrice ? (
                        <p className="font-semibold text-emerald-600">
                          ${listing.listingPrice.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">Not set</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(listing.status)}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-500">
                        <p>{listing.views} views</p>
                        <p>{listing.offers} offers</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenActionDropdown(openActionDropdown === listing.id ? null : listing.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        {openActionDropdown === listing.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => {
                                navigate(`/admin/listing/${listing.id}`)
                                setOpenActionDropdown(null)
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              View & Edit
                            </button>
                            <button
                              onClick={() => {
                                window.open(`/mc/${listing.id}`, '_blank')
                                setOpenActionDropdown(null)
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Public Page
                            </button>
                            <button
                              onClick={() => {
                                handleToggleVip(listing)
                                setOpenActionDropdown(null)
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${listing.isVip ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <Crown className="w-4 h-4" />
                              {listing.isVip ? 'Remove VIP' : 'Mark as VIP'}
                            </button>
                            {listing.status === 'active' && (
                              <button
                                onClick={() => {
                                  openTelegramModal(listing)
                                  setOpenActionDropdown(null)
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                              >
                                <Send className="w-4 h-4" />
                                Share to Telegram
                              </button>
                            )}
                            {listing.status === 'pending' && (
                              <button
                                onClick={() => {
                                  navigate(`/admin/review/${listing.id}`)
                                  setOpenActionDropdown(null)
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Review Listing
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </Card>
      )}

      {/* Card View */}
      {!loading && viewMode === 'cards' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <Card
              key={listing.id}
              hover
              className="cursor-pointer"
              onClick={() => navigate(`/admin/listing/${listing.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {listing.isPremium && <Crown className="w-4 h-4 text-amber-500" />}
                    <h3 className="font-semibold text-gray-900">MC-{listing.mcNumber}</h3>
                  </div>
                  {listing.dotNumber ? (
                    <p className="text-xs text-gray-500">DOT-{listing.dotNumber}</p>
                  ) : (
                    <p className="text-xs text-indigo-600 font-medium">
                      {AUTHORITY_TYPE_BADGE_LABELS[normalizeAuthorityType(listing.authorityType)]}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(listing.status)}`}>
                  {listing.status}
                </span>
              </div>

              <p className="font-medium text-gray-900 mb-1">{listing.legalName}</p>
              <p className="text-sm text-gray-500 mb-3">{listing.city}, {listing.state}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">{listing.seller.name}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-lg font-bold text-gray-900">
                  {listing.isPremium ? 'Contact' : `$${listing.price.toLocaleString()}`}
                </p>
                <div className="text-xs text-gray-500">
                  {listing.views} views | {listing.offers} offers
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {selectedListing.isPremium && (
                        <span className="px-2 py-1 bg-amber-400 text-amber-900 rounded text-xs font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3" /> PREMIUM
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        selectedListing.status === 'active' ? 'bg-green-400 text-green-900' :
                        selectedListing.status === 'pending' ? 'bg-yellow-400 text-yellow-900' :
                        selectedListing.status === 'reserved' ? 'bg-orange-400 text-orange-900' :
                        selectedListing.status === 'sold' ? 'bg-blue-400 text-blue-900' :
                        selectedListing.status === 'draft' ? 'bg-purple-400 text-purple-900' :
                        'bg-red-400 text-red-900'
                      }`}>
                        {selectedListing.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold">MC-{selectedListing.mcNumber}</h2>
                    <p className="text-indigo-200">
                      {selectedListing.dotNumber
                        ? `DOT-${selectedListing.dotNumber}`
                        : AUTHORITY_TYPE_PILL_LABELS[normalizeAuthorityType(selectedListing.authorityType)]}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Edit Error */}
                {editError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{editError}</span>
                    <button onClick={() => setEditError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                  </div>
                )}

                {isEditMode && editForm ? (
                  <>
                    {/* EDIT MODE */}
                    {/* Seller Reassignment */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        Assigned Seller
                      </h3>
                      {editSelectedSeller && (
                        <div className="flex items-center gap-3 mb-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{editSelectedSeller.name}</p>
                            <p className="text-sm text-gray-500">{editSelectedSeller.email}</p>
                          </div>
                          {editSelectedSeller.id !== selectedListing?.seller.id && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Changed</span>
                          )}
                        </div>
                      )}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reassign to a different seller</label>
                        <Input
                          placeholder="Search sellers by name or email..."
                          value={editSellerSearchTerm}
                          onChange={(e: any) => setEditSellerSearchTerm(e.target.value)}
                        />
                        {editSellerSearchLoading && (
                          <div className="absolute right-3 top-9">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        )}
                        {showEditSellerDropdown && editSellerSearchResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {editSellerSearchResults.map((user: any) => (
                              <button
                                key={user.id}
                                className="w-full px-4 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                onClick={() => {
                                  setEditSelectedSeller({ id: user.id, name: user.name, email: user.email, phone: user.phone })
                                  setEditSellerSearchTerm('')
                                  setShowEditSellerDropdown(false)
                                  setEditSellerSearchResults([])
                                }}
                              >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
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
                      {editSelectedSeller && editSelectedSeller.id !== selectedListing?.seller.id && (
                        <button
                          className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
                          onClick={() => setEditSelectedSeller(selectedListing?.seller || null)}
                        >
                          Revert to original seller
                        </button>
                      )}
                    </div>

                    {/* Company Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Company Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label>
                          <Input value={editForm.mcNumber} onChange={(e: any) => setEditForm({ ...editForm, mcNumber: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label>
                          <Input value={editForm.dotNumber} onChange={(e: any) => setEditForm({ ...editForm, dotNumber: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                          <Input value={editForm.legalName} onChange={(e: any) => setEditForm({ ...editForm, legalName: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">DBA Name</label>
                          <Input value={editForm.dbaName} onChange={(e: any) => setEditForm({ ...editForm, dbaName: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <Input value={editForm.city} onChange={(e: any) => setEditForm({ ...editForm, city: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <Input value={editForm.state} onChange={(e: any) => setEditForm({ ...editForm, state: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                          <Input value={editForm.address} onChange={(e: any) => setEditForm({ ...editForm, address: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                          <Input type="email" value={editForm.contactEmail} onChange={(e: any) => setEditForm({ ...editForm, contactEmail: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                          <Input type="tel" value={editForm.contactPhone} onChange={(e: any) => setEditForm({ ...editForm, contactPhone: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Years Active</label>
                          <Input type="number" value={editForm.yearsActive} onChange={(e: any) => setEditForm({ ...editForm, yearsActive: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Size</label>
                          <Input type="number" value={editForm.fleetSize} onChange={(e: any) => setEditForm({ ...editForm, fleetSize: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Drivers</label>
                          <Input type="number" value={editForm.totalDrivers} onChange={(e: any) => setEditForm({ ...editForm, totalDrivers: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Safety Rating</label>
                          <select value={editForm.safetyRating} onChange={(e) => setEditForm({ ...editForm, safetyRating: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="satisfactory">Satisfactory</option>
                            <option value="conditional">Conditional</option>
                            <option value="unsatisfactory">Unsatisfactory</option>
                            <option value="not-rated">Not Rated</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Authority Key Dates */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        MC Authority Dates
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Applied</label>
                          <Input type="date" value={editForm.applicationDate} onChange={(e: any) => setEditForm({ ...editForm, applicationDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Granted</label>
                          <Input type="date" value={editForm.grantDate} onChange={(e: any) => setEditForm({ ...editForm, grantDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Effective</label>
                          <Input type="date" value={editForm.effectiveDate} onChange={(e: any) => setEditForm({ ...editForm, effectiveDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Revoked</label>
                          <Input type="date" value={editForm.revocationDate} onChange={(e: any) => setEditForm({ ...editForm, revocationDate: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* Authority Type */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-indigo-600" />
                        Authority Type
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {AUTHORITY_TYPE_OPTIONS.map((option) => {
                          const selected = editForm.authorityType === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, authorityType: option.value })}
                              className={`p-3 rounded-xl border-2 transition-all text-center ${
                                selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                              }`}
                            >
                              <div className={`text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-gray-700'}`}>{option.label}</div>
                              <div className="text-xs text-gray-400 mt-1">{option.sub}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Insurance & Coverage */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        Insurance & Coverage
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">BIPD Coverage ($)</label>
                          <Input type="number" value={editForm.bipdCoverage} onChange={(e: any) => setEditForm({ ...editForm, bipdCoverage: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Coverage ($)</label>
                          <Input type="number" value={editForm.cargoCoverage} onChange={(e: any) => setEditForm({ ...editForm, cargoCoverage: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bond Amount ($)</label>
                          <Input type="number" value={editForm.bondAmount} onChange={(e: any) => setEditForm({ ...editForm, bondAmount: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company</label>
                          <Input value={editForm.insuranceCompany} onChange={(e: any) => setEditForm({ ...editForm, insuranceCompany: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Premium ($)</label>
                          <Input type="number" value={editForm.monthlyInsurancePremium} onChange={(e: any) => setEditForm({ ...editForm, monthlyInsurancePremium: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* Listing Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Listing Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <Input value={editForm.title} onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($)</label>
                          <Input type="number" value={editForm.askingPrice} onChange={(e: any) => setEditForm({ ...editForm, askingPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                            <option value="sold">Sold</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Status</label>
                          <select value={editForm.amazonStatus} onChange={(e) => setEditForm({ ...editForm, amazonStatus: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="none">None</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Relay Score</label>
                          <Input value={editForm.amazonRelayScore} onChange={(e: any) => setEditForm({ ...editForm, amazonRelayScore: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                          <select value={editForm.visibility} onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <Textarea value={editForm.description} onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-indigo-600" />
                        Options
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { key: 'isPremium', label: 'Premium' },
                          { key: 'isVip', label: 'VIP' },
                          { key: 'highwaySetup', label: 'Highway Setup' },
                          { key: 'sellingWithEmail', label: 'Selling with Email' },
                          { key: 'sellingWithPhone', label: 'Selling with Phone' },
                        ].map(opt => (
                          <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editForm[opt.key]} onChange={(e) => setEditForm({ ...editForm, [opt.key]: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button onClick={handleSaveEdit} disabled={editLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                        {editLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4 mr-2" /> Save Changes</>}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsEditMode(false); setEditForm(null); setEditError(null) }}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* VIEW MODE */}
                    {/* Company Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                          Company Information
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Legal Name</p>
                            <p className="font-medium text-gray-900">{selectedListing.legalName}</p>
                          </div>
                          {selectedListing.dbaName && (
                            <div>
                              <p className="text-xs text-gray-500">DBA</p>
                              <p className="font-medium text-gray-900">{selectedListing.dbaName}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">{selectedListing.city}, {selectedListing.state}</p>
                          </div>
                          {selectedListing.address && (
                            <div>
                              <p className="text-xs text-gray-500">Address</p>
                              <p className="font-medium text-gray-900">{selectedListing.address}</p>
                            </div>
                          )}
                          {(selectedListing.contactEmail || selectedListing.contactPhone) && (
                            <div className="space-y-1 pt-1">
                              {selectedListing.contactEmail && (
                                <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedListing.contactEmail}</p>
                              )}
                              {selectedListing.contactPhone && (
                                <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedListing.contactPhone}</p>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-lg font-bold text-gray-900">{selectedListing.yearsActive}</p>
                              <p className="text-xs text-gray-500">Years</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-lg font-bold text-gray-900">{selectedListing.fleetSize}</p>
                              <p className="text-xs text-gray-500">Trucks</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-lg font-bold text-gray-900">{selectedListing.totalDrivers}</p>
                              <p className="text-xs text-gray-500">Drivers</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          Owner / Seller
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{selectedListing.seller.name}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="w-4 h-4" /> {selectedListing.seller.email}
                            </p>
                            {selectedListing.seller.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> {selectedListing.seller.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Authority Key Dates (from stored authorityHistory) */}
                    {(() => {
                      let auth: any = null
                      if (selectedListing.authorityHistory) {
                        try { auth = typeof selectedListing.authorityHistory === 'string' ? JSON.parse(selectedListing.authorityHistory) : selectedListing.authorityHistory } catch { auth = null }
                      }
                      if (!auth) return null
                      const hasAnyDate = auth.applicationDate || auth.grantDate || auth.effectiveDate || auth.revocationDate || auth.commonAuthorityGrantDate
                      if (!hasAnyDate && !auth.commonAuthorityStatus) return null
                      return (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            MC Authority Dates
                          </h3>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-400 mb-1">Applied</p>
                              <p className="text-sm font-semibold text-gray-800">{auth.applicationDate || '—'}</p>
                            </div>
                            <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-400 mb-1">Granted</p>
                              <p className="text-sm font-semibold text-gray-800">{auth.grantDate || auth.commonAuthorityGrantDate || '—'}</p>
                            </div>
                            <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-400 mb-1">Effective</p>
                              <p className="text-sm font-semibold text-gray-800">{auth.effectiveDate || '—'}</p>
                            </div>
                            <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-400 mb-1">Revoked</p>
                              <p className={`text-sm font-semibold ${auth.revocationDate || auth.commonAuthorityRevokedDate ? 'text-red-600' : 'text-gray-800'}`}>
                                {auth.revocationDate || auth.commonAuthorityRevokedDate || '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Safety & Compliance */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-indigo-600" />
                          Safety & Compliance
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Safety Rating</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              selectedListing.safetyRating?.toLowerCase().includes('satisfactory') ? 'bg-green-100 text-green-700' :
                              selectedListing.safetyRating?.toLowerCase().includes('conditional') ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {selectedListing.safetyRating}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Insurance on File</span>
                            {selectedListing.insuranceOnFile ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">BIPD Coverage</span>
                            <span className="font-medium">${selectedListing.bipdCoverage.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Cargo Coverage</span>
                            <span className="font-medium">${selectedListing.cargoCoverage.toLocaleString()}</span>
                          </div>
                          {(selectedListing.bondAmount ?? 0) > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Bond Amount</span>
                              <span className="font-medium">${selectedListing.bondAmount!.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedListing.insuranceCompany && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Insurance Company</span>
                              <span className="font-medium">{selectedListing.insuranceCompany}</span>
                            </div>
                          )}
                          {(selectedListing.monthlyInsurancePremium ?? 0) > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Monthly Premium</span>
                              <span className="font-medium">${selectedListing.monthlyInsurancePremium!.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-indigo-600" />
                          Platform Integrations
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Amazon Relay</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              selectedListing.amazonStatus === 'active' ? 'bg-green-100 text-green-700' :
                              selectedListing.amazonStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              selectedListing.amazonStatus === 'suspended' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {selectedListing.amazonStatus === 'active' && selectedListing.amazonRelayScore
                                ? `Active (${selectedListing.amazonRelayScore})`
                                : selectedListing.amazonStatus.charAt(0).toUpperCase() + selectedListing.amazonStatus.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Highway Setup</span>
                            {selectedListing.highwaySetup ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Selling with Email</span>
                            {selectedListing.sellingWithEmail ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Selling with Phone</span>
                            {selectedListing.sellingWithPhone ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          {selectedListing.visibility && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Visibility</span>
                              <span className="font-medium capitalize">{selectedListing.visibility}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cargo Types */}
                    {selectedListing.cargoTypes.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Truck className="w-5 h-5 text-indigo-600" />
                          Cargo Types
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedListing.cargoTypes.map((cargo, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                              {cargo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial & Stats */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-indigo-600" />
                        Pricing & Statistics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedListing.isPremium ? 'Contact' : `$${selectedListing.price.toLocaleString()}`}
                          </p>
                          <p className="text-xs text-gray-500">Asking Price</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{selectedListing.views}</p>
                          <p className="text-xs text-gray-500">Views</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{selectedListing.saves}</p>
                          <p className="text-xs text-gray-500">Saves</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{selectedListing.offers}</p>
                          <p className="text-xs text-gray-500">Offers</p>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {selectedListing.rejectionReason && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Rejection Reason
                        </h3>
                        <p className="text-red-700">{selectedListing.rejectionReason}</p>
                        {selectedListing.rejectedDate && (
                          <p className="text-sm text-red-600 mt-2">
                            Rejected on {new Date(selectedListing.rejectedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <Button onClick={() => navigate(`/mc/${selectedListing.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Public Page
                      </Button>
                      {selectedListing.status === 'pending' && (
                        <Button
                          onClick={() => navigate(`/admin/review/${selectedListing.id}`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Review Listing
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => enterEditMode(selectedListing)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" className="text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Listing Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowAddModal(false); resetAddListingForm() }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Plus className="w-6 h-6" />
                      Add New Listing
                    </h2>
                    <p className="text-indigo-200 mt-1">Look up FMCSA data, assign to a seller, and create</p>
                  </div>
                  <button
                    onClick={() => { setShowAddModal(false); resetAddListingForm() }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Error Message */}
                {addListingError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{addListingError}</span>
                    <button onClick={() => setAddListingError(null)} className="ml-auto">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Section 1: FMCSA Authority Lookup */}
                <div className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 -mx-6 px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Authority Lookup</h3>
                      <p className="text-sm text-gray-500">Enter MC or DOT number to auto-fill carrier information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label>
                      <Input
                        placeholder="Enter MC number..."
                        value={newListing.mcNumber}
                        onChange={(e) => {
                          setNewListing({ ...newListing, mcNumber: e.target.value })
                          setAddListingFmcsaSuccess(false)
                          setAddListingFmcsaError(null)
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label>
                      <Input
                        placeholder="Enter DOT number..."
                        value={newListing.dotNumber}
                        onChange={(e) => {
                          setNewListing({ ...newListing, dotNumber: e.target.value })
                          setAddListingFmcsaSuccess(false)
                          setAddListingFmcsaError(null)
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddListingFmcsaLookup}
                    disabled={addListingFmcsaLoading || (!newListing.mcNumber && !newListing.dotNumber)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {addListingFmcsaLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Looking up...</>
                    ) : (
                      <><Search className="w-4 h-4 mr-2" /> Lookup FMCSA</>
                    )}
                  </Button>
                  {addListingFmcsaError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {addListingFmcsaError}
                    </div>
                  )}
                  {addListingFmcsaSuccess && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Carrier data loaded successfully! Fields have been auto-populated below.
                    </div>
                  )}
                </div>

                {/* FMCSA Snapshot (shown after successful lookup) */}
                {addListingFmcsaCarrierData && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-green-600" />
                      FMCSA Carrier Snapshot
                    </h4>

                    {/* Carrier Identity & Operating Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">Legal Name</div>
                        <div className="text-sm font-semibold text-gray-900">{addListingFmcsaCarrierData.legalName}</div>
                        {addListingFmcsaCarrierData.dbaName && (
                          <div className="text-xs text-gray-500 mt-0.5">DBA: {addListingFmcsaCarrierData.dbaName}</div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">Operating Status</div>
                        <div className={`text-sm font-bold ${addListingFmcsaCarrierData.allowedToOperate === 'Y' ? 'text-green-600' : 'text-red-600'}`}>
                          {addListingFmcsaCarrierData.allowedToOperate === 'Y' ? 'AUTHORIZED' : 'NOT AUTHORIZED'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">Address</div>
                        <div className="text-sm text-gray-800">
                          {[addListingFmcsaCarrierData.physicalAddress, addListingFmcsaCarrierData.hqCity, addListingFmcsaCarrierData.hqState].filter(Boolean).join(', ')}
                        </div>
                        {addListingFmcsaCarrierData.phone && (
                          <div className="text-xs text-gray-500 mt-0.5">{addListingFmcsaCarrierData.phone}</div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">MCS-150 Date</div>
                        <div className="text-sm font-medium text-gray-800">{addListingFmcsaCarrierData.mcs150Date || '—'}</div>
                        {addListingFmcsaCarrierData.carrierOperation && (
                          <div className="text-xs text-gray-500 mt-0.5">Type: {addListingFmcsaCarrierData.carrierOperation}</div>
                        )}
                      </div>
                    </div>

                    {/* Fleet & Safety */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Power Units</div>
                        <div className="text-lg font-bold text-gray-900">{addListingFmcsaCarrierData.totalPowerUnits || 0}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Drivers</div>
                        <div className="text-lg font-bold text-gray-900">{addListingFmcsaCarrierData.totalDrivers || 0}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Safety Rating</div>
                        <div className={`text-sm font-bold ${
                          addListingFmcsaCarrierData.safetyRating?.toLowerCase().includes('satisfactory') ? 'text-green-600' :
                          addListingFmcsaCarrierData.safetyRating?.toLowerCase().includes('conditional') ? 'text-yellow-600' :
                          addListingFmcsaCarrierData.safetyRating?.toLowerCase().includes('unsatisfactory') ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {addListingFmcsaCarrierData.safetyRating || 'None'}
                        </div>
                        {addListingFmcsaCarrierData.safetyRatingDate && (
                          <div className="text-xs text-gray-400">{addListingFmcsaCarrierData.safetyRatingDate}</div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Insurance</div>
                        <div className={`text-sm font-bold ${addListingFmcsaCarrierData.insuranceOnFile ? 'text-green-600' : 'text-red-600'}`}>
                          {addListingFmcsaCarrierData.insuranceOnFile ? 'On File' : 'None'}
                        </div>
                      </div>
                    </div>

                    {/* Insurance Details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">BIPD on File</div>
                        <div className="text-sm font-semibold text-gray-900">${(addListingFmcsaCarrierData.bipdOnFile || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Req: ${(addListingFmcsaCarrierData.bipdRequired || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Cargo on File</div>
                        <div className="text-sm font-semibold text-gray-900">${(addListingFmcsaCarrierData.cargoOnFile || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Req: ${(addListingFmcsaCarrierData.cargoRequired || 0).toLocaleString()}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Bond on File</div>
                        <div className="text-sm font-semibold text-gray-900">${(addListingFmcsaCarrierData.bondOnFile || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Req: ${(addListingFmcsaCarrierData.bondRequired || 0).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Inspections & Crashes */}
                    {(addListingFmcsaCarrierData.driverInsp > 0 || addListingFmcsaCarrierData.vehicleInsp > 0 || addListingFmcsaCarrierData.crashTotal > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-gray-200">
                          <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Inspections (24 mo)</div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-xs text-gray-400">Driver</div>
                              <div className="text-sm font-bold">{addListingFmcsaCarrierData.driverInsp || 0}</div>
                              {addListingFmcsaCarrierData.driverOosRate > 0 && <div className="text-xs text-red-500">{addListingFmcsaCarrierData.driverOosRate}% OOS</div>}
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Vehicle</div>
                              <div className="text-sm font-bold">{addListingFmcsaCarrierData.vehicleInsp || 0}</div>
                              {addListingFmcsaCarrierData.vehicleOosRate > 0 && <div className="text-xs text-red-500">{addListingFmcsaCarrierData.vehicleOosRate}% OOS</div>}
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Hazmat</div>
                              <div className="text-sm font-bold">{addListingFmcsaCarrierData.hazmatInsp || 0}</div>
                              {addListingFmcsaCarrierData.hazmatOosRate > 0 && <div className="text-xs text-red-500">{addListingFmcsaCarrierData.hazmatOosRate}% OOS</div>}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-200">
                          <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Crashes (24 mo)</div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div>
                              <div className="text-xs text-gray-400">Total</div>
                              <div className={`text-sm font-bold ${addListingFmcsaCarrierData.crashTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>{addListingFmcsaCarrierData.crashTotal || 0}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Fatal</div>
                              <div className={`text-sm font-bold ${addListingFmcsaCarrierData.fatalCrash > 0 ? 'text-red-600' : 'text-green-600'}`}>{addListingFmcsaCarrierData.fatalCrash || 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cargo Types */}
                    {addListingFmcsaCarrierData.cargoTypes?.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-400 mb-2">Cargo Types</div>
                        <div className="flex flex-wrap gap-1.5">
                          {addListingFmcsaCarrierData.cargoTypes.map((type: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700">{type}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Authority History (shown after FMCSA lookup) */}
                {addListingAuthorityHistory && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Authority History & Key Dates
                    </h4>

                    {/* Key MC Dates */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Applied</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {addListingAuthorityHistory.applicationDate || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Granted</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {addListingAuthorityHistory.grantDate || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Effective</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {addListingAuthorityHistory.effectiveDate || '—'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-center">
                        <div className="text-xs text-gray-400 mb-1">Revoked</div>
                        <div className={`text-sm font-semibold ${addListingAuthorityHistory.revocationDate ? 'text-red-600' : 'text-gray-800'}`}>
                          {addListingAuthorityHistory.revocationDate || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Authority Type Statuses */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">Common Authority</div>
                        <div className={`text-sm font-bold ${addListingAuthorityHistory.commonAuthorityStatus === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                          {addListingAuthorityHistory.commonAuthorityStatus || 'N/A'}
                        </div>
                        {addListingAuthorityHistory.commonAuthorityGrantDate && (
                          <div className="text-xs text-gray-400 mt-1">Granted: {addListingAuthorityHistory.commonAuthorityGrantDate}</div>
                        )}
                        {addListingAuthorityHistory.commonAuthorityRevokedDate && (
                          <div className="text-xs text-red-400 mt-1">Revoked: {addListingAuthorityHistory.commonAuthorityRevokedDate}</div>
                        )}
                        {addListingAuthorityHistory.commonAuthorityReinstatedDate && (
                          <div className="text-xs text-green-400 mt-1">Reinstated: {addListingAuthorityHistory.commonAuthorityReinstatedDate}</div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">Contract Authority</div>
                        <div className={`text-sm font-bold ${addListingAuthorityHistory.contractAuthorityStatus === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                          {addListingAuthorityHistory.contractAuthorityStatus || 'N/A'}
                        </div>
                        {addListingAuthorityHistory.contractAuthorityGrantDate && (
                          <div className="text-xs text-gray-400 mt-1">Granted: {addListingAuthorityHistory.contractAuthorityGrantDate}</div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-xs text-gray-400 mb-1">Broker Authority</div>
                        <div className={`text-sm font-bold ${addListingAuthorityHistory.brokerAuthorityStatus === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                          {addListingAuthorityHistory.brokerAuthorityStatus || 'N/A'}
                        </div>
                        {addListingAuthorityHistory.brokerAuthorityGrantDate && (
                          <div className="text-xs text-gray-400 mt-1">Granted: {addListingAuthorityHistory.brokerAuthorityGrantDate}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Authority Type */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-600" />
                    Authority Type
                    {addListingFmcsaSuccess && !addListingAuthorityTypeTouched && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Auto-detected</span>}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {AUTHORITY_TYPE_OPTIONS.map((option) => {
                      const selected = newListing.authorityType === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setAddListingAuthorityTypeTouched(true)
                            setNewListing({ ...newListing, authorityType: option.value as typeof newListing.authorityType })
                          }}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className={`text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-gray-700'}`}>{option.label}</div>
                          <div className="text-xs text-gray-400 mt-1">{option.sub}</div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Auto-detected from FMCSA active authorities — adjust if needed.</p>
                </div>

                {/* MC Authority Dates (editable) */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    MC Authority Dates
                    {addListingFmcsaSuccess && (newListing.applicationDate || newListing.grantDate) && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Auto-filled</span>}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Applied</label>
                      <Input
                        type="date"
                        value={newListing.applicationDate}
                        onChange={(e) => setNewListing({ ...newListing, applicationDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Granted</label>
                      <Input
                        type="date"
                        value={newListing.grantDate}
                        onChange={(e) => setNewListing({ ...newListing, grantDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective</label>
                      <Input
                        type="date"
                        value={newListing.effectiveDate}
                        onChange={(e) => setNewListing({ ...newListing, effectiveDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Revoked</label>
                      <Input
                        type="date"
                        value={newListing.revocationDate}
                        onChange={(e) => setNewListing({ ...newListing, revocationDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Auto-populated from FMCSA when available, or enter manually</p>
                </div>

                {/* Section 2: Auto-filled Company Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    Company Information
                    {addListingFmcsaSuccess && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Auto-filled</span>}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name *</label>
                      <Input
                        placeholder="Company LLC"
                        value={newListing.legalName}
                        onChange={(e) => setNewListing({ ...newListing, legalName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DBA Name</label>
                      <Input
                        placeholder="Trading As"
                        value={newListing.dbaName}
                        onChange={(e) => setNewListing({ ...newListing, dbaName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <Input
                        placeholder="Houston"
                        value={newListing.city}
                        onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <Input
                        placeholder="TX"
                        value={newListing.state}
                        onChange={(e) => setNewListing({ ...newListing, state: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <Input
                        placeholder="123 Main St"
                        value={newListing.address}
                        onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        value={newListing.contactEmail}
                        onChange={(e) => setNewListing({ ...newListing, contactEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={newListing.contactPhone}
                        onChange={(e) => setNewListing({ ...newListing, contactPhone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Drivers</label>
                      <Input
                        type="number"
                        placeholder="12"
                        value={newListing.totalDrivers}
                        onChange={(e) => setNewListing({ ...newListing, totalDrivers: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Size (Power Units)</label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={newListing.fleetSize}
                        onChange={(e) => setNewListing({ ...newListing, fleetSize: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years Active</label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={newListing.yearsActive}
                        onChange={(e) => setNewListing({ ...newListing, yearsActive: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Safety Rating</label>
                      <select
                        value={newListing.safetyRating}
                        onChange={(e) => setNewListing({ ...newListing, safetyRating: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="satisfactory">Satisfactory</option>
                        <option value="conditional">Conditional</option>
                        <option value="unsatisfactory">Unsatisfactory</option>
                        <option value="not-rated">Not Rated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">BIPD Coverage ($)</label>
                      <Input
                        type="number"
                        placeholder="1000000"
                        value={newListing.bipdCoverage}
                        onChange={(e) => setNewListing({ ...newListing, bipdCoverage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Coverage ($)</label>
                      <Input
                        type="number"
                        placeholder="100000"
                        value={newListing.cargoCoverage}
                        onChange={(e) => setNewListing({ ...newListing, cargoCoverage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bond Amount ($)</label>
                      <Input
                        type="number"
                        placeholder="75000"
                        value={newListing.bondAmount}
                        onChange={(e) => setNewListing({ ...newListing, bondAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company</label>
                      <Input
                        placeholder="Progressive, National Interstate..."
                        value={newListing.insuranceCompany}
                        onChange={(e) => setNewListing({ ...newListing, insuranceCompany: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Insurance Premium ($)</label>
                      <Input
                        type="number"
                        placeholder="2500"
                        value={newListing.monthlyInsurancePremium}
                        onChange={(e) => setNewListing({ ...newListing, monthlyInsurancePremium: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Types</label>
                      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border border-gray-200 rounded-xl bg-white">
                        {newListing.cargoTypes.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1">
                            {type}
                            <button onClick={() => setNewListing({ ...newListing, cargoTypes: newListing.cargoTypes.filter((_, i) => i !== idx) })}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {newListing.cargoTypes.length === 0 && (
                          <span className="text-gray-400 text-sm">Auto-filled from FMCSA lookup</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Listing Details (admin fills) */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Listing Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
                      <Input
                        placeholder="Auto-generated from FMCSA lookup or enter manually"
                        value={newListing.title}
                        onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($) *</label>
                      <Input
                        type="number"
                        placeholder="45000"
                        value={newListing.price}
                        onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Status</label>
                      <select
                        value={newListing.amazonStatus}
                        onChange={(e) => setNewListing({ ...newListing, amazonStatus: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="none">None</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Relay Score</label>
                      <Input
                        placeholder="e.g. 850"
                        value={newListing.amazonRelayScore}
                        onChange={(e) => setNewListing({ ...newListing, amazonRelayScore: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                      <select
                        value={newListing.visibility}
                        onChange={(e) => setNewListing({ ...newListing, visibility: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Textarea
                        placeholder="Optional description for the listing..."
                        value={newListing.description}
                        onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Factoring & Audit */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-indigo-600" />
                    Factoring & Compliance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Has Factoring?</label>
                      <select
                        value={newListing.hasFactoring}
                        onChange={(e) => setNewListing({ ...newListing, hasFactoring: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Not Specified</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Factoring Company</label>
                      <Input
                        placeholder="Company name"
                        value={newListing.factoringCompany}
                        onChange={(e) => setNewListing({ ...newListing, factoringCompany: e.target.value })}
                        disabled={newListing.hasFactoring !== 'yes'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entry Audit Completed?</label>
                      <select
                        value={newListing.entryAuditCompleted}
                        onChange={(e) => setNewListing({ ...newListing, entryAuditCompleted: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Not Specified</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="not-required">Not Required</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Options */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    Options
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newListing.isPremium}
                        onChange={(e) => setNewListing({ ...newListing, isPremium: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Premium Listing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newListing.isVip}
                        onChange={(e) => setNewListing({ ...newListing, isVip: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">VIP Listing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newListing.highwaySetup}
                        onChange={(e) => setNewListing({ ...newListing, highwaySetup: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Highway Setup</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newListing.sellingWithEmail}
                        onChange={(e) => setNewListing({ ...newListing, sellingWithEmail: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Selling with Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newListing.sellingWithPhone}
                        onChange={(e) => setNewListing({ ...newListing, sellingWithPhone: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Selling with Phone</span>
                    </label>
                  </div>
                </div>

                {/* Section 5: Assign to Seller (searchable) */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Assign to Seller *
                  </h3>
                  {selectedSeller ? (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{selectedSeller.name}</p>
                        <p className="text-sm text-gray-500">{selectedSeller.email}{selectedSeller.companyName ? ` - ${selectedSeller.companyName}` : ''}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedSeller(null); setSellerSearchTerm(''); setNewListing({ ...newListing, assignedTo: '' }) }}
                        className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search sellers by name, email, or company..."
                          value={sellerSearchTerm}
                          onChange={(e) => setSellerSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                        {sellerSearchLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        )}
                      </div>
                      {showSellerDropdown && sellerSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                          {sellerSearchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setSelectedSeller(user)
                                setNewListing({ ...newListing, assignedTo: user.id })
                                setShowSellerDropdown(false)
                                setSellerSearchTerm('')
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}{user.companyName ? ` - ${user.companyName}` : ''}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {showSellerDropdown && sellerSearchResults.length === 0 && sellerSearchTerm.length >= 2 && !sellerSearchLoading && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-4 text-center text-sm text-gray-500">
                          No sellers found matching "{sellerSearchTerm}"
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Type at least 2 characters to search for sellers
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 6: Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                  <Textarea
                    placeholder="Any internal notes about this listing..."
                    value={newListing.notes}
                    onChange={(e) => setNewListing({ ...newListing, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleAddListing}
                    disabled={addListingLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {addListingLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" /> Create Listing</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddModal(false); resetAddListingForm() }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create User + Listing Modal */}
      <AnimatePresence>
        {showCreateUserWithListingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateUserWithListingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <UserPlus className="w-6 h-6" />
                      Create User + Listing
                    </h2>
                    <p className="text-emerald-200 mt-1">Create a new seller account with a listing and Stripe Connected Account</p>
                  </div>
                  <button
                    onClick={() => setShowCreateUserWithListingModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Error Messages */}
                {createUserError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {createUserError}
                  </div>
                )}

                {/* MC/DOT Lookup Section */}
                <div className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 -mx-6 px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">FMCSA Lookup</h3>
                      <p className="text-sm text-gray-500">Enter MC or DOT to auto-fill carrier information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label>
                      <Input
                        placeholder="Enter MC number..."
                        value={newUserWithListing.mcNumber}
                        onChange={(e) => {
                          setNewUserWithListing({ ...newUserWithListing, mcNumber: e.target.value })
                          setMcLookupSuccess(false)
                          setMcLookupError(null)
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label>
                      <Input
                        placeholder="Enter DOT number..."
                        value={newUserWithListing.dotNumber}
                        onChange={(e) => {
                          setNewUserWithListing({ ...newUserWithListing, dotNumber: e.target.value })
                          setMcLookupSuccess(false)
                          setMcLookupError(null)
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleMcLookup}
                    disabled={mcLookupLoading || (!newUserWithListing.mcNumber && !newUserWithListing.dotNumber)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    {mcLookupLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Searching FMCSA Database...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Auto-Fill from FMCSA
                      </>
                    )}
                  </Button>
                  {mcLookupError && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {mcLookupError}
                    </p>
                  )}
                  {mcLookupSuccess && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <BadgeCheck className="w-6 h-6 text-emerald-600" />
                        <span className="font-bold text-emerald-700">FMCSA Data Retrieved!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Building2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-700">{newUserWithListing.legalName}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-700">{newUserWithListing.city}, {newUserWithListing.state}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Truck className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-700">{newUserWithListing.powerUnits} Units • {newUserWithListing.drivers} Drivers</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-700">{newUserWithListing.yearsActive} Years Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Account Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">User Account</h3>
                      <p className="text-xs text-gray-500">Create seller account credentials</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <Input
                        placeholder="John Smith"
                        value={newUserWithListing.name}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={newUserWithListing.email}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, email: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Generated Password</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            type="text"
                            value={newUserWithListing.password}
                            readOnly
                            className="bg-gray-50 font-mono"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(newUserWithListing.password)
                            toast.success('Password copied!')
                          }}
                          title="Copy password"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewUserWithListing({ ...newUserWithListing, password: generatePassword() })}
                          title="Generate new password"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Share this password with the user</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User Phone</label>
                      <Input
                        placeholder="(555) 123-4567"
                        value={newUserWithListing.phone}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <Input
                        placeholder="Auto-filled from FMCSA"
                        value={newUserWithListing.companyName}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, companyName: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                  </div>
                </div>

                {/* Company & Authority Details */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Company Details</h3>
                      <p className="text-xs text-gray-500">Legal business information</p>
                    </div>
                    {mcLookupSuccess && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Auto-filled</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                      <Input
                        placeholder="Company Legal Name LLC"
                        value={newUserWithListing.legalName}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, legalName: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DBA Name</label>
                      <Input
                        placeholder="Doing Business As"
                        value={newUserWithListing.dbaName}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, dbaName: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                      <Input
                        placeholder="123 Main St, City, State ZIP"
                        value={newUserWithListing.physicalAddress}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, physicalAddress: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <Input
                        placeholder="City"
                        value={newUserWithListing.city}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, city: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <Input
                        placeholder="TX"
                        value={newUserWithListing.state}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, state: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Phone</label>
                      <Input
                        placeholder="(555) 123-4567"
                        value={newUserWithListing.carrierPhone}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, carrierPhone: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                      <Input
                        placeholder="CARRIER"
                        value={newUserWithListing.entityType}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, entityType: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                  </div>
                </div>

                {/* Fleet & Operations */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Fleet & Operations</h3>
                      <p className="text-xs text-gray-500">Authority and operational details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Power Units</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newUserWithListing.powerUnits}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, powerUnits: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Drivers</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newUserWithListing.drivers}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, drivers: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years Active</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newUserWithListing.yearsActive}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, yearsActive: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operating Status</label>
                      <Input
                        placeholder="AUTHORIZED"
                        value={newUserWithListing.operatingStatus}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, operatingStatus: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Safety Rating</label>
                      <select
                        value={newUserWithListing.safetyRating}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, safetyRating: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="satisfactory">Satisfactory</option>
                        <option value="conditional">Conditional</option>
                        <option value="unsatisfactory">Unsatisfactory</option>
                        <option value="not-rated">Not Rated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Status</label>
                      <select
                        value={newUserWithListing.insuranceStatus}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, insuranceStatus: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Platform & Extras */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Platform & Extras</h3>
                      <p className="text-xs text-gray-500">Amazon, Highway, and more</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Status</label>
                      <select
                        value={newUserWithListing.amazonStatus}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, amazonStatus: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="not-registered">Not Registered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Relay Score</label>
                      <Input
                        placeholder="e.g., 750"
                        value={newUserWithListing.amazonRelayScore}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, amazonRelayScore: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Highway Setup</label>
                      <select
                        value={newUserWithListing.highwaySetup}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, highwaySetup: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Has Factoring</label>
                      <select
                        value={newUserWithListing.hasFactoring}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, hasFactoring: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling with Email?</label>
                      <select
                        value={newUserWithListing.sellingWithEmail}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, sellingWithEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling with Phone?</label>
                      <select
                        value={newUserWithListing.sellingWithPhone}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, sellingWithPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Listing Details */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Listing Details</h3>
                      <p className="text-xs text-gray-500">Pricing and visibility</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title *</label>
                      <Input
                        placeholder="Auto-generated or custom title"
                        value={newUserWithListing.title}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, title: e.target.value })}
                        className={mcLookupSuccess ? 'bg-emerald-50 border-emerald-200' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($) *</label>
                      <Input
                        type="number"
                        placeholder="45000"
                        value={newUserWithListing.askingPrice}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, askingPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={newUserWithListing.status}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="PENDING_REVIEW">Pending Review</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Textarea
                        placeholder="Describe the trucking business, operational history, and key selling points..."
                        value={newUserWithListing.description}
                        onChange={(e) => setNewUserWithListing({ ...newUserWithListing, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Stripe Account */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    Payment Setup
                  </h3>
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={newUserWithListing.createStripeAccount}
                      onChange={(e) => setNewUserWithListing({ ...newUserWithListing, createStripeAccount: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Create Stripe Connected Account</p>
                      <p className="text-sm text-gray-500">Enable the seller to receive payouts. They will need to complete Stripe onboarding.</p>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleCreateUserWithListing}
                    disabled={
                      createUserLoading ||
                      !newUserWithListing.email ||
                      !newUserWithListing.name ||
                      !newUserWithListing.password ||
                      newUserWithListing.password.length < 8 ||
                      !newUserWithListing.mcNumber ||
                      !newUserWithListing.title ||
                      !newUserWithListing.askingPrice
                    }
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createUserLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create User + Listing
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateUserWithListingModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telegram Share Modal */}
      <AnimatePresence>
        {showTelegramModal && telegramListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTelegramModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Send className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Share to Telegram</h2>
                      <p className="text-sm text-gray-500">Post this listing to your channel</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTelegramModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Listing Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                      MC# {telegramListing.mcNumber}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${(telegramListing.listingPrice || telegramListing.askingPrice).toLocaleString()}
                    </span>
                    {telegramInspectionsLoading ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                      </span>
                    ) : telegramInspections !== null && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        {telegramInspections} inspections
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{telegramListing.legalName}</p>
                  <p className="text-xs text-gray-500">{telegramListing.city}, {telegramListing.state}</p>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message (Optional)
                  </label>
                  <Textarea
                    placeholder="Add a custom message..."
                    value={telegramMessage}
                    onChange={(e) => setTelegramMessage(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                    <Send className="w-3 h-3" /> Preview
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    {telegramMessage && <div className="italic">{telegramMessage}</div>}
                    <div className="font-semibold">🚛 {telegramListing.title || telegramListing.legalName}</div>
                    <div>📋 MC# ***{telegramListing.mcNumber.slice(-3)}</div>
                    <div>💰 Listing Price: ${(telegramListing.listingPrice || telegramListing.askingPrice).toLocaleString()}</div>
                    {telegramInspections !== null && (
                      <div>🔍 {telegramInspections} Inspections</div>
                    )}
                    {telegramListing.state && <div>📍 {telegramListing.state}</div>}
                    <div className="text-blue-600">🔗 View Listing</div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowTelegramModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTelegramShare} disabled={telegramSharing}>
                  {telegramSharing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Share
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminAllListingsPage
