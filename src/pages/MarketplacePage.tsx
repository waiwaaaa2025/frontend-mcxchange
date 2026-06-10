import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Crown,
  Sparkles,
  Mail,
  Phone,
  CheckCircle,
  Loader2,
  BadgeCheck,
  Target,
  Briefcase
} from 'lucide-react'
import MCCard from '../components/MCCard'
import SoldMCCard from '../components/SoldMCCard'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FilterOptions, TrustLevel, AmazonStatus, AuthorityType, AUTHORITY_TYPE_LABELS, MCListing } from '../types'

type MatchEntry = {
  listing: MCListing
  matchScore: number
  matchReasons: string[]
  isUnlocked: boolean
}

// Map a raw backend listing record to the MCListing shape used across the marketplace.
const transformListing = (listing: any): MCListing => {
  let fmcsa: any = null
  if (listing.fmcsaData) {
    try {
      const raw = typeof listing.fmcsaData === 'string' ? JSON.parse(listing.fmcsaData) : listing.fmcsaData
      fmcsa = raw?.carrier || raw
    } catch {}
  }
  return {
    id: listing.id,
    mcNumber: listing.mcNumber,
    sellerId: listing.sellerId,
    seller: listing.seller || { id: listing.sellerId, name: 'Unknown', email: '', role: 'seller', verified: false, trustScore: 50, memberSince: new Date(), completedDeals: 0, reviews: [] },
    title: listing.title,
    description: listing.description || '',
    price: parseFloat(listing.listingPrice || listing.askingPrice || listing.price) || 0,
    askingPrice: parseFloat(listing.askingPrice || listing.price) || 0,
    listingPrice: listing.listingPrice ? parseFloat(listing.listingPrice) : undefined,
    trustScore: listing.seller?.trustScore || 50,
    trustLevel: ((listing.seller?.trustScore || 50) >= 80 ? 'high' : (listing.seller?.trustScore || 50) >= 50 ? 'medium' : 'low') as TrustLevel,
    verified: listing.seller?.verified || false,
    verificationBadges: [],
    yearsActive: listing.yearsActive || 0,
    operationType: (() => {
      if (!listing.cargoTypes) return []
      if (Array.isArray(listing.cargoTypes)) return listing.cargoTypes
      try { return JSON.parse(listing.cargoTypes) } catch { return [] }
    })(),
    fleetSize: listing.fleetSize || 0,
    safetyRating: (listing.safetyRating?.toLowerCase() || 'not-rated') as 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not-rated',
    insuranceStatus: listing.insuranceOnFile ? 'active' : 'pending',
    state: listing.state,
    city: listing.city || undefined,
    amazonStatus: (listing.amazonStatus?.toLowerCase() || 'none') as AmazonStatus,
    amazonRelayScore: listing.amazonRelayScore,
    authorityType: listing.authorityType || 'MOTOR_CARRIER',
    highwaySetup: listing.highwaySetup || false,
    sellingWithEmail: listing.sellingWithEmail || false,
    sellingWithPhone: listing.sellingWithPhone || false,
    isPremium: listing.isPremium || false,
    isVip: listing.isVip || false,
    freeToUnlock: listing.freeToUnlock || false,
    documents: [],
    status: (listing.status?.toLowerCase().replace('_', '-') || 'active') as 'active' | 'pending-verification' | 'sold' | 'reserved' | 'suspended',
    visibility: (listing.visibility?.toLowerCase() || 'public') as 'public' | 'private' | 'unlisted',
    views: listing.views || 0,
    saves: listing.saves || 0,
    createdAt: listing.createdAt ? new Date(listing.createdAt) : new Date(),
    updatedAt: listing.updatedAt ? new Date(listing.updatedAt) : new Date(),
    totalInspections: fmcsa?.totalInspections ?? fmcsa?.driverInsp ?? fmcsa?.totalDriverInspections ?? undefined,
    driverOosInsp: fmcsa?.driverOosInsp ?? fmcsa?.driverOosInspections ?? undefined,
    driverOosRate: fmcsa?.driverOosRate ?? undefined,
    vehicleOosInsp: fmcsa?.vehicleOosInsp ?? fmcsa?.vehicleOosInspections ?? undefined,
    vehicleOosRate: fmcsa?.vehicleOosRate ?? undefined,
    crashTotal: fmcsa?.crashTotal ?? fmcsa?.totalCrashes ?? undefined,
    fatalCrash: fmcsa?.fatalCrash ?? fmcsa?.fatalCrashes ?? undefined,
  }
}

// US States for filter
const US_STATES = [
  { value: '', label: 'All States' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
]

const MarketplacePage = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set())
  const [listings, setListings] = useState<MCListing[]>([])
  const [soldListings, setSoldListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchEntry[]>([])
  const [hasPreferences, setHasPreferences] = useState(false)

  const [filters, setFilters] = useState<FilterOptions>({
    priceMin: undefined,
    priceMax: undefined,
    yearsActiveMin: undefined,
    operationTypes: [],
    safetyRating: [],
    trustLevel: [],
    verified: undefined,
    state: undefined,
    amazonStatus: undefined,
    authorityTypes: undefined,
    hasHighway: undefined,
    hasEmail: undefined,
    hasPhone: undefined,
    isPremium: undefined,
    sortBy: 'newest'
  })

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getListings({
          search: searchQuery || undefined,
          minPrice: filters.priceMin,
          maxPrice: filters.priceMax,
          state: filters.state,
          amazonStatus: filters.amazonStatus === 'all' ? undefined : filters.amazonStatus,
          authorityType: filters.authorityTypes && filters.authorityTypes.length > 0
            ? filters.authorityTypes.join(',')
            : undefined,
        })

        const transformedListings: MCListing[] = (response.data || response.listings || []).map(transformListing)

        setListings(transformedListings)

        // Fetch sold listings for "Recently Sold" section
        try {
          const soldResponse = await api.getListings({ status: 'SOLD', limit: 100 })
          const soldData = (soldResponse.data || soldResponse.listings || []).map((listing: any) => ({
            id: listing.id,
            mcNumber: listing.mcNumber,
            state: listing.state,
            city: listing.city || undefined,
            price: parseFloat(listing.listingPrice || listing.askingPrice || listing.price) || 0,
            yearsActive: listing.yearsActive || 0,
            fleetSize: listing.fleetSize || 0,
            safetyRating: listing.safetyRating?.toLowerCase() || 'not-rated',
            amazonStatus: listing.amazonStatus?.toLowerCase() || 'none',
            amazonRelayScore: listing.amazonRelayScore,
            highwaySetup: listing.highwaySetup || false,
            sellingWithEmail: listing.sellingWithEmail || false,
            sellingWithPhone: listing.sellingWithPhone || false,
            soldAt: listing.soldAt,
          }))
          setSoldListings(soldData)
        } catch (err) {
          console.error('Failed to fetch sold listings:', err)
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err)
        setError('Failed to load listings. Please try again.')
        setListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [searchQuery, filters.priceMin, filters.priceMax, filters.state, filters.amazonStatus, filters.authorityTypes])

  // Fetch personalized matches for authenticated buyers who have saved preferences.
  useEffect(() => {
    if (user?.role !== 'buyer') {
      setMatches([])
      setHasPreferences(false)
      return
    }
    const fetchMatches = async () => {
      try {
        const res = await api.getMyMatches(6)
        const data = (res as any).data
        if (!data?.hasPreferences) {
          setHasPreferences(false)
          setMatches([])
          return
        }
        setHasPreferences(true)
        const entries: MatchEntry[] = (data.matches || []).map((m: any) => ({
          listing: transformListing(m.listing),
          matchScore: m.matchScore,
          matchReasons: m.matchReasons || [],
          isUnlocked: !!m.isUnlocked,
        }))
        setMatches(entries)
      } catch (err) {
        console.error('Failed to fetch matches:', err)
        setMatches([])
      }
    }
    fetchMatches()
  }, [user?.id, user?.role])

  const handleSaveListing = (id: string) => {
    setSavedListings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.priceMin) count++
    if (filters.priceMax) count++
    if (filters.yearsActiveMin) count++
    if (filters.state) count++
    if (filters.amazonStatus && filters.amazonStatus !== 'all') count++
    if (filters.authorityTypes && filters.authorityTypes.length > 0) count++
    if (filters.hasHighway) count++
    if (filters.hasEmail) count++
    if (filters.hasPhone) count++
    if (filters.isPremium !== undefined) count++
    if (filters.trustLevel && filters.trustLevel.length > 0) count++
    if (filters.verified !== undefined) count++
    return count
  }, [filters])

  const filteredListings = useMemo(() => {
    let results = listings.filter(listing => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          listing.mcNumber.includes(query) ||
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.state.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Price range
      const displayPrice = listing.listingPrice ?? listing.askingPrice ?? listing.price ?? 0
      if (filters.priceMin && displayPrice < filters.priceMin) return false
      if (filters.priceMax && displayPrice > filters.priceMax) return false

      // Years active
      if (filters.yearsActiveMin && listing.yearsActive < filters.yearsActiveMin) return false

      // State filter
      if (filters.state && listing.state !== filters.state) return false

      // Amazon status filter
      if (filters.amazonStatus && filters.amazonStatus !== 'all') {
        if (listing.amazonStatus !== filters.amazonStatus) return false
      }

      // Authority type filter
      if (filters.authorityTypes && filters.authorityTypes.length > 0) {
        const lt = listing.authorityType || 'MOTOR_CARRIER'
        if (!filters.authorityTypes.includes(lt)) return false
      }

      // Highway filter
      if (filters.hasHighway && !listing.highwaySetup) return false

      // Email filter
      if (filters.hasEmail && !listing.sellingWithEmail) return false

      // Phone filter
      if (filters.hasPhone && !listing.sellingWithPhone) return false

      // Premium filter
      if (filters.isPremium !== undefined && listing.isPremium !== filters.isPremium) return false

      // Trust level
      if (filters.trustLevel && filters.trustLevel.length > 0) {
        if (!filters.trustLevel.includes(listing.trustLevel)) return false
      }

      // Verified
      if (filters.verified !== undefined && listing.verified !== filters.verified) return false

      return true
    })

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':
        results.sort((a, b) => (a.listingPrice ?? a.askingPrice ?? a.price ?? 0) - (b.listingPrice ?? b.askingPrice ?? b.price ?? 0))
        break
      case 'price-desc':
        results.sort((a, b) => (b.listingPrice ?? b.askingPrice ?? b.price ?? 0) - (a.listingPrice ?? a.askingPrice ?? a.price ?? 0))
        break
      case 'trust-score':
        results.sort((a, b) => b.trustScore - a.trustScore)
        break
      case 'newest':
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case 'oldest':
        results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case 'years-active':
        results.sort((a, b) => b.yearsActive - a.yearsActive)
        break
    }

    return results
  }, [listings, searchQuery, filters])

  const clearFilters = () => {
    setFilters({
      priceMin: undefined,
      priceMax: undefined,
      yearsActiveMin: undefined,
      operationTypes: [],
      safetyRating: [],
      trustLevel: [],
      verified: undefined,
      state: undefined,
      amazonStatus: undefined,
      authorityTypes: undefined,
      hasHighway: undefined,
      hasEmail: undefined,
      hasPhone: undefined,
      isPremium: undefined,
      sortBy: 'newest'
    })
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-gray-500">Browse verified motor carrier authorities</p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by MC number, title, state, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <Button
                variant={showFilters ? 'primary' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilters(prev => {
                    const set = new Set(prev.authorityTypes || [])
                    const hasBroker = set.has('BROKER') || set.has('MOTOR_CARRIER_AND_BROKER')
                    if (hasBroker) {
                      set.delete('BROKER')
                      set.delete('MOTOR_CARRIER_AND_BROKER')
                    } else {
                      set.add('BROKER')
                      set.add('MOTOR_CARRIER_AND_BROKER')
                    }
                    const next = Array.from(set) as AuthorityType[]
                    return { ...prev, authorityTypes: next.length > 0 ? next : undefined }
                  })
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  (filters.authorityTypes?.includes('BROKER') || filters.authorityTypes?.includes('MOTOR_CARRIER_AND_BROKER'))
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Broker
                {(filters.authorityTypes?.includes('BROKER') || filters.authorityTypes?.includes('MOTOR_CARRIER_AND_BROKER')) && <CheckCircle className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, amazonStatus: prev.amazonStatus === 'active' ? undefined : 'active' as AmazonStatus }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.amazonStatus === 'active'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>📦</span>
                Amazon Active
                {filters.amazonStatus === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, hasHighway: prev.hasHighway ? undefined : true }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.hasHighway
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>🛣️</span>
                Highway Setup
                {filters.hasHighway && <CheckCircle className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, hasEmail: prev.hasEmail ? undefined : true }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.hasEmail
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Includes Email
                {filters.hasEmail && <CheckCircle className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, hasPhone: prev.hasPhone ? undefined : true }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.hasPhone
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Includes Phone
                {filters.hasPhone && <CheckCircle className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, isPremium: prev.isPremium === true ? undefined : true }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filters.isPremium === true
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Premium Only
                {filters.isPremium === true && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expanded Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-gray-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {/* State Filter */}
                  <Select
                    label="State"
                    value={filters.state || ''}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, state: e.target.value || undefined }))
                    }
                    options={US_STATES}
                  />

                  {/* Price Range */}
                  <Input
                    label="Min Price"
                    type="number"
                    placeholder="$0"
                    value={filters.priceMin || ''}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, priceMin: e.target.value ? Number(e.target.value) : undefined }))
                    }
                  />

                  <Input
                    label="Max Price"
                    type="number"
                    placeholder="$100,000"
                    value={filters.priceMax || ''}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, priceMax: e.target.value ? Number(e.target.value) : undefined }))
                    }
                  />

                  {/* Years Active */}
                  <Input
                    label="Min Years Active"
                    type="number"
                    placeholder="0"
                    value={filters.yearsActiveMin || ''}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        yearsActiveMin: e.target.value ? Number(e.target.value) : undefined
                      }))
                    }
                  />

                  {/* Amazon Status */}
                  <Select
                    label="Amazon Status"
                    value={filters.amazonStatus || 'all'}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        amazonStatus: e.target.value === 'all' ? undefined : e.target.value as AmazonStatus
                      }))
                    }
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'suspended', label: 'Suspended' },
                      { value: 'none', label: 'No Amazon' }
                    ]}
                  />

                  {/* Trust Level */}
                  <Select
                    label="Trust Level"
                    value={filters.trustLevel?.[0] || ''}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        trustLevel: e.target.value ? [e.target.value as TrustLevel] : []
                      }))
                    }
                    options={[
                      { value: '', label: 'All' },
                      { value: 'high', label: 'High Trust' },
                      { value: 'medium', label: 'Medium Trust' },
                      { value: 'low', label: 'Low Trust' }
                    ]}
                  />

                  {/* Verified Only */}
                  <Select
                    label="Verification"
                    value={filters.verified === undefined ? '' : filters.verified.toString()}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        verified: e.target.value === '' ? undefined : e.target.value === 'true'
                      }))
                    }
                    options={[
                      { value: '', label: 'All' },
                      { value: 'true', label: 'Verified Only' },
                      { value: 'false', label: 'Unverified' }
                    ]}
                  />

                  {/* Authority Type (multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Authority Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(AUTHORITY_TYPE_LABELS) as AuthorityType[]).map((t) => {
                        const selected = filters.authorityTypes?.includes(t) || false
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setFilters(prev => {
                                const set = new Set(prev.authorityTypes || [])
                                if (set.has(t)) set.delete(t); else set.add(t)
                                const next = Array.from(set) as AuthorityType[]
                                return { ...prev, authorityTypes: next.length > 0 ? next : undefined }
                              })
                            }}
                            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                              selected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {AUTHORITY_TYPE_LABELS[t]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sort By */}
                  <Select
                    label="Sort By"
                    value={filters.sortBy || 'newest'}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        sortBy: e.target.value as FilterOptions['sortBy']
                      }))
                    }
                    options={[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'price-asc', label: 'Price: Low to High' },
                      { value: 'price-desc', label: 'Price: High to Low' },
                      { value: 'trust-score', label: 'Trust Score' },
                      { value: 'years-active', label: 'Years Active' }
                    ]}
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters.state && (
              <span className="px-2 py-1 rounded-full bg-secondary-50 border border-secondary-200 text-xs text-secondary-700 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {filters.state}
                <button onClick={() => setFilters(prev => ({ ...prev, state: undefined }))} className="ml-1 hover:text-secondary-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.amazonStatus && filters.amazonStatus !== 'all' && (
              <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-1">
                📦 {filters.amazonStatus}
                <button onClick={() => setFilters(prev => ({ ...prev, amazonStatus: undefined }))} className="ml-1 hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.hasHighway && (
              <span className="px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-1">
                🛣️ Highway
                <button onClick={() => setFilters(prev => ({ ...prev, hasHighway: undefined }))} className="ml-1 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.hasEmail && (
              <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
                <button onClick={() => setFilters(prev => ({ ...prev, hasEmail: undefined }))} className="ml-1 hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.hasPhone && (
              <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
                <button onClick={() => setFilters(prev => ({ ...prev, hasPhone: undefined }))} className="ml-1 hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <span className="px-2 py-1 rounded-full bg-secondary-50 border border-secondary-200 text-xs text-secondary-700 flex items-center gap-1">
                ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
                <button onClick={() => setFilters(prev => ({ ...prev, priceMin: undefined, priceMax: undefined }))} className="ml-1 hover:text-secondary-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Recommended for You — personalized matches based on "What I Want" preferences */}
        {user?.role === 'buyer' && hasPreferences && matches.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-600 shadow-md shadow-indigo-200/50">
                <Target className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white tracking-wide">RECOMMENDED FOR YOU</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent" />
              <Link to="/buyer/dashboard?tab=preferences" className="text-xs text-indigo-600 hover:underline whitespace-nowrap">
                Edit preferences
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((m) => (
                <div key={m.listing.id} className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                        m.matchScore >= 80
                          ? 'bg-emerald-600 text-white'
                          : m.matchScore >= 60
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                      title={m.matchReasons.join(' · ')}
                    >
                      {m.matchScore}% match
                    </span>
                  </div>
                  <MCCard
                    listing={m.listing}
                    onSave={handleSaveListing}
                    isSaved={savedListings.has(m.listing.id)}
                  />
                  {m.matchReasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.matchReasons.slice(0, 3).map((reason, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs text-indigo-700"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended — preferences not set yet nudge for buyers */}
        {user?.role === 'buyer' && !hasPreferences && (
          <Card className="mb-6 border-2 border-dashed border-indigo-200 bg-indigo-50/30">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Get personalized recommendations</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tell us what you're looking for and we'll score every listing against your criteria.
                </p>
              </div>
              <Link to="/buyer/dashboard?tab=preferences">
                <Button size="sm">Set preferences</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-500">
            {loading ? 'Loading...' : `${filteredListings.length} ${filteredListings.length === 1 ? 'listing' : 'listings'} found`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading listings...</h3>
              <p className="text-gray-500">Fetching available trucking businesses</p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <div className="text-center py-12">
              <X className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error loading listings</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </Card>
        )}

        {/* Listings Grid — Tier Grouped */}
        {!loading && !error && filteredListings.length > 0 && (() => {
          const vipListings = filteredListings.filter(l => l.isVip)
          const premiumListings = filteredListings.filter(l => l.isPremium && !l.isVip)
          const standardListings = filteredListings.filter(l => !l.isPremium && !l.isVip)

          return (
            <div className="space-y-10">
              {/* VIP Collection */}
              {vipListings.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-md shadow-amber-200/50">
                      <Sparkles className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white tracking-wide">VIP COLLECTION</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vipListings.map((listing) => (
                      <MCCard
                        key={listing.id}
                        listing={listing}
                        onSave={handleSaveListing}
                        isSaved={savedListings.has(listing.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Premium Listings */}
              {premiumListings.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-md shadow-violet-200/50">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white tracking-wide">PREMIUM LISTINGS</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-violet-200 to-transparent" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {premiumListings.map((listing) => (
                      <MCCard
                        key={listing.id}
                        listing={listing}
                        onSave={handleSaveListing}
                        isSaved={savedListings.has(listing.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* All Listings */}
              {standardListings.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 shadow-md">
                      <span className="text-sm font-bold text-white tracking-wide">ALL LISTINGS</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {standardListings.map((listing) => (
                      <MCCard
                        key={listing.id}
                        listing={listing}
                        onSave={handleSaveListing}
                        isSaved={savedListings.has(listing.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        })()}

        {/* Recently Sold Section */}
        {!loading && soldListings.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 shadow-md shadow-emerald-200/50">
                <BadgeCheck className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white tracking-wide">RECENTLY SOLD</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldListings.map((listing) => (
                <SoldMCCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && filteredListings.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MarketplacePage
