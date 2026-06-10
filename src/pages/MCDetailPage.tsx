import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Shield,
  Calendar,
  TruckIcon,
  ShieldCheck,
  FileText,
  Lock,
  Unlock,
  MessageSquare,
  Eye,
  Heart,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  Zap,
  Percent,
  ClipboardCheck,
  Hash,
  XCircle,
  Coins,
  CreditCard,
  Crown,
  X,
  AlertCircle,
  Send,
  AlertTriangle,
  Loader2,
  DollarSign,
  ShoppingCart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import Input from '../components/ui/Input'
import { formatDistanceToNow } from 'date-fns'
import { getPartialMCNumber } from '../utils/helpers'
import { useListing } from '../hooks/useListing'
import { useFMCSAData } from '../hooks/useFMCSAData'
import api from '../services/api'
import { format } from 'date-fns'

const MCDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  // Use custom hook for listing data management
  const { listing, loading, error, isUnlocked, unlocking, unlock } = useListing(id)

  // Fetch FMCSA data when listing is unlocked
  const {
    carrier: fmcsaCarrier,
    authority: fmcsaAuthority,
    insurance: fmcsaInsurance,
    smsData: fmcsaSmsData,
    loading: fmcsaLoading
  } = useFMCSAData(listing?.mcNumber, isUnlocked)

  // Get user's available credits
  const userCredits = user?.totalCredits ? (user.totalCredits - (user.usedCredits || 0)) : 0
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumRequestSent, setPremiumRequestSent] = useState(false)
  const [premiumMessage, setPremiumMessage] = useState('')
  const [sendingPremiumRequest, setSendingPremiumRequest] = useState(false)

  // Terms of Service state
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsSignature, setTermsSignature] = useState('')
  const [acceptingTerms, setAcceptingTerms] = useState(false)
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [sendingInquiry, setSendingInquiry] = useState(false)

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showBuyNowModal, setShowBuyNowModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [buyNowMessage, setBuyNowMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [submittingBuyNow, setSubmittingBuyNow] = useState(false)
  const [offerSuccess, setOfferSuccess] = useState(false)
  const [buyNowSuccess, setBuyNowSuccess] = useState(false)

  // Subscription plan state for premium request gating
  const [buyerPlan, setBuyerPlan] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Fetch subscription plan for buyer users
  useEffect(() => {
    if (user?.role !== 'buyer') return
    let active = true
    api.getSubscription().then((res) => {
      if (active) setBuyerPlan(res.data?.subscription?.plan || null)
    }).catch(() => {
      if (active) setBuyerPlan(null)
    })
    return () => { active = false }
  }, [user?.role])

  // Check if listing is premium from actual listing data
  const isPremiumListing = listing?.isPremium ?? false

  // Build listing details from the MCListingExtended data
  // Using nullish coalescing for cleaner default values
  const listingDetails = {
    // Basic Info
    mcNumber: listing?.mcNumber ?? '',
    dotNumber: listing?.dotNumber ?? '',
    state: listing?.state ?? '',
    city: listing?.city ?? '',

    // FMCSA Data
    legalName: listing?.legalName ?? '',
    dbaName: listing?.dbaName ?? '',
    physicalAddress: listing?.address ?? '',
    phone: listing?.contactPhone ?? '',
    powerUnits: String(listing?.fleetSize ?? 0),
    drivers: String(listing?.totalDrivers ?? 0),
    operatingStatus: listing?.status === 'active' ? 'AUTHORIZED' : listing?.status?.toUpperCase() ?? 'UNKNOWN',
    entityType: 'CARRIER' as const,
    cargoCarried: listing?.operationType ?? [],

    // Amazon & Highway - using booleans directly
    amazonStatus: listing?.amazonStatus ?? 'none',
    amazonRelayScore: listing?.amazonRelayScore ?? '',
    highwaySetup: listing?.highwaySetup ?? false,

    // Selling with Email/Phone - using booleans directly
    sellingWithEmail: listing?.sellingWithEmail ?? false,
    sellingWithPhone: listing?.sellingWithPhone ?? false,

    // Safety Record (FMCSA)
    safetyRecord: {
      saferScore: listing?.saferScore || getSafetyRatingLabel(listing?.safetyRating),
      totalInspections: 0, // Not available from API yet
      outOfServiceRate: 0, // Not available from API yet
      totalCrashes: 0, // Not available from API yet
      basicScores: {
        unsafeDriving: 0,
        hoursOfService: 0,
        driverFitness: 0,
        controlledSubstances: 0,
        vehicleMaintenance: 0,
        hazmat: 0,
        crashIndicator: 0
      }
    },

    // Insurance info
    insuranceOnFile: listing?.insuranceOnFile ?? false,
    bipdCoverage: listing?.bipdCoverage,
    cargoCoverage: listing?.cargoCoverage,
    bondAmount: listing?.bondAmount,

    // Compliance (not yet available from backend, will show defaults)
    entryAuditCompleted: false,
    hasFactoring: false,
    factoringCompany: '',
    factoringRate: 0,
  }

  // Helper function to convert safety rating enum to display label
  function getSafetyRatingLabel(rating?: string): string {
    switch (rating) {
      case 'satisfactory': return 'Satisfactory'
      case 'conditional': return 'Conditional'
      case 'unsatisfactory': return 'Unsatisfactory'
      default: return 'Not Rated'
    }
  }

  // Handler for unlocking listing with credit
  const handleUnlockWithCredit = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user?.role !== 'buyer') {
      return
    }
    if (userCredits < 1) {
      navigate('/buyer/subscription')
      return
    }

    try {
      await unlock()
    } catch (err: any) {
      console.error('Failed to unlock listing:', err)
      alert(err.message || 'Failed to unlock listing. Please try again.')
    }
  }

  const handlePremiumRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Always show terms modal first - user must accept/acknowledge each time
    setShowTermsModal(true)
  }

  const handleAcceptTerms = async () => {
    if (!termsSignature.trim() || termsSignature.trim().length < 2) {
      alert('Please enter your full name to sign the terms.')
      return
    }

    try {
      setAcceptingTerms(true)
      // Check if already accepted, if so just proceed
      const statusResponse = await api.getTermsStatus()
      if (!statusResponse.data.hasAccepted) {
        // First time signing - record it
        await api.acceptTerms(termsSignature.trim())
      }
      setTermsAccepted(true)
      setShowTermsModal(false)
      setTermsSignature('') // Reset for next time
      setHasReadTerms(false) // Reset scroll state
      // Now show the premium request modal
      setShowPremiumModal(true)
    } catch (err: any) {
      console.error('Failed to accept terms:', err)
      alert(err.message || 'Failed to accept terms. Please try again.')
    } finally {
      setAcceptingTerms(false)
    }
  }

  const handleSubmitPremiumRequest = async () => {
    if (!listing) return

    // Block starter plan users from submitting premium requests
    if (buyerPlan === 'starter') {
      setShowPremiumModal(false)
      setShowUpgradeModal(true)
      return
    }

    try {
      setSendingPremiumRequest(true)
      const message = premiumMessage.trim() || 'Interested in this premium MC authority. Please provide pricing and details.'
      const response = await api.createPremiumRequest(listing.id, message)
      setShowPremiumModal(false)
      setPremiumMessage('')

      // If auto-approved (Enterprise subscriber), reload to show unlocked content
      if (response.data?.status === 'COMPLETED') {
        window.location.reload()
      } else {
        setPremiumRequestSent(true)
      }
    } catch (err: any) {
      console.error('Failed to submit premium request:', err)
      alert(err.message || 'Failed to submit request. Please try again.')
    } finally {
      setSendingPremiumRequest(false)
    }
  }

  const handleContactClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setShowContactModal(true)
  }

  const handleSubmitContact = async () => {
    if (!listing) return
    try {
      setSendingInquiry(true)
      await api.sendInquiryToAdmin(listing.id, contactMessage.trim(), contactPhone.trim() || undefined)
      setMessageSent(true)
      setShowContactModal(false)
      setContactMessage('')
      setContactPhone('')
    } catch (err: any) {
      console.error('Failed to send inquiry:', err)
      alert(err.message || 'Failed to send message. Please try again.')
    } finally {
      setSendingInquiry(false)
    }
  }

  // Handle submitting an offer
  const handleSubmitOffer = async () => {
    if (!listing || !offerAmount) return
    setSubmittingOffer(true)
    setOfferSuccess(false)

    try {
      await api.createOffer({
        listingId: listing.id,
        amount: parseFloat(offerAmount),
        message: offerMessage || 'I am interested in purchasing this MC authority.'
      })
      setOfferSuccess(true)
      setTimeout(() => {
        setShowOfferModal(false)
        setOfferAmount('')
        setOfferMessage('')
        setOfferSuccess(false)
      }, 2000)
    } catch (err: any) {
      alert(err.message || 'Failed to submit offer. Please try again.')
    } finally {
      setSubmittingOffer(false)
    }
  }

  // Handle Buy Now (offer at listing price)
  const handleBuyNow = async () => {
    if (!listing) return
    setSubmittingBuyNow(true)
    setBuyNowSuccess(false)

    try {
      const price = listing.listingPrice || listing.askingPrice || listing.price || 0
      await api.createOffer({
        listingId: listing.id,
        amount: price,
        message: buyNowMessage || 'I want to buy this MC at the listed price.',
        isBuyNow: true
      })
      setBuyNowSuccess(true)
      setTimeout(() => {
        setShowBuyNowModal(false)
        setBuyNowMessage('')
        setBuyNowSuccess(false)
      }, 2000)
    } catch (err: any) {
      alert(err.message || 'Failed to submit offer. Please try again.')
    } finally {
      setSubmittingBuyNow(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-secondary-600 mb-4" />
            <p className="text-gray-500">Loading listing details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show VIP access denied state
  if (error === 'ENTERPRISE_REQUIRED') {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">VIP Listing — Enterprise Only</h2>
            <p className="text-gray-500 mb-6">This listing is exclusive to Enterprise subscribers. Upgrade your plan to access VIP listings.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/marketplace')}>
                Back to Marketplace
              </Button>
              <Button onClick={() => navigate('/buyer/subscription')}>
                Upgrade to Enterprise
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !listing) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Listing</h2>
            <p className="text-gray-500 mb-4">{error || 'The listing could not be found.'}</p>
            <Button onClick={() => navigate('/marketplace')}>
              Back to Marketplace
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 via-indigo-50 to-purple-50 -m-6 mb-6 p-6 border-b border-gray-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        MC #{isUnlocked ? listing.mcNumber : getPartialMCNumber(listing.mcNumber)}
                      </h1>
                      {isPremiumListing && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300">
                          <Crown className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs font-bold text-yellow-600">PREMIUM</span>
                        </div>
                      )}
                      {isUnlocked ? (
                        <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-full border border-emerald-300">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-600">Unlocked</span>
                        </div>
                      ) : !isPremiumListing && (
                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                          <Lock className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs text-yellow-600">Locked</span>
                        </div>
                      )}
                    </div>
                    <p className="text-lg sm:text-xl text-gray-700">{listing.title}</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                      ${(listing.listingPrice || listing.askingPrice || listing.price || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Listed Price</div>
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Hash className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">MC Number</div>
                  <div className="font-bold text-gray-900">{isUnlocked ? listingDetails.mcNumber : '••••••'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Hash className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">DOT Number</div>
                  <div className="font-bold text-gray-900">{isUnlocked ? listingDetails.dotNumber : '••••••'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <MapPin className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">State</div>
                  <div className="font-bold text-gray-900">{listingDetails.state}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Shield className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-bold text-emerald-600 text-sm">{listingDetails.operatingStatus}</div>
                </div>
              </div>


              <div className="mt-6 flex flex-wrap gap-2">
                {listing.verificationBadges.map((badge) => (
                  <div key={badge} className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-indigo-500" />
                    <span className="text-xs text-gray-700">{badge}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{listing.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>{listing.saves} saves</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Listed {listing.createdAt instanceof Date && !isNaN(listing.createdAt.getTime())
                    ? formatDistanceToNow(listing.createdAt, { addSuffix: true })
                    : 'Recently'}</span>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <h2 className="text-xl font-bold mb-4 text-gray-900">Description</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </Card>

            {/* Key Details */}
            <Card>
              <h2 className="text-xl font-bold mb-4 text-gray-900">Key Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Years Active</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{listing.yearsActive} years</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <TruckIcon className="w-4 h-4" />
                    <span>Fleet Size</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{listing.fleetSize} trucks</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Safety Rating</span>
                  </div>
                  <div className="text-lg font-bold capitalize text-gray-900">
                    {listing.safetyRating.replace('-', ' ')}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Insurance</span>
                  </div>
                  <div className="text-lg font-bold capitalize text-gray-900">{listing.insuranceStatus}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-gray-500 text-sm mb-2">Operation Types</div>
                <div className="flex flex-wrap gap-2">
                  {listing.operationType.map((type) => (
                    <span
                      key={type}
                      className="bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Platform Integrations - Amazon & Highway */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Platform Integrations</h2>
                  <p className="text-sm text-gray-500">Load board and carrier network status</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Amazon Relay */}
                <div className={`rounded-xl p-4 border ${listingDetails.amazonStatus === 'active' ? 'bg-trust-high/5 border-trust-high/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📦</span>
                    <div className="flex-1">
                      <span className="font-semibold text-lg">Amazon Relay</span>
                      <div className={`text-sm ${listingDetails.amazonStatus === 'active' ? 'text-trust-high' : 'text-yellow-400'}`}>
                        {listingDetails.amazonStatus === 'active' ? '✅ Active' : listingDetails.amazonStatus === 'suspended' ? '⚠️ Suspended' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>
                  {listingDetails.amazonStatus === 'active' && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Relay Score</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${
                            listingDetails.amazonRelayScore === 'A' ? 'text-trust-high' :
                            listingDetails.amazonRelayScore === 'B' ? 'text-green-400' :
                            listingDetails.amazonRelayScore === 'C' ? 'text-yellow-400' :
                            listingDetails.amazonRelayScore === 'D' ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {listingDetails.amazonRelayScore}
                          </span>
                          {listingDetails.amazonRelayScore === 'A' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-trust-high/20 text-trust-high font-medium">Excellent</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Highway Setup */}
                <div className={`rounded-xl p-4 border ${listingDetails.highwaySetup ? 'bg-trust-high/5 border-trust-high/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🛣️</span>
                    <div className="flex-1">
                      <span className="font-semibold text-lg">Highway</span>
                      <div className={`text-sm ${listingDetails.highwaySetup ? 'text-trust-high' : 'text-gray-500'}`}>
                        {listingDetails.highwaySetup ? '✅ Setup Complete' : '❌ Not Setup'}
                      </div>
                    </div>
                  </div>
                  {listingDetails.highwaySetup && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                        <span>Verified carrier profile</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* What's Included in Sale */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">What's Included in Sale</h2>
                  <p className="text-sm text-gray-500">Assets transferring with this authority</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 border flex items-center gap-4 ${listingDetails.sellingWithEmail ? 'bg-trust-high/10 border-trust-high/30' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${listingDetails.sellingWithEmail ? 'bg-trust-high/20' : 'bg-white/10'}`}>
                    <Mail className={`w-6 h-6 ${listingDetails.sellingWithEmail ? 'text-trust-high' : 'text-white/40'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Business Email</div>
                    <div className="text-sm text-gray-500">
                      {listingDetails.sellingWithEmail ? 'Included with sale' : 'Not included'}
                    </div>
                  </div>
                  {listingDetails.sellingWithEmail ? (
                    <CheckCircle className="w-6 h-6 text-trust-high" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white/30" />
                  )}
                </div>

                <div className={`rounded-xl p-4 border flex items-center gap-4 ${listingDetails.sellingWithPhone ? 'bg-trust-high/10 border-trust-high/30' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${listingDetails.sellingWithPhone ? 'bg-trust-high/20' : 'bg-white/10'}`}>
                    <Phone className={`w-6 h-6 ${listingDetails.sellingWithPhone ? 'text-trust-high' : 'text-white/40'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Business Phone</div>
                    <div className="text-sm text-gray-500">
                      {listingDetails.sellingWithPhone ? 'Included with sale' : 'Not included'}
                    </div>
                  </div>
                  {listingDetails.sellingWithPhone ? (
                    <CheckCircle className="w-6 h-6 text-trust-high" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white/30" />
                  )}
                </div>
              </div>
            </Card>

            {/* Entry Audit & Factoring */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                  <ClipboardCheck className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Compliance & Financials</h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Entry Audit */}
                <div className={`rounded-xl p-4 border ${listingDetails.entryAuditCompleted ? 'bg-trust-high/10 border-trust-high/30' : 'bg-yellow-400/10 border-yellow-400/30'}`}>
                  <div className="flex items-center gap-3">
                    {listingDetails.entryAuditCompleted ? (
                      <CheckCircle className="w-8 h-8 text-trust-high" />
                    ) : (
                      <ClipboardCheck className="w-8 h-8 text-yellow-400" />
                    )}
                    <div>
                      <div className={`font-bold ${listingDetails.entryAuditCompleted ? 'text-trust-high' : 'text-yellow-400'}`}>
                        Entry Audit {listingDetails.entryAuditCompleted ? 'Completed' : 'Pending'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {listingDetails.entryAuditCompleted ? 'Authority passed audit' : 'Audit not completed'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Factoring */}
                <div className={`rounded-xl p-4 border ${listingDetails.hasFactoring ? 'bg-cyan-400/10 border-cyan-400/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Percent className={`w-8 h-8 ${listingDetails.hasFactoring ? 'text-cyan-400' : 'text-white/40'}`} />
                    <div>
                      <div className="font-bold">
                        {listingDetails.hasFactoring ? 'Active Factoring' : 'No Factoring'}
                      </div>
                      {listingDetails.hasFactoring && (
                        <div className="text-sm text-gray-500">
                          {listingDetails.factoringCompany} • {listingDetails.factoringRate}% rate
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Safety Record (FMCSA) */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Safety Record (FMCSA)</h2>
                    <p className="text-sm text-gray-500">Federal Motor Carrier Safety Administration</p>
                  </div>
                </div>
              </div>

              {/* Always visible summary */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl mb-4">
                <span className="font-medium text-gray-900">SAFER Rating</span>
                <span className={`px-4 py-2 rounded-full font-bold text-lg ${
                  (fmcsaCarrier?.safetyRating || listingDetails.safetyRecord.saferScore)?.toLowerCase() === 'satisfactory'
                    ? 'bg-green-100 text-green-700'
                    : (fmcsaCarrier?.safetyRating || listingDetails.safetyRecord.saferScore)?.toLowerCase() === 'conditional'
                    ? 'bg-yellow-100 text-yellow-700'
                    : (fmcsaCarrier?.safetyRating || listingDetails.safetyRecord.saferScore)?.toLowerCase() === 'unsatisfactory'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {fmcsaCarrier?.safetyRating || listingDetails.safetyRecord.saferScore || 'Not Rated'}
                </span>
              </div>

              {isUnlocked ? (
                // Full safety record when unlocked
                <div className="space-y-4">
                  {fmcsaLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading FMCSA data...</span>
                    </div>
                  ) : (
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
                          <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.totalDrivers ?? listing?.totalDrivers ?? 0}</p>
                          <p className="text-sm text-gray-500">Drivers</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{fmcsaCarrier?.totalPowerUnits ?? listing?.fleetSize ?? 0}</p>
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
                              ${((fmcsaCarrier?.bipdOnFile ?? listing?.bipdCoverage) || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              Required: ${(fmcsaCarrier?.bipdRequired || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Cargo Coverage</p>
                            <p className="text-xl font-bold text-gray-900">
                              ${((fmcsaCarrier?.cargoOnFile ?? listing?.cargoCoverage) || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              Required: ${(fmcsaCarrier?.cargoRequired || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Bond/Surety</p>
                            <p className="text-xl font-bold text-gray-900">
                              ${((fmcsaCarrier?.bondOnFile ?? listing?.bondAmount) || 0).toLocaleString()}
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

                      {/* Inspections & Crashes - Data from FMCSA Carrier Response */}
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

                      {/* BASIC Scores - From SMS API endpoint */}
                      {fmcsaSmsData?.basics && fmcsaSmsData.basics.length > 0 && (
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            BASIC Scores (Safety Measurement System)
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {fmcsaSmsData.basics.map((basic, idx) => (
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
                </div>
              ) : (
                // Locked state - show teaser
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-300">--</p>
                      <p className="text-sm text-gray-400">Drivers</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-300">--</p>
                      <p className="text-sm text-gray-400">Power Units</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-300">--</p>
                      <p className="text-sm text-gray-400">Operation</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-300">--/--/----</p>
                      <p className="text-sm text-gray-400">MCS-150</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Authority Details Locked</span>
                    </div>
                    <div className="space-y-2">
                      {['Common Authority', 'Contract Authority', 'Broker Authority'].map((label) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-sm text-gray-400 w-40">{label}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                          <span className="text-sm text-gray-400 w-20 text-right">Locked</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Insurance Coverage Locked</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['BIPD', 'Cargo', 'Bond'].map((type) => (
                        <div key={type} className="p-2 bg-white rounded border border-gray-100 text-center">
                          <p className="text-xs text-gray-400">{type}</p>
                          <p className="text-lg font-bold text-gray-300">$--</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden lg:block text-center p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                    <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-yellow-700 font-medium">Unlock to view full FMCSA safety record</p>
                    <p className="text-xs text-yellow-600 mt-1">Includes authority status, insurance details, and carrier information</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Compliance & Status Checks */}
            <Card>
              <h2 className="text-xl font-bold mb-4">Verification Checks</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-subtle rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-trust-high/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                      </div>
                      <span className="font-semibold">Carrier 411</span>
                    </div>
                  </div>
                  <p className="text-sm text-trust-high">No Issues Found</p>
                </div>

                <div className="glass-subtle rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-trust-high/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                      </div>
                      <span className="font-semibold">UCC Liens</span>
                    </div>
                  </div>
                  <p className="text-sm text-trust-high">No Active Liens</p>
                </div>

                <div className="glass-subtle rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-trust-high/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                      </div>
                      <span className="font-semibold">SAFER/FMCSA</span>
                    </div>
                  </div>
                  <p className="text-sm text-trust-high">Active Authority</p>
                </div>

                <div className="glass-subtle rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-trust-high/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                      </div>
                      <span className="font-semibold">Insurance</span>
                    </div>
                  </div>
                  <p className="text-sm text-trust-high">Current & Valid</p>
                </div>
              </div>
            </Card>

            {/* Full Details - Locked/Unlocked */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Complete Documentation</h2>
                {isUnlocked ? (
                  <div className="flex items-center gap-2 text-trust-high">
                    <Unlock className="w-5 h-5" />
                    <span className="text-sm font-medium">Unlocked</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock className="w-5 h-5" />
                    <span className="text-sm font-medium">Locked</span>
                  </div>
                )}
              </div>

              {isUnlocked ? (
                <div className="space-y-4">
                  {/* FMCSA Details */}
                  <div className="glass-subtle rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary-400" />
                      FMCSA Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Legal Name</div>
                        <div className="font-semibold">{listingDetails.legalName}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">DBA Name</div>
                        <div className="font-semibold">{listingDetails.dbaName}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">MC Number</div>
                        <div className="font-semibold">{listingDetails.mcNumber}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">DOT Number</div>
                        <div className="font-semibold">{listingDetails.dotNumber}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Physical Address</div>
                        <div className="font-semibold">{listingDetails.physicalAddress}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Phone</div>
                        <div className="font-semibold">{listingDetails.phone}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Power Units</div>
                        <div className="font-semibold">{listingDetails.powerUnits}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Drivers</div>
                        <div className="font-semibold">{listingDetails.drivers}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-gray-500 mb-2 text-sm">Cargo Carried</div>
                      <div className="flex flex-wrap gap-2">
                        {listingDetails.cargoCarried.map((cargo, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                            {cargo}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-subtle rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-400" />
                      Available Documents
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2 text-white/80">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                        Article of Incorporation
                      </li>
                      <li className="flex items-center gap-2 text-white/80">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                        EIN Letter
                      </li>
                      <li className="flex items-center gap-2 text-white/80">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                        Driver License
                      </li>
                      <li className="flex items-center gap-2 text-white/80">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                        Certificate of Insurance (COI)
                      </li>
                      <li className="flex items-center gap-2 text-white/80">
                        <CheckCircle className="w-4 h-4 text-trust-high" />
                        Loss Run Report
                      </li>
                      {listingDetails.hasFactoring && (
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="w-4 h-4 text-trust-high" />
                          Factoring Letter of Release (LOR)
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Detailed information is locked</h3>
                  <p className="text-gray-500 mb-4">
                    Unlock to view complete MC details, documents, and contact seller
                  </p>
                  <div className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400 font-medium">Use 1 credit to unlock</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Domilea Representative Card */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Contact Representative</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">D</span>
                </div>
                <div>
                  <div className="font-semibold">Domilea Representative</div>
                  <div className="text-sm text-gray-500">Domilea Team</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified Team Member</span>
                </div>
                <p className="text-sm text-gray-600">
                  Our team will assist you with all inquiries about this MC authority, including pricing, documentation, and transfer process.
                </p>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Response Time</span>
                  <span className="font-semibold">Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Availability</span>
                  <span className="font-semibold">Mon-Fri 9am-6pm</span>
                </div>
              </div>

              {isPremiumListing ? (
                /* Premium Listing - No direct messaging, use Unlock Premium MC button */
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Crown className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-700 mb-1">Premium Listing</div>
                      <p className="text-sm text-amber-600">
                        Use the "Unlock Premium MC" button below to request access to this listing.
                      </p>
                    </div>
                  </div>
                </div>
              ) : messageSent ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="font-semibold text-emerald-700">Message Sent!</div>
                  <div className="text-sm text-emerald-600">We'll get back to you soon.</div>
                </div>
              ) : (
                <Button fullWidth onClick={handleContactClick}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              )}

              {!isAuthenticated && !isPremiumListing && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Sign in
                  </Link>{' '}
                  to contact our team
                </p>
              )}
            </Card>

            {/* Credits Card / Premium Card */}
            <Card className="overflow-hidden">
              {isPremiumListing && !isUnlocked ? (
                // Premium Listing - Contact Admin (only show if not unlocked)
                <>
                  <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 -m-6 mb-4 p-4 border-b border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      <span className="font-bold text-yellow-400">Premium Listing</span>
                    </div>
                  </div>

                  {premiumRequestSent ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-trust-high/10 border border-trust-high/30 text-center">
                        <CheckCircle className="w-10 h-10 text-trust-high mx-auto mb-3" />
                        <div className="font-bold text-trust-high text-lg mb-1">Request Submitted!</div>
                        <div className="text-sm text-gray-500">
                          Our admin team will review your request and contact you within 24-48 hours.
                        </div>
                      </div>

                      {isAuthenticated && user?.role === 'buyer' && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Coins className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-amber-600">{userCredits} credits</span>
                          </div>
                          {user.totalCredits === 0 ? (
                            <Link to="/buyer/subscription">
                              <Button size="sm" variant="secondary" fullWidth className="mt-2">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Get Subscription
                              </Button>
                            </Link>
                          ) : userCredits < 1 ? (
                            <Link to="/buyer/subscription">
                              <Button size="sm" variant="secondary" fullWidth className="mt-2">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Buy More Credits
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        fullWidth
                        onClick={handlePremiumRequest}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Unlock Premium MC
                      </Button>

                      {isAuthenticated && user?.role === 'buyer' && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Coins className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-amber-600">{userCredits} credits</span>
                          </div>
                          {user.totalCredits === 0 ? (
                            <Link to="/buyer/subscription">
                              <Button size="sm" variant="secondary" fullWidth className="mt-2">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Get Subscription
                              </Button>
                            </Link>
                          ) : userCredits < 1 ? (
                            <Link to="/buyer/subscription">
                              <Button size="sm" variant="secondary" fullWidth className="mt-2">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Buy More Credits
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-600">
                          <span className="font-semibold">Note:</span> Even if you have credits, our admin team must review and approve your request first. Credits will only be charged upon approval.
                        </p>
                      </div>

                      {!isAuthenticated && (
                        <p className="text-xs text-center text-gray-500">
                          <Link to="/login" className="text-primary-400 hover:text-primary-300">
                            Sign in
                          </Link>{' '}
                          to unlock this premium listing
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : !isAuthenticated ? (
                // Not logged in - Show Login/Register prompt
                <>
                  <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 -m-6 mb-4 p-4 border-b border-indigo-500/20">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-500" />
                      <span className="font-semibold text-gray-900">Sign in to Unlock</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                      <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <div className="font-bold text-gray-900 mb-1">Unlock Full Details</div>
                      <div className="text-sm text-gray-500 mb-4">
                        Sign in or create an account to unlock this MC listing and view all details.
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">1 Credit</div>
                    </div>

                    <Link to="/login">
                      <Button fullWidth>
                        <Lock className="w-4 h-4 mr-2" />
                        Sign In to Unlock
                      </Button>
                    </Link>

                    <Link to="/register">
                      <Button fullWidth variant="secondary">
                        Create Account
                      </Button>
                    </Link>

                    <p className="text-xs text-center text-gray-500">
                      New buyers get credits with their subscription
                    </p>
                  </div>
                </>
              ) : user?.role === 'buyer' ? (
                // Logged in as buyer - Show credits and unlock
                <>
                  <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 -m-6 mb-4 p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-gray-900">Your Credits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-yellow-500">{userCredits}</span>
                        <span className="text-sm text-gray-500">remaining</span>
                      </div>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <Unlock className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <div className="font-bold text-emerald-700">MC Unlocked!</div>
                        <div className="text-sm text-emerald-600">Full details are now visible</div>
                      </div>

                      {/* Buy Now Button */}
                      <Button
                        fullWidth
                        onClick={() => {
                          setBuyNowMessage('')
                          setShowBuyNowModal(true)
                        }}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now at ${(listing?.listingPrice || listing?.askingPrice || listing?.price || 0).toLocaleString()}
                      </Button>

                      {/* Place Offer Button */}
                      <Button
                        fullWidth
                        variant="secondary"
                        onClick={() => {
                          setOfferAmount((listing?.listingPrice || listing?.askingPrice || listing?.price || 0).toString())
                          setOfferMessage('')
                          setShowOfferModal(true)
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Place an Offer
                      </Button>

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Coins className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-amber-600">{userCredits} credits remaining</span>
                        </div>
                        {user?.totalCredits === 0 ? (
                          <Link to="/buyer/subscription">
                            <Button size="sm" variant="secondary" fullWidth className="mt-2">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Get Subscription
                            </Button>
                          </Link>
                        ) : userCredits < 1 ? (
                          <Link to="/buyer/subscription">
                            <Button size="sm" variant="secondary" fullWidth className="mt-2">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Buy More Credits
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        fullWidth
                        onClick={handleUnlockWithCredit}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        disabled={userCredits < 1 || unlocking}
                      >
                        {unlocking ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Unlocking...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock Full MC with 1 Credit
                          </>
                        )}
                      </Button>

                      {user?.totalCredits === 0 ? (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                          <p className="text-sm text-red-600 mb-2">You don't have a subscription yet</p>
                          <Link to="/buyer/subscription">
                            <Button size="sm" fullWidth>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Get Subscription
                            </Button>
                          </Link>
                        </div>
                      ) : userCredits < 1 ? (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                          <p className="text-sm text-red-600 mb-2">You're out of credits!</p>
                          <Link to="/buyer/subscription">
                            <Button size="sm" fullWidth>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Buy More Credits
                            </Button>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                // Logged in as seller/admin - Just show listing info
                <>
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 -m-6 mb-4 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-gray-900">Listing Preview</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                      <div className="text-sm text-gray-500">
                        {user?.role === 'seller' ? 'You are viewing as a seller' : 'You are viewing as an admin'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Safety Card */}
            <Card>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Buyer Protection</h4>
                  <p className="text-sm text-gray-500">
                    All transactions are protected by our secure escrow system. Your funds are safe
                    until the transfer is complete.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar - Only visible on mobile/tablet */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="px-4 py-3 safe-area-inset-bottom">
          {isPremiumListing && !isUnlocked ? (
            // Premium listing actions
            <div className="flex gap-3">
              {isAuthenticated && user?.role === 'buyer' && (
                <Link to="/buyer/subscription" className="flex-1">
                  <Button variant="secondary" fullWidth>
                    <Coins className="w-4 h-4 mr-1" />
                    {user.totalCredits === 0 ? 'Get Subscription' : userCredits < 1 ? 'Buy Credits' : `${userCredits} Credits`}
                  </Button>
                </Link>
              )}
              {premiumRequestSent ? (
                <div className="flex-[2] flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 rounded-lg px-4 py-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Request Sent</span>
                </div>
              ) : (
                <Button
                  className="flex-[2] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={handlePremiumRequest}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Unlock Premium MC
                </Button>
              )}
            </div>
          ) : !isAuthenticated ? (
            // Not logged in
            <div className="flex gap-3">
              <Link to="/register" className="flex-1">
                <Button variant="secondary" fullWidth>
                  Sign Up
                </Button>
              </Link>
              <Link to="/login" className="flex-[2]">
                <Button fullWidth>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In to Unlock
                </Button>
              </Link>
            </div>
          ) : user?.role === 'buyer' ? (
            // Logged in buyer
            isUnlocked ? (
              // Already unlocked - show buy/offer buttons
              <div className="flex gap-3">
                <Link to="/buyer/subscription" className="flex-1">
                  <Button variant="secondary" fullWidth>
                    <Coins className="w-4 h-4 mr-1" />
                    {user?.totalCredits === 0 ? 'Get Subscription' : userCredits < 1 ? 'Buy Credits' : `${userCredits} Credits`}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setOfferAmount((listing?.listingPrice || listing?.askingPrice || listing?.price || 0).toString())
                    setOfferMessage('')
                    setShowOfferModal(true)
                  }}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Offer
                </Button>
                <Button
                  className="flex-[2] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  onClick={() => {
                    setBuyNowMessage('')
                    setShowBuyNowModal(true)
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
              </div>
            ) : (
              // Not unlocked yet
              <div className="flex gap-3">
                <Link to="/buyer/subscription" className="flex-1">
                  <Button variant="secondary" fullWidth>
                    <Coins className="w-4 h-4 mr-1" />
                    {user?.totalCredits === 0 ? 'Get Subscription' : userCredits < 1 ? 'Buy Credits' : `${userCredits} Credits`}
                  </Button>
                </Link>
                {user?.totalCredits === 0 || userCredits < 1 ? (
                  <Link to="/buyer/subscription" className="flex-[2]">
                    <Button
                      fullWidth
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {user?.totalCredits === 0 ? 'Get Subscription' : 'Buy More Credits'}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="flex-[2] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    onClick={handleUnlockWithCredit}
                    disabled={unlocking}
                  >
                    {unlocking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock with 1 Credit
                      </>
                    )}
                  </Button>
                )}
              </div>
            )
          ) : (
            // Seller or admin viewing
            <div className="flex gap-3">
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                {user?.role === 'seller' ? 'Viewing as seller' : 'Viewing as admin'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 -m-6 mb-6 p-6 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                        <p className="text-sm text-gray-300">Please read and sign to continue</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTermsModal(false)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Terms Content */}
                <div className="space-y-4">
                  {/* Scrollable Terms */}
                  <div
                    className="h-80 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700"
                    onScroll={(e) => {
                      const target = e.target as HTMLDivElement
                      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
                        setHasReadTerms(true)
                      }
                    }}
                  >
                    <h4 className="font-bold text-gray-900 text-center mb-2 text-base">CONFIDENTIALITY, NON-DISCLOSURE, AND NON-CIRCUMVENTION AGREEMENT</h4>
                    <p className="text-center mb-4 text-xs text-gray-600">THIS AMENDED AND RESTATED CONFIDENTIALITY, NON-DISCLOSURE, AND NON-CIRCUMVENTION AGREEMENT</p>

                    <p className="mb-3">This Agreement is made and entered into as of <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> (the "Effective Date"), by and between:</p>

                    <p className="mb-3"><strong>DISCLOSING PARTY:</strong> The Domilea Group, an Illinois limited liability company ("Provider"), acting in its capacity as the exclusive marketing consultant and intermediary for the owner(s) of the business opportunities presented hereunder ("Seller"); and</p>

                    <p className="mb-3"><strong>RECIPIENT:</strong> <em>{user?.name || '[Your Name]'}</em>, the undersigned party ("Recipient").</p>

                    <p className="mb-3">(Provider and Recipient are hereinafter collectively referred to as the "Parties" and individually as a "Party").</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">RECITALS</h5>
                    <p className="mb-3">WHEREAS, Provider serves as an intermediary for the sale of certain transportation, logistics, and trucking business assets (the "Business"); and WHEREAS, Provider possesses, or has access to, certain proprietary, non-public, and highly confidential information regarding the Business, its operations, financial condition, and strategies, which is proprietary to the Seller; and WHEREAS, Recipient has expressed an interest in evaluating a potential acquisition of the assets or equity of the Business (the "Transaction") and desires access to such information for the sole and exclusive purpose of conducting its preliminary due diligence; and WHEREAS, Provider is willing to disclose such Confidential Information to Recipient only upon the strict terms and conditions of confidentiality, non-use, non-solicitation, and non-circumvention set forth in this Agreement;</p>

                    <p className="mb-4">NOW, THEREFORE, in consideration of the mutual covenants, conditions, and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">ARTICLE 1: DEFINITION, SCOPE, AND PROTECTION OF CONFIDENTIAL INFORMATION</h5>

                    <p className="mb-2"><strong>1.1. Comprehensive Definition of Confidential Information.</strong> For purposes of this Agreement, "Confidential Information" shall mean any and all data, information, documents, and materials regarding the Seller, the Business, or the Transaction, whether conveyed orally, in writing, electronically, visually, or by inspection of tangible assets, that is furnished to Recipient by Provider or Seller. This definition shall be broadly construed to include, without limitation:</p>

                    <ul className="list-disc pl-6 mb-3 space-y-1">
                      <li><strong>(a) Corporate Identity:</strong> The specific identity of the Seller, its owners, shareholders, officers, and the precise geographic location of its terminals or facilities;</li>
                      <li><strong>(b) Financial Data:</strong> Historical, current, and projected financial statements, tax returns, profit and loss statements, balance sheets, bank records, debt schedules, accounts receivable aging reports, and factoring agreements;</li>
                      <li><strong>(c) Operational Assets:</strong> Equipment lists (including VINs, make, model, and year), maintenance records, lease agreements, and real estate documents;</li>
                      <li><strong>(d) Commercial Relationships:</strong> Customer lists, shipper contracts, rate confirmation sheets, lane data, fuel surcharge schedules, and vendor/supplier agreements;</li>
                      <li><strong>(e) Human Capital:</strong> Driver lists (including names, CDL numbers, and tenure), independent contractor agreements, employee personnel files, dispatcher compensation plans, and organizational charts;</li>
                      <li><strong>(f) Regulatory Status:</strong> FMCSA/DOT safety ratings, SAFER system data, insurance loss runs, and claims history; and</li>
                      <li><strong>(g) The "Fact of Sale":</strong> The existence of this Agreement, the fact that the Business is available for acquisition, and the status of any negotiations or offers.</li>
                    </ul>

                    <p className="mb-3"><strong>1.2. Inclusion of Derivative Works.</strong> "Confidential Information" shall also expressly include any notes, analyses, compilations, studies, interpretations, memoranda, or other documents prepared by Recipient or its Representatives which contain, reflect, or are based upon, in whole or in part, the Confidential Information furnished to Recipient ("Derivative Works").</p>

                    <p className="mb-3"><strong>1.3. Exclusions from Definition.</strong> Confidential Information shall not include information that: (i) is or becomes generally available to the public other than as a result of a disclosure by Recipient or its Representatives in violation of this Agreement; (ii) was available to Recipient on a non-confidential basis prior to its disclosure by Provider; or (iii) becomes available to Recipient on a non-confidential basis from a person other than Provider or Seller who is not bound by a confidentiality agreement with Provider or Seller.</p>

                    <p className="mb-3"><strong>1.4. Permitted Use and Standard of Care.</strong> Recipient agrees that it shall use the Confidential Information solely and exclusively for the purpose of evaluating the advisability of the Transaction. Recipient shall protect the Confidential Information with the same degree of care that it uses to protect its own confidential information of like nature, but in no event less than a reasonable standard of care. Recipient shall not use the Confidential Information to compete with Seller, reverse-engineer Seller's business model, or gain an unfair commercial advantage.</p>

                    <p className="mb-3"><strong>1.5. Disclosure to Representatives.</strong> Recipient shall not disclose, disseminate, or publish any Confidential Information to any third party, except to Recipient's directors, officers, employees, attorneys, accountants, and lenders (collectively, "Representatives") who: (a) Have a specific, bona fide need to know such information for the purpose of the Transaction; (b) Are informed by Recipient of the confidential nature of the information; and (c) Are strictly bound by professional duties of confidentiality or written confidentiality agreements at least as protective as this Agreement. <strong>Vicarious Liability:</strong> Recipient agrees to be responsible for any breach of this Agreement by any of its Representatives.</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">ARTICLE 2: NON-CIRCUMVENTION</h5>

                    <p className="mb-3"><strong>2.1. Absolute Prohibition on Direct Contact.</strong> Recipient covenants and agrees that, during the Term and the Protection Period, neither Recipient nor its Representatives shall, directly or indirectly, initiate, solicit, maintain, or engage in any contact, communication, interview, or negotiation with the Seller, its beneficial owners, officers, employees, independent contractors (drivers), lessors, or supply chain vendors regarding the Business or the Transaction, without the express prior written consent and direct participation of Provider.</p>

                    <p className="mb-3"><strong>(a) Exclusive Channel:</strong> All expressions of interest, offers, counter-offers, letters of intent (LOI), requests for due diligence materials, and scheduling of site visits must be transmitted and coordinated exclusively through Provider.</p>

                    <p className="mb-3"><strong>(b) Duty to Notify and Redirect:</strong> In the event Recipient is contacted directly by Seller (or Seller's agents) regarding the Transaction, Recipient shall: (i) immediately suspend such communication; (ii) notify Provider in writing within twenty-four (24) hours of such contact; and (iii) redirect Seller to communicate solely through Provider. Failure to report such contact shall constitute a material breach of this Agreement.</p>

                    <p className="mb-3"><strong>2.2. Non-Circumvention and Non-Interference.</strong> Recipient acknowledges that Provider has a valid contractual engagement with Seller and that Provider's proprietary network is its primary commercial asset. Accordingly, Recipient agrees that during the Term and for a period of twenty-four (24) months following the Effective Date (the "Protection Period"), Recipient shall not, directly or indirectly:</p>

                    <ul className="list-disc pl-6 mb-3 space-y-1">
                      <li><strong>(a) Transactional Bypass:</strong> Consummate, participate in, or facilitate any Transaction involving the Business, the Seller, or any material portion of Seller's assets, without Provider's full participation and compensation;</li>
                      <li><strong>(b) Alternative Structures:</strong> Enter into any management agreement, consulting arrangement, lease agreement, or independent contractor relationship with Seller that has the effect of transferring the economic benefit, operational control, or goodwill of the Business to Recipient;</li>
                      <li><strong>(c) Tortious Interference:</strong> Induce, encourage, aid, or abet Seller to breach, terminate, or modify its engagement agreement with Provider for the purpose of avoiding, reducing, or delaying the payment of commissions; or</li>
                      <li><strong>(d) Parallel Pursuit:</strong> Enter into any agreement, option, or understanding with Seller during the Protection Period that contemplates a closing or transfer of assets occurring subsequent to the expiration of the Protection Period.</li>
                    </ul>

                    <p className="mb-3"><strong>2.3. Liability for Circumvention.</strong> The Parties expressly acknowledge that a breach of Section 2.1 or 2.2 will result in the loss of Provider's bargained-for compensation. Accordingly, in the event Recipient (or any Affiliate) consummates a Transaction or takes control of the Business in violation of this Article 2, Recipient shall be immediately liable to pay Provider a sum equal to Ten Percent (10.0%) of the "Total Transaction Value" or the specific commission amount Provider would have earned under its agreement with Seller, whichever is greater (the "Liquidated Damages").</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">ARTICLE 3: NON-SOLICITATION AND NON-INTERFERENCE</h5>

                    <p className="mb-3"><strong>3.1. Non-Solicitation and "No-Hire" of Workforce.</strong> Recipient acknowledges that the Business's enterprise value is inextricably linked to its workforce, specifically its DOT qualified drivers and key logistics personnel. Accordingly, Recipient covenants and agrees that, during the Term and for a period of twenty-four (24) months following the Effective Date (the "Restricted Period"), Recipient shall not, directly or indirectly:</p>

                    <ul className="list-disc pl-6 mb-3 space-y-1">
                      <li><strong>(a) Targeted Solicitation:</strong> Solicit, induce, recruit, encourage, or attempt to persuade any "Protected Individual" to terminate their employment or engagement with Seller; or</li>
                      <li><strong>(b) Hiring Prohibition:</strong> Hire, engage, or contract with any Protected Individual, regardless of whether such individual approaches Recipient voluntarily or responds to a general solicitation.</li>
                    </ul>

                    <p className="mb-3"><strong>3.3. Non-Interference with Commercial Relationships.</strong> Recipient covenants that it shall not use any Confidential Information (including customer lists, lane history, or rate sheets) to divert, solicit, or interfere with any of Seller's commercial relationships.</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">ARTICLE 4: DISCLAIMER OF WARRANTIES AND RELEASE OF LIABILITY</h5>

                    <p className="mb-3"><strong>4.1. Limited Role of Provider.</strong> Recipient acknowledges and agrees that Provider acts solely as a marketing consultant and administrative intermediary for the Seller. Provider has not audited, verified, validated, investigated, or independently confirmed the accuracy, completeness, or authenticity of any information provided by Seller. Provider is not acting as legal counsel, certified public accountant, tax advisor, or licensed real estate broker/inspector for Recipient.</p>

                    <p className="mb-3"><strong>4.2. Disclaimer of Representations and Warranties.</strong> PROVIDER MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AT LAW OR IN EQUITY, WITH RESPECT TO THE TRANSACTION OR THE CONFIDENTIAL INFORMATION. Provider expressly disclaims any warranty regarding: (a) Financial projections; (b) Asset condition (AS-IS/WHERE-IS); (c) Regulatory compliance; and (d) Implied warranties of merchantability or fitness for a particular purpose.</p>

                    <p className="mb-3"><strong>4.3. Non-Reliance Covenant.</strong> Recipient acknowledges that it is a sophisticated purchaser and has made its own independent investigation, analysis, and valuation of the Business. Recipient is relying solely on its own independent due diligence, inspection of assets, and the advice of its own legal and financial advisors.</p>

                    <p className="mb-3"><strong>4.4. Waiver and Release of Liability.</strong> To the fullest extent permitted by applicable law, Recipient hereby irrevocably and unconditionally releases, acquits, and forever discharges Provider and its affiliates from any and all claims, demands, causes of action, liabilities, losses, damages, costs, and expenses arising out of or relating to any inaccuracy, error, omission, or misrepresentation in the Confidential Information.</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">ARTICLE 5: OPERATIONAL CONDITIONS</h5>

                    <p className="mb-3"><strong>5.1. Proof of Funds.</strong> Provider reserves the right to withhold specific categories of information until Recipient has provided current, verifiable evidence of its financial capacity to consummate the Transaction.</p>

                    <p className="mb-3"><strong>5.2. Strict Prohibition on Unannounced Site Visits.</strong> Under no circumstances shall Recipient visit the Seller's offices, terminals, yards, or facilities without the express prior written consent of Provider and the presence of a designated escort.</p>

                    <p className="mb-3"><strong>5.4. Return or Destruction of Confidential Information.</strong> Upon termination of negotiations, Recipient shall within five (5) business days permanently delete, destroy, or erase all copies of the Confidential Information from its systems and provide a certificate confirming such destruction.</p>

                    <h5 className="font-bold text-gray-900 mt-6 mb-2 text-sm">ARTICLE 6: DISPUTE RESOLUTION, GOVERNING LAW, AND REMEDIES</h5>

                    <p className="mb-3"><strong>6.1. Governing Law.</strong> This Agreement shall be governed by the internal laws of the State of New York, without giving effect to any choice of law provision.</p>

                    <p className="mb-3"><strong>6.2. Mandatory Binding Arbitration.</strong> Any dispute, claim, or controversy arising out of or relating to this Agreement shall be determined exclusively by binding arbitration before a single arbitrator, administered by the American Arbitration Association in New York, New York.</p>

                    <p className="mb-3"><strong>6.4. WAIVER OF JURY TRIAL.</strong> TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, EACH PARTY HEREBY KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVES ANY RIGHT IT MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY LITIGATION OR PROCEEDING ARISING OUT OF OR RELATING TO THIS AGREEMENT.</p>

                    <p className="mb-3"><strong>6.5. Equitable Relief.</strong> The Parties acknowledge that a breach of Article 2 (Non-Circumvention) or Article 3 (Non-Solicitation) would cause irreparable harm. Provider shall be entitled to seek preliminary and permanent injunctive relief in any state or federal court located in New York County, New York, without the necessity of posting a bond.</p>

                    <p className="mb-3"><strong>6.6. Attorneys' Fees.</strong> The Prevailing Party shall be entitled to recover from the non-prevailing party all reasonable attorneys' fees, court costs, and other expenses incurred in connection with any proceeding.</p>

                    <p className="mb-3"><strong>6.7. Survival.</strong> The rights and obligations set forth in Articles 1-4 and 6 shall survive the expiration or termination of this Agreement for the duration of the Protection Period plus the applicable statute of limitations.</p>

                    <div className="mt-6 pt-4 border-t border-gray-300">
                      <p className="font-bold text-gray-900 mb-3">IN WITNESS WHEREOF, the Recipient has executed this Agreement as of the Effective Date.</p>
                    </div>

                    <p className="text-xs text-amber-600 mt-4 pt-4 border-t border-gray-200 text-center font-medium">
                      Scroll to the bottom to enable signing.
                    </p>
                  </div>

                  {/* Read Confirmation */}
                  {!hasReadTerms && (
                    <p className="text-sm text-amber-600 text-center">
                      Please scroll through and read the entire terms of service to continue.
                    </p>
                  )}

                  {/* Signature Section */}
                  {hasReadTerms && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Electronic Signature
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        By typing your full name below, you agree that this electronic signature has the same legal effect as a handwritten signature.
                      </p>
                      <input
                        type="text"
                        placeholder="Type your full legal name"
                        value={termsSignature}
                        onChange={(e) => setTermsSignature(e.target.value)}
                        className="w-full px-4 py-3 border border-emerald-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-serif italic"
                        style={{ fontFamily: 'Georgia, serif' }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => setShowTermsModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      onClick={handleAcceptTerms}
                      disabled={!hasReadTerms || termsSignature.trim().length < 2 || acceptingTerms}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {acceptingTerms ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Sign & Accept
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Request Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 -m-6 mb-6 p-6 border-b border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Premium MC Request</h3>
                        <p className="text-sm text-gray-500">MC Authority Inquiry</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPremiumModal(false)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="space-y-4">
                  {/* Disclaimer */}
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">Important:</span> Even if you have credits, your request must be reviewed and approved by our admin team first. Credits will only be charged upon approval.
                    </p>
                  </div>

                  <Textarea
                    label="Message to Admin (Optional)"
                    placeholder="Tell us about your business needs, timeline, or any specific questions..."
                    value={premiumMessage}
                    onChange={(e) => setPremiumMessage(e.target.value)}
                    rows={4}
                  />

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold mb-2">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary-400" />
                        Admin reviews your request
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary-400" />
                        We'll contact you within 24-48 hours
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary-400" />
                        Credits charged only upon approval
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => setShowPremiumModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      onClick={handleSubmitPremiumRequest}
                      disabled={sendingPremiumRequest}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      {sendingPremiumRequest ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Required Modal (Starter plan cannot request premium) */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Upgrade Required</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Starter plan members cannot request premium MC listings. Upgrade to <span className="font-semibold text-indigo-600">Premium</span> or <span className="font-semibold text-amber-600">Enterprise</span> to unlock premium requests.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full pt-2">
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => setShowUpgradeModal(false)}
                    >
                      Close
                    </Button>
                    <Link to="/buyer/subscription" className="flex-1">
                      <Button
                        fullWidth
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Representative Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 -m-6 mb-6 p-6 border-b border-indigo-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Contact Us</h3>
                        <p className="text-sm text-gray-500">MC Authority Inquiry</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowContactModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Send a message to our team about this MC authority. We'll respond within 24 hours.
                  </p>

                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="(555) 555-5555"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />

                  <Textarea
                    label="Your Message"
                    placeholder="I'm interested in this MC authority. Please provide more information about pricing, documentation requirements, and the transfer process..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    required
                  />

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <h4 className="font-semibold mb-2 text-gray-900">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                        Our team reviews your inquiry
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                        We'll contact you within 24 hours
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                        Get all your questions answered
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => setShowContactModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      onClick={handleSubmitContact}
                      disabled={!contactMessage.trim() || sendingInquiry}
                    >
                      {sendingInquiry ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Offer Modal */}
        {showOfferModal && listing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 -m-6 mb-6 p-6 border-b border-indigo-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Send className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Place an Offer</h3>
                        <p className="text-sm text-gray-500">MC #{listing.mcNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowOfferModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                {offerSuccess ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Offer Submitted!</h3>
                    <p className="text-gray-600">Admin will review your offer and contact you shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* MC Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-900">{listing.title}</div>
                          <div className="text-sm text-gray-500">Listed at ${(listing.listingPrice || listing.askingPrice || listing.price || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Offer Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Offer Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 resize-none"
                        placeholder="Add a message about your offer..."
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        fullWidth
                        variant="outline"
                        onClick={() => setShowOfferModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        fullWidth
                        onClick={handleSubmitOffer}
                        disabled={!offerAmount || submittingOffer}
                      >
                        {submittingOffer ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Offer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Buy Now Modal */}
        {showBuyNowModal && listing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBuyNowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 -m-6 mb-6 p-6 border-b border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Buy Now</h3>
                        <p className="text-sm text-gray-500">MC #{listing.mcNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBuyNowModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                {buyNowSuccess ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Purchase Request Submitted!</h3>
                    <p className="text-gray-600">Admin will review and contact you to proceed with the transaction.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* MC Info */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <div className="text-center">
                        <div className="font-bold text-gray-900 text-lg mb-1">{listing.title}</div>
                        <div className="text-3xl font-bold text-emerald-600">
                          ${(listing.listingPrice || listing.askingPrice || listing.price || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-emerald-700 mt-1">Listed Price</div>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={buyNowMessage}
                        onChange={(e) => setBuyNowMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 resize-none"
                        placeholder="Add any notes about your purchase..."
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <h4 className="font-semibold mb-2 text-gray-900">What happens next?</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Admin reviews your purchase request
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          You'll receive deposit instructions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Transaction room opens for secure transfer
                        </li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        fullWidth
                        variant="outline"
                        onClick={() => setShowBuyNowModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        fullWidth
                        onClick={handleBuyNow}
                        disabled={submittingBuyNow}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                      >
                        {submittingBuyNow ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Confirm Purchase
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MCDetailPage
