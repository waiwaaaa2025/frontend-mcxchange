import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Select from './ui/Select'
import { AUTHORITY_TYPE_OPTIONS } from '../constants/authority'
import api from '../services/api'

const US_STATES = [
  { value: '', label: 'Select State' },
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

const AMAZON_STATUS_OPTIONS = [
  { value: 'NONE', label: 'Not on Amazon' },
  { value: 'ACTIVE', label: 'Active on Amazon Relay' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending Approval' }
]

const SAFETY_RATING_OPTIONS = [
  { value: 'NONE', label: 'Not Rated' },
  { value: 'SATISFACTORY', label: 'Satisfactory' },
  { value: 'CONDITIONAL', label: 'Conditional' },
  { value: 'UNSATISFACTORY', label: 'Unsatisfactory' }
]

interface EditListingModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  onSuccess: () => void
}

interface ListingData {
  id: string
  mcNumber: string
  dotNumber?: string
  title: string
  description?: string
  askingPrice?: number
  listingPrice?: number
  city?: string
  state?: string
  yearsActive?: number
  fleetSize?: number
  totalDrivers?: number
  safetyRating?: string
  insuranceOnFile?: boolean
  bipdCoverage?: number
  cargoCoverage?: number
  bondAmount?: number
  insuranceCompany?: string
  monthlyInsurancePremium?: number
  amazonStatus?: string
  amazonRelayScore?: string
  highwaySetup?: boolean
  sellingWithEmail?: boolean
  sellingWithPhone?: boolean
  rmisSetup?: boolean
  setupWithBrokers?: boolean
  authorityType?: string
}

const EditListingModal = ({ isOpen, onClose, listingId, onSuccess }: EditListingModalProps) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listing, setListing] = useState<ListingData | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    askingPrice: '',
    city: '',
    state: '',
    yearsActive: '',
    fleetSize: '',
    totalDrivers: '',
    safetyRating: 'NONE',
    insuranceOnFile: false,
    bipdCoverage: '',
    cargoCoverage: '',
    bondAmount: '',
    insuranceCompany: '',
    monthlyInsurancePremium: '',
    amazonStatus: 'NONE',
    amazonRelayScore: '',
    highwaySetup: false,
    sellingWithEmail: false,
    sellingWithPhone: false,
    rmisSetup: false,
    setupWithBrokers: false,
    authorityType: 'MOTOR_CARRIER' as 'MOTOR_CARRIER' | 'BROKER' | 'MOTOR_CARRIER_AND_BROKER' | 'FREIGHT_FORWARDER',
  })

  useEffect(() => {
    if (isOpen && listingId) {
      fetchListing()
    }
  }, [isOpen, listingId])

  const fetchListing = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getSellerListing(listingId)
      if (response.success && response.data) {
        const data = response.data
        setListing(data)
        setFormData({
          title: data.title || '',
          description: data.description || '',
          askingPrice: String(data.askingPrice || data.listingPrice || ''),
          city: data.city || '',
          state: data.state || '',
          yearsActive: String(data.yearsActive || ''),
          fleetSize: String(data.fleetSize || ''),
          totalDrivers: String(data.totalDrivers || ''),
          safetyRating: data.safetyRating || 'NONE',
          insuranceOnFile: data.insuranceOnFile || false,
          bipdCoverage: String(data.bipdCoverage || ''),
          cargoCoverage: String(data.cargoCoverage || ''),
          bondAmount: String(data.bondAmount || ''),
          insuranceCompany: data.insuranceCompany || '',
          monthlyInsurancePremium: String(data.monthlyInsurancePremium || ''),
          amazonStatus: data.amazonStatus || 'NONE',
          amazonRelayScore: data.amazonRelayScore || '',
          highwaySetup: data.highwaySetup || false,
          sellingWithEmail: data.sellingWithEmail || false,
          sellingWithPhone: data.sellingWithPhone || false,
          rmisSetup: data.rmisSetup || false,
          setupWithBrokers: data.setupWithBrokers || false,
          authorityType: (data.authorityType as any) || 'MOTOR_CARRIER',
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description || undefined,
        askingPrice: formData.askingPrice ? parseFloat(formData.askingPrice) : undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        yearsActive: formData.yearsActive ? parseInt(formData.yearsActive) : undefined,
        fleetSize: formData.fleetSize ? parseInt(formData.fleetSize) : undefined,
        totalDrivers: formData.totalDrivers ? parseInt(formData.totalDrivers) : undefined,
        safetyRating: formData.safetyRating,
        insuranceOnFile: formData.insuranceOnFile,
        bipdCoverage: formData.bipdCoverage ? parseFloat(formData.bipdCoverage) : undefined,
        cargoCoverage: formData.cargoCoverage ? parseFloat(formData.cargoCoverage) : undefined,
        bondAmount: formData.bondAmount ? parseFloat(formData.bondAmount) : undefined,
        insuranceCompany: formData.insuranceCompany || undefined,
        monthlyInsurancePremium: formData.monthlyInsurancePremium ? parseFloat(formData.monthlyInsurancePremium) : undefined,
        amazonStatus: formData.amazonStatus,
        amazonRelayScore: formData.amazonRelayScore || undefined,
        highwaySetup: formData.highwaySetup,
        sellingWithEmail: formData.sellingWithEmail,
        sellingWithPhone: formData.sellingWithPhone,
        rmisSetup: formData.rmisSetup,
        setupWithBrokers: formData.setupWithBrokers,
        authorityType: formData.authorityType,
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      await api.updateListing(listingId, updateData)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update listing')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 bg-white border-b border-gray-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Listing</h2>
                {listing && (
                  <p className="text-sm text-gray-500 mt-0.5">MC #{listing.mcNumber}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <span className="ml-3 text-gray-500">Loading listing...</span>
                </div>
              ) : error && !listing ? (
                <div className="flex items-center justify-center py-12 text-red-500">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  <span>{error}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>

                    <Input
                      label="Listing Title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Enter listing title"
                      required
                    />

                    <Textarea
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe your MC authority..."
                      rows={3}
                    />

                    <Input
                      label="Asking Price ($)"
                      type="number"
                      value={formData.askingPrice}
                      onChange={(e) => handleChange('askingPrice', e.target.value)}
                      placeholder="Enter asking price"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="City"
                      />

                      <Select
                        label="State"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        options={US_STATES}
                      />
                    </div>
                  </div>

                  {/* Authority Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Authority Details</h3>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Authority Type</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {AUTHORITY_TYPE_OPTIONS.map((option) => {
                          const selected = formData.authorityType === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleChange('authorityType', option.value)}
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                selected ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Years Active"
                        type="number"
                        value={formData.yearsActive}
                        onChange={(e) => handleChange('yearsActive', e.target.value)}
                        placeholder="Years"
                      />

                      <Input
                        label="Fleet Size"
                        type="number"
                        value={formData.fleetSize}
                        onChange={(e) => handleChange('fleetSize', e.target.value)}
                        placeholder="Trucks"
                      />

                      <Input
                        label="Total Drivers"
                        type="number"
                        value={formData.totalDrivers}
                        onChange={(e) => handleChange('totalDrivers', e.target.value)}
                        placeholder="Drivers"
                      />
                    </div>

                    <Select
                      label="Safety Rating"
                      value={formData.safetyRating}
                      onChange={(e) => handleChange('safetyRating', e.target.value)}
                      options={SAFETY_RATING_OPTIONS}
                    />
                  </div>

                  {/* Insurance */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Insurance</h3>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.insuranceOnFile}
                        onChange={(e) => handleChange('insuranceOnFile', e.target.checked)}
                        className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-700">Insurance On File</span>
                    </label>

                    <Input
                      label="Insurance Company"
                      value={formData.insuranceCompany}
                      onChange={(e) => handleChange('insuranceCompany', e.target.value)}
                      placeholder="e.g., Progressive, National Interstate"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="BIPD Coverage ($)"
                        type="number"
                        value={formData.bipdCoverage}
                        onChange={(e) => handleChange('bipdCoverage', e.target.value)}
                        placeholder="BIPD amount"
                      />

                      <Input
                        label="Cargo Coverage ($)"
                        type="number"
                        value={formData.cargoCoverage}
                        onChange={(e) => handleChange('cargoCoverage', e.target.value)}
                        placeholder="Cargo amount"
                      />

                      <Input
                        label="Bond / Surety ($)"
                        type="number"
                        value={formData.bondAmount}
                        onChange={(e) => handleChange('bondAmount', e.target.value)}
                        placeholder="Bond amount"
                      />
                    </div>

                    <Input
                      label="Monthly Insurance Premium ($)"
                      type="number"
                      value={formData.monthlyInsurancePremium}
                      onChange={(e) => handleChange('monthlyInsurancePremium', e.target.value)}
                      placeholder="Monthly premium"
                    />
                  </div>

                  {/* Platform Status */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Platform Status</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Amazon Status"
                        value={formData.amazonStatus}
                        onChange={(e) => handleChange('amazonStatus', e.target.value)}
                        options={AMAZON_STATUS_OPTIONS}
                      />

                      {formData.amazonStatus === 'ACTIVE' && (
                        <Input
                          label="Amazon Relay Score"
                          value={formData.amazonRelayScore}
                          onChange={(e) => handleChange('amazonRelayScore', e.target.value)}
                          placeholder="e.g., Fantastic"
                        />
                      )}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.highwaySetup}
                        onChange={(e) => handleChange('highwaySetup', e.target.checked)}
                        className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-700">Highway Setup Complete</span>
                    </label>
                  </div>

                  {/* What's Included & Setup */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">What's Included & Setup</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.sellingWithPhone}
                          onChange={(e) => handleChange('sellingWithPhone', e.target.checked)}
                          className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700">Selling with Phone?</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.sellingWithEmail}
                          onChange={(e) => handleChange('sellingWithEmail', e.target.checked)}
                          className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700">Selling with Email?</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.rmisSetup}
                          onChange={(e) => handleChange('rmisSetup', e.target.checked)}
                          className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700">RMIS Setup?</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.setupWithBrokers}
                          onChange={(e) => handleChange('setupWithBrokers', e.target.checked)}
                          className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700">Set Up with Brokers?</span>
                      </label>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!loading && listing && (
              <div className="sticky bottom-0 flex flex-col sm:flex-row gap-3 p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full sm:w-auto sm:ml-auto order-1 sm:order-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EditListingModal
