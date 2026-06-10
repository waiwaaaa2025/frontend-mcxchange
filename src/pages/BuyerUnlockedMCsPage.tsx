import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Unlock,
  DollarSign,
  Eye,
  Send,
  X,
  Coins,
  Clock,
  Building2,
  Shield,
  Loader2,
  Search,
  AlertCircle,
  ShoppingCart,
  CheckCircle
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const BuyerUnlockedMCsPage = () => {
  const { user } = useAuth()
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showBuyNowModal, setShowBuyNowModal] = useState(false)
  const [selectedMC, setSelectedMC] = useState<any>(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [buyNowMessage, setBuyNowMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [submittingBuyNow, setSubmittingBuyNow] = useState(false)
  const [buyNowSuccess, setBuyNowSuccess] = useState(false)
  const [unlockedMCs, setUnlockedMCs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get credits from user data
  const totalCredits = user?.totalCredits || 0
  const usedCredits = user?.usedCredits || 0
  const availableCredits = totalCredits - usedCredits

  // Fetch unlocked MCs from API
  useEffect(() => {
    const fetchUnlockedMCs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getUnlockedListings({ limit: 100 })
        // Transform the data to match expected format
        const listings = response.data.map((item: any) => ({
          id: item.id,
          listing: {
            id: item.id,
            mcNumber: item.mcNumber,
            dotNumber: item.dotNumber,
            title: item.title,
            price: parseFloat(item.price) || 0,
            yearsActive: item.yearsActive || 0,
            trustScore: item.seller?.trustScore || 50,
            isPremium: item.isPremium || false,
            city: item.city,
            state: item.state,
            safetyRating: item.safetyRating,
            amazonStatus: item.amazonStatus,
          },
          unlockedAt: item.unlockedAt,
          creditsUsed: item.creditsUsed || 1,
        }))
        setUnlockedMCs(listings)
      } catch (err: any) {
        console.error('Failed to fetch unlocked MCs:', err)
        setError(err.message || 'Failed to load unlocked listings')
      } finally {
        setLoading(false)
      }
    }

    fetchUnlockedMCs()
  }, [])

  const handleSubmitOffer = async () => {
    if (!selectedMC || !offerAmount) return
    setSubmittingOffer(true)

    try {
      await api.createOffer({
        listingId: selectedMC.listing.id,
        amount: parseFloat(offerAmount),
        message: offerMessage || 'I am interested in purchasing this MC authority.'
      })
      setSubmittingOffer(false)
      setShowOfferModal(false)
      setOfferAmount('')
      setOfferMessage('')
      alert('Offer submitted successfully! Admin will review shortly.')
    } catch (err: any) {
      setSubmittingOffer(false)
      alert(err.message || 'Failed to submit offer. Please try again.')
    }
  }

  const handleBuyNow = async () => {
    if (!selectedMC) return
    setSubmittingBuyNow(true)
    setBuyNowSuccess(false)

    try {
      await api.createOffer({
        listingId: selectedMC.listing.id,
        amount: selectedMC.listing.price,
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
      alert(err.message || 'Failed to submit buy request. Please try again.')
    } finally {
      setSubmittingBuyNow(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unlocked MCs</h1>
          <p className="text-gray-500">View and manage your unlocked MC authorities</p>
        </div>
        <Link to="/buyer/subscription">
          <Button>
            <Coins className="w-4 h-4 mr-2" />
            Buy More Credits
          </Button>
        </Link>
      </div>

      {/* Credits Card */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Available Credits</p>
              <p className="text-3xl font-bold text-white">{availableCredits}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Purchased</p>
              <p className="text-xl font-semibold text-white">{totalCredits}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Used</p>
              <p className="text-xl font-semibold text-white">{usedCredits}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">MCs Unlocked</p>
              <p className="text-xl font-semibold text-white">{unlockedMCs.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Unlocked MCs List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Unlocked Listings</h2>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Unlocked MCs...</h3>
              <p className="text-gray-500">Please wait while we fetch your unlocked listings</p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Listings</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Card>
        ) : unlockedMCs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Unlock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Unlocked MCs Yet</h3>
              <p className="text-gray-500 mb-4">Browse the marketplace and unlock MC listings to view full details</p>
              <Link to="/marketplace">
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {unlockedMCs.map((unlockedMC, index) => {
              const listing = unlockedMC.listing

              return (
                <motion.div
                  key={unlockedMC.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* MC Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">MC #{listing.mcNumber}</h3>
                              {listing.isPremium && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{listing.title}</p>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {listing.yearsActive} years active
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                {listing.trustScore}% trust
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${listing.price?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/mc/${listing.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedMC(unlockedMC)
                          setOfferAmount(listing.price?.toString() || '')
                          setShowOfferModal(true)
                        }}>
                          <Send className="w-4 h-4 mr-2" />
                          Place Offer
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
                          setSelectedMC(unlockedMC)
                          setBuyNowMessage('')
                          setShowBuyNowModal(true)
                        }}>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>

                    {/* Unlocked date */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Unlock className="w-4 h-4" />
                        Unlocked on {new Date(unlockedMC.unlockedAt).toLocaleDateString()}
                      </span>
                      <span>{unlockedMC.creditsUsed} credit used</span>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && selectedMC && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowOfferModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Place an Offer</h2>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* MC Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">MC #{selectedMC.listing.mcNumber}</p>
                    <p className="text-sm text-gray-500">Asking Price: ${selectedMC.listing.price?.toLocaleString()}</p>
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
                  placeholder="Add a message to the admin about your offer..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowOfferModal(false)}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleSubmitOffer}
                loading={submittingOffer}
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
        </div>
      )}

      {/* Buy Now Modal */}
      {showBuyNowModal && selectedMC && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !submittingBuyNow && setShowBuyNowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Buy Now Request</h2>
                <button
                  onClick={() => !submittingBuyNow && setShowBuyNowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={submittingBuyNow}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {buyNowSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-500">
                  Your buy request has been submitted. Admin will review and contact you shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-6">
                  {/* MC Info */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">MC #{selectedMC.listing.mcNumber}</p>
                        <p className="text-sm text-gray-600">{selectedMC.listing.title}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
                      <span className="text-gray-600">Listed Price</span>
                      <span className="text-2xl font-bold text-green-700">${selectedMC.listing.price?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">How Buy Now Works</p>
                        <ul className="text-blue-700 space-y-1">
                          <li>1. Your request is submitted for admin review</li>
                          <li>2. Admin verifies and approves the transaction</li>
                          <li>3. You'll pay a $1,000 refundable deposit</li>
                          <li>4. Transaction room opens for closing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Admin (Optional)
                    </label>
                    <textarea
                      value={buyNowMessage}
                      onChange={(e) => setBuyNowMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 resize-none"
                      placeholder="Add any notes or questions about this purchase..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowBuyNowModal(false)}
                    disabled={submittingBuyNow}
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleBuyNow}
                    loading={submittingBuyNow}
                    disabled={submittingBuyNow}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submittingBuyNow ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Submit Buy Request
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BuyerUnlockedMCsPage
