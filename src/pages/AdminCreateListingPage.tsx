import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Loader2,
  Package,
  DollarSign,
  FileText,
  CheckCircle,
  Users,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Zap,
  Phone,
  Mail,
  Shield,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { AUTHORITY_TYPE_OPTIONS, hasCarrierOperations } from '../constants/authority'
import type { AuthorityType } from '../types'
import api from '../services/api'

export default function AdminCreateListingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Check if coming back from CarrierPulse
  const fromPulse = searchParams.get('fromPulse') === 'true'
  const pulseMC = searchParams.get('mc') || ''
  const pulseDOT = searchParams.get('dot') || ''

  // Page state: 'search' | 'form' | 'success'
  const [pageState, setPageState] = useState<'search' | 'form' | 'success'>(fromPulse ? 'form' : 'search')

  // MC Search
  const [mcInput, setMcInput] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // FMCSA data
  const [carrierData, setCarrierData] = useState<any>(null)
  const [fmcsaLoading, setFmcsaLoading] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [authorityType, setAuthorityType] = useState<AuthorityType>('MOTOR_CARRIER')

  // Additional questions
  const [amazonStatus, setAmazonStatus] = useState('')
  const [amazonRelayScore, setAmazonRelayScore] = useState('')
  const [hasFactoring, setHasFactoring] = useState('')
  const [factoringCompany, setFactoringCompany] = useState('')
  const [factoringRate, setFactoringRate] = useState('')
  const [highwaySetup, setHighwaySetup] = useState('')
  const [rmisSetup, setRmisSetup] = useState('')
  const [sellingWithPhone, setSellingWithPhone] = useState('')
  const [sellingWithEmail, setSellingWithEmail] = useState('')
  const [insuranceCompany, setInsuranceCompany] = useState('')
  const [monthlyInsurancePremium, setMonthlyInsurancePremium] = useState('')

  // Seller assignment
  const [sellerMode, setSellerMode] = useState<'existing' | 'new'>('existing')
  const [sellerSearch, setSellerSearch] = useState('')
  const [sellerResults, setSellerResults] = useState<any[]>([])
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [sellerSearchLoading, setSellerSearchLoading] = useState(false)

  // New seller fields
  const [newSellerName, setNewSellerName] = useState('')
  const [newSellerEmail, setNewSellerEmail] = useState('')
  const [newSellerPhone, setNewSellerPhone] = useState('')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [createdListing, setCreatedListing] = useState<any>(null)

  // Auto-fetch carrier data from MorPro when coming from CarrierPulse
  useEffect(() => {
    if (fromPulse && pulseDOT && !carrierData) {
      fetchCarrierData(pulseDOT)
    }
  }, [fromPulse, pulseDOT])

  const fetchCarrierData = async (dot: string) => {
    const cleanDot = dot.replace(/\D/g, '')
    if (!cleanDot) return
    setFmcsaLoading(true)
    try {
      const response = await api.getCarrierReport(cleanDot)
      if (response.success && response.data) {
        const report = response.data
        const carrier = report.carrier || {}
        setCarrierData({
          ...carrier,
          dotNumber: carrier.dotNumber || cleanDot,
          legalName: carrier.legalName || '',
          dbaName: carrier.dbaName || '',
          hqCity: carrier.location?.city || '',
          hqState: carrier.location?.state || '',
          physicalAddress: carrier.location?.street || '',
          totalPowerUnits: carrier.totalPowerUnits || carrier.powerUnits || 0,
          totalDrivers: carrier.totalDrivers || 0,
          safetyRating: report.safety?.safetyRating || carrier.safetyRating || '',
          insuranceOnFile: (report.insurance?.activePolicies?.length || 0) > 0,
          bipdOnFile: report.insurance?.activePolicies?.find((p: any) => String(p.insuranceType || '').toLowerCase().includes('bipd') || String(p.insuranceType || '').toLowerCase().includes('liability'))?.coverageAmount || 0,
          cargoOnFile: report.insurance?.activePolicies?.find((p: any) => String(p.insuranceType || '').toLowerCase().includes('cargo'))?.coverageAmount || 0,
          bondOnFile: report.insurance?.activePolicies?.find((p: any) => String(p.insuranceType || '').toLowerCase().includes('bond'))?.coverageAmount || 0,
          allowedToOperate: carrier.allowedToOperate || carrier.operatingStatus || '',
          mcNumber: carrier.mcNumber || pulseMC || '',
          cargoTypes: report.cargo ? Object.entries(report.cargo).filter(([, v]) => v === true).map(([k]) => k) : [],
        })
        setTitle(`${carrier.legalName || 'Carrier'} - DOT #${cleanDot}`)
      } else {
        setSearchError('Carrier data not found for this DOT number.')
      }
    } catch (err: any) {
      setSearchError(err.message || 'Failed to fetch carrier data')
    } finally {
      setFmcsaLoading(false)
    }
  }

  // DOT search → navigate to CarrierPulse
  const handleDOTSearch = async () => {
    const cleaned = mcInput.replace(/\D/g, '')
    if (!cleaned) {
      setSearchError('Please enter a valid DOT number')
      return
    }
    navigate(`/admin/carrier-pulse/${cleaned}?fromAdmin=true`)
  }

  // Debounced seller search
  const searchSellers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSellerResults([])
      return
    }
    setSellerSearchLoading(true)
    try {
      const res = await api.getAdminUsers({ search: query, role: 'SELLER', limit: 10 })
      setSellerResults(res.users || [])
    } catch {
      setSellerResults([])
    } finally {
      setSellerSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchSellers(sellerSearch), 300)
    return () => clearTimeout(timer)
  }, [sellerSearch, searchSellers])

  // Submit listing
  const handleSubmit = async () => {
    if (!carrierData) {
      setSubmitError('Carrier data is required')
      return
    }
    if (!price) {
      setSubmitError('Please enter an asking price')
      return
    }
    if (sellerMode === 'existing' && !selectedSeller) {
      setSubmitError('Please select an existing seller')
      return
    }
    if (sellerMode === 'new' && (!newSellerName || !newSellerEmail)) {
      setSubmitError('Please enter seller name and email')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const carrier = carrierData
      const fullAddress = [carrier.physicalAddress, carrier.hqCity, carrier.hqState].filter(Boolean).join(', ')
      const city = carrier.hqCity || carrier.physicalAddress?.split(',')[0] || 'Unknown'

      let safetyRating = 'NONE'
      if (carrier.safetyRating) {
        const r = carrier.safetyRating.toLowerCase()
        if (r.includes('satisfactory')) safetyRating = 'SATISFACTORY'
        else if (r.includes('conditional')) safetyRating = 'CONDITIONAL'
        else if (r.includes('unsatisfactory')) safetyRating = 'UNSATISFACTORY'
      }

      const listingData = {
        mcNumber: pulseMC || carrier.mcNumber || '',
        // Brokers/forwarders may have no USDOT — the backend stores ''
        dotNumber: carrier.dotNumber || '',
        legalName: carrier.legalName,
        dbaName: carrier.dbaName || undefined,
        title: title || `${carrier.legalName} - MC #${pulseMC || carrier.mcNumber}`,
        description: description || undefined,
        askingPrice: parseFloat(price) || 0,
        city,
        state: carrier.hqState || undefined,
        address: fullAddress || undefined,
        yearsActive: carrier.mcs150Date ? Math.floor((Date.now() - new Date(carrier.mcs150Date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        authorityType,
        // Fleet and safety only mean something for authorities that run trucks
        fleetSize: hasCarrierOperations(authorityType) ? carrier.totalPowerUnits || undefined : 0,
        totalDrivers: hasCarrierOperations(authorityType) ? carrier.totalDrivers || undefined : 0,
        safetyRating: hasCarrierOperations(authorityType) ? safetyRating : 'NONE',
        insuranceOnFile: carrier.insuranceOnFile || false,
        bipdCoverage: carrier.bipdOnFile || undefined,
        cargoCoverage: carrier.cargoOnFile || undefined,
        bondAmount: carrier.bondOnFile || undefined,
        cargoTypes: carrier.cargoTypes || [],
        fmcsaData: JSON.stringify(carrier),
        status,
        amazonStatus: amazonStatus === 'yes' ? 'ACTIVE' : amazonStatus === 'no' ? 'NONE' : undefined,
        amazonRelayScore: amazonRelayScore || undefined,
        highwaySetup: highwaySetup === 'yes',
        sellingWithEmail: sellingWithEmail === 'yes',
        sellingWithPhone: sellingWithPhone === 'yes',
        hasFactoring: hasFactoring || undefined,
        factoringCompany: factoringCompany || undefined,
        insuranceCompany: insuranceCompany || undefined,
        monthlyInsurancePremium: parseFloat(monthlyInsurancePremium) || undefined,
      }

      if (sellerMode === 'existing' && selectedSeller) {
        // Create listing attached to existing seller
        const response = await api.createAdminListing({
          ...listingData,
          sellerId: selectedSeller.id,
        })
        if (response.success) {
          setCreatedListing(response.data)
          setPageState('success')
        } else {
          throw new Error('Failed to create listing')
        }
      } else {
        // Create new seller + listing
        const tempPassword = `Domilea${Date.now().toString().slice(-6)}!`
        const response = await api.createAdminUserWithListing({
          user: {
            name: newSellerName,
            email: newSellerEmail,
            password: tempPassword,
            phone: newSellerPhone || undefined,
            companyName: carrier.legalName,
          },
          listing: {
            ...listingData,
            amazonStatus: listingData.amazonStatus,
            amazonRelayScore: listingData.amazonRelayScore,
            highwaySetup: listingData.highwaySetup,
            sellingWithEmail: listingData.sellingWithEmail,
            sellingWithPhone: listingData.sellingWithPhone,
          },
        })
        if (response.success) {
          setCreatedListing(response.data?.listing)
          setPageState('success')
        } else {
          throw new Error('Failed to create user and listing')
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err)
      setSubmitError(err.message || 'Failed to create listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // SEARCH VIEW
  // ============================================
  if (pageState === 'search') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Listing</h1>
          <p className="text-gray-500 mt-2 mb-8">Look up a carrier by DOT number to view their full profile, then create a listing</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={mcInput}
                onChange={e => { setMcInput(e.target.value); setSearchError('') }}
                onKeyDown={e => e.key === 'Enter' && handleDOTSearch()}
                placeholder="Enter DOT number..."
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-lg font-medium transition-all outline-none"
                autoFocus
              />
            </div>
            <button
              onClick={handleDOTSearch}
              disabled={!mcInput.trim() || searchLoading}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold transition-colors flex items-center gap-2"
            >
              {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              Look Up
            </button>
          </div>

          {searchError && (
            <p className="mt-3 text-sm text-red-600 flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {searchError}
            </p>
          )}

          <p className="mt-6 text-xs text-gray-400">
            This will open the full CarrierPulse view. After reviewing, click "List This Authority" to create the listing.
          </p>
        </motion.div>
      </div>
    )
  }

  // ============================================
  // SUCCESS VIEW
  // ============================================
  if (pageState === 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Listing Created!</h1>
          <p className="text-gray-500 mb-8">
            {carrierData?.legalName} - MC #{pulseMC} has been listed successfully{selectedSeller ? ` under ${selectedSeller.name}` : ''}.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">MC Number</span>
              <span className="font-medium">{pulseMC}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Asking Price</span>
              <span className="font-medium">${parseFloat(price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-emerald-600">{status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seller</span>
              <span className="font-medium">{selectedSeller?.name || newSellerName}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/listings')}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              View All Listings
            </button>
            <button
              onClick={() => {
                // Reset everything for another listing
                setPageState('search')
                setCarrierData(null)
                setTitle('')
                setDescription('')
                setPrice('')
                setSelectedSeller(null)
                setNewSellerName('')
                setNewSellerEmail('')
                setNewSellerPhone('')
                setSellerSearch('')
                setMcInput('')
                navigate('/admin/create-listing', { replace: true })
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Create Another
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ============================================
  // FORM VIEW (coming from CarrierPulse)
  // ============================================
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/create-listing', { replace: true })}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
        Back to Search
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Create Listing</h1>
          <p className="text-gray-500 mt-1">Fill in the listing details below. Carrier data has been auto-filled from FMCSA.</p>
        </div>

        {/* Loading state */}
        {fmcsaLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mr-3" />
            <span className="text-gray-500 font-medium">Loading carrier data...</span>
          </div>
        )}

        {!fmcsaLoading && carrierData && (
          <div className="space-y-6">
            {/* Carrier Summary Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                    {carrierData.allowedToOperate === 'Y' ? 'Authorized Carrier' : 'Not Authorized'}
                  </p>
                  <h2 className="text-xl font-bold">{carrierData.legalName}</h2>
                  {carrierData.dbaName && <p className="text-white/50 text-sm mt-0.5">DBA: {carrierData.dbaName}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">MC# {pulseMC || carrierData.mcNumber}</p>
                  <p className="text-xs text-white/40">DOT# {carrierData.dotNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Location', value: `${carrierData.hqCity}, ${carrierData.hqState}` },
                  { label: 'Power Units', value: carrierData.totalPowerUnits || '0' },
                  { label: 'Drivers', value: carrierData.totalDrivers || '0' },
                  { label: 'Safety', value: carrierData.safetyRating || 'Not Rated' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">{s.label}</p>
                    <p className="text-sm font-bold text-white/90">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Authority Type — what is actually being sold */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Authority Type
              </h3>
              <p className="text-sm text-gray-500 mb-4">Which type of FMCSA authority this listing represents.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AUTHORITY_TYPE_OPTIONS.map(option => {
                  const selected = authorityType === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAuthorityType(option.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-gray-700'}`}>{option.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{option.sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Listing Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="e.g. Well-Maintained MC Authority with Clean Safety Record"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                    placeholder="Describe the authority, its history, and why it's a good purchase..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="w-4 h-4 inline text-gray-400" /> Asking Price
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Whole Business Sale Required</p>
                <p className="text-sm text-amber-700">
                  The seller must sell the entire business entity (LLC, Inc., etc.) — not just the trucking authority.
                  The MC authority is tied to the legal entity and cannot be transferred separately.
                </p>
              </div>
            </div>

            {/* Platform Integrations & Questions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Platform & Operations
              </h3>
              <p className="text-sm text-gray-500 mb-5">Setup details that buyers care about</p>

              <div className="space-y-5">
                {/* Amazon Relay */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Amazon Relay Setup?</p>
                  <div className="flex gap-2 mb-2">
                    {['yes', 'no'].map(v => (
                      <button key={v} type="button" onClick={() => { setAmazonStatus(v); if (v === 'no') setAmazonRelayScore('') }}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          amazonStatus === v
                            ? v === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-400 bg-gray-100 text-gray-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {v === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  {amazonStatus === 'yes' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Relay Score</label>
                      <select value={amazonRelayScore} onChange={e => setAmazonRelayScore(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white"
                      >
                        <option value="">Select Score</option>
                        <option value="A">A - Excellent</option>
                        <option value="B">B - Good</option>
                        <option value="C">C - Average</option>
                        <option value="D">D - Below Average</option>
                        <option value="F">F - Poor</option>
                        <option value="no-score">No Score Yet</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Factoring */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Active Factoring Agreement?</p>
                  <div className="flex gap-2 mb-2">
                    {['yes', 'no'].map(v => (
                      <button key={v} type="button" onClick={() => { setHasFactoring(v); if (v === 'no') { setFactoringCompany(''); setFactoringRate('') } }}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          hasFactoring === v
                            ? v === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-400 bg-gray-100 text-gray-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {v === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  {hasFactoring === 'yes' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Factoring Company</label>
                        <input type="text" value={factoringCompany} onChange={e => setFactoringCompany(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                        <input type="number" step="0.1" value={factoringRate} onChange={e => setFactoringRate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          placeholder="3.5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Highway & RMIS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Set up with Highway?</p>
                    <div className="flex gap-2">
                      {['yes', 'no'].map(v => (
                        <button key={v} type="button" onClick={() => setHighwaySetup(v)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            highwaySetup === v
                              ? v === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-400 bg-gray-100 text-gray-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Set up with RMIS?</p>
                    <div className="flex gap-2">
                      {['yes', 'no'].map(v => (
                        <button key={v} type="button" onClick={() => setRmisSetup(v)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            rmisSetup === v
                              ? v === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-400 bg-gray-100 text-gray-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {v === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selling with phone/email */}
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setSellingWithPhone(sellingWithPhone === 'yes' ? 'no' : 'yes')}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      sellingWithPhone === 'yes' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Phone className={`w-5 h-5 ${sellingWithPhone === 'yes' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Business Phone</p>
                      <p className="text-xs text-gray-500">Include with sale</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      sellingWithPhone === 'yes' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                    }`}>
                      {sellingWithPhone === 'yes' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                  <button type="button" onClick={() => setSellingWithEmail(sellingWithEmail === 'yes' ? 'no' : 'yes')}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      sellingWithEmail === 'yes' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Mail className={`w-5 h-5 ${sellingWithEmail === 'yes' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Business Email</p>
                      <p className="text-xs text-gray-500">Include with sale</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      sellingWithEmail === 'yes' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                    }`}>
                      {sellingWithEmail === 'yes' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Insurance Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Insurance Details
              </h3>
              <p className="text-sm text-gray-500 mb-5">Insurance provider info and current monthly cost</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                  <input type="text" value={insuranceCompany} onChange={e => setInsuranceCompany(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="e.g. Progressive, National Indemnity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Insurance Payment ($)</label>
                  <input type="number" value={monthlyInsurancePremium} onChange={e => setMonthlyInsurancePremium(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="1500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Seller Assignment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Assign Seller
              </h3>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setSellerMode('existing')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    sellerMode === 'existing'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Existing Seller
                </button>
                <button
                  onClick={() => setSellerMode('new')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    sellerMode === 'new'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  New Seller (No Account)
                </button>
              </div>

              {/* Existing seller search */}
              {sellerMode === 'existing' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={sellerSearch}
                      onChange={e => { setSellerSearch(e.target.value); setSelectedSeller(null) }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="Search sellers by name or email..."
                    />
                    {sellerSearchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* Selected seller */}
                  {selectedSeller && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 font-bold text-sm">{selectedSeller.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{selectedSeller.name}</p>
                        <p className="text-xs text-gray-500">{selectedSeller.email}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}

                  {/* Search results */}
                  {!selectedSeller && sellerResults.length > 0 && sellerSearch.length >= 2 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {sellerResults.map(seller => (
                        <button
                          key={seller.id}
                          onClick={() => { setSelectedSeller(seller); setSellerSearch(seller.name) }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 font-bold text-xs">{seller.name?.charAt(0)}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{seller.name}</p>
                            <p className="text-xs text-gray-400">{seller.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!selectedSeller && sellerResults.length === 0 && sellerSearch.length >= 2 && !sellerSearchLoading && (
                    <p className="text-sm text-gray-400 text-center py-2">No sellers found. Try a different search or create a new seller.</p>
                  )}
                </div>
              )}

              {/* New seller form */}
              {sellerMode === 'new' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    A new seller account will be created. The seller will receive login credentials via email.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name *</label>
                    <input
                      type="text"
                      value={newSellerName}
                      onChange={e => setNewSellerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Email *</label>
                    <input
                      type="email"
                      value={newSellerEmail}
                      onChange={e => setNewSellerEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="seller@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={newSellerPhone}
                      onChange={e => setNewSellerPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Listing...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Create Listing
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {!fmcsaLoading && !carrierData && searchError && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">{searchError}</p>
            <button
              onClick={() => navigate('/admin/create-listing', { replace: true })}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
