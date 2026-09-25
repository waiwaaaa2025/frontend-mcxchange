import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  CreditCard,
  DollarSign,
  Link2,
  CheckCircle,
  AlertTriangle,
  Download,
  Search,
  TrendingUp,
  Calendar,
  Building2,
  ExternalLink,
  Shield,
  Bell,
  Globe,
  Tag,
  Plus,
  Trash2,
  Copy,
  Save
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { api } from '../services/api'
import type { PricingConfig, SubscriptionPlanConfig, CreditPack } from '../types'

interface NotificationSettings {
  admin_notification_emails: string;
  notify_new_users: boolean;
  notify_new_inquiries: boolean;
  notify_new_transactions: boolean;
  notify_disputes: boolean;
  notify_consultations: boolean;
}

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'notifications' | 'security' | 'pricing'>('general')
  const [stripeConnected, setStripeConnected] = useState(true)
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // User email export state
  const [emailExportRole, setEmailExportRole] = useState('ALL')
  const [emailExporting, setEmailExporting] = useState(false)
  const [emailExportError, setEmailExportError] = useState<string | null>(null)

  const handleExportEmails = async () => {
    setEmailExporting(true)
    setEmailExportError(null)
    try {
      await api.downloadUserEmailsCsv(emailExportRole)
    } catch (err) {
      setEmailExportError(err instanceof Error ? err.message : 'Email export failed')
    } finally {
      setEmailExporting(false)
    }
  }

  // Pricing state
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingSaving, setPricingSaving] = useState(false)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    admin_notification_emails: '',
    notify_new_users: true,
    notify_new_inquiries: true,
    notify_new_transactions: true,
    notify_disputes: true,
    notify_consultations: true,
  })
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null)

  // Platform settings state
  const [listingPaymentRequired, setListingPaymentRequired] = useState(true)
  const [equipmentFeePct, setEquipmentFeePct] = useState('5')
  const [platformSettingsLoading, setPlatformSettingsLoading] = useState(false)
  const [platformSettingsSaving, setPlatformSettingsSaving] = useState(false)
  const [platformSettingsError, setPlatformSettingsError] = useState<string | null>(null)
  const [platformSettingsSuccess, setPlatformSettingsSuccess] = useState<string | null>(null)

  // Load pricing config when pricing tab is active
  useEffect(() => {
    if (activeTab === 'pricing' && !pricingConfig) {
      loadPricingConfig()
    }
  }, [activeTab])

  // Load notification settings when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationSettings()
    }
  }, [activeTab])

  // Load platform settings when general tab is active
  useEffect(() => {
    if (activeTab === 'general') {
      loadPlatformSettings()
    }
  }, [activeTab])

  const loadPlatformSettings = async () => {
    setPlatformSettingsLoading(true)
    setPlatformSettingsError(null)
    try {
      const response = await api.getPlatformSettings()
      if (response.success && response.data) {
        // listing_payment_required defaults to true if not set
        const paymentRequired = response.data.listing_payment_required
        setListingPaymentRequired(paymentRequired !== false)
        const fee = response.data.equipment_platform_fee_percentage
        if (fee !== undefined && fee !== null && fee !== '') setEquipmentFeePct(String(fee))
      }
    } catch (err: any) {
      setPlatformSettingsError(err.message || 'Failed to load platform settings')
    } finally {
      setPlatformSettingsLoading(false)
    }
  }

  const saveEquipmentFee = async () => {
    const n = Number(equipmentFeePct)
    if (!isFinite(n) || n < 0 || n >= 100) {
      setPlatformSettingsError('Platform fee must be between 0 and 99.99%')
      return
    }
    setPlatformSettingsSaving(true)
    setPlatformSettingsError(null)
    setPlatformSettingsSuccess(null)
    try {
      const response = await api.updatePlatformSettings([
        { key: 'equipment_platform_fee_percentage', value: String(n), type: 'number' },
      ])
      if (response.success) {
        setPlatformSettingsSuccess(`Equipment & parts platform fee set to ${n}%`)
        setTimeout(() => setPlatformSettingsSuccess(null), 3000)
      }
    } catch (err: any) {
      setPlatformSettingsError(err.message || 'Failed to update setting')
    } finally {
      setPlatformSettingsSaving(false)
    }
  }

  const toggleListingPaymentRequired = async () => {
    const newValue = !listingPaymentRequired
    setPlatformSettingsSaving(true)
    setPlatformSettingsError(null)
    setPlatformSettingsSuccess(null)

    try {
      const response = await api.updatePlatformSettings([
        { key: 'listing_payment_required', value: String(newValue), type: 'boolean' }
      ])
      if (response.success) {
        setListingPaymentRequired(newValue)
        setPlatformSettingsSuccess(`Listing payment ${newValue ? 'enabled' : 'disabled'} successfully`)
        setTimeout(() => setPlatformSettingsSuccess(null), 3000)
      }
    } catch (err: any) {
      setPlatformSettingsError(err.message || 'Failed to update setting')
    } finally {
      setPlatformSettingsSaving(false)
    }
  }

  const loadNotificationSettings = async () => {
    setNotificationLoading(true)
    setNotificationError(null)
    try {
      const response = await api.getNotificationSettings()
      if (response.success && response.data) {
        setNotificationSettings({
          admin_notification_emails: response.data.admin_notification_emails || '',
          notify_new_users: response.data.notify_new_users !== 'false',
          notify_new_inquiries: response.data.notify_new_inquiries !== 'false',
          notify_new_transactions: response.data.notify_new_transactions !== 'false',
          notify_disputes: response.data.notify_disputes !== 'false',
          notify_consultations: response.data.notify_consultations !== 'false',
        })
      }
    } catch (err: any) {
      setNotificationError(err.message || 'Failed to load notification settings')
    } finally {
      setNotificationLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setNotificationSaving(true)
    setNotificationError(null)
    setNotificationSuccess(null)
    try {
      const settingsToSave = {
        admin_notification_emails: notificationSettings.admin_notification_emails,
        notify_new_users: notificationSettings.notify_new_users.toString(),
        notify_new_inquiries: notificationSettings.notify_new_inquiries.toString(),
        notify_new_transactions: notificationSettings.notify_new_transactions.toString(),
        notify_disputes: notificationSettings.notify_disputes.toString(),
        notify_consultations: notificationSettings.notify_consultations.toString(),
      }
      await api.updateNotificationSettings(settingsToSave)
      setNotificationSuccess('Notification settings saved successfully!')
      setTimeout(() => setNotificationSuccess(null), 3000)
    } catch (err: any) {
      setNotificationError(err.message || 'Failed to save notification settings')
    } finally {
      setNotificationSaving(false)
    }
  }

  const toggleNotificationSetting = (key: keyof Omit<NotificationSettings, 'admin_notification_emails'>) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const loadPricingConfig = async () => {
    setPricingLoading(true)
    setPricingError(null)
    try {
      const response = await api.getPricingConfig()
      if (response.success && response.data) {
        setPricingConfig(response.data)
      }
    } catch (err: any) {
      setPricingError(err.message || 'Failed to load pricing configuration')
    } finally {
      setPricingLoading(false)
    }
  }

  const savePricingConfig = async () => {
    if (!pricingConfig) return
    setPricingSaving(true)
    setPricingError(null)
    try {
      await api.updatePricingConfig(pricingConfig)
      alert('Pricing configuration saved successfully!')
    } catch (err: any) {
      setPricingError(err.message || 'Failed to save pricing configuration')
    } finally {
      setPricingSaving(false)
    }
  }

  const updateSubscriptionPlan = (
    planKey: 'starter' | 'premium' | 'enterprise' | 'vip_access',
    field: keyof SubscriptionPlanConfig,
    value: string | number | string[]
  ) => {
    if (!pricingConfig) return
    setPricingConfig({
      ...pricingConfig,
      subscriptionPlans: {
        ...pricingConfig.subscriptionPlans,
        [planKey]: {
          ...pricingConfig.subscriptionPlans[planKey],
          [field]: value,
        },
      },
    })
  }

  const updatePlatformFee = (field: keyof PricingConfig['platformFees'], value: number) => {
    if (!pricingConfig) return
    setPricingConfig({
      ...pricingConfig,
      platformFees: {
        ...pricingConfig.platformFees,
        [field]: value,
      },
    })
  }

  const updateCreditPack = (index: number, field: keyof CreditPack, value: string | number) => {
    if (!pricingConfig) return
    const updatedPacks = [...pricingConfig.creditPacks]
    updatedPacks[index] = { ...updatedPacks[index], [field]: value }
    setPricingConfig({
      ...pricingConfig,
      creditPacks: updatedPacks,
    })
  }

  const addCreditPack = () => {
    if (!pricingConfig) return
    const newPack: CreditPack = {
      id: `pack_${Date.now()}`,
      credits: 5,
      price: 19.99,
      stripePriceId: '',
    }
    setPricingConfig({
      ...pricingConfig,
      creditPacks: [...pricingConfig.creditPacks, newPack],
    })
  }

  const removeCreditPack = (index: number) => {
    if (!pricingConfig) return
    const updatedPacks = pricingConfig.creditPacks.filter((_, i) => i !== index)
    setPricingConfig({
      ...pricingConfig,
      creditPacks: updatedPacks,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Mock Stripe account data
  const stripeAccount = {
    id: 'acct_1234567890',
    email: 'admin@domilea.com',
    businessName: 'Domilea LLC',
    status: 'active',
    balance: 45750.00,
    pendingBalance: 12350.00,
    lastPayout: '2024-01-15',
    payoutSchedule: 'Daily',
    currency: 'USD'
  }

  // Mock transactions data
  const transactions = [
    {
      id: 'txn_001',
      type: 'payment',
      description: 'MC Authority Purchase - MC #789012',
      amount: 15000.00,
      fee: 465.00,
      net: 14535.00,
      status: 'completed',
      customer: 'John Smith',
      date: '2024-01-15 14:32:00',
      paymentMethod: 'card'
    },
    {
      id: 'txn_002',
      type: 'payment',
      description: 'MC Authority Purchase - MC #345678',
      amount: 8500.00,
      fee: 276.50,
      net: 8223.50,
      status: 'completed',
      customer: 'Sarah Johnson',
      date: '2024-01-15 11:15:00',
      paymentMethod: 'card'
    },
    {
      id: 'txn_003',
      type: 'payout',
      description: 'Payout to Bank Account ****4567',
      amount: -25000.00,
      fee: 0,
      net: -25000.00,
      status: 'completed',
      customer: 'Domilea LLC',
      date: '2024-01-14 09:00:00',
      paymentMethod: 'bank'
    },
    {
      id: 'txn_004',
      type: 'payment',
      description: 'Premium Listing Fee - MC #901234',
      amount: 500.00,
      fee: 14.80,
      net: 485.20,
      status: 'pending',
      customer: 'Mike Wilson',
      date: '2024-01-15 16:45:00',
      paymentMethod: 'card'
    },
    {
      id: 'txn_005',
      type: 'refund',
      description: 'Refund - MC #123456 (Cancelled)',
      amount: -3500.00,
      fee: 0,
      net: -3500.00,
      status: 'completed',
      customer: 'Emily Davis',
      date: '2024-01-13 10:20:00',
      paymentMethod: 'card'
    },
    {
      id: 'txn_006',
      type: 'payment',
      description: 'Credit Package - 50 Credits',
      amount: 250.00,
      fee: 7.55,
      net: 242.45,
      status: 'failed',
      customer: 'Robert Brown',
      date: '2024-01-15 08:30:00',
      paymentMethod: 'card'
    }
  ]

  const filteredTransactions = transactions.filter(txn => {
    const matchesFilter = transactionFilter === 'all' || txn.status === transactionFilter
    const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    totalRevenue: 158450.00,
    monthlyRevenue: 45750.00,
    totalFees: 4825.50,
    totalPayouts: 95000.00
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Admin Settings</h1>
          <p className="text-gray-500">Manage platform settings and financial integrations</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'bg-primary-500 text-gray-900'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'finance'
                ? 'bg-primary-500 text-gray-900'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Finance & Stripe
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-primary-500 text-gray-900'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-primary-500 text-gray-900'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'pricing'
                ? 'bg-primary-500 text-gray-900'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            Pricing
          </button>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Export User Emails</h2>
                  <p className="text-sm text-gray-500">
                    Download a CSV of every user's email with name, phone, role, company, and subscription.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={emailExportRole}
                    onChange={(e) => setEmailExportRole(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary-500"
                  >
                    <option value="ALL">All users</option>
                    <option value="BUYER">Buyers</option>
                    <option value="SELLER">Sellers</option>
                    <option value="COMPLIANCE_MANAGER">Compliance</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                  <Button onClick={handleExportEmails} disabled={emailExporting}>
                    <Download className="w-4 h-4 mr-2" />
                    {emailExporting ? 'Exporting...' : 'Download CSV'}
                  </Button>
                </div>
              </div>
              {emailExportError && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {emailExportError}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-xl font-bold mb-4">Platform Settings</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform Name</label>
                    <input
                      type="text"
                      defaultValue="Domilea"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Support Email</label>
                    <input
                      type="email"
                      defaultValue="support@domilea.com"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Platform Description</label>
                  <textarea
                    defaultValue="The trusted marketplace for buying and selling MC Authorities"
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Listing Fee (%)</label>
                    <input
                      type="number"
                      defaultValue="3"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Premium Listing Price ($)</label>
                    <input
                      type="number"
                      defaultValue="500"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Credit Price ($)</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold mb-4">Site Features</h2>

              {/* Platform Settings Messages */}
              {platformSettingsError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {platformSettingsError}
                </div>
              )}
              {platformSettingsSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  {platformSettingsSuccess}
                </div>
              )}

              <div className="space-y-4">
                {/* Listing Payment Toggle - Dynamic */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-primary-200">
                  <div>
                    <span className="font-medium">Require Listing Payment</span>
                    <p className="text-sm text-gray-500">When enabled, sellers must pay the listing fee before submitting</p>
                  </div>
                  <button
                    onClick={toggleListingPaymentRequired}
                    disabled={platformSettingsSaving || platformSettingsLoading}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      listingPaymentRequired ? 'bg-primary-500' : 'bg-gray-300'
                    } ${platformSettingsSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      listingPaymentRequired ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Equipment & parts platform fee */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border-2 border-primary-200">
                  <div>
                    <span className="font-medium">Equipment &amp; Parts Platform Fee</span>
                    <p className="text-sm text-gray-500">Percentage kept from each truck, trailer or part sale; the rest is paid to the seller</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        step="0.5"
                        value={equipmentFeePct}
                        onChange={(e) => setEquipmentFeePct(e.target.value)}
                        className="w-24 pl-3 pr-7 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                    </div>
                    <button
                      onClick={saveEquipmentFee}
                      disabled={platformSettingsSaving || platformSettingsLoading}
                      className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Static feature toggles */}
                {[
                  { label: 'Enable User Registration', enabled: true },
                  { label: 'Enable Premium Listings', enabled: true },
                  { label: 'Enable Credit System', enabled: true },
                  { label: 'Require Email Verification', enabled: true },
                  { label: 'Enable AI Due Diligence', enabled: true },
                  { label: 'Maintenance Mode', enabled: false }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{feature.label}</span>
                    <button
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        feature.enabled ? 'bg-primary-500' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        feature.enabled ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Finance & Stripe Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Stripe Connection Status */}
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Stripe Integration</h2>
                  <p className="text-gray-500 text-sm">Manage your payment processing connection</p>
                </div>
                {stripeConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-trust-high/20 border border-trust-high/30">
                    <CheckCircle className="w-4 h-4 text-trust-high" />
                    <span className="text-sm font-medium text-trust-high">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Not Connected</span>
                  </div>
                )}
              </div>

              {stripeConnected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Account ID</div>
                      <div className="font-mono text-sm">{stripeAccount.id}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Business Name</div>
                      <div className="font-semibold">{stripeAccount.businessName}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Payout Schedule</div>
                      <div className="font-semibold">{stripeAccount.payoutSchedule}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Last Payout</div>
                      <div className="font-semibold">{stripeAccount.lastPayout}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Stripe Dashboard
                    </Button>
                    <Button variant="ghost" className="text-red-400 hover:bg-red-400/10">
                      Disconnect Account
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 text-gray-900/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your Stripe Account</h3>
                  <p className="text-gray-500 mb-4">Link your Stripe account to start processing payments</p>
                  <Button onClick={() => setStripeConnected(true)}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </Button>
                </div>
              )}
            </Card>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8 text-trust-high" />
                    <TrendingUp className="w-4 h-4 text-trust-high" />
                  </div>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-8 h-8 text-primary-400" />
                    <TrendingUp className="w-4 h-4 text-trust-high" />
                  </div>
                  <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">This Month</div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold">${stats.totalFees.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Processing Fees</div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold">${stats.totalPayouts.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Payouts</div>
                </Card>
              </motion.div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-trust-high">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Available Balance</div>
                    <div className="text-3xl font-bold text-trust-high">
                      ${stripeAccount.balance.toLocaleString()}
                    </div>
                  </div>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Payout Now
                  </Button>
                </div>
              </Card>

              <Card className="border-l-4 border-l-yellow-400">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Pending Balance</div>
                    <div className="text-3xl font-bold text-yellow-400">
                      ${stripeAccount.pendingBalance.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Available in 2-3 days
                  </div>
                </div>
              </Card>
            </div>

            {/* Transactions */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Transactions</h2>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'completed', 'pending', 'failed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTransactionFilter(filter)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        transactionFilter === filter
                          ? 'bg-primary-500 text-gray-900'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Transaction</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Fee</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Net</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-white/5 hover:bg-white">
                        <td className="py-3 px-2">
                          <div className="font-medium text-sm">{txn.description}</div>
                          <div className="text-xs text-gray-400 font-mono">{txn.id}</div>
                        </td>
                        <td className="py-3 px-2 text-sm">{txn.customer}</td>
                        <td className="py-3 px-2 text-sm text-gray-500">{txn.date}</td>
                        <td className={`py-3 px-2 text-sm text-right font-medium ${
                          txn.amount >= 0 ? 'text-trust-high' : 'text-red-400'
                        }`}>
                          {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-sm text-right text-gray-500">
                          ${txn.fee.toLocaleString()}
                        </td>
                        <td className={`py-3 px-2 text-sm text-right font-medium ${
                          txn.net >= 0 ? 'text-gray-900' : 'text-red-400'
                        }`}>
                          {txn.net >= 0 ? '+' : ''}${Math.abs(txn.net).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            txn.status === 'completed'
                              ? 'bg-trust-high/20 text-trust-high'
                              : txn.status === 'pending'
                              ? 'bg-yellow-400/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions found
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {notificationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {notificationError}
              </div>
            )}

            {notificationSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {notificationSuccess}
              </div>
            )}

            {notificationLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Admin Email Configuration */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">Admin Notification Emails</h2>
                      <p className="text-sm text-gray-500">Configure email addresses that will receive admin notifications</p>
                    </div>
                    <Button onClick={saveNotificationSettings} disabled={notificationSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {notificationSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Addresses</label>
                      <Input
                        type="text"
                        value={notificationSettings.admin_notification_emails}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          admin_notification_emails: e.target.value
                        }))}
                        placeholder="admin@example.com, support@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter multiple email addresses separated by commas. All admin notifications will be sent to these addresses.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Admin Notification Toggles */}
                <Card>
                  <h2 className="text-xl font-bold mb-4">Admin Notification Types</h2>
                  <p className="text-sm text-gray-500 mb-4">Choose which events trigger email notifications to admin addresses</p>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'notify_new_users' as const,
                        label: 'New User Registration',
                        description: 'Get notified when a new user (buyer or seller) registers on the platform'
                      },
                      {
                        key: 'notify_new_inquiries' as const,
                        label: 'New Inquiries & Messages',
                        description: 'Get notified when users send inquiries or contact messages'
                      },
                      {
                        key: 'notify_new_transactions' as const,
                        label: 'Transaction Updates',
                        description: 'Get notified when transactions are created or change status'
                      },
                      {
                        key: 'notify_disputes' as const,
                        label: 'Account Disputes & Blocks',
                        description: 'Get notified when users are blocked or submit dispute requests'
                      },
                      {
                        key: 'notify_consultations' as const,
                        label: 'Consultation Requests',
                        description: 'Get notified when users request a consultation with a representative'
                      },
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{notification.label}</div>
                          <div className="text-sm text-gray-500">{notification.description}</div>
                        </div>
                        <button
                          onClick={() => toggleNotificationSetting(notification.key)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notificationSettings[notification.key] ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            notificationSettings[notification.key] ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-4">Security Settings</h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Two-Factor Authentication</div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-trust-high/20 text-trust-high">Enabled</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your admin account</p>
                  <Button variant="secondary" size="sm">Manage 2FA</Button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-2">Change Password</div>
                  <p className="text-sm text-gray-500 mb-3">Update your admin password regularly for security</p>
                  <Button variant="secondary" size="sm">Update Password</Button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-2">Active Sessions</div>
                  <p className="text-sm text-gray-500 mb-3">View and manage your active login sessions</p>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm">Chrome on MacOS</div>
                          <div className="text-xs text-gray-400">Current session</div>
                        </div>
                      </div>
                      <span className="text-xs text-trust-high">Active now</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-red-500/30">
                  <div className="font-medium text-red-400 mb-2">Danger Zone</div>
                  <p className="text-sm text-gray-500 mb-3">Irreversible actions that affect the entire platform</p>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10">
                      Reset All User Sessions
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10">
                      Export All Data
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {pricingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {pricingError}
              </div>
            )}

            {pricingLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : pricingConfig ? (
              <>
                {/* Subscription Plans */}
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Subscription Plans</h2>
                    <Button onClick={savePricingConfig} disabled={pricingSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {pricingSaving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {(['starter', 'premium', 'enterprise', 'vip_access'] as const).map((planKey) => {
                      const plan = pricingConfig.subscriptionPlans[planKey]
                      return (
                        <div key={planKey} className="p-4 bg-gray-50 rounded-lg">
                          <h3 className="text-lg font-semibold mb-4 capitalize">{plan.name} Plan</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Credits per Month</label>
                              <Input
                                type="number"
                                value={plan.credits}
                                onChange={(e) => updateSubscriptionPlan(planKey, 'credits', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Monthly Price ($)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={plan.priceMonthly}
                                onChange={(e) => updateSubscriptionPlan(planKey, 'priceMonthly', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Yearly Price ($)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={plan.priceYearly}
                                onChange={(e) => updateSubscriptionPlan(planKey, 'priceYearly', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Stripe Monthly Price ID</label>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  value={plan.stripePriceIdMonthly}
                                  onChange={(e) => updateSubscriptionPlan(planKey, 'stripePriceIdMonthly', e.target.value)}
                                  placeholder="price_xxx..."
                                  className="flex-1"
                                />
                                {plan.stripePriceIdMonthly && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(plan.stripePriceIdMonthly)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Stripe Yearly Price ID</label>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  value={plan.stripePriceIdYearly}
                                  onChange={(e) => updateSubscriptionPlan(planKey, 'stripePriceIdYearly', e.target.value)}
                                  placeholder="price_xxx..."
                                  className="flex-1"
                                />
                                {plan.stripePriceIdYearly && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(plan.stripePriceIdYearly)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Platform Fees */}
                <Card>
                  <h2 className="text-xl font-bold mb-6">Platform Fees</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Listing Fee ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pricingConfig.platformFees.listingFee}
                        onChange={(e) => updatePlatformFee('listingFee', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Fee to list an MC authority</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Premium Listing Fee ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pricingConfig.platformFees.premiumListingFee}
                        onChange={(e) => updatePlatformFee('premiumListingFee', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Fee for premium listing placement</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Transaction Fee (%)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pricingConfig.platformFees.transactionFeePercentage}
                        onChange={(e) => updatePlatformFee('transactionFeePercentage', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Percentage of sale price</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Deposit (%)</label>
                      <Input
                        type="number"
                        step="1"
                        value={pricingConfig.platformFees.depositPercentage}
                        onChange={(e) => updatePlatformFee('depositPercentage', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Deposit percentage of agreed price</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Deposit ($)</label>
                      <Input
                        type="number"
                        value={pricingConfig.platformFees.minDeposit}
                        onChange={(e) => updatePlatformFee('minDeposit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Deposit ($)</label>
                      <Input
                        type="number"
                        value={pricingConfig.platformFees.maxDeposit}
                        onChange={(e) => updatePlatformFee('maxDeposit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Consultation Fee ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pricingConfig.platformFees.consultationFee || 100}
                        onChange={(e) => updatePlatformFee('consultationFee', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Fee for Talk to Rep consultations</p>
                    </div>
                  </div>
                </Card>

                {/* Credit Packs */}
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold">Credit Packs</h2>
                      <p className="text-sm text-gray-500">One-time credit purchases for buyers</p>
                    </div>
                    <Button variant="secondary" onClick={addCreditPack}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pack
                    </Button>
                  </div>

                  {pricingConfig.creditPacks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No credit packs configured. Click "Add Pack" to create one.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pricingConfig.creditPacks.map((pack, index) => (
                        <div key={pack.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Pack {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCreditPack(index)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Credits</label>
                              <Input
                                type="number"
                                value={pack.credits}
                                onChange={(e) => updateCreditPack(index, 'credits', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Price ($)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={pack.price}
                                onChange={(e) => updateCreditPack(index, 'price', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium mb-1">Stripe Price ID</label>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  value={pack.stripePriceId}
                                  onChange={(e) => updateCreditPack(index, 'stripePriceId', e.target.value)}
                                  placeholder="price_xxx..."
                                  className="flex-1"
                                />
                                {pack.stripePriceId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(pack.stripePriceId)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Stripe Dashboard Link */}
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Stripe Dashboard</h2>
                      <p className="text-sm text-gray-500">Create and manage prices in Stripe, then paste Price IDs here</p>
                    </div>
                    <a
                      href="https://dashboard.stripe.com/products"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white rounded-lg hover:bg-[#5851DB] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Stripe Dashboard
                    </a>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Failed to load pricing configuration. Please try again.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSettingsPage
