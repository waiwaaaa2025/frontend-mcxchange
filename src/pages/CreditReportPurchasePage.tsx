import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Building,
  Building2,
  MapPin,
  ChevronRight,
  Loader2,
  CreditCard,
  CircleDollarSign,
  Search,
  CheckCircle,
} from 'lucide-react'
import Button from '../components/ui/Button'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import CreditReportView from '../components/v2/CreditReportView'

interface CompanySearchResult {
  id: string
  connectId?: string
  name: string
  regNo?: string
  status?: string
  address?: {
    simpleValue?: string
    city?: string
    province?: string
  }
}

const CreditReportPurchasePage = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  // Search state
  const [searchName, setSearchName] = useState('')
  const [searchState, setSearchState] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([])
  const [totalResults, setTotalResults] = useState(0)

  // Selection & report state
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [fullReport, setFullReport] = useState<any>(null)
  const [purchasedConnectIds, setPurchasedConnectIds] = useState<Set<string>>(new Set())

  // Handle Stripe purchase success return
  useEffect(() => {
    const connectId = searchParams.get('connectId')
    if (searchParams.get('purchase') === 'success' && connectId) {
      setPurchasedConnectIds(prev => new Set(prev).add(connectId))
      toast.success('Credit report purchased! Loading your report...')
      window.history.replaceState({}, '', window.location.pathname)
      loadPurchasedReport(connectId)
    }
  }, [searchParams])

  const handleSearch = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a company name')
      return
    }

    setSearchResults([])
    setTotalResults(0)
    setSelectedCompany(null)
    setFullReport(null)
    setIsSearching(true)

    try {
      const response = await api.creditsafeOpenSearch({
        name: searchName.trim(),
        state: searchState.trim() || undefined,
      })
      setSearchResults(response.data.companies)
      setTotalResults(response.data.totalResults)

      if (response.data.companies.length === 0) {
        toast('No companies found matching that name', { icon: '\u{1F50D}' })
      }
    } catch (error: any) {
      toast.error(error?.message || 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCompany = async (company: CompanySearchResult) => {
    const connectId = company.connectId || company.id
    if (!connectId) return

    setSelectedCompany(company)
    setFullReport(null)

    // Check if already purchased
    try {
      const check = await api.checkCreditReportPurchase(connectId)
      if (check.data?.purchased) {
        setPurchasedConnectIds(prev => new Set(prev).add(connectId))
        loadPurchasedReport(connectId)
      }
    } catch {
      // Not purchased — UI will show purchase button
    }
  }

  const loadPurchasedReport = async (connectId: string) => {
    setIsLoadingReport(true)
    setFullReport(null)
    try {
      const response = await api.creditsafePurchasedReport(connectId)
      setFullReport(response.data)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load credit report')
    } finally {
      setIsLoadingReport(false)
    }
  }

  const handlePurchaseReport = async (company: CompanySearchResult) => {
    const connectId = company.connectId || company.id
    if (!connectId) {
      toast.error('Unable to identify this company')
      return
    }

    setPurchaseLoading(true)
    try {
      const response = await api.createCreditReportCheckout(connectId, company.name || 'Unknown Company')
      if (response.data?.url) {
        window.location.href = response.data.url
      } else {
        toast.error('Failed to create checkout session')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to initiate purchase')
    } finally {
      setPurchaseLoading(false)
    }
  }

  const isPurchased = (company: CompanySearchResult) =>
    purchasedConnectIds.has(company.connectId || company.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="p-4 sm:p-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Credit Reports
                </h1>
                <p className="text-sm sm:text-base text-gray-500">
                  Search any company and purchase a full business credit report — <span className="text-indigo-600 font-semibold">$35 per report</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search Section */}
          <motion.div
            className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-5 sm:p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Company Search</h2>
                <p className="text-sm text-gray-500">Search by company name to find their credit report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter company name..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State (Optional)</label>
                <input
                  type="text"
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. TX, CA, NY..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchName.trim()}
              className="w-full md:w-auto"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Companies
                </>
              )}
            </Button>
          </motion.div>

          {/* Results + Report */}
          {(isSearching || searchResults.length > 0 || selectedCompany || fullReport) && (
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Search Results Sidebar */}
              <motion.div
                className="lg:col-span-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden sticky top-8">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Results</h3>
                      {totalResults > 0 && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {totalResults} found
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Searching...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No results yet</p>
                        <p className="text-sm text-gray-400 mt-1">Search for a company above</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {searchResults.map((company, index) => {
                          const purchased = isPurchased(company)
                          return (
                          <motion.button
                            key={company.id}
                            onClick={() => handleSelectCompany(company)}
                            className={`w-full text-left p-5 hover:bg-gray-50 transition-all ${
                              selectedCompany?.id === company.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                selectedCompany?.id === company.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Building className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{company.name}</p>
                                {company.address?.simpleValue && (
                                  <p className="text-sm text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {company.address.simpleValue}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {company.status && (
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                      company.status.toLowerCase().includes('active')
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {company.status}
                                    </span>
                                  )}
                                  {purchased && (
                                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Purchased
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                selectedCompany?.id === company.id ? 'text-blue-500' : 'text-gray-300'
                              }`} />
                            </div>
                          </motion.button>
                        )})}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Report Content / Purchase Prompt */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {isLoadingReport ? (
                    <motion.div
                      key="loading"
                      className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-8 sm:p-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Loading Credit Report...</p>
                        <p className="text-sm text-gray-400 mt-1">Fetching comprehensive business data</p>
                      </div>
                    </motion.div>
                  ) : selectedCompany && !isPurchased(selectedCompany) && !fullReport ? (
                    <motion.div
                      key="purchase"
                      className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 sm:p-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                          <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Purchase Credit Report</h3>
                        <p className="text-gray-500 mb-1">
                          Get the full business credit report for <strong>{selectedCompany.name}</strong>
                        </p>
                        <p className="text-gray-400 text-sm mb-6">
                          Includes credit score, payment history, UCC filings, liens, judgments, bankruptcy status, financial statements, and more.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 mb-6">
                          <CircleDollarSign className="w-5 h-5 text-blue-600" />
                          <span className="text-2xl font-bold text-blue-700">$35</span>
                          <span className="text-sm text-blue-500">one-time</span>
                        </div>
                        <div>
                          <Button
                            onClick={() => handlePurchaseReport(selectedCompany)}
                            disabled={purchaseLoading}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
                          >
                            {purchaseLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Redirecting to checkout...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Purchase Report — $35
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          Secure payment powered by Stripe. Report available immediately after purchase.
                        </p>
                      </div>
                    </motion.div>
                  ) : fullReport ? (
                    <motion.div
                      key="report"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CreditReportView fullReport={fullReport} isLoading={false} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-8 sm:p-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Shield className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Select a company to view or purchase their credit report</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreditReportPurchasePage
