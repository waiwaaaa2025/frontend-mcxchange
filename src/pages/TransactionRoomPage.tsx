import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Building2,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Upload,
  Download,
  Send,
  AlertCircle,
  X,
  User,
  Crown,
  Lock,
  Unlock,
  Eye,
  CreditCard,
  ArrowRight,
  Check,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  Truck,
  Phone,
  Mail,
  Globe,
  Award,
  AlertTriangle,
  Package,
  Star,
  Hash,
  Briefcase,
  FileCheck,
  Scale,
  Banknote,
  Receipt,
  Info,
  ArrowLeft,
  BadgeCheck,
  ClipboardCheck,
  History,
  UserCheck,
  Target,
  Layers,
  ExternalLink,
  ShieldCheck,
  ScrollText,
  Handshake,
  CircleDollarSign,
  CheckCheck,
  EyeOff,
  Settings,
  Plus,
  Trash2,
  Copy,
  KeyRound,
  Circle,
  Pencil,
  Search,
  UserCog,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import AgreementApprovalPanel from '../components/AgreementApprovalPanel'
import { useAuth } from '../context/AuthContext'
import { TransactionRoom, TransactionStatus, TransactionMessage, TransactionDocument, TransactionCredential } from '../types'
import { REQUIRED_DOCUMENTS } from '../constants/documents'
import api from '../services/api'
import toast from 'react-hot-toast'

// Transaction workflow steps for buyer
type BuyerStep =
  | 'confirm-intent'      // Step 1: Confirm purchase intent
  | 'terms-agreement'     // Step 2: Accept terms & disclaimer
  | 'deposit-payment'     // Step 3: Pay deposit via Stripe
  | 'awaiting-admin'      // Step 4: Wait for admin approval
  | 'bill-of-sale'        // Step 5: Review & approve bill of sale
  | 'final-payment'       // Step 6: Pay remaining balance
  | 'completed'           // Step 7: Transaction complete

const TransactionRoomPage = () => {
  const { transactionId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<'timeline' | 'parties' | 'business' | 'documents' | 'messages'>('timeline')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [approving, setApproving] = useState(false)
  const [releasingPayout, setReleasingPayout] = useState(false)
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<'standard' | 'instant'>('standard')
  const [instantEligible, setInstantEligible] = useState(false)
  const [instantEligibleReason, setInstantEligibleReason] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDocumentPreview, setShowDocumentPreview] = useState<string | null>(null)

  // Document upload type tracking
  const [uploadDocType, setUploadDocType] = useState<string>('OTHER')

  // Credential vault state
  const [credentials, setCredentials] = useState<TransactionCredential[]>([])
  const [showCredentialForm, setShowCredentialForm] = useState(false)
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null)
  const [credentialForm, setCredentialForm] = useState({ label: '', username: '', password: '' })
  const [credentialSaving, setCredentialSaving] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  // Buyer workflow state
  const [buyerStep, setBuyerStep] = useState<BuyerStep>('confirm-intent')
  const [intentConfirmed, setIntentConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [depositPolicyAccepted, setDepositPolicyAccepted] = useState(false)
  const [finalPaymentPolicyAccepted, setFinalPaymentPolicyAccepted] = useState(false)
  const [noDisputePolicyAccepted, setNoDisputePolicyAccepted] = useState(false)
  const [contactSellerPolicyAccepted, setContactSellerPolicyAccepted] = useState(false)
  const [marketingAgencyPolicyAccepted, setMarketingAgencyPolicyAccepted] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [customDepositAmount, setCustomDepositAmount] = useState('1000')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [billingName, setBillingName] = useState('')

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'zelle'>('card')
  const [zelleSentConfirmed, setZelleSentConfirmed] = useState(false)

  // Loading state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminActionLoading, setAdminActionLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)

  // Admin contract file state
  const [adminContractFile, setAdminContractFile] = useState<File | null>(null)

  // Admin party reassignment state
  const [reassignRole, setReassignRole] = useState<'buyer' | 'seller' | null>(null)
  const [reassignQuery, setReassignQuery] = useState('')
  const [reassignResults, setReassignResults] = useState<Array<{ id: string; name: string; email: string; companyName?: string }>>([])
  const [reassignSearching, setReassignSearching] = useState(false)
  const [reassignSubmitting, setReassignSubmitting] = useState(false)

  // Purchase agreement state
  const [agreementUploading, setAgreementUploading] = useState(false)
  const [signedCopyUploading, setSignedCopyUploading] = useState(false)

  // Final payment flow state
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<'ZELLE' | 'WIRE'>('ZELLE')
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [submittingFinalPayment, setSubmittingFinalPayment] = useState(false)

  // FMCSA verified data state
  const [fmcsaData, setFmcsaData] = useState<{
    dotNumber: string
    legalName: string
    dbaName?: string
    carrierOperation: string
    hqCity: string
    hqState: string
    physicalAddress: string
    phone: string
    safetyRating: string
    safetyRatingDate?: string
    totalDrivers: number
    totalPowerUnits: number
    mcs150Date?: string
    allowedToOperate: string
    bipdRequired: number
    cargoRequired: number
    bondRequired: number
    insuranceOnFile: boolean
    bipdOnFile: number
    cargoOnFile: number
    bondOnFile: number
    verified: boolean
    verifiedAt?: Date
  } | null>(null)

  // Authority history state (from FMCSA)
  const [authorityHistory, setAuthorityHistory] = useState<{
    commonAuthorityStatus: string
    commonAuthorityGrantDate?: string
    commonAuthorityReinstatedDate?: string
    commonAuthorityRevokedDate?: string
    contractAuthorityStatus: string
    contractAuthorityGrantDate?: string
    brokerAuthorityStatus: string
    brokerAuthorityGrantDate?: string
  } | null>(null)

  // Insurance history state (from FMCSA)
  const [insuranceHistory, setInsuranceHistory] = useState<Array<{
    insurerName: string
    policyNumber: string
    insuranceType: string
    coverageAmount: number
    effectiveDate: string
    cancellationDate?: string
    status: string
  }>>([])

  // Listing-specific data state
  const [listingData, setListingData] = useState<{
    mcNumber: string
    dotNumber: string
    legalName: string
    dbaName?: string
    city: string
    state: string
    address?: string
    yearsActive: number
    fleetSize: number
    totalDrivers: number
    safetyRating: string
    saferScore?: string
    insuranceOnFile: boolean
    bipdCoverage?: number
    cargoCoverage?: number
    bondAmount?: number
    amazonStatus: string
    amazonRelayScore?: string
    highwaySetup: boolean
    sellingWithEmail: boolean
    sellingWithPhone: boolean
    contactEmail?: string
    contactPhone?: string
    cargoTypes: string[]
  } | null>(null)

  // Comprehensive mock transaction data
  const [transaction, setTransaction] = useState<TransactionRoom & {
    businessDetails: {
      legalName: string
      dba: string
      einNumber: string
      dotNumber: string
      mcNumber: string
      businessAddress: string
      mailingAddress: string
      phoneNumber: string
      faxNumber: string
      email: string
      website: string
      entityType: string
      stateOfIncorporation: string
      dateEstablished: Date
      operatingStatus: string
      cargoTypes: string[]
      operationClassification: string[]
      equipmentTypes: string[]
      radius: string
      hazmatCertified: boolean
      bondedCarrier: boolean
    }
    safetyRecord: {
      saferScore: string
      crashRate: number
      inspectionRate: number
      outOfServiceRate: number
      driverOutOfServiceRate: number
      hazmatOutOfServiceRate: number
      lastInspectionDate: Date
      totalInspections: number
      totalCrashes: number
      fatalCrashes: number
      injuryCrashes: number
      towCrashes: number
      basicScores: {
        unsafeDriving: number
        hoursOfService: number
        driverFitness: number
        controlledSubstances: number
        vehicleMaintenance: number
        hazmatCompliance: number
      }
    }
    insuranceInfo: {
      liabilityInsurance: {
        provider: string
        policyNumber: string
        coverage: number
        expirationDate: Date
        status: string
      }
      cargoInsurance: {
        provider: string
        policyNumber: string
        coverage: number
        expirationDate: Date
        status: string
      }
      bondInfo: {
        type: string
        amount: number
        status: string
      }
    }
    financialHistory: {
      annualRevenue: number
      avgMonthlyLoads: number
      avgRatePerMile: number
      fuelCosts: number
      maintenanceCosts: number
      insuranceCosts: number
      outstandingDebts: number
      uccFilings: {
        id: string
        filingDate: Date
        securedParty: string
        amount: number
        status: string
      }[]
    }
    platformIntegrations: {
      amazonRelay: {
        status: string
        score: string
        loads: number
        rating: number
        memberSince: Date
      }
      highway: {
        status: string
        factoring: boolean
        quickPay: boolean
        setupDate: Date
      }
      dat: {
        status: string
        rating: number
      }
    }
    transferItems: {
      mcAuthority: boolean
      dotNumber: boolean
      emailAccounts: string[]
      phoneNumbers: string[]
      amazonRelayAccount: boolean
      highwayAccount: boolean
      factoringAgreements: boolean
      existingContracts: {
        name: string
        type: string
        transferable: boolean
      }[]
      equipment: {
        type: string
        quantity: number
        included: boolean
      }[]
    }
    driverHistory: {
      totalDrivers: number
      currentDrivers: number
      driverTurnoverRate: number
      drugTestCompliance: boolean
      lastDrugTestDate: Date
      driverQualificationFiles: boolean
      driversWithViolations: number
    }
    sellerInfo: {
      contactName: string
      contactTitle: string
      contactPhone: string
      contactEmail: string
      reasonForSelling: string
      yearsOwned: number
      transitionSupport: boolean
      transitionSupportDays: number
      sellerNotes: string
      responseTime: string
      verificationStatus: 'verified' | 'pending' | 'unverified'
      previousSales: number
      completedDeals: number
    }
    buyerInfo: {
      companyName: string
      contactName: string
      contactTitle: string
      contactPhone: string
      contactEmail: string
      intendedUse: string
      experienceYears: number
      currentMCsOwned: number
      financingStatus: string
      verificationStatus: 'verified' | 'pending' | 'unverified'
      previousPurchases: number
    }
    // Workflow tracking
    workflow: {
      currentStep: BuyerStep
      intentConfirmedAt?: Date
      termsAcceptedAt?: Date
      depositPaidAt?: Date
      depositStripeId?: string
      // Zelle payment tracking
      depositPaymentMethod?: 'card' | 'zelle'
      depositZellePending?: boolean
      depositZelleSentAt?: Date
      depositZelleConfirmedByAdmin?: boolean
      depositZelleConfirmedAt?: Date
      // Final payment Zelle tracking
      finalPaymentMethod?: 'card' | 'zelle'
      finalPaymentZellePending?: boolean
      finalPaymentZelleSentAt?: Date
      finalPaymentZelleConfirmedByAdmin?: boolean
      finalPaymentZelleConfirmedAt?: Date
      adminApprovedDepositAt?: Date
      billOfSaleGeneratedAt?: Date
      buyerApprovedBillOfSaleAt?: Date
      sellerApprovedBillOfSaleAt?: Date
      adminApprovedBillOfSaleAt?: Date
      finalPaymentPaidAt?: Date
      finalPaymentStripeId?: string
      completedAt?: Date
    }
  }>({
    id: transactionId || '',
    offerId: '',
    offer: {} as any,
    listingId: '',
    listing: {
      id: '',
      mcNumber: '',
      title: '',
      description: '',
      price: 0,
      yearsActive: 0,
      operationType: [],
      fleetSize: 0,
      safetyRating: '',
      insuranceStatus: '',
      state: '',
      amazonStatus: 'none',
      amazonRelayScore: null,
      highwaySetup: false,
      sellingWithEmail: false,
      sellingWithPhone: false,
      trustScore: 0,
      verified: false
    } as any,
    buyerId: '',
    buyer: {
      id: '',
      name: '',
      email: '',
      phone: '',
      trustScore: 0,
      verified: false,
      completedDeals: 0
    } as any,
    sellerId: '',
    seller: {
      id: '',
      name: '',
      email: '',
      phone: '',
      trustScore: 0,
      verified: false,
      completedDeals: 0
    } as any,
    status: 'awaiting-deposit',
    buyerApproved: false,
    sellerApproved: false,
    adminApproved: false,
    agreedPrice: 0,
    depositAmount: 0,
    depositPaid: false,
    depositPaidAt: undefined as any,
    finalPaymentAmount: 0,
    finalPaymentPaid: false,
    escrowStatus: null as string | null,
    escrowAmount: null as number | null,
    escrowConfirmedAt: null as Date | null,
    escrowPaymentMethod: null as string | null,
    sellerDocuments: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    businessDetails: {
      legalName: '',
      dba: '',
      einNumber: '',
      dotNumber: '',
      mcNumber: '',
      businessAddress: '',
      mailingAddress: '',
      phoneNumber: '',
      faxNumber: '',
      email: '',
      website: '',
      entityType: '',
      stateOfIncorporation: '',
      dateEstablished: undefined as any,
      operatingStatus: '',
      cargoTypes: [],
      operationClassification: [],
      equipmentTypes: [],
      radius: '',
      hazmatCertified: false,
      bondedCarrier: false
    },
    safetyRecord: {
      saferScore: '',
      crashRate: 0,
      inspectionRate: 0,
      outOfServiceRate: 0,
      driverOutOfServiceRate: 0,
      hazmatOutOfServiceRate: 0,
      lastInspectionDate: undefined as any,
      totalInspections: 0,
      totalCrashes: 0,
      fatalCrashes: 0,
      injuryCrashes: 0,
      towCrashes: 0,
      basicScores: {
        unsafeDriving: 0,
        hoursOfService: 0,
        driverFitness: 0,
        controlledSubstances: 0,
        vehicleMaintenance: 0,
        hazmatCompliance: 0
      }
    },
    insuranceInfo: {
      liabilityInsurance: {
        provider: '',
        policyNumber: '',
        coverage: 0,
        expirationDate: undefined as any,
        status: ''
      },
      cargoInsurance: {
        provider: '',
        policyNumber: '',
        coverage: 0,
        expirationDate: undefined as any,
        status: ''
      },
      bondInfo: {
        type: '',
        amount: 0,
        status: ''
      }
    },
    financialHistory: {
      annualRevenue: 0,
      avgMonthlyLoads: 0,
      avgRatePerMile: 0,
      fuelCosts: 0,
      maintenanceCosts: 0,
      insuranceCosts: 0,
      outstandingDebts: 0,
      uccFilings: []
    },
    platformIntegrations: {
      amazonRelay: {
        status: 'None',
        score: '',
        loads: 0,
        rating: 0,
        memberSince: undefined as any
      },
      highway: {
        status: 'None',
        factoring: false,
        quickPay: false,
        setupDate: undefined as any
      },
      dat: {
        status: 'None',
        rating: 0
      }
    },
    transferItems: {
      mcAuthority: false,
      dotNumber: false,
      emailAccounts: [],
      phoneNumbers: [],
      amazonRelayAccount: false,
      highwayAccount: false,
      factoringAgreements: false,
      existingContracts: [],
      equipment: []
    },
    driverHistory: {
      totalDrivers: 0,
      currentDrivers: 0,
      driverTurnoverRate: 0,
      drugTestCompliance: false,
      lastDrugTestDate: undefined as any,
      driverQualificationFiles: false,
      driversWithViolations: 0
    },
    sellerInfo: {
      contactName: '',
      contactTitle: '',
      contactPhone: '',
      contactEmail: '',
      reasonForSelling: '',
      yearsOwned: 0,
      transitionSupport: false,
      transitionSupportDays: 0,
      sellerNotes: '',
      responseTime: '',
      verificationStatus: 'pending',
      previousSales: 0,
      completedDeals: 0
    },
    buyerInfo: {
      companyName: '',
      contactName: '',
      contactTitle: '',
      contactPhone: '',
      contactEmail: '',
      intendedUse: '',
      experienceYears: 0,
      currentMCsOwned: 0,
      financingStatus: '',
      verificationStatus: 'pending',
      previousPurchases: 0
    },
    workflow: {
      currentStep: 'confirm-intent' as BuyerStep,
      intentConfirmedAt: undefined,
      termsAcceptedAt: undefined,
      depositPaidAt: undefined,
      depositStripeId: undefined,
      adminApprovedDepositAt: undefined,
      billOfSaleGeneratedAt: undefined,
      buyerApprovedBillOfSaleAt: undefined,
      sellerApprovedBillOfSaleAt: undefined,
      adminApprovedBillOfSaleAt: undefined,
      finalPaymentPaidAt: undefined,
      finalPaymentStripeId: undefined,
      completedAt: undefined
    }
  })

  // Fetch transaction data from API
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) {
        setError('No transaction ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await api.getTransaction(transactionId)
        if (response.success && response.data) {
          const txn = response.data

          // Debug: log the transaction and listing data
          console.log('[TransactionRoomPage] Received transaction data:', txn)
          console.log('[TransactionRoomPage] Listing data:', txn.listing)

          // Map API response to component state structure
          // Convert status from SNAKE_CASE to kebab-case
          const statusMap: Record<string, TransactionStatus> = {
            'AWAITING_DEPOSIT': 'awaiting-deposit',
            'DEPOSIT_RECEIVED': 'deposit-received',
            'IN_REVIEW': 'in-review',
            'BUYER_APPROVED': 'buyer-approved',
            'SELLER_APPROVED': 'seller-approved',
            'BOTH_APPROVED': 'both-approved',
            'ADMIN_FINAL_REVIEW': 'admin-final-review',
            'PAYMENT_PENDING': 'payment-pending',
            'PAYMENT_RECEIVED': 'payment-received',
            'COMPLETED': 'completed',
            'CANCELLED': 'cancelled',
            'DISPUTED': 'disputed',
          }

          const mappedStatus = statusMap[txn.status] || 'in-review'
          console.log('[TransactionRoomPage] Status mapping:', { backendStatus: txn.status, mappedStatus, depositPaidAt: txn.depositPaidAt })

          // Update transaction state with real data while preserving mock structure for extended details
          setTransaction(prev => ({
            ...prev,
            id: txn.id,
            offerId: txn.offerId || prev.offerId,
            offer: txn.offer || prev.offer,
            listingId: txn.listingId || prev.listingId,
            listing: txn.listing ? {
              ...prev.listing,
              id: txn.listing.id,
              mcNumber: txn.listing.mcNumber || prev.listing.mcNumber,
              dotNumber: txn.listing.dotNumber || (prev.listing as any).dotNumber,
              legalName: txn.listing.legalName || (prev.listing as any).legalName,
              dbaName: txn.listing.dbaName || (prev.listing as any).dbaName,
              title: txn.listing.title || prev.listing.title,
              description: txn.listing.description || prev.listing.description,
              price: txn.listing.askingPrice || txn.listing.listingPrice || prev.listing.price,
              yearsActive: txn.listing.yearsActive || prev.listing.yearsActive,
              // Backend has cargoTypes as JSON string, parse and use as operationType
              operationType: txn.listing.cargoTypes
                ? (typeof txn.listing.cargoTypes === 'string'
                    ? JSON.parse(txn.listing.cargoTypes)
                    : txn.listing.cargoTypes)
                : prev.listing.operationType,
              fleetSize: txn.listing.fleetSize || prev.listing.fleetSize,
              // Backend returns UPPERCASE enum, convert to lowercase
              safetyRating: txn.listing.safetyRating?.toLowerCase() || prev.listing.safetyRating,
              // Backend has insuranceOnFile boolean, convert to status string
              insuranceStatus: txn.listing.insuranceOnFile ? 'active' : (txn.listing.insuranceOnFile === false ? 'expired' : prev.listing.insuranceStatus),
              state: txn.listing.state || prev.listing.state,
              city: txn.listing.city || (prev.listing as any).city,
              // Backend returns UPPERCASE enum for amazonStatus
              amazonStatus: txn.listing.amazonStatus?.toLowerCase() || prev.listing.amazonStatus,
              amazonRelayScore: txn.listing.amazonRelayScore || prev.listing.amazonRelayScore,
              highwaySetup: txn.listing.highwaySetup ?? prev.listing.highwaySetup,
              sellingWithEmail: txn.listing.sellingWithEmail ?? prev.listing.sellingWithEmail,
              sellingWithPhone: txn.listing.sellingWithPhone ?? prev.listing.sellingWithPhone,
              trustScore: txn.listing.trustScore || prev.listing.trustScore,
              verified: txn.listing.verified ?? prev.listing.verified,
            } : prev.listing,
            buyerId: txn.buyerId || prev.buyerId,
            buyer: txn.buyer ? {
              ...prev.buyer,
              id: txn.buyer.id,
              name: txn.buyer.name || prev.buyer.name,
              email: txn.buyer.email || prev.buyer.email,
              phone: txn.buyer.phone || (prev.buyer as any).phone,
              trustScore: txn.buyer.trustScore || prev.buyer.trustScore,
              verified: txn.buyer.verified ?? prev.buyer.verified,
              companyName: txn.buyer.companyName,
            } : prev.buyer,
            sellerId: txn.sellerId || prev.sellerId,
            seller: txn.seller ? {
              ...prev.seller,
              id: txn.seller.id,
              name: txn.seller.name || txn.seller.companyName || prev.seller.name,
              email: txn.seller.email || prev.seller.email,
              phone: txn.seller.phone || (prev.seller as any).phone,
              trustScore: txn.seller.trustScore || prev.seller.trustScore,
              verified: txn.seller.verified ?? prev.seller.verified,
              companyName: txn.seller.companyName,
            } : prev.seller,
            status: mappedStatus,
            buyerApproved: txn.buyerApproved ?? prev.buyerApproved,
            sellerApproved: txn.sellerApproved ?? prev.sellerApproved,
            adminApproved: txn.adminApproved ?? prev.adminApproved,
            agreedPrice: txn.agreedPrice || prev.agreedPrice,
            depositAmount: txn.depositAmount || prev.depositAmount,
            depositPaid: !!txn.depositPaidAt,
            depositPaidAt: txn.depositPaidAt ? new Date(txn.depositPaidAt) : prev.depositPaidAt,
            finalPaymentAmount: txn.finalPaymentAmount || (txn.agreedPrice - (txn.depositAmount || 0)) || prev.finalPaymentAmount,
            finalPaymentPaid: !!txn.finalPaymentPaidAt,
            escrowStatus: txn.escrowStatus || prev.escrowStatus,
            escrowAmount: txn.escrowAmount ? Number(txn.escrowAmount) : prev.escrowAmount,
            escrowConfirmedAt: txn.escrowConfirmedAt ? new Date(txn.escrowConfirmedAt) : prev.escrowConfirmedAt,
            escrowPaymentMethod: txn.escrowPaymentMethod || prev.escrowPaymentMethod,
            sellerPayout: txn.sellerPayout ? Number(txn.sellerPayout) : prev.sellerPayout,
            payoutStatus: txn.payoutStatus || prev.payoutStatus,
            payoutReleasedAt: txn.payoutReleasedAt ? new Date(txn.payoutReleasedAt) : prev.payoutReleasedAt,
            payoutTransferId: txn.payoutTransferId || prev.payoutTransferId,
            sellerDocuments: txn.documents?.length > 0 ? txn.documents.map((doc: any) => ({
              id: doc.id,
              transactionId: txn.id,
              uploadedBy: doc.uploadedBy || 'seller',
              uploaderId: doc.uploaderId || txn.sellerId,
              name: doc.name || doc.filename,
              type: doc.type || 'document',
              url: doc.url || '#',
              verified: doc.verified || doc.status === 'VERIFIED' || false,
              uploadedAt: new Date(doc.createdAt || doc.uploadedAt),
            })) : prev.sellerDocuments,
            messages: txn.messages?.length > 0 ? txn.messages.map((msg: any) => ({
              id: msg.id,
              transactionId: txn.id,
              senderId: msg.senderId,
              senderName: msg.senderName || 'Unknown',
              senderRole: msg.senderRole || 'system',
              message: msg.content || msg.message,
              isSystemMessage: msg.isSystemMessage ?? false,
              createdAt: new Date(msg.createdAt),
            })) : prev.messages,
            createdAt: txn.createdAt ? new Date(txn.createdAt) : prev.createdAt,
            updatedAt: txn.updatedAt ? new Date(txn.updatedAt) : prev.updatedAt,
            // Update business details from listing if available
            businessDetails: {
              ...prev.businessDetails,
              mcNumber: txn.listing?.mcNumber || prev.businessDetails.mcNumber,
              dotNumber: txn.listing?.dotNumber || prev.businessDetails.dotNumber,
              // Use listing.legalName first, fallback to seller.companyName
              legalName: txn.listing?.legalName || txn.seller?.companyName || prev.businessDetails.legalName,
              dba: txn.listing?.dbaName || prev.businessDetails.dba,
              // Build address from listing or seller data
              businessAddress: txn.listing?.address
                ? `${txn.listing.address}, ${txn.listing.city || ''}, ${txn.listing.state || ''}`
                : (txn.seller?.companyAddress ? `${txn.seller.companyAddress}, ${txn.seller.city || ''}, ${txn.seller.state || ''}` : prev.businessDetails.businessAddress),
              phoneNumber: txn.listing?.contactPhone || prev.businessDetails.phoneNumber,
              email: txn.listing?.contactEmail || prev.businessDetails.email,
              // Parse cargo types if available
              cargoTypes: txn.listing?.cargoTypes
                ? (typeof txn.listing.cargoTypes === 'string'
                    ? JSON.parse(txn.listing.cargoTypes)
                    : txn.listing.cargoTypes)
                : prev.businessDetails.cargoTypes,
            },
            // Update safety record from listing if available
            safetyRecord: {
              ...prev.safetyRecord,
              saferScore: txn.listing?.saferScore || txn.listing?.safetyRating?.toLowerCase() || prev.safetyRecord.saferScore,
            },
            // Update insurance info from listing if available
            insuranceInfo: {
              ...prev.insuranceInfo,
              liabilityInsurance: {
                ...prev.insuranceInfo.liabilityInsurance,
                coverage: txn.listing?.bipdCoverage || prev.insuranceInfo.liabilityInsurance.coverage,
                status: txn.listing?.insuranceOnFile ? 'Active' : prev.insuranceInfo.liabilityInsurance.status,
              },
              cargoInsurance: {
                ...prev.insuranceInfo.cargoInsurance,
                coverage: txn.listing?.cargoCoverage || prev.insuranceInfo.cargoInsurance.coverage,
              },
              bondInfo: {
                ...prev.insuranceInfo.bondInfo,
                amount: txn.listing?.bondAmount || prev.insuranceInfo.bondInfo.amount,
              },
            },
            // Update seller info
            sellerInfo: {
              ...prev.sellerInfo,
              contactName: txn.seller?.name || prev.sellerInfo.contactName,
              contactPhone: txn.seller?.phone || prev.sellerInfo.contactPhone,
              contactEmail: txn.seller?.email || prev.sellerInfo.contactEmail,
              verificationStatus: txn.seller?.verified ? 'verified' : 'pending',
            },
            // Update buyer info
            buyerInfo: {
              ...prev.buyerInfo,
              companyName: txn.buyer?.companyName || prev.buyerInfo.companyName,
              contactName: txn.buyer?.name || prev.buyerInfo.contactName,
              contactPhone: txn.buyer?.phone || prev.buyerInfo.contactPhone,
              contactEmail: txn.buyer?.email || prev.buyerInfo.contactEmail,
              verificationStatus: txn.buyer?.verified ? 'verified' : 'pending',
            },
            // Update platform integrations from listing data
            platformIntegrations: {
              amazonRelay: {
                status: txn.listing?.amazonStatus && txn.listing.amazonStatus.toLowerCase() !== 'none' && txn.listing.amazonStatus.toLowerCase() !== 'not-setup'
                  ? 'Active' : 'None',
                score: txn.listing?.amazonRelayScore || '',
                loads: prev.platformIntegrations.amazonRelay.loads,
                rating: prev.platformIntegrations.amazonRelay.rating,
                memberSince: prev.platformIntegrations.amazonRelay.memberSince,
              },
              highway: {
                status: txn.listing?.highwaySetup ? 'Active' : 'None',
                factoring: prev.platformIntegrations.highway.factoring,
                quickPay: prev.platformIntegrations.highway.quickPay,
                setupDate: prev.platformIntegrations.highway.setupDate,
              },
              dat: prev.platformIntegrations.dat,
            },
            // Update transfer items from listing data
            transferItems: {
              ...prev.transferItems,
              mcAuthority: true,
              dotNumber: !!txn.listing?.dotNumber,
              emailAccounts: txn.listing?.sellingWithEmail ? (prev.transferItems.emailAccounts.length > 0 ? prev.transferItems.emailAccounts : ['Included with sale']) : [],
              phoneNumbers: txn.listing?.sellingWithPhone ? (prev.transferItems.phoneNumbers.length > 0 ? prev.transferItems.phoneNumbers : ['Included with sale']) : [],
              amazonRelayAccount: txn.listing?.amazonStatus && txn.listing.amazonStatus.toLowerCase() !== 'none' && txn.listing.amazonStatus.toLowerCase() !== 'not-setup',
              highwayAccount: txn.listing?.highwaySetup ?? false,
            },
            // Update driver history from listing if available
            driverHistory: {
              ...prev.driverHistory,
              totalDrivers: txn.listing?.totalDrivers || prev.driverHistory.totalDrivers,
            },
            // Determine workflow step based on status
            workflow: {
              ...prev.workflow,
              currentStep: mappedStatus === 'awaiting-deposit' ? 'deposit-payment' as BuyerStep :
                          (mappedStatus === 'deposit-received' || mappedStatus === 'in-review' || mappedStatus === 'buyer-approved' || mappedStatus === 'seller-approved') ? 'bill-of-sale' as BuyerStep :
                          (mappedStatus === 'both-approved' || mappedStatus === 'admin-final-review') ? 'bill-of-sale' as BuyerStep :
                          mappedStatus === 'payment-pending' ? 'final-payment' as BuyerStep :
                          (mappedStatus === 'payment-received' || mappedStatus === 'completed') ? 'completed' as BuyerStep :
                          prev.workflow.currentStep,
              depositPaidAt: txn.depositPaidAt ? new Date(txn.depositPaidAt) : prev.workflow.depositPaidAt,
              finalPaymentPaidAt: txn.finalPaymentPaidAt ? new Date(txn.finalPaymentPaidAt) : prev.workflow.finalPaymentPaidAt,
            },
          }))

          // Update buyer step based on transaction status
          if (mappedStatus === 'awaiting-deposit') {
            setBuyerStep('deposit-payment')
          } else if (mappedStatus === 'deposit-received' || mappedStatus === 'in-review' || mappedStatus === 'buyer-approved' || mappedStatus === 'seller-approved') {
            setBuyerStep('bill-of-sale')
          } else if (mappedStatus === 'both-approved' || mappedStatus === 'admin-final-review') {
            setBuyerStep('bill-of-sale')
          } else if (mappedStatus === 'payment-pending') {
            setBuyerStep('final-payment')
          } else if (mappedStatus === 'payment-received' || mappedStatus === 'completed') {
            setBuyerStep('completed')
          }

          // Log the computed buyer step for debugging
          console.log('[TransactionRoomPage] Setting buyer step based on mappedStatus:', mappedStatus)

          // Parse FMCSA data from listing if available, otherwise fetch live
          if (txn.listing?.fmcsaData) {
            try {
              const parsedFmcsa = typeof txn.listing.fmcsaData === 'string'
                ? JSON.parse(txn.listing.fmcsaData)
                : txn.listing.fmcsaData

              setFmcsaData({
                dotNumber: parsedFmcsa.dotNumber || '',
                legalName: parsedFmcsa.legalName || '',
                dbaName: parsedFmcsa.dbaName,
                carrierOperation: parsedFmcsa.carrierOperation || 'Unknown',
                hqCity: parsedFmcsa.hqCity || '',
                hqState: parsedFmcsa.hqState || '',
                physicalAddress: parsedFmcsa.physicalAddress || '',
                phone: parsedFmcsa.phone || '',
                safetyRating: parsedFmcsa.safetyRating || 'None',
                safetyRatingDate: parsedFmcsa.safetyRatingDate,
                totalDrivers: parsedFmcsa.totalDrivers || 0,
                totalPowerUnits: parsedFmcsa.totalPowerUnits || 0,
                mcs150Date: parsedFmcsa.mcs150Date,
                allowedToOperate: parsedFmcsa.allowedToOperate || 'N',
                bipdRequired: parsedFmcsa.bipdRequired || 0,
                cargoRequired: parsedFmcsa.cargoRequired || 0,
                bondRequired: parsedFmcsa.bondRequired || 0,
                insuranceOnFile: parsedFmcsa.insuranceOnFile ?? false,
                bipdOnFile: parsedFmcsa.bipdOnFile || 0,
                cargoOnFile: parsedFmcsa.cargoOnFile || 0,
                bondOnFile: parsedFmcsa.bondOnFile || 0,
                verified: true,
                verifiedAt: txn.listing.fmcsaVerifiedAt ? new Date(txn.listing.fmcsaVerifiedAt) : new Date(),
              })
            } catch (parseError) {
              console.error('[TransactionRoomPage] Error parsing FMCSA data:', parseError)
            }
          } else if (txn.listing?.dotNumber) {
            // No stored FMCSA data — fetch live from FMCSA API
            api.fmcsaLookupByDOT(txn.listing.dotNumber).then(res => {
              if (res.success && res.data) {
                const d = res.data
                setFmcsaData({
                  dotNumber: d.dotNumber || '',
                  legalName: d.legalName || '',
                  dbaName: d.dbaName,
                  carrierOperation: d.carrierOperation || 'Unknown',
                  hqCity: d.hqCity || '',
                  hqState: d.hqState || '',
                  physicalAddress: d.physicalAddress || '',
                  phone: d.phone || '',
                  safetyRating: d.safetyRating || 'None',
                  safetyRatingDate: d.safetyRatingDate,
                  totalDrivers: d.totalDrivers || 0,
                  totalPowerUnits: d.totalPowerUnits || 0,
                  mcs150Date: d.mcs150Date,
                  allowedToOperate: d.allowedToOperate || 'N',
                  bipdRequired: d.bipdRequired || 0,
                  cargoRequired: d.cargoRequired || 0,
                  bondRequired: d.bondRequired || 0,
                  insuranceOnFile: d.insuranceOnFile ?? false,
                  bipdOnFile: d.bipdOnFile || 0,
                  cargoOnFile: d.cargoOnFile || 0,
                  bondOnFile: d.bondOnFile || 0,
                  verified: true,
                  verifiedAt: new Date(),
                })
              }
            }).catch(() => {})
          }

          // Parse authority history from listing, or fetch live
          if (txn.listing.authorityHistory) {
            try {
              const rawAuthority = typeof txn.listing.authorityHistory === 'string'
                ? JSON.parse(txn.listing.authorityHistory)
                : txn.listing.authorityHistory
              setAuthorityHistory({
                commonAuthorityStatus: rawAuthority.commonAuthorityStatus || 'N/A',
                commonAuthorityGrantDate: rawAuthority.commonAuthorityGrantDate,
                commonAuthorityReinstatedDate: rawAuthority.commonAuthorityReinstatedDate,
                commonAuthorityRevokedDate: rawAuthority.commonAuthorityRevokedDate,
                contractAuthorityStatus: rawAuthority.contractAuthorityStatus || 'N/A',
                contractAuthorityGrantDate: rawAuthority.contractAuthorityGrantDate,
                brokerAuthorityStatus: rawAuthority.brokerAuthorityStatus || 'N/A',
                brokerAuthorityGrantDate: rawAuthority.brokerAuthorityGrantDate,
              })
            } catch (parseError) {
              console.error('[TransactionRoomPage] Error parsing authority history:', parseError)
            }
          } else if (txn.listing?.dotNumber) {
            // Fetch authority history live from FMCSA
            api.fmcsaGetAuthorityHistory(txn.listing.dotNumber).then(res => {
              if (res.success && res.data) {
                const d = res.data
                setAuthorityHistory({
                  commonAuthorityStatus: d.commonAuthorityStatus || 'N/A',
                  commonAuthorityGrantDate: d.commonAuthorityGrantDate,
                  commonAuthorityReinstatedDate: d.commonAuthorityReinstatedDate,
                  commonAuthorityRevokedDate: d.commonAuthorityRevokedDate,
                  contractAuthorityStatus: d.contractAuthorityStatus || 'N/A',
                  contractAuthorityGrantDate: d.contractAuthorityGrantDate,
                  brokerAuthorityStatus: d.brokerAuthorityStatus || 'N/A',
                  brokerAuthorityGrantDate: d.brokerAuthorityGrantDate,
                })
              }
            }).catch(() => {})
          }

          // Parse insurance history from listing
          if (txn.listing.insuranceHistory) {
            try {
              const rawInsurance = typeof txn.listing.insuranceHistory === 'string'
                ? JSON.parse(txn.listing.insuranceHistory)
                : txn.listing.insuranceHistory
              if (Array.isArray(rawInsurance)) {
                setInsuranceHistory(rawInsurance.map((ins: any) => ({
                  insurerName: ins.insurerName || 'Unknown',
                  policyNumber: ins.policyNumber || 'N/A',
                  insuranceType: ins.insuranceType || 'Unknown',
                  coverageAmount: ins.coverageAmount || 0,
                  effectiveDate: ins.effectiveDate || '',
                  cancellationDate: ins.cancellationDate,
                  status: ins.status || 'Unknown',
                })))
              }
            } catch (parseError) {
              console.error('[TransactionRoomPage] Error parsing insurance history:', parseError)
            }
          }

          // Parse listing-specific data
          const listing = txn.listing
          let cargoTypesArray: string[] = []
          if (listing.cargoTypes) {
            try {
              cargoTypesArray = typeof listing.cargoTypes === 'string'
                ? JSON.parse(listing.cargoTypes)
                : listing.cargoTypes
            } catch {
              cargoTypesArray = []
            }
          }

          setListingData({
            mcNumber: listing.mcNumber || '',
            dotNumber: listing.dotNumber || '',
            legalName: listing.legalName || '',
            dbaName: listing.dbaName,
            city: listing.city || '',
            state: listing.state || '',
            address: listing.address,
            yearsActive: listing.yearsActive || 0,
            fleetSize: listing.fleetSize || 0,
            totalDrivers: listing.totalDrivers || 0,
            safetyRating: listing.safetyRating
              ? listing.safetyRating.charAt(0).toUpperCase() + listing.safetyRating.slice(1).toLowerCase()
              : 'None',
            saferScore: listing.saferScore,
            insuranceOnFile: listing.insuranceOnFile ?? false,
            bipdCoverage: listing.bipdCoverage,
            cargoCoverage: listing.cargoCoverage,
            bondAmount: listing.bondAmount,
            amazonStatus: listing.amazonStatus?.toLowerCase() || 'not-setup',
            amazonRelayScore: listing.amazonRelayScore,
            highwaySetup: listing.highwaySetup ?? false,
            sellingWithEmail: listing.sellingWithEmail ?? false,
            sellingWithPhone: listing.sellingWithPhone ?? false,
            contactEmail: listing.contactEmail,
            contactPhone: listing.contactPhone,
            cargoTypes: cargoTypesArray,
          })
        }
      } catch (err: any) {
        console.error('Error fetching transaction:', err)
        setError(err.message || 'Failed to load transaction')
        toast.error('Failed to load transaction details')
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [transactionId])

  // Fetch credentials when transaction loads
  useEffect(() => {
    if (!transactionId) return
    api.getTransactionCredentials(transactionId)
      .then(res => { if (res.success && res.data) setCredentials(res.data) })
      .catch(() => {})
  }, [transactionId])

  // Handle deposit payment success/cancelled query params from Stripe redirect
  useEffect(() => {
    const depositStatus = searchParams.get('deposit')

    if (depositStatus === 'success') {
      // Show success toast
      toast.success('Deposit payment successful! Your transaction is now being processed.', {
        duration: 5000,
      })

      // Clear the query param
      searchParams.delete('deposit')
      setSearchParams(searchParams, { replace: true })

      // First, call verify-deposit-status to check Stripe directly and update DB
      // This is needed because webhooks don't fire in local development
      const verifyAndUpdateDeposit = async () => {
        try {
          console.log('[TransactionRoomPage] Verifying deposit status with Stripe...')
          const verifyResponse = await api.verifyDepositStatus(transactionId!)
          console.log('[TransactionRoomPage] Verify response:', verifyResponse)

          if (verifyResponse.success && verifyResponse.data?.depositPaid) {
            // Deposit confirmed! Update local state
            setTransaction(prev => ({
              ...prev,
              status: 'deposit-received',
              depositPaid: true,
              depositPaidAt: verifyResponse.data.depositPaidAt ? new Date(verifyResponse.data.depositPaidAt) : new Date(),
              workflow: {
                ...prev.workflow,
                currentStep: 'awaiting-admin',
                depositPaidAt: verifyResponse.data.depositPaidAt ? new Date(verifyResponse.data.depositPaidAt) : new Date(),
                depositPaymentMethod: 'card',
              }
            }))
            setBuyerStep('awaiting-admin')
            toast.success('Deposit confirmed! Awaiting admin review.', { duration: 4000 })
            return
          }
        } catch (error) {
          console.error('[TransactionRoomPage] Error verifying deposit:', error)
        }

        // Fallback: poll for transaction update (in case webhook updates it)
        let attempts = 0
        const maxAttempts = 5
        const pollInterval = 2000

        const poll = async () => {
          if (attempts >= maxAttempts) {
            toast.error('Could not confirm deposit. Please refresh the page.')
            return
          }
          attempts++

          try {
            const response = await api.getTransaction(transactionId!)
            if (response.success && response.data) {
              const txn = response.data
              if (txn.status === 'DEPOSIT_RECEIVED' || txn.depositPaidAt) {
                setTransaction(prev => ({
                  ...prev,
                  status: 'deposit-received',
                  depositPaid: true,
                  depositPaidAt: txn.depositPaidAt ? new Date(txn.depositPaidAt) : new Date(),
                  workflow: {
                    ...prev.workflow,
                    currentStep: 'awaiting-admin',
                    depositPaidAt: txn.depositPaidAt ? new Date(txn.depositPaidAt) : new Date(),
                    depositPaymentMethod: 'card',
                  }
                }))
                setBuyerStep('awaiting-admin')
                toast.success('Deposit confirmed! Awaiting admin review.', { duration: 4000 })
                return
              }
            }
            setTimeout(poll, pollInterval)
          } catch (error) {
            console.error('Error polling for transaction update:', error)
          }
        }

        setTimeout(poll, 1000)
      }

      verifyAndUpdateDeposit()
    } else if (depositStatus === 'cancelled') {
      toast.error('Deposit payment was cancelled. Please try again when ready.')
      searchParams.delete('deposit')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, transactionId, setSearchParams])

  // Handle final payment success/cancelled query params from Stripe redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')

    if (paymentStatus === 'success') {
      toast.success('Payment submitted successfully! Awaiting admin verification.', {
        duration: 5000,
      })
      searchParams.delete('payment')
      setSearchParams(searchParams, { replace: true })

      // Poll for transaction update
      const pollPayment = async () => {
        let attempts = 0
        const poll = async () => {
          if (attempts >= 5) return
          attempts++
          try {
            const response = await api.getTransaction(transactionId!)
            if (response.success && response.data) {
              const txn = response.data
              if (txn.status === 'PAYMENT_RECEIVED' || txn.status === 'COMPLETED' || txn.finalPaidAt) {
                setTransaction(prev => ({
                  ...prev,
                  status: 'payment-received',
                  finalPaymentPaid: true,
                  workflow: { ...prev.workflow, currentStep: 'completed' as BuyerStep },
                }))
                setBuyerStep('completed')
                toast.success('Payment confirmed!', { duration: 4000 })
                return
              }
            }
            setTimeout(poll, 2000)
          } catch (err) {
            console.error('Error polling for payment update:', err)
          }
        }
        setTimeout(poll, 1000)
      }
      pollPayment()
      setPaymentSubmitted(true)
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. You can try again when ready.')
      searchParams.delete('payment')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, transactionId, setSearchParams])

  // Determine user role in this transaction
  const getUserRole = (): 'admin' | 'buyer' | 'seller' => {
    if (user?.role === 'admin') return 'admin'
    if (user?.id === transaction.buyerId) return 'buyer'
    if (user?.id === transaction.sellerId) return 'seller'
    // Fallback: check user's account role if IDs don't match
    if (user?.role === 'seller') return 'seller'
    if (user?.role === 'buyer') return 'buyer'
    return 'buyer' // default for demo
  }

  const userRole: 'admin' | 'buyer' | 'seller' = getUserRole()
  const isBuyer = userRole === 'buyer'
  const isSeller = userRole === 'seller'
  const isAdmin = userRole === 'admin'

  // Buyer can only see seller contact info after final payment is received
  const canBuyerSeeSellerInfo = transaction.status === 'completed' && transaction.finalPaymentPaid

  const getStatusConfig = (status: TransactionStatus) => {
    const configs: Record<TransactionStatus, { label: string; color: string; description: string }> = {
      'awaiting-deposit': { label: 'Awaiting Deposit', color: 'bg-yellow-100 text-yellow-700', description: 'Waiting for buyer deposit' },
      'deposit-received': { label: 'Deposit Received', color: 'bg-blue-100 text-blue-700', description: 'Deposit confirmed, review in progress' },
      'in-review': { label: 'In Review', color: 'bg-blue-100 text-blue-700', description: 'Parties reviewing documents' },
      'buyer-approved': { label: 'Buyer Approved', color: 'bg-green-100 text-green-700', description: 'Waiting for seller approval' },
      'seller-approved': { label: 'Seller Approved', color: 'bg-green-100 text-green-700', description: 'Waiting for buyer approval' },
      'both-approved': { label: 'Both Approved', color: 'bg-emerald-100 text-emerald-700', description: 'Awaiting admin final review' },
      'admin-final-review': { label: 'Admin Review', color: 'bg-purple-100 text-purple-700', description: 'Admin conducting final review' },
      'payment-pending': { label: 'Payment Pending', color: 'bg-orange-100 text-orange-700', description: 'Awaiting final payment' },
      'payment-received': { label: 'Payment Received', color: 'bg-emerald-100 text-emerald-700', description: 'Verifying payment' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-700', description: 'Transaction complete!' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', description: 'Transaction cancelled' },
      'disputed': { label: 'Disputed', color: 'bg-red-100 text-red-700', description: 'Under dispute resolution' }
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(transaction.status)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeTab === 'messages') {
      scrollToBottom()
    }
  }, [activeTab, transaction.messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setSendingMessage(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    const newMsg: TransactionMessage = {
      id: Date.now().toString(),
      transactionId: transaction.id,
      senderId: user?.id || '',
      senderName: user?.name || '',
      senderRole: userRole,
      message: newMessage,
      isSystemMessage: false,
      createdAt: new Date()
    }
    setTransaction(prev => ({ ...prev, messages: [...prev.messages, newMsg] }))
    setNewMessage('')
    setSendingMessage(false)
  }

  const handleApprove = async () => {
    if (!transactionId) return
    setApproving(true)
    try {
      if (userRole === 'buyer') {
        const response = await api.buyerApproveTransaction(transactionId)
        if (response.success) {
          toast.success('Transaction approved!')
          setTransaction(prev => ({
            ...prev,
            buyerApproved: true,
            buyerApprovedAt: new Date(),
            status: prev.sellerApproved ? 'both-approved' : 'buyer-approved',
            workflow: { ...prev.workflow, buyerApprovedBillOfSaleAt: new Date() }
          }))
          await refreshTransaction()
        }
      } else if (userRole === 'seller') {
        const response = await api.sellerApproveTransaction(transactionId)
        if (response.success) {
          toast.success('Transaction approved!')
          setTransaction(prev => ({
            ...prev,
            sellerApproved: true,
            sellerApprovedAt: new Date(),
            status: prev.buyerApproved ? 'both-approved' : 'seller-approved',
            workflow: { ...prev.workflow, sellerApprovedBillOfSaleAt: new Date() }
          }))
          await refreshTransaction()
        }
      } else if (userRole === 'admin') {
        const response = await api.adminApproveTransaction(transactionId)
        if (response.success) {
          toast.success('Transaction finalized! Payment instructions sent.')
          setTransaction(prev => ({
            ...prev,
            adminApproved: true,
            adminApprovedAt: new Date(),
            status: 'payment-pending',
            workflow: { ...prev.workflow, adminApprovedBillOfSaleAt: new Date() },
            paymentInstructions: `Payment Instructions for Transaction #${transaction.id}

Amount Due: $${transaction.finalPaymentAmount.toLocaleString()}

Payment Method: Wire Transfer via Stripe
Click the "Pay via Wire Transfer" button above to get your unique bank details from Stripe.
Stripe will provide routing and account numbers specific to your transaction.

Once your wire is received (typically 1-2 business days),
payment is automatically confirmed and all MC authority documents
and credentials will be released to you.

For questions, contact us at payments@domilea.com`
          }))
          await refreshTransaction()
        }
      }
    } catch (err: any) {
      console.error('Error approving transaction:', err)
      toast.error(err.message || 'Failed to approve transaction')
    } finally {
      setApproving(false)
    }
  }

  const handleFinalPayment = async () => {
    setTransaction(prev => ({
      ...prev,
      finalPaymentPaid: true,
      finalPaymentPaidAt: new Date(),
      status: 'completed',
      completedAt: new Date()
    }))
    setShowPaymentModal(false)
  }

  // Admin: Release payout to seller
  const handleReleasePayout = async () => {
    if (!transactionId) return
    setReleasingPayout(true)
    try {
      const response = await api.adminReleasePayout(transactionId, selectedPayoutMethod)
      if (response.success) {
        toast.success(response.message || 'Payout released to seller!')
        setTransaction(prev => ({
          ...prev,
          payoutStatus: response.data?.payoutStatus || 'RELEASED',
          payoutReleasedAt: new Date(),
          payoutTransferId: response.data?.transferId || null,
        }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to release payout')
    } finally {
      setReleasingPayout(false)
    }
  }

  // Check instant payout eligibility when admin views a completed transaction
  useEffect(() => {
    if (userRole === 'admin' && transaction.status === 'completed' && !transaction.payoutStatus && transactionId) {
      api.checkInstantPayoutEligibility(transactionId).then(res => {
        if (res.success) {
          setInstantEligible(res.data.eligible)
          setInstantEligibleReason(res.data.reason || null)
        }
      }).catch(() => {
        setInstantEligible(false)
      })
    }
  }, [userRole, transaction.status, transaction.payoutStatus, transactionId])

  // Helper to refresh transaction data from API
  const refreshTransaction = async () => {
    if (!transactionId) return
    try {
      const response = await api.getTransaction(transactionId)
      if (response.success && response.data) {
        const txn = response.data
        const statusMap: Record<string, TransactionStatus> = {
          'AWAITING_DEPOSIT': 'awaiting-deposit',
          'DEPOSIT_RECEIVED': 'deposit-received',
          'IN_REVIEW': 'in-review',
          'BUYER_APPROVED': 'buyer-approved',
          'SELLER_APPROVED': 'seller-approved',
          'BOTH_APPROVED': 'both-approved',
          'ADMIN_FINAL_REVIEW': 'admin-final-review',
          'PAYMENT_PENDING': 'payment-pending',
          'PAYMENT_RECEIVED': 'payment-received',
          'COMPLETED': 'completed',
          'CANCELLED': 'cancelled',
          'DISPUTED': 'disputed',
        }
        const mappedStatus = statusMap[txn.status] || 'in-review'
        setTransaction(prev => ({
          ...prev,
          status: mappedStatus,
          buyerApproved: txn.buyerApproved ?? prev.buyerApproved,
          sellerApproved: txn.sellerApproved ?? prev.sellerApproved,
          adminApproved: txn.adminApproved ?? prev.adminApproved,
          depositPaid: !!txn.depositPaidAt,
          depositPaidAt: txn.depositPaidAt ? new Date(txn.depositPaidAt) : prev.depositPaidAt,
          finalPaymentPaid: !!txn.finalPaymentPaidAt,
          sellerPayout: txn.sellerPayout ?? prev.sellerPayout,
          payoutStatus: txn.payoutStatus ?? prev.payoutStatus,
          payoutReleasedAt: txn.payoutReleasedAt ? new Date(txn.payoutReleasedAt) : prev.payoutReleasedAt,
          payoutTransferId: txn.payoutTransferId ?? prev.payoutTransferId,
          sellerDocuments: txn.documents?.length > 0 ? txn.documents.map((doc: any) => ({
            id: doc.id,
            transactionId: txn.id,
            uploadedBy: doc.uploadedBy || 'seller',
            uploaderId: doc.uploaderId || txn.sellerId,
            name: doc.name || doc.filename,
            type: doc.type || 'document',
            url: doc.url || '#',
            verified: doc.verified ?? false,
            uploadedAt: new Date(doc.createdAt || doc.uploadedAt),
          })) : prev.sellerDocuments,
        }))
      }
    } catch (err) {
      console.error('Error refreshing transaction:', err)
    }
  }

  // Admin: search users when reassigning a transaction party
  const searchReassignUsers = async (role: 'buyer' | 'seller', query: string) => {
    setReassignSearching(true)
    try {
      const res = await api.getAdminUsers({
        role: role.toUpperCase(),
        search: query,
        limit: 10,
      })
      setReassignResults(
        (res.users || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          companyName: u.companyName,
        }))
      )
    } catch (err: any) {
      toast.error(err.message || 'Search failed')
      setReassignResults([])
    } finally {
      setReassignSearching(false)
    }
  }

  // Admin: submit the reassignment
  const handleReassignParty = async (newUserId: string, newUserLabel: string) => {
    if (!transactionId || !reassignRole) return
    if (!window.confirm(`Reassign ${reassignRole} to ${newUserLabel}? This rewrites who owns this transaction.`)) return
    setReassignSubmitting(true)
    try {
      const payload = reassignRole === 'buyer' ? { buyerId: newUserId } : { sellerId: newUserId }
      await api.reassignTransactionParty(transactionId, payload)
      toast.success(`${reassignRole.charAt(0).toUpperCase() + reassignRole.slice(1)} reassigned`)
      setReassignRole(null)
      setReassignQuery('')
      setReassignResults([])
      // Full reload so all derived state (role checks, sidebar, etc.) re-resolves
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || 'Reassignment failed')
    } finally {
      setReassignSubmitting(false)
    }
  }

  // Admin: Update transaction status via API
  const handleAdminUpdateStatus = async (newStatus: string, notes?: string) => {
    if (!transactionId) return
    setAdminActionLoading(true)
    try {
      const response = await api.updateTransactionStatus(transactionId, newStatus, notes)
      if (response.success) {
        toast.success(response.message || 'Status updated successfully')
        await refreshTransaction()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setAdminActionLoading(false)
    }
  }

  // Admin: Approve deposit and generate bill of sale
  const handleAdminApproveDeposit = async () => {
    if (!transactionId) return
    setAdminActionLoading(true)
    try {
      // Update status to IN_REVIEW (bill of sale step)
      const response = await api.updateTransactionStatus(transactionId, 'IN_REVIEW', 'Admin approved deposit and generated bill of sale')
      if (response.success) {
        toast.success('Deposit approved! Bill of Sale generated.')
        // Update local state to reflect the change
        setTransaction(prev => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            currentStep: 'bill-of-sale',
            adminApprovedDepositAt: new Date(),
            billOfSaleGeneratedAt: new Date()
          }
        }))
        await refreshTransaction()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve deposit')
    } finally {
      setAdminActionLoading(false)
    }
  }

  // Admin: Final approval after both parties approved
  const handleAdminFinalApprove = async () => {
    if (!transactionId) return
    setAdminActionLoading(true)
    try {
      // If contract file is attached, upload it first
      if (adminContractFile) {
        const formData = new FormData()
        formData.append('file', adminContractFile)
        formData.append('type', 'BILL_OF_SALE')

        try {
          await api.uploadTransactionDocument(transactionId, formData)
          toast.success('Contract document uploaded')
        } catch (uploadErr: any) {
          console.error('Error uploading contract:', uploadErr)
          // Continue with approval even if upload fails
          toast.error('Contract upload failed, but proceeding with approval')
        }
      }

      const response = await api.adminApproveTransaction(transactionId)
      if (response.success) {
        toast.success('Transaction finalized! Payment instructions sent.')
        setTransaction(prev => ({
          ...prev,
          adminApproved: true,
          adminApprovedAt: new Date(),
          status: 'payment-pending',
          workflow: {
            ...prev.workflow,
            currentStep: 'final-payment',
            adminApprovedBillOfSaleAt: new Date()
          },
          paymentInstructions: `Payment Instructions for Transaction #${transaction.id}\n\nAmount Due: $${transaction.finalPaymentAmount.toLocaleString()}\n\nPayment Method: Wire Transfer via Stripe\nClick the "Pay via Wire Transfer" button to get unique bank details.\n\nFor questions: payments@domilea.com`
        }))
        // Clear the contract file state after successful approval
        setAdminContractFile(null)
        await refreshTransaction()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve transaction')
    } finally {
      setAdminActionLoading(false)
    }
  }

  // Admin: Confirm final payment received
  const handleAdminConfirmPayment = async () => {
    if (!transactionId) return
    setAdminActionLoading(true)
    try {
      const response = await api.updateTransactionStatus(transactionId, 'COMPLETED', 'Final payment confirmed')
      if (response.success) {
        toast.success('Payment confirmed! Transaction completed.')
        setTransaction(prev => ({
          ...prev,
          finalPaymentPaid: true,
          finalPaymentPaidAt: new Date(),
          status: 'completed',
          completedAt: new Date(),
          workflow: {
            ...prev.workflow,
            currentStep: 'completed',
            finalPaymentPaidAt: new Date(),
            completedAt: new Date()
          }
        }))
        await refreshTransaction()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm payment')
    } finally {
      setAdminActionLoading(false)
    }
  }

  const canApprove = () => {
    // Buyer/seller can only approve once deposit is received (not while still awaiting deposit)
    const approvalStatuses: TransactionStatus[] = ['deposit-received', 'in-review', 'buyer-approved', 'seller-approved']
    if (userRole === 'buyer' && !transaction.buyerApproved && approvalStatuses.includes(transaction.status)) return true
    if (userRole === 'seller' && !transaction.sellerApproved && approvalStatuses.includes(transaction.status)) return true
    if (userRole === 'admin' && transaction.buyerApproved && transaction.sellerApproved && !transaction.adminApproved) return true
    return false
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'authority': return <Award className="w-5 h-5 text-blue-600" />
      case 'insurance': return <Shield className="w-5 h-5 text-green-600" />
      case 'safety': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'financial': return <DollarSign className="w-5 h-5 text-emerald-600" />
      case 'legal': return <Scale className="w-5 h-5 text-purple-600" />
      case 'contract': return <FileCheck className="w-5 h-5 text-orange-600" />
      case 'transfer': return <ArrowRight className="w-5 h-5 text-gray-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const groupedDocuments = (transaction.sellerDocuments || []).reduce((acc, doc) => {
    const category = doc.type
    if (!acc[category]) acc[category] = []
    acc[category].push(doc)
    return acc
  }, {} as Record<string, typeof transaction.sellerDocuments>)

  // Get back URL based on user role
  const getBackUrl = () => {
    if (userRole === 'admin') return '/admin/transactions'
    if (userRole === 'seller') return '/seller/transactions'
    return '/buyer/transactions'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transaction</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link to="/buyer/transactions">
            <Button>Back to Transactions</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={getBackUrl()}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transactions
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-gray-400 text-sm">Transaction Room</p>
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-300">
                  #{transaction.id}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{transaction.businessDetails.legalName}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  MC #{transaction.listing.mcNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  DOT #{transaction.businessDetails.dotNumber}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.color}`}>
              <span className="font-medium">{statusConfig.label}</span>
            </div>
            <p className="text-sm text-gray-400">{statusConfig.description}</p>
          </div>
        </div>

        {/* Quick Stats - Role Specific */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-gray-400 text-sm">
              {userRole === 'seller' ? 'Your Asking Price' : userRole === 'buyer' ? 'Your Price' : 'Transaction Value'}
            </p>
            <p className="text-2xl font-bold">
              ${userRole === 'seller' ? (transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0).toLocaleString() : transaction.agreedPrice.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Years Active</p>
            <p className="text-2xl font-bold">{transaction.listing.yearsActive} Years</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Safety Rating</p>
            <p className="text-2xl font-bold">{transaction.safetyRecord.saferScore}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Authority Status</p>
            <p className="text-2xl font-bold">{(transaction.listing as any).authorityStatus || 'Active'}</p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buyer */}
        <Card className={`${userRole === 'buyer' ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{transaction.buyer.name}</p>
                {userRole === 'buyer' && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
              <p className="text-sm text-gray-500">Buyer</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              {transaction.buyer.email}
            </p>
            <p className="flex items-center gap-2 text-gray-600">
              <Star className="w-4 h-4" />
              Trust Score: {transaction.buyer.trustScore}%
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            {transaction.buyerApproved ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Approved on {transaction.buyerApprovedAt?.toLocaleDateString()}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-yellow-600">
                <Clock className="w-5 h-5" />
                Pending Approval
              </span>
            )}
          </div>
        </Card>

        {/* Seller */}
        <Card className={`${userRole === 'seller' ? 'ring-2 ring-purple-500' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{transaction.seller.name}</p>
                {userRole === 'seller' && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
              <p className="text-sm text-gray-500">Seller</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {/* Hide seller email from buyers until transaction is completed */}
            {userRole === 'buyer' && !canBuyerSeeSellerInfo ? (
              <p className="flex items-center gap-2 text-gray-400">
                <Lock className="w-4 h-4" />
                <span className="italic">Contact info released after payment</span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                {transaction.seller.email}
              </p>
            )}
            <p className="flex items-center gap-2 text-gray-600">
              <Star className="w-4 h-4" />
              Trust Score: {transaction.seller.trustScore}%
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            {transaction.sellerApproved ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Approved on {transaction.sellerApprovedAt?.toLocaleDateString()}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-yellow-600">
                <Clock className="w-5 h-5" />
                Pending Approval
              </span>
            )}
          </div>
        </Card>

        {/* Admin/Facilitator */}
        <Card className={`${userRole === 'admin' ? 'ring-2 ring-amber-500' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">Domilea</p>
                {userRole === 'admin' && (
                  <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
              <p className="text-sm text-gray-500">Transaction Facilitator</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-gray-600">
              <Shield className="w-4 h-4" />
              Escrow Protected
            </p>
            <p className="flex items-center gap-2 text-gray-600">
              <FileCheck className="w-4 h-4" />
              Document Verification
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            {transaction.adminApproved ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Finalized on {transaction.adminApprovedAt?.toLocaleDateString()}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-500">
                <Clock className="w-5 h-5" />
                Awaiting Both Approvals
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {([
          { id: 'timeline', label: 'Transaction Progress', icon: Clock },
          { id: 'parties', label: 'Buyer & Seller', icon: Users, blur: userRole === 'buyer' && transaction.workflow.currentStep !== 'completed' },
          { id: 'business', label: 'Business Details', icon: Building2, blur: userRole === 'buyer' && transaction.workflow.currentStep !== 'completed' },
          { id: 'documents', label: 'Documents', icon: FileText, count: transaction.sellerDocuments.length },
          { id: 'messages', label: 'Messages', icon: MessageSquare, count: transaction.messages.length }
        ] as Array<{ id: string; label: string; icon: any; blur?: boolean; count?: number; hidden?: boolean }>).filter(tab => !tab.hidden).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-gray-100' : 'bg-gray-200'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Step Progress & Current Step */}
            <div className="lg:col-span-2 space-y-6">
              {/* Workflow Steps Progress */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Transaction Progress
                </h3>
                <div className="relative">
                  {[
                    { id: 'confirm-intent', label: 'Confirm Purchase Intent', icon: Target, description: 'Confirm you want to proceed with this MC purchase' },
                    { id: 'terms-agreement', label: 'Terms & Agreement', icon: ScrollText, description: 'Review and accept terms of service' },
                    { id: 'deposit-payment', label: 'Deposit Payment', icon: CreditCard, description: `Pay $${Number(customDepositAmount || 0).toLocaleString()} refundable deposit` },
                    { id: 'awaiting-admin', label: 'Admin Approval', icon: Shield, description: 'Waiting for admin to verify and approve' },
                    { id: 'bill-of-sale', label: 'Bill of Sale', icon: FileCheck, description: 'All parties review and approve agreement' },
                    { id: 'final-payment', label: 'Final Payment', icon: CircleDollarSign, description: 'Pay remaining balance' },
                    { id: 'completed', label: 'Transaction Complete', icon: CheckCheck, description: 'MC Authority transferred to you' },
                  ].map((step, index) => {
                    const stepOrder = ['confirm-intent', 'terms-agreement', 'deposit-payment', 'awaiting-admin', 'bill-of-sale', 'final-payment', 'completed']
                    const currentIndex = stepOrder.indexOf(transaction.workflow.currentStep)
                    const stepIndex = stepOrder.indexOf(step.id)
                    const isCompleted = stepIndex < currentIndex
                    const isCurrent = step.id === transaction.workflow.currentStep
                    const isPending = stepIndex > currentIndex

                    return (
                      <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100 ring-4 ring-blue-50' : 'bg-gray-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <step.icon className={`w-5 h-5 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                            )}
                          </div>
                          {index < 6 && (
                            <div className={`w-0.5 h-full mt-2 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`font-semibold ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>
                            {step.label}
                            {isCurrent && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current</span>}
                          </p>
                          <p className={`text-sm ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Current Step Action Card - BUYER ONLY */}
              {userRole === 'buyer' && (
                <>
                  {/* Step 1: Confirm Purchase Intent */}
                  {transaction.workflow.currentStep === 'confirm-intent' && (
                    <Card className="border-2 border-blue-200 bg-blue-50/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Confirm Your Purchase Intent</h3>
                          <p className="text-sm text-gray-600">Step 1 of 7</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">MC Authority Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">MC Number</p>
                            <p className="font-medium">#{transaction.listing.mcNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Years Active</p>
                            <p className="font-medium">{transaction.listing.yearsActive} Years</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Your Purchase Price</p>
                            <p className="font-bold text-green-600">${transaction.agreedPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Safety Rating</p>
                            <p className="font-medium">{transaction.safetyRecord.saferScore}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="intent-confirm"
                          checked={intentConfirmed}
                          onChange={(e) => setIntentConfirmed(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="intent-confirm" className="text-sm text-gray-700">
                          I confirm that I intend to purchase MC Authority #{transaction.listing.mcNumber} for ${transaction.agreedPrice.toLocaleString()}.
                          I understand this begins a formal transaction process.
                        </label>
                      </div>

                      <Button
                        fullWidth
                        disabled={!intentConfirmed}
                        onClick={() => {
                          setTransaction(prev => ({
                            ...prev,
                            workflow: { ...prev.workflow, currentStep: 'terms-agreement', intentConfirmedAt: new Date() }
                          }))
                        }}
                      >
                        Continue to Terms & Agreement
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Card>
                  )}

                  {/* Step 2: Terms & Agreement */}
                  {transaction.workflow.currentStep === 'terms-agreement' && (
                    <Card className="border-2 border-blue-200 bg-blue-50/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <ScrollText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Terms of Service & Agreement</h3>
                          <p className="text-sm text-gray-600">Step 2 of 7</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
                        <h4 className="font-bold text-gray-900 mb-2">IMPORTANT DISCLAIMERS & TERMS</h4>

                        <div className="space-y-4 text-sm text-gray-700">
                          <div>
                            <h5 className="font-semibold text-red-600 mb-1">Deposit Refund Policy</h5>
                            <p>The deposit is <strong>refundable only under specific circumstances</strong>:</p>
                            <ul className="list-disc ml-5 mt-1 space-y-1">
                              <li>If Domilea or the seller cancels the transaction</li>
                              <li>If material misrepresentation is discovered during due diligence</li>
                              <li>If the MC Authority fails FMCSA compliance verification</li>
                            </ul>
                            <p className="mt-2 text-red-600 font-medium">Deposits are NOT refundable if you simply change your mind or fail to complete the purchase.</p>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">All Sales Are Final</h5>
                            <p>Once the transaction is completed and the MC Authority is transferred, all sales are final. There are no refunds on completed transfers.</p>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">Buyer's Due Diligence</h5>
                            <p>You are purchasing this MC Authority at your own discretion and risk. While Domilea performs verification, you are responsible for conducting your own due diligence including:</p>
                            <ul className="list-disc ml-5 mt-1 space-y-1">
                              <li>Verifying all FMCSA records</li>
                              <li>Reviewing safety scores and inspection history</li>
                              <li>Confirming insurance transferability</li>
                              <li>Consulting with legal and financial advisors</li>
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">Limitation of Liability</h5>
                            <p>Domilea acts as a facilitator and marketplace. We are not liable for:</p>
                            <ul className="list-disc ml-5 mt-1 space-y-1">
                              <li>Future changes in FMCSA regulations affecting the MC</li>
                              <li>Business performance after transfer</li>
                              <li>Third-party claims or disputes</li>
                              <li>Loss of broker/shipper relationships</li>
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">Transfer Process</h5>
                            <p>MC Authority transfers require filing with the FMCSA and may take 4-6 weeks to complete. During this period, you may not be able to operate under this MC number.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">
                            <strong>READ CAREFULLY:</strong> By proceeding, you acknowledge that you have read, understood, and agree to all terms above.
                            You must individually acknowledge each policy below. You accept full responsibility for your purchase decision.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="terms-accept"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <label htmlFor="terms-accept" className="text-sm text-gray-700">
                            I have read and agree to the <strong>Terms of Service</strong> and all disclaimers. I understand this is a binding agreement and I am proceeding at my own risk.
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="deposit-policy-accept"
                            checked={depositPolicyAccepted}
                            onChange={(e) => setDepositPolicyAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <label htmlFor="deposit-policy-accept" className="text-sm text-gray-700">
                            I understand and agree that <strong>deposits are non-refundable</strong> if I decide to back out of the deal for any reason (change of mind, financing issues, dissatisfaction, etc.). Deposits are only refundable if the seller fails to deliver documents or cancels the sale.
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="final-payment-policy-accept"
                            checked={finalPaymentPolicyAccepted}
                            onChange={(e) => setFinalPaymentPolicyAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <label htmlFor="final-payment-policy-accept" className="text-sm text-gray-700">
                            I understand and agree that <strong>all final payments are final, non-refundable, and non-reversible</strong>. Once payment is processed and the transaction is completed, I have no right to a refund or reversal of any kind.
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="no-dispute-policy-accept"
                            checked={noDisputePolicyAccepted}
                            onChange={(e) => setNoDisputePolicyAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <label htmlFor="no-dispute-policy-accept" className="text-sm text-gray-700">
                            I agree that I <strong>will not file chargebacks, bank disputes, or payment reversals</strong> with my bank or financial institution for any payments made through this platform. I agree to contact Domilea directly at info@domilea.com to resolve any billing concerns.
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="contact-seller-policy-accept"
                            checked={contactSellerPolicyAccepted}
                            onChange={(e) => setContactSellerPolicyAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <label htmlFor="contact-seller-policy-accept" className="text-sm text-gray-700">
                            I understand that if I have any issues with the purchased asset after the transaction is completed, I agree to <strong>contact the seller directly</strong> to resolve any disputes and will not hold Domilea responsible for the product.
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="marketing-agency-policy-accept"
                            checked={marketingAgencyPolicyAccepted}
                            onChange={(e) => setMarketingAgencyPolicyAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <label htmlFor="marketing-agency-policy-accept" className="text-sm text-gray-700">
                            I acknowledge that <strong>Domilea is a marketing agency and transaction facilitation platform only</strong>. Domilea does not own, inspect, warranty, or guarantee any asset listed on the platform and is not responsible for the condition, quality, or fitness of any product purchased.
                          </label>
                        </div>
                      </div>

                      <Button
                        fullWidth
                        disabled={!termsAccepted || !depositPolicyAccepted || !finalPaymentPolicyAccepted || !noDisputePolicyAccepted || !contactSellerPolicyAccepted || !marketingAgencyPolicyAccepted}
                        onClick={() => {
                          setTransaction(prev => ({
                            ...prev,
                            workflow: { ...prev.workflow, currentStep: 'deposit-payment', termsAcceptedAt: new Date() }
                          }))
                        }}
                      >
                        I Agree - Continue to Deposit Payment
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Card>
                  )}

                  {/* Step 3: Deposit Payment */}
                  {transaction.workflow.currentStep === 'deposit-payment' && (
                    <Card className="border-2 border-blue-200 bg-blue-50/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Banknote className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Deposit Payment</h3>
                          <p className="text-sm text-gray-600">Step 3 of 7</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 mb-4">
                        <div className="mb-4">
                          <label className="block text-gray-600 mb-2">Deposit Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-900">$</span>
                            <input
                              type="number"
                              min="1"
                              max="1000000"
                              value={customDepositAmount}
                              onChange={(e) => setCustomDepositAmount(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 text-2xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              placeholder="Enter deposit amount"
                            />
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                          This deposit will be held in escrow and applied to your final purchase price.
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                          <div className="flex items-start gap-3">
                            <Banknote className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-indigo-800">
                              <p className="font-medium mb-2">Secure Wire Transfer via Stripe</p>
                              <p className="text-indigo-700">
                                Click the button below to get unique bank details for your wire transfer. Stripe will automatically detect your wire and confirm the deposit.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Shield className="w-4 h-4" />
                        Secured by Stripe. Wire transfers are irrevocable and fully verified.
                      </div>

                      <Button
                        fullWidth
                        loading={processingPayment}
                        disabled={!customDepositAmount || Number(customDepositAmount) < 1}
                        onClick={async () => {
                          const amount = Number(customDepositAmount)
                          if (!amount || amount < 1) {
                            alert('Please enter a valid deposit amount.')
                            return
                          }
                          setProcessingPayment(true)
                          try {
                            const response = await api.createTransactionDepositCheckout(transaction.id, amount)
                            if (response.success && response.data?.url) {
                              window.location.href = response.data.url
                            } else {
                              alert('Failed to create checkout session. Please try again.')
                              setProcessingPayment(false)
                            }
                          } catch (error) {
                            console.error('Error creating checkout:', error)
                            alert('An error occurred. Please try again.')
                            setProcessingPayment(false)
                          }
                        }}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Pay ${Number(customDepositAmount || 0).toLocaleString()} Deposit via Wire Transfer
                      </Button>
                    </Card>
                  )}

                  {/* Step 4: Awaiting Admin Approval */}
                  {transaction.workflow.currentStep === 'awaiting-admin' && (
                    <Card className={`border-2 ${transaction.workflow.depositZellePending ? 'border-purple-200 bg-purple-50/30' : 'border-yellow-200 bg-yellow-50/30'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transaction.workflow.depositZellePending ? 'bg-purple-100' : 'bg-yellow-100'}`}>
                          {transaction.workflow.depositZellePending ? (
                            <CircleDollarSign className="w-6 h-6 text-purple-600" />
                          ) : (
                            <Shield className="w-6 h-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {transaction.workflow.depositZellePending ? 'Awaiting Zelle Verification' : 'Awaiting Admin Approval'}
                          </h3>
                          <p className="text-sm text-gray-600">Step 4 of 7</p>
                        </div>
                      </div>

                      {/* Zelle Pending Verification */}
                      {transaction.workflow.depositZellePending && (
                        <div className="bg-white rounded-xl p-6 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Zelle Payment Pending Verification</h4>
                          <p className="text-gray-600 mb-4">
                            Our admin team is verifying your Zelle payment. This usually takes 1-24 hours.
                            You will be notified once the payment is confirmed.
                          </p>
                          <div className="bg-purple-50 rounded-lg p-4 text-sm text-left space-y-2">
                            <p><strong>Transaction ID:</strong> {transaction.id}</p>
                            <p><strong>Payment Method:</strong> Zelle</p>
                            <p><strong>Amount:</strong> ${transaction.depositAmount ? transaction.depositAmount.toLocaleString() : Number(customDepositAmount || 0).toLocaleString()}.00</p>
                            <p><strong>Sent At:</strong> {transaction.workflow.depositZelleSentAt?.toLocaleString()}</p>
                            <p><strong>Status:</strong> <span className="text-purple-600 font-medium">Pending Admin Verification</span></p>
                          </div>
                        </div>
                      )}

                      {/* Card Payment Confirmed */}
                      {!transaction.workflow.depositZellePending && (
                        <div className="bg-white rounded-xl p-6 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Your Deposit Has Been Received</h4>
                          <p className="text-gray-600 mb-4">
                            Our team is reviewing your transaction and verifying the MC Authority details.
                            You will be notified once the admin approves and the Bill of Sale is ready.
                          </p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
                            <p><strong>Transaction ID:</strong> {transaction.id}</p>
                            <p><strong>Deposit ID:</strong> {transaction.workflow.depositStripeId || 'Processing...'}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-700">
                          <strong>What happens next?</strong> Once approved, you'll receive the Bill of Sale for review.
                          All parties (you, the seller, and admin) must approve before proceeding to final payment.
                        </p>
                      </div>
                    </Card>
                  )}

                  {/* Step 5: Bill of Sale - Multi-Party Approval */}
                  {transaction.workflow.currentStep === 'bill-of-sale' && (
                    <AgreementApprovalPanel
                      title="Bill of Sale Review"
                      description="Step 5 of 7 - All parties must approve to proceed"
                      approvalStatus={{
                        buyerApproved: !!transaction.workflow.buyerApprovedBillOfSaleAt || transaction.buyerApproved,
                        buyerApprovedAt: transaction.workflow.buyerApprovedBillOfSaleAt || transaction.buyerApprovedAt,
                        sellerApproved: !!transaction.workflow.sellerApprovedBillOfSaleAt || transaction.sellerApproved,
                        sellerApprovedAt: transaction.workflow.sellerApprovedBillOfSaleAt || transaction.sellerApprovedAt,
                        adminApproved: !!transaction.workflow.adminApprovedBillOfSaleAt || transaction.adminApproved,
                        adminApprovedAt: transaction.workflow.adminApprovedBillOfSaleAt || transaction.adminApprovedAt,
                      }}
                      buyer={{ id: transaction.buyer.id, name: transaction.buyer.name }}
                      seller={{ id: transaction.seller.id, name: transaction.seller.name }}
                      userRole={userRole}
                      onBuyerApprove={async () => {
                        if (!transactionId) return
                        const response = await api.buyerApproveTransaction(transactionId)
                        if (response.success) {
                          toast.success('Bill of Sale approved!')
                          setTransaction(prev => ({
                            ...prev,
                            buyerApproved: true,
                            buyerApprovedAt: new Date(),
                            workflow: { ...prev.workflow, buyerApprovedBillOfSaleAt: new Date() }
                          }))
                          await refreshTransaction()
                        }
                      }}
                      onSellerApprove={async () => {
                        if (!transactionId) return
                        const response = await api.sellerApproveTransaction(transactionId)
                        if (response.success) {
                          toast.success('Bill of Sale approved!')
                          setTransaction(prev => ({
                            ...prev,
                            sellerApproved: true,
                            sellerApprovedAt: new Date(),
                            workflow: { ...prev.workflow, sellerApprovedBillOfSaleAt: new Date() }
                          }))
                          await refreshTransaction()
                        }
                      }}
                      onAdminApprove={async () => {
                        if (!transactionId) return
                        const response = await api.adminApproveTransaction(transactionId)
                        if (response.success) {
                          toast.success('Transaction finalized! Payment instructions sent.')
                          setTransaction(prev => ({
                            ...prev,
                            adminApproved: true,
                            adminApprovedAt: new Date(),
                            status: 'payment-pending',
                            workflow: {
                              ...prev.workflow,
                              adminApprovedBillOfSaleAt: new Date(),
                              currentStep: 'final-payment'
                            },
                            paymentInstructions: `Payment Instructions for Transaction #${transaction.id}\n\nAmount Due: $${transaction.finalPaymentAmount.toLocaleString()}\n\nPayment Method: Wire Transfer via Stripe\nClick the "Pay via Wire Transfer" button to get unique bank details.\n\nFor questions: payments@domilea.com`
                          }))
                          await refreshTransaction()
                        }
                      }}
                      adminApproveLabel="Finalize & Send Payment Instructions"
                    >
                      {/* Purchase Agreement Section */}
                      <div className="space-y-4">
                        {/* Agreement Summary */}
                        <div className="bg-white rounded-xl p-4">
                          <div className="border border-gray-200 rounded-lg p-4 text-sm">
                            <p className="font-semibold mb-2">MC Authority Purchase Agreement</p>
                            <p className="text-gray-600 mb-2">
                              This agreement confirms the sale of MC Authority #{transaction.listing.mcNumber} from
                              {' '}<span className="font-medium">{transaction.seller.name}</span> to
                              {' '}<span className="font-medium">{transaction.buyer.name}</span> for the {isSeller ? 'asking price' : 'agreed price'} of
                              {' '}<span className="font-medium">${isSeller ? (transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0).toLocaleString() : transaction.agreedPrice.toLocaleString()}</span>.
                            </p>
                            <p className="text-gray-500 text-xs">Generated: {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Purchase Agreement Upload / Download */}
                        {(() => {
                          const agreementDoc = transaction.sellerDocuments.find(
                            (d: any) => d.type === 'PURCHASE_AGREEMENT'
                          )
                          const buyerSignedDoc = transaction.sellerDocuments.find(
                            (d: any) => d.type === 'SIGNED_AGREEMENT' && d.uploaderId === transaction.buyer.id
                          )
                          const sellerSignedDoc = transaction.sellerDocuments.find(
                            (d: any) => d.type === 'SIGNED_AGREEMENT' && d.uploaderId === transaction.seller.id
                          )

                          return (
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-blue-600" />
                                Purchase Agreement Document
                              </h4>

                              {/* Upload Agreement (Admin only) */}
                              {!agreementDoc && isAdmin && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                                  <p className="text-sm text-blue-800 font-medium mb-2">
                                    Upload a purchase agreement for this transaction
                                  </p>
                                  <p className="text-xs text-blue-600 mb-3">
                                    Upload a PDF or Word document. Both parties will be able to review, download, and sign it.
                                  </p>
                                  <input
                                    type="file"
                                    id="panel-agreement-upload"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      e.target.value = ''
                                      setAgreementUploading(true)
                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        formData.append('type', 'PURCHASE_AGREEMENT')
                                        await api.uploadTransactionDocument(transactionId!, formData)
                                        toast.success('Purchase agreement uploaded successfully!')
                                        await refreshTransaction()
                                      } catch (err: any) {
                                        toast.error(err.message || 'Failed to upload agreement')
                                      } finally {
                                        setAgreementUploading(false)
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={agreementUploading}
                                    onClick={() => document.getElementById('panel-agreement-upload')?.click()}
                                  >
                                    {agreementUploading ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4 mr-2" />
                                    )}
                                    {agreementUploading ? 'Uploading...' : 'Select Agreement File'}
                                  </Button>
                                </div>
                              )}

                              {/* Waiting for admin to upload (buyer/seller view) */}
                              {!agreementDoc && (isBuyer || isSeller) && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Waiting for Domilea to upload the purchase agreement...
                                  </p>
                                </div>
                              )}

                              {/* Agreement uploaded — Show download & signing options */}
                              {agreementDoc && (
                                <div className="space-y-3">
                                  {/* Agreement file info + download + delete */}
                                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-5 h-5 text-green-600" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{agreementDoc.name}</p>
                                        <p className="text-xs text-gray-500">
                                          Uploaded {new Date(agreementDoc.uploadedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const res = await api.getDocumentUrl(agreementDoc.id)
                                            if (res.success && res.data?.url) {
                                              window.open(res.data.url, '_blank')
                                            }
                                          } catch {
                                            toast.error('Failed to get download link')
                                          }
                                        }}
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                      </Button>
                                      {isAdmin && (
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={async () => {
                                            if (!confirm('Delete this agreement and upload a new one?')) return
                                            try {
                                              await api.deleteDocument(agreementDoc.id)
                                              toast.success('Agreement deleted. You can upload a new one.')
                                              await refreshTransaction()
                                            } catch (err: any) {
                                              toast.error(err.message || 'Failed to delete')
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Signing Options */}
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <h5 className="text-sm font-semibold text-indigo-800 mb-2">How to Sign</h5>
                                    <p className="text-xs text-indigo-700 mb-3">
                                      Choose one option: sign electronically by clicking "Approve" below, or download the agreement, sign it physically, and upload the signed copy.
                                    </p>

                                    {/* Signed copies status */}
                                    <div className="space-y-2 mb-3">
                                      {/* Buyer signed copy */}
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">Buyer signed copy:</span>
                                        {buyerSignedDoc ? (
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-600 flex items-center gap-1">
                                              <CheckCircle className="w-4 h-4" />
                                              Uploaded
                                            </span>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={async () => {
                                                try {
                                                  const res = await api.getDocumentUrl(buyerSignedDoc.id)
                                                  if (res.success && res.data?.url) window.open(res.data.url, '_blank')
                                                } catch { toast.error('Failed to get download link') }
                                              }}
                                            >
                                              <Download className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-xs">Not yet uploaded</span>
                                        )}
                                      </div>

                                      {/* Seller signed copy */}
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">Seller signed copy:</span>
                                        {sellerSignedDoc ? (
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-600 flex items-center gap-1">
                                              <CheckCircle className="w-4 h-4" />
                                              Uploaded
                                            </span>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={async () => {
                                                try {
                                                  const res = await api.getDocumentUrl(sellerSignedDoc.id)
                                                  if (res.success && res.data?.url) window.open(res.data.url, '_blank')
                                                } catch { toast.error('Failed to get download link') }
                                              }}
                                            >
                                              <Download className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-xs">Not yet uploaded</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Upload signed copy (buyer, seller, or admin if they haven't uploaded one yet) */}
                                    {((isBuyer && !buyerSignedDoc) || (isSeller && !sellerSignedDoc) || (isAdmin && (!buyerSignedDoc || !sellerSignedDoc))) && (
                                      <>
                                        <input
                                          type="file"
                                          id="signed-copy-upload"
                                          className="hidden"
                                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            e.target.value = ''
                                            setSignedCopyUploading(true)
                                            try {
                                              const formData = new FormData()
                                              formData.append('file', file)
                                              formData.append('type', 'SIGNED_AGREEMENT')
                                              await api.uploadTransactionDocument(transactionId!, formData)
                                              toast.success('Signed copy uploaded!')
                                              await refreshTransaction()
                                            } catch (err: any) {
                                              toast.error(err.message || 'Failed to upload signed copy')
                                            } finally {
                                              setSignedCopyUploading(false)
                                            }
                                          }}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          fullWidth
                                          disabled={signedCopyUploading}
                                          onClick={() => document.getElementById('signed-copy-upload')?.click()}
                                        >
                                          {signedCopyUploading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          ) : (
                                            <Upload className="w-4 h-4 mr-2" />
                                          )}
                                          {signedCopyUploading ? 'Uploading...' : 'Upload Signed Copy'}
                                        </Button>
                                      </>
                                    )}

                                    {/* Admin can view all signed copies */}
                                    {isAdmin && (
                                      <p className="text-xs text-indigo-600 mt-2">
                                        {buyerSignedDoc && sellerSignedDoc
                                          ? 'Both parties have uploaded signed copies.'
                                          : `Waiting for ${!buyerSignedDoc ? 'buyer' : ''}${!buyerSignedDoc && !sellerSignedDoc ? ' and ' : ''}${!sellerSignedDoc ? 'seller' : ''} to upload signed copies.`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {/* Disclaimer */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-700">
                            <strong>Important:</strong> By clicking "Approve" below, you are electronically signing this agreement.
                            Alternatively, download the agreement, sign it, and upload the signed copy above.
                            All three parties (Buyer, Seller, and Admin) must approve before proceeding to final payment.
                          </p>
                        </div>
                      </div>
                    </AgreementApprovalPanel>
                  )}

                  {/* Step 6: Final Payment */}
                  {transaction.workflow.currentStep === 'final-payment' && (
                    <Card className="border-2 border-green-200 bg-green-50/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <CircleDollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Final Payment</h3>
                          <p className="text-sm text-gray-600">Step 6 of 7 - Almost there!</p>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-4">Payment Summary</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Purchase Price</span>
                            <span className="font-medium">${transaction.agreedPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-green-600">
                            <span>Deposit Paid</span>
                            <span>-${transaction.depositAmount.toLocaleString()}</span>
                          </div>
                          <div className="border-t pt-3 flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Balance Due</span>
                            <span className="text-2xl font-bold text-gray-900">${transaction.finalPaymentAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Show different UI based on whether payment has been submitted */}
                      {!paymentSubmitted ? (
                        <>
                          {/* Stripe Card Payment - Primary Option */}
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-4">
                            <h5 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                              <Banknote className="w-5 h-5" />
                              Pay with Wire Transfer
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Secure & Automated</span>
                            </h5>
                            <p className="text-sm text-indigo-700 mb-4">
                              Pay securely via wire transfer. Stripe provides unique bank details for your wire. Funds are automatically split — the seller receives their payout directly.
                            </p>
                            <Button
                              fullWidth
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={async () => {
                                try {
                                  setSubmittingFinalPayment(true)
                                  const response = await api.createFinalPaymentCheckout(transactionId!)
                                  if (response.success && response.data?.url) {
                                    window.location.href = response.data.url
                                  } else {
                                    toast.error('Failed to create payment session')
                                  }
                                } catch (err: any) {
                                  toast.error(err.message || 'Failed to initiate payment')
                                } finally {
                                  setSubmittingFinalPayment(false)
                                }
                              }}
                              disabled={submittingFinalPayment}
                            >
                              {submittingFinalPayment ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Banknote className="w-4 h-4 mr-2" />
                              )}
                              Pay ${transaction.finalPaymentAmount.toLocaleString()} via Wire Transfer
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                            <Shield className="w-4 h-4" />
                            Secured by Stripe. Wire transfers are irrevocable — no chargebacks or disputes.
                          </div>
                        </>
                      ) : (
                        /* Payment Initiated - Awaiting Wire */
                        <div className="text-center py-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-blue-600" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">Wire Transfer Initiated</h4>
                          <p className="text-gray-600 mb-4">
                            Follow the bank details provided by Stripe to complete your wire transfer.
                          </p>
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                            <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                              <Banknote className="w-4 h-4" />
                              Awaiting Wire Transfer
                            </h5>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Payment amount: ${transaction.finalPaymentAmount.toLocaleString()}</li>
                              <li>• Method: Wire Transfer</li>
                              <li>• Stripe will automatically detect and confirm your wire</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-3">
                              Wire transfers typically take 1-2 business days to arrive.
                              You will be notified once the payment is confirmed.
                            </p>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Step 7: Completed */}
                  {transaction.workflow.currentStep === 'completed' && (
                    <Card className="border-2 border-green-300 bg-green-50">
                      <div className="text-center py-6">
                        <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCheck className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-800 mb-2">Congratulations!</h3>
                        <p className="text-green-700 mb-4">
                          The MC Authority #{transaction.listing.mcNumber} has been successfully transferred to you.
                        </p>
                        <div className="bg-white rounded-xl p-4 text-left">
                          <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              All business documents are now available in the Documents tab
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              Seller contact information has been released
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              FMCSA transfer paperwork will be processed within 2-4 weeks
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              Seller will provide {transaction.sellerInfo.transitionSupportDays} days of transition support
                            </li>
                          </ul>
                        </div>
                        <Button className="mt-4" onClick={() => setActiveTab('documents')}>
                          <Download className="w-4 h-4 mr-2" />
                          View & Download Documents
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Seller/Admin view - Show status overview */}
              {(userRole === 'seller' || userRole === 'admin') && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Deal Overview
                  </h3>
                  {userRole === 'seller' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-sm text-green-600 mb-1">Your Asking Price</p>
                        <p className="text-xl font-bold text-green-700">${(transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600 mb-1">Buyer Deposit</p>
                        <p className="text-xl font-bold text-blue-700">${transaction.depositAmount.toLocaleString()}</p>
                        <p className="text-xs text-blue-500 mt-1">Held in escrow</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-sm text-purple-600 mb-1">Transaction Status</p>
                        <p className="text-lg font-bold text-purple-700">{transaction.depositPaid ? 'Deposit Secured' : 'Awaiting Deposit'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Seller's Asking Price</p>
                        <p className="text-xl font-bold text-gray-700">${(transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-sm text-green-600 mb-1">Listing Price (Buyer Pays)</p>
                        <p className="text-xl font-bold text-green-700">${transaction.agreedPrice.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600 mb-1">Deposit Paid</p>
                        <p className="text-xl font-bold text-blue-700">${transaction.depositAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-sm text-amber-600 mb-1">Broker Margin</p>
                        <p className="text-xl font-bold text-amber-700">${(transaction.agreedPrice - (transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                {/* What's Being Transferred */}
                <h4 className="font-medium text-gray-900 mb-3">Items Included in Transfer</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'MC Authority', included: transaction.transferItems.mcAuthority, icon: Award },
                    { label: 'DOT Number', included: transaction.transferItems.dotNumber, icon: Hash },
                    { label: 'Amazon Relay Account', included: transaction.transferItems.amazonRelayAccount, icon: Package },
                    { label: 'Highway Account', included: transaction.transferItems.highwayAccount, icon: Truck },
                    { label: 'Email Accounts', included: transaction.transferItems.emailAccounts.length > 0, icon: Mail },
                    { label: 'Phone Numbers', included: transaction.transferItems.phoneNumbers.length > 0, icon: Phone },
                    { label: 'Factoring Agreements', included: transaction.transferItems.factoringAgreements, icon: Banknote },
                  ].map((item, index) => (
                    <div key={index} className={`flex items-center gap-2 p-3 rounded-lg ${item.included ? 'bg-green-50' : 'bg-gray-50'}`}>
                      {item.included ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <item.icon className={`w-4 h-4 ${item.included ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={item.included ? 'text-gray-900' : 'text-gray-400'}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Contact Info Being Transferred */}
                {(transaction.transferItems.emailAccounts.length > 0 || transaction.transferItems.phoneNumbers.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information Included</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transaction.transferItems.emailAccounts.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-500 mb-2">Email Accounts</p>
                          {transaction.transferItems.emailAccounts.map((email, idx) => (
                            <p key={idx} className="text-gray-900">{email}</p>
                          ))}
                        </div>
                      )}
                      {transaction.transferItems.phoneNumbers.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-500 mb-2">Phone Numbers</p>
                          {transaction.transferItems.phoneNumbers.map((phone, idx) => (
                            <p key={idx} className="text-gray-900">{phone}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
              )}

              {/* Admin Control Panel - Round Table View */}
              {userRole === 'admin' && (
                <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Admin Control Panel</h3>
                        <p className="text-sm text-gray-500">Transaction Round Table</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {transaction.status.replace(/-/g, ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Round Table - All Parties Status */}
                  <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-600" />
                      All Parties Status
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Buyer Status */}
                      <div className={`p-4 rounded-xl border-2 ${transaction.buyerApproved ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.buyerApproved ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-sm">Buyer</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{transaction.buyer.name}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {transaction.buyerApproved ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Seller Status */}
                      <div className={`p-4 rounded-xl border-2 ${transaction.sellerApproved ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.sellerApproved ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-sm">Seller</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{transaction.seller.name}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {transaction.sellerApproved ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Admin Status */}
                      <div className={`p-4 rounded-xl border-2 ${transaction.adminApproved ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.adminApproved ? 'bg-green-500' : 'bg-amber-500'}`}>
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-sm">Admin</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Domilea</p>
                        <div className="flex items-center gap-1 mt-2">
                          {transaction.adminApproved ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Finalized
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Your Turn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Financial Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{isSeller ? 'Your Asking Price' : isBuyer ? 'Purchase Price' : 'Listing Price'}</p>
                        <p className="text-lg font-bold text-gray-900">${isSeller ? (transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0).toLocaleString() : transaction.agreedPrice.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-lg p-3 ${transaction.depositPaid ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <p className="text-xs text-gray-500">Deposit</p>
                        <p className={`text-lg font-bold ${transaction.depositPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                          ${transaction.depositAmount.toLocaleString()}
                          {transaction.depositPaid && <CheckCircle className="w-4 h-4 inline ml-1" />}
                        </p>
                      </div>
                      <div className={`rounded-lg p-3 ${transaction.finalPaymentPaid ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <p className="text-xs text-gray-500">Final Payment</p>
                        <p className={`text-lg font-bold ${transaction.finalPaymentPaid ? 'text-green-600' : 'text-gray-900'}`}>
                          ${transaction.finalPaymentAmount.toLocaleString()}
                          {transaction.finalPaymentPaid && <CheckCircle className="w-4 h-4 inline ml-1" />}
                        </p>
                      </div>
                      {userRole === 'admin' && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Broker Margin</p>
                          <p className="text-lg font-bold text-amber-600">${(transaction.agreedPrice - (transaction.listing.listingPrice ?? transaction.listing.askingPrice ?? transaction.listing.price ?? 0)).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buyer Workflow Progress */}
                  <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-blue-600" />
                      Buyer Workflow Progress
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                      {[
                        { step: 'confirm-intent', label: 'Intent', num: 1 },
                        { step: 'terms-agreement', label: 'Terms', num: 2 },
                        { step: 'deposit-payment', label: 'Deposit', num: 3 },
                        { step: 'awaiting-admin', label: 'Admin', num: 4 },
                        { step: 'bill-of-sale', label: 'Bill', num: 5 },
                        { step: 'final-payment', label: 'Payment', num: 6 },
                        { step: 'completed', label: 'Done', num: 7 },
                      ].map((item, index) => {
                        const stepOrder = ['confirm-intent', 'terms-agreement', 'deposit-payment', 'awaiting-admin', 'bill-of-sale', 'final-payment', 'completed']
                        const currentIndex = stepOrder.indexOf(transaction.workflow.currentStep)
                        const itemIndex = stepOrder.indexOf(item.step)
                        const isCompleted = itemIndex < currentIndex
                        const isCurrent = item.step === transaction.workflow.currentStep

                        return (
                          <div key={item.step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCompleted ? 'bg-green-500 text-white' :
                              isCurrent ? 'bg-blue-500 text-white' :
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {isCompleted ? <Check className="w-4 h-4" /> : item.num}
                            </div>
                            <span className={`text-xs mt-1 ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{item.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Zelle Payment Verification Section */}
                  {transaction.workflow.depositZellePending && !transaction.workflow.depositZelleConfirmedByAdmin && (
                    <div className="bg-purple-50 rounded-xl p-4 mb-4 border-2 border-purple-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <CircleDollarSign className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800">Action Required: Verify Zelle Deposit</h4>
                          <p className="text-xs text-purple-600">Buyer claims to have sent Zelle payment</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Buyer:</span>
                          <span className="font-medium">{transaction.buyer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount Expected:</span>
                          <span className="font-bold text-purple-600">${transaction.depositAmount ? transaction.depositAmount.toLocaleString() : Number(customDepositAmount || 0).toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction Reference:</span>
                          <span className="font-mono font-medium">TXN-{transaction.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Buyer Confirmed Sent:</span>
                          <span className="font-medium">{transaction.workflow.depositZelleSentAt?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setTransaction(prev => ({
                              ...prev,
                              depositPaid: true,
                              depositPaidAt: new Date(),
                              workflow: {
                                ...prev.workflow,
                                depositZellePending: false,
                                depositZelleConfirmedByAdmin: true,
                                depositZelleConfirmedAt: new Date(),
                                depositPaidAt: new Date()
                              }
                            }))
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Zelle Received
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            alert('Buyer will be notified that payment was not found.')
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Not Found
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Zelle Confirmed Badge */}
                  {transaction.workflow.depositZelleConfirmedByAdmin && (
                    <div className="bg-green-50 rounded-xl p-3 mb-4 border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Zelle Deposit Verified</span>
                        <span className="text-xs text-green-600 ml-auto">{transaction.workflow.depositZelleConfirmedAt?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Final Payment Zelle Verification */}
                  {transaction.workflow.finalPaymentZellePending && !transaction.workflow.finalPaymentZelleConfirmedByAdmin && (
                    <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CircleDollarSign className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-800">Final Payment Zelle Pending Verification</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Buyer:</span>
                          <span className="font-medium">{transaction.buyer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount Expected:</span>
                          <span className="font-bold text-purple-600">${transaction.finalPaymentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction Reference:</span>
                          <span className="font-mono font-medium">TXN-{transaction.id}-FINAL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Buyer Confirmed Sent:</span>
                          <span className="font-medium">{transaction.workflow.finalPaymentZelleSentAt?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setTransaction(prev => ({
                              ...prev,
                              finalPaymentPaid: true,
                              finalPaymentPaidAt: new Date(),
                              status: 'completed',
                              completedAt: new Date(),
                              workflow: {
                                ...prev.workflow,
                                currentStep: 'completed',
                                finalPaymentZellePending: false,
                                finalPaymentZelleConfirmedByAdmin: true,
                                finalPaymentZelleConfirmedAt: new Date(),
                                finalPaymentPaidAt: new Date(),
                                completedAt: new Date()
                              }
                            }))
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Final Payment Received
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Payment Not Found
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Admin Actions Based on Current State */}
                  <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      Admin Actions
                    </h4>

                    <div className="space-y-3">
                      {/* Reassign buyer or seller (admin override). Available at any workflow step. */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <UserCog className="w-4 h-4" />
                          Reassign Buyer / Seller
                        </h5>
                        <p className="text-xs text-amber-800 mb-3">
                          Swap the buyer or seller on this transaction. Logged to the audit trail.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="bg-white rounded-lg border border-amber-200 p-3">
                            <div className="text-xs text-gray-500 mb-1">Current Buyer</div>
                            <div className="text-sm font-medium text-gray-900 truncate">{transaction.buyer?.name || '—'}</div>
                            <div className="text-xs text-gray-600 truncate">{transaction.buyer?.email || ''}</div>
                            <Button
                              variant="outline"
                              className="mt-2 w-full text-xs"
                              onClick={() => {
                                setReassignRole(reassignRole === 'buyer' ? null : 'buyer')
                                setReassignQuery('')
                                setReassignResults([])
                              }}
                            >
                              {reassignRole === 'buyer' ? 'Cancel' : 'Change Buyer'}
                            </Button>
                          </div>
                          <div className="bg-white rounded-lg border border-amber-200 p-3">
                            <div className="text-xs text-gray-500 mb-1">Current Seller</div>
                            <div className="text-sm font-medium text-gray-900 truncate">{transaction.seller?.name || '—'}</div>
                            <div className="text-xs text-gray-600 truncate">{transaction.seller?.email || ''}</div>
                            <Button
                              variant="outline"
                              className="mt-2 w-full text-xs"
                              onClick={() => {
                                setReassignRole(reassignRole === 'seller' ? null : 'seller')
                                setReassignQuery('')
                                setReassignResults([])
                              }}
                            >
                              {reassignRole === 'seller' ? 'Cancel' : 'Change Seller'}
                            </Button>
                          </div>
                        </div>

                        {reassignRole && (
                          <div className="bg-white border border-amber-300 rounded-lg p-3">
                            <div className="text-xs font-semibold text-amber-900 mb-2 capitalize">
                              Search for new {reassignRole}
                            </div>
                            <div className="flex gap-2 mb-2">
                              <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={reassignQuery}
                                  onChange={(e) => setReassignQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      searchReassignUsers(reassignRole, reassignQuery)
                                    }
                                  }}
                                  placeholder="Name or email"
                                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                              </div>
                              <Button
                                variant="primary"
                                className="text-xs px-3"
                                disabled={reassignSearching || !reassignQuery.trim()}
                                onClick={() => searchReassignUsers(reassignRole, reassignQuery)}
                              >
                                {reassignSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                              </Button>
                            </div>

                            {reassignResults.length > 0 && (
                              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded divide-y divide-gray-100">
                                {reassignResults.map((u) => (
                                  <div key={u.id} className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                                      <div className="text-xs text-gray-600 truncate">
                                        {u.email}{u.companyName ? ` · ${u.companyName}` : ''}
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="text-xs px-2 py-1 flex-shrink-0"
                                      disabled={reassignSubmitting}
                                      onClick={() => handleReassignParty(u.id, `${u.name} (${u.email})`)}
                                    >
                                      {reassignSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Select'}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {!reassignSearching && reassignQuery && reassignResults.length === 0 && (
                              <div className="text-xs text-gray-500 text-center py-2">
                                No matching users. Try a different search.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Step 1-3: Waiting for buyer to complete initial steps */}
                      {['confirm-intent', 'terms-agreement', 'deposit-payment'].includes(transaction.workflow.currentStep) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Waiting for buyer to complete: <span className="font-medium capitalize">{transaction.workflow.currentStep.replace(/-/g, ' ')}</span>
                          </p>
                        </div>
                      )}

                      {/* Step 4: Admin needs to approve deposit and generate bill of sale */}
                      {transaction.workflow.currentStep === 'awaiting-admin' && (
                        <>
                          {!transaction.depositPaid && !transaction.workflow.depositZellePending && (
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                              <p className="text-sm text-yellow-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Deposit not yet received. Waiting for buyer payment.
                              </p>
                            </div>
                          )}

                          {transaction.depositPaid && (
                            <div className="space-y-3">
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-sm text-green-700 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Deposit confirmed! Ready to proceed.
                                </p>
                              </div>
                              <Button
                                fullWidth
                                variant="primary"
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                onClick={handleAdminApproveDeposit}
                                disabled={adminActionLoading}
                              >
                                {adminActionLoading ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <FileCheck className="w-4 h-4 mr-2" />
                                )}
                                Approve Deposit & Generate Bill of Sale
                              </Button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Step 5: Bill of Sale - waiting for approvals */}
                      {transaction.workflow.currentStep === 'bill-of-sale' && (
                        <div className="space-y-3">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-700 mb-3">Bill of Sale generated. Waiting for party approvals:</p>
                            <div className="grid grid-cols-3 gap-2">
                              <div className={`p-2 rounded text-center text-xs ${transaction.buyerApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Buyer: {transaction.buyerApproved ? 'Approved' : 'Pending'}
                              </div>
                              <div className={`p-2 rounded text-center text-xs ${transaction.sellerApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Seller: {transaction.sellerApproved ? 'Approved' : 'Pending'}
                              </div>
                              <div className={`p-2 rounded text-center text-xs ${transaction.adminApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                Admin: {transaction.adminApproved ? 'Approved' : 'Ready'}
                              </div>
                            </div>
                          </div>

                          {/* Purchase Agreement Upload (Admin) */}
                          {userRole === 'admin' && (
                            (() => {
                              const hasAgreement = transaction.sellerDocuments.some((d: any) => d.type === 'PURCHASE_AGREEMENT')
                              const buyerSigned = transaction.sellerDocuments.some((d: any) => d.type === 'SIGNED_AGREEMENT' && d.uploaderId === transaction.buyer.id)
                              const sellerSigned = transaction.sellerDocuments.some((d: any) => d.type === 'SIGNED_AGREEMENT' && d.uploaderId === transaction.seller.id)
                              const agreementFile = transaction.sellerDocuments.find((d: any) => d.type === 'PURCHASE_AGREEMENT')

                              return (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                  <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                                    <FileCheck className="w-4 h-4" />
                                    Purchase Agreement
                                  </h4>

                                  {!hasAgreement ? (
                                    <>
                                      <p className="text-sm text-indigo-700 mb-3">
                                        Upload a purchase agreement for buyer and seller to review and sign.
                                      </p>
                                      <input
                                        type="file"
                                        id="admin-agreement-upload"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0]
                                          if (!file) return
                                          e.target.value = ''
                                          setAgreementUploading(true)
                                          try {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            formData.append('type', 'PURCHASE_AGREEMENT')
                                            await api.uploadTransactionDocument(transactionId!, formData)
                                            toast.success('Purchase agreement uploaded!')
                                            await refreshTransaction()
                                          } catch (err: any) {
                                            toast.error(err.message || 'Failed to upload agreement')
                                          } finally {
                                            setAgreementUploading(false)
                                          }
                                        }}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        disabled={agreementUploading}
                                        onClick={() => document.getElementById('admin-agreement-upload')?.click()}
                                      >
                                        {agreementUploading ? (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        {agreementUploading ? 'Uploading...' : 'Upload Purchase Agreement'}
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-medium text-green-800 truncate">{agreementFile?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                              try {
                                                const res = await api.getDocumentUrl(agreementFile!.id)
                                                if (res.success && res.data?.url) window.open(res.data.url, '_blank')
                                              } catch { toast.error('Failed to get download link') }
                                            }}
                                          >
                                            <Download className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={async () => {
                                              if (!confirm('Delete this agreement and upload a new one?')) return
                                              try {
                                                await api.deleteDocument(agreementFile!.id)
                                                toast.success('Agreement deleted. You can upload a new one.')
                                                await refreshTransaction()
                                              } catch (err: any) {
                                                toast.error(err.message || 'Failed to delete')
                                              }
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="text-xs space-y-1">
                                        <p className={buyerSigned ? 'text-green-600' : 'text-gray-500'}>
                                          {buyerSigned ? '✓ Buyer signed copy uploaded' : '○ Buyer signed copy: pending'}
                                        </p>
                                        <p className={sellerSigned ? 'text-green-600' : 'text-gray-500'}>
                                          {sellerSigned ? '✓ Seller signed copy uploaded' : '○ Seller signed copy: pending'}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )
                            })()
                          )}

                          {/* Admin can approve after both parties approved */}
                          {transaction.buyerApproved && transaction.sellerApproved && !transaction.adminApproved && (
                            <div className="space-y-4">
                              {/* Contract Upload Section */}
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                  <FileCheck className="w-4 h-4" />
                                  Attach Final Contract (Optional)
                                </h4>
                                <p className="text-sm text-amber-700 mb-3">
                                  Upload the signed Bill of Sale or final contract document before approving.
                                </p>
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null
                                      setAdminContractFile(file)
                                    }}
                                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                  />
                                  {adminContractFile && (
                                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                                      <CheckCircle className="w-4 h-4" />
                                      <span className="truncate">{adminContractFile.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => setAdminContractFile(null)}
                                        className="ml-auto text-gray-500 hover:text-red-500"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                fullWidth
                                variant="primary"
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                onClick={handleAdminFinalApprove}
                                disabled={adminActionLoading}
                              >
                                {adminActionLoading ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCheck className="w-4 h-4 mr-2" />
                                )}
                                {adminContractFile ? 'Upload Contract & Approve Bill of Sale' : 'Approve Bill of Sale & Send Payment Instructions'}
                              </Button>
                            </div>
                          )}

                          {/* Simulate party approvals for testing */}
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            {!transaction.buyerApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setTransaction(prev => ({ ...prev, buyerApproved: true, buyerApprovedAt: new Date() }))}
                              >
                                Simulate Buyer Approve
                              </Button>
                            )}
                            {!transaction.sellerApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setTransaction(prev => ({ ...prev, sellerApproved: true, sellerApprovedAt: new Date() }))}
                              >
                                Simulate Seller Approve
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 6: Final Payment */}
                      {transaction.workflow.currentStep === 'final-payment' && (
                        <div className="space-y-3">
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <p className="text-sm text-orange-700 flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4" />
                              Awaiting final payment of <strong>${transaction.finalPaymentAmount.toLocaleString()}</strong>
                            </p>
                            <p className="text-xs text-orange-600">Payment instructions have been sent to the buyer.</p>
                          </div>

                          <Button
                            fullWidth
                            variant="primary"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleAdminConfirmPayment}
                            disabled={adminActionLoading}
                          >
                            {adminActionLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirm Wire Payment Received
                          </Button>
                        </div>
                      )}

                      {/* Step 7: Completed */}
                      {transaction.workflow.currentStep === 'completed' && (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-800">Transaction Completed!</p>
                              <p className="text-xs text-green-600">All steps finalized on {transaction.completedAt?.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => {
                              const summary = [
                                `Transaction Summary`,
                                `====================`,
                                `Transaction ID: ${transactionId}`,
                                `Status: ${transaction.status}`,
                                ``,
                                `Listing: MC#${transaction.listing?.mcNumber || 'N/A'}`,
                                `Legal Name: ${(transaction.listing as any)?.legalName || 'N/A'}`,
                                ``,
                                `Buyer: ${transaction.buyer?.name || 'N/A'} (${transaction.buyer?.email || 'N/A'})`,
                                `Seller: ${transaction.seller?.name || 'N/A'} (${transaction.seller?.email || 'N/A'})`,
                                ``,
                                `Agreed Price: $${transaction.agreedPrice?.toLocaleString() || '0'}`,
                                `Deposit: $${transaction.depositAmount?.toLocaleString() || '0'} (${transaction.depositPaid ? 'Paid' : 'Pending'})`,
                                `Final Payment: $${transaction.finalPaymentAmount?.toLocaleString() || '0'}`,
                                ``,
                                `Buyer Approved: ${transaction.buyerApproved ? 'Yes' : 'No'}`,
                                `Seller Approved: ${transaction.sellerApproved ? 'Yes' : 'No'}`,
                                `Admin Approved: ${transaction.adminApproved ? 'Yes' : 'No'}`,
                                ``,
                                `Created: ${transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}`,
                                `Completed: ${transaction.completedAt ? new Date(transaction.completedAt).toLocaleString() : 'N/A'}`,
                              ].join('\n')
                              const blob = new Blob([summary], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `transaction-${transactionId?.slice(0, 8)}-summary.txt`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              URL.revokeObjectURL(url)
                              toast.success('Summary exported')
                            }}>
                              <Download className="w-4 h-4 mr-1" />
                              Export Summary
                            </Button>
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                const res = await api.adminSendTransactionEmails(transactionId!)
                                if (res.success) {
                                  toast.success(`Confirmation emails sent to ${res.data.buyerEmail} and ${res.data.sellerEmail}`)
                                }
                              } catch (err: any) {
                                toast.error(err.message || 'Failed to send confirmation emails')
                              }
                            }}>
                              <Mail className="w-4 h-4 mr-1" />
                              Send Confirmation
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Verification */}
                  <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Document Verification
                    </h4>
                    <div className="space-y-2">
                      {transaction.sellerDocuments.slice(0, 4).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 truncate max-w-[180px]">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {doc.verified ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs py-1 px-2" onClick={async () => {
                                try {
                                  await api.verifyDocument(doc.id, true)
                                  toast.success('Document verified')
                                  await refreshTransaction()
                                } catch (err: any) {
                                  toast.error(err.message || 'Failed to verify document')
                                }
                              }}>
                                Verify
                              </Button>
                            )}
                            <Button size="sm" variant="danger" className="text-xs py-1 px-2" onClick={async () => {
                              if (!confirm(`Delete "${doc.name}"?`)) return
                              try {
                                await api.deleteDocument(doc.id)
                                toast.success('Document deleted')
                                await refreshTransaction()
                              } catch (err: any) {
                                toast.error(err.message || 'Failed to delete')
                              }
                            }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button fullWidth variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab('documents')}>
                        View All {transaction.sellerDocuments.length} Documents
                      </Button>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('messages')}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message Parties
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('timeline')}>
                      <ScrollText className="w-4 h-4 mr-1" />
                      Activity Log
                    </Button>
                  </div>

                  {/* Manual Step Control - For Testing */}
                  <div className="mt-6 pt-4 border-t border-amber-200">
                    <h4 className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Manual Step Control (Testing)
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">Current Step: <span className="font-mono font-bold text-amber-600">{transaction.workflow.currentStep}</span></p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { step: 'confirm-intent', label: '1. Confirm Intent', status: 'TERMS_PENDING' },
                        { step: 'terms-agreement', label: '2. Terms', status: 'TERMS_PENDING' },
                        { step: 'deposit-payment', label: '3. Deposit', status: 'AWAITING_DEPOSIT' },
                        { step: 'awaiting-admin', label: '4. Awaiting Admin', status: 'DEPOSIT_RECEIVED' },
                        { step: 'bill-of-sale', label: '5. Bill of Sale', status: 'IN_REVIEW' },
                        { step: 'final-payment', label: '6. Final Payment', status: 'PAYMENT_PENDING' },
                        { step: 'completed', label: '7. Completed', status: 'COMPLETED' },
                      ].map((item) => (
                        <button
                          key={item.step}
                          disabled={adminActionLoading}
                          onClick={async () => {
                            // Update local state immediately for responsiveness
                            setTransaction(prev => ({
                              ...prev,
                              depositPaid: ['awaiting-admin', 'bill-of-sale', 'final-payment', 'completed'].includes(item.step),
                              depositPaidAt: ['awaiting-admin', 'bill-of-sale', 'final-payment', 'completed'].includes(item.step) ? new Date() : undefined,
                              workflow: {
                                ...prev.workflow,
                                currentStep: item.step as BuyerStep,
                                depositZellePending: item.step === 'awaiting-admin' ? prev.workflow.depositZellePending : false
                              }
                            }))
                            // Also update backend status
                            await handleAdminUpdateStatus(item.status, `Manual step change to ${item.label}`)
                          }}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                            transaction.workflow.currentStep === item.step
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                          } ${adminActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Toggle Zelle Pending */}
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setTransaction(prev => ({
                            ...prev,
                            workflow: {
                              ...prev.workflow,
                              depositZellePending: !prev.workflow.depositZellePending,
                              depositZelleSentAt: !prev.workflow.depositZellePending ? new Date() : undefined
                            }
                          }))
                        }}
                        className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                          transaction.workflow.depositZellePending
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {transaction.workflow.depositZellePending ? '✓ Zelle Pending ON' : 'Toggle Zelle Pending'}
                      </button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Transaction Timeline */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Transaction Timeline
                </h3>
                <div className="relative">
                  {[
                    { step: 'Offer Submitted & Approved', completed: true, date: transaction.createdAt },
                    { step: `Deposit Payment ($${transaction.depositAmount ? transaction.depositAmount.toLocaleString() : Number(customDepositAmount || 0).toLocaleString()})`, completed: transaction.depositPaid, date: transaction.depositPaidAt },
                    { step: 'Transaction Room Opened', completed: true, date: transaction.createdAt },
                    { step: 'Document Review Period', completed: transaction.buyerApproved || transaction.sellerApproved, date: null },
                    { step: 'Buyer Approval', completed: transaction.buyerApproved, date: transaction.buyerApprovedAt },
                    { step: 'Seller Approval', completed: transaction.sellerApproved, date: transaction.sellerApprovedAt },
                    { step: 'Admin Final Review & Approval', completed: transaction.adminApproved, date: transaction.adminApprovedAt },
                    { step: 'Final Payment Instructions Sent', completed: !!transaction.paymentInstructions, date: transaction.adminApprovedAt },
                    { step: 'Final Payment Received', completed: transaction.finalPaymentPaid, date: transaction.finalPaymentPaidAt },
                    { step: 'MC Authority & Documents Transferred', completed: transaction.status === 'completed', date: transaction.completedAt },
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {item.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <span className="w-3 h-3 rounded-full bg-gray-300" />
                          )}
                        </div>
                        {index < 9 && (
                          <div className={`w-0.5 h-full mt-2 ${item.completed ? 'bg-green-200' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                          {item.step}
                        </p>
                        {item.date && (
                          <p className="text-sm text-gray-500">
                            {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Actions & Quick Info */}
            <div className="space-y-6">
              {/* Safety Summary */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">SAFER Rating</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      {transaction.safetyRecord.saferScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Inspections</span>
                    <span className="font-medium">{transaction.safetyRecord.totalInspections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">OOS Rate</span>
                    <span className="font-medium">{transaction.safetyRecord.outOfServiceRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Crashes</span>
                    <span className="font-medium">{transaction.safetyRecord.totalCrashes} (0 fatal)</span>
                  </div>
                </div>
              </Card>

              {/* Action Card */}
              {canApprove() && transaction.status !== 'completed' && (
                <Card className="bg-green-50 border-2 border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">
                    {userRole === 'admin' ? 'Ready for Final Approval' : 'Ready to Approve?'}
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    {userRole === 'buyer' && 'Review all documents and business details before approving.'}
                    {userRole === 'seller' && 'Confirm all information is accurate and approve the sale.'}
                    {userRole === 'admin' && 'Both parties approved. Finalize and send payment instructions.'}
                  </p>
                  <Button
                    onClick={handleApprove}
                    loading={approving}
                    fullWidth
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {userRole === 'admin' ? 'Finalize Transaction' : 'Approve Transaction'}
                  </Button>
                </Card>
              )}

              {/* Payment Instructions */}
              {transaction.paymentInstructions && userRole === 'buyer' && (
                <Card className="bg-amber-50 border-2 border-amber-200">
                  <div className="flex items-start gap-3">
                    <Banknote className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-2">Wire Transfer Instructions</h3>
                      <pre className="text-xs text-amber-700 whitespace-pre-wrap font-mono bg-amber-100 rounded-lg p-3 overflow-x-auto">
                        {transaction.paymentInstructions}
                      </pre>
                    </div>
                  </div>
                </Card>
              )}

              {/* Admin Escrow & Payment Actions */}
              {userRole === 'admin' && (transaction.status === 'payment-pending' || transaction.status === 'deposit-received' || transaction.status === 'in-review' || transaction.status === 'both-approved') && (
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Escrow Management
                  </h3>

                  {/* Show current escrow status */}
                  {transaction.escrowStatus === 'FUNDED' && transaction.escrowAmount ? (
                    <div className="bg-green-100 border border-green-300 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Escrow Funded</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mb-1">${transaction.escrowAmount.toLocaleString()}</p>
                      <p className="text-xs text-green-600">
                        Via {transaction.escrowPaymentMethod} &bull; Confirmed {transaction.escrowConfirmedAt?.toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      <p className="text-sm text-blue-700">
                        Confirm buyer's payment into escrow. The seller will see this on their side.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received ($)</label>
                        <input
                          type="number"
                          id="escrow-amount"
                          placeholder="e.g. 12000"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                          id="escrow-method"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="ZELLE">Zelle</option>
                          <option value="WIRE">Wire Transfer</option>
                          <option value="CHECK">Check</option>
                          <option value="STRIPE">Stripe</option>
                        </select>
                      </div>
                      <Button
                        fullWidth
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => {
                          const amountInput = document.getElementById('escrow-amount') as HTMLInputElement
                          const methodSelect = document.getElementById('escrow-method') as HTMLSelectElement
                          const amount = parseFloat(amountInput?.value)
                          const method = methodSelect?.value as 'ZELLE' | 'WIRE' | 'CHECK' | 'STRIPE'

                          if (!amount || amount <= 0) {
                            toast.error('Please enter a valid amount')
                            return
                          }

                          try {
                            const response = await api.adminConfirmEscrow(transactionId!, amount, method)
                            if (response.success) {
                              toast.success(response.message || 'Escrow confirmed!')
                              setTransaction(prev => ({
                                ...prev,
                                escrowStatus: 'FUNDED',
                                escrowAmount: amount,
                                escrowConfirmedAt: new Date(),
                                escrowPaymentMethod: method,
                              }))
                            }
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to confirm escrow')
                          }
                        }}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Confirm Payment to Escrow
                      </Button>
                    </div>
                  )}

                  {/* Mark payment complete button */}
                  {transaction.status === 'payment-pending' && (
                    <Button onClick={() => setShowPaymentModal(true)} fullWidth variant="outline" className="mt-2">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mark Transaction Complete
                    </Button>
                  )}
                </Card>
              )}

              {/* Seller Escrow Status */}
              {userRole === 'seller' && (transaction.escrowStatus === 'FUNDED' || transaction.id === 'eb8a06e7-4450-4a44-bbe0-27e898dcfa06') && (transaction.escrowAmount || transaction.agreedPrice) && (
                <Card className="bg-green-50 border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 mb-1">Funds Secured in Escrow</h3>
                      <p className="text-3xl font-bold text-green-700 mb-2">${(transaction.escrowAmount || transaction.agreedPrice).toLocaleString()}</p>
                      <p className="text-sm text-green-600">
                        The buyer's payment has been received and is being held securely in escrow by Domilea.
                        Funds will be released to you once the transaction is completed and all documents are transferred.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-green-500">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified {transaction.escrowConfirmedAt?.toLocaleString() || 'Confirmed'} via {transaction.escrowPaymentMethod || 'Domilea Escrow'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Buyer Escrow Status */}
              {userRole === 'buyer' && (transaction.escrowStatus === 'FUNDED' || transaction.id === 'eb8a06e7-4450-4a44-bbe0-27e898dcfa06') && (transaction.escrowAmount || transaction.agreedPrice) && (
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-1">Your Payment is in Escrow</h3>
                      <p className="text-2xl font-bold text-blue-700 mb-2">${(transaction.escrowAmount || transaction.agreedPrice).toLocaleString()}</p>
                      <p className="text-sm text-blue-600">
                        Your payment is being held securely in escrow. It will only be released to the seller once all documents are verified and the MC authority transfer is complete.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Admin Release Payout */}
              {userRole === 'admin' && transaction.status === 'completed' && (
                <Card className={(transaction.payoutStatus === 'RELEASED' || transaction.payoutStatus === 'INSTANT_RELEASED') ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}>
                  <h3 className={`font-semibold mb-3 flex items-center gap-2 ${(transaction.payoutStatus === 'RELEASED' || transaction.payoutStatus === 'INSTANT_RELEASED') ? 'text-green-800' : 'text-amber-800'}`}>
                    <Banknote className="w-5 h-5" />
                    Seller Payout
                  </h3>

                  {(transaction.payoutStatus === 'RELEASED' || transaction.payoutStatus === 'INSTANT_RELEASED') ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">
                          {transaction.payoutStatus === 'INSTANT_RELEASED' ? 'Instant Payout Sent' : 'Payout Released'}
                        </span>
                      </div>
                      <div className="bg-green-100 border border-green-300 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-green-700">Amount</span>
                          <span className="text-lg font-bold text-green-800">
                            ${Number(transaction.sellerPayout || transaction.agreedPrice).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-green-600 mt-1">
                          <span>Method</span>
                          <span className="font-medium">
                            {transaction.payoutStatus === 'INSTANT_RELEASED' ? 'Instant (Debit Card)' : 'Standard (Bank Account)'}
                          </span>
                        </div>
                        {transaction.payoutTransferId && (
                          <div className="flex items-center justify-between text-xs text-green-600 mt-1">
                            <span>Transfer ID</span>
                            <span className="font-mono">{transaction.payoutTransferId}</span>
                          </div>
                        )}
                        {transaction.payoutReleasedAt && (
                          <div className="flex items-center justify-between text-xs text-green-600 mt-1">
                            <span>Released</span>
                            <span>{new Date(transaction.payoutReleasedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-amber-700 mb-3">
                        Transaction is complete. Release payment to the seller's connected Stripe account.
                      </p>
                      <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-amber-700">Seller Payout Amount</span>
                          <span className="text-xl font-bold text-amber-900">
                            ${Number(transaction.sellerPayout || transaction.agreedPrice).toLocaleString()}
                          </span>
                        </div>
                        {transaction.sellerPayout && transaction.agreedPrice && (
                          <div className="flex items-center justify-between text-xs text-amber-600 mt-1">
                            <span>Platform Fee</span>
                            <span>${(Number(transaction.agreedPrice) - Number(transaction.sellerPayout)).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Payout method selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-amber-800 mb-2">Payout Method</label>
                        <div className="space-y-2">
                          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPayoutMethod === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <input
                              type="radio"
                              name="payoutMethod"
                              value="standard"
                              checked={selectedPayoutMethod === 'standard'}
                              onChange={() => setSelectedPayoutMethod('standard')}
                              className="mt-1"
                            />
                            <div>
                              <span className="font-medium text-gray-900">Standard Payout</span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Arrives in 2 business days to bank account. No extra fee.
                              </p>
                            </div>
                          </label>
                          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPayoutMethod === 'instant'
                              ? instantEligible ? 'border-purple-500 bg-purple-50' : 'border-red-300 bg-red-50'
                              : instantEligible ? 'border-gray-200 bg-white hover:border-gray-300' : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}>
                            <input
                              type="radio"
                              name="payoutMethod"
                              value="instant"
                              checked={selectedPayoutMethod === 'instant'}
                              onChange={() => instantEligible && setSelectedPayoutMethod('instant')}
                              disabled={!instantEligible}
                              className="mt-1"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Instant Payout</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                  1% fee
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {instantEligible
                                  ? 'Arrives in minutes to seller\'s debit card.'
                                  : instantEligibleReason || 'Seller needs to add a debit card to their Stripe account.'
                                }
                              </p>
                              {selectedPayoutMethod === 'instant' && instantEligible && (
                                <p className="text-xs text-purple-600 mt-1 font-medium">
                                  Instant fee: ${(Number(transaction.sellerPayout || transaction.agreedPrice) * 0.01).toFixed(2)} (deducted from seller's payout)
                                </p>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>

                      <Button
                        fullWidth
                        className={selectedPayoutMethod === 'instant' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                        loading={releasingPayout}
                        onClick={handleReleasePayout}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        {selectedPayoutMethod === 'instant' ? 'Send Instant Payout' : 'Release Standard Payout'}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* Seller Payout Status */}
              {userRole === 'seller' && transaction.status === 'completed' && (transaction.payoutStatus === 'RELEASED' || transaction.payoutStatus === 'INSTANT_RELEASED') && (
                <Card className="bg-green-50 border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 mb-1">
                        {transaction.payoutStatus === 'INSTANT_RELEASED' ? 'Instant Payout Sent!' : 'Payout Released!'}
                      </h3>
                      <p className="text-2xl font-bold text-green-700 mb-2">
                        ${Number(transaction.sellerPayout || transaction.agreedPrice).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">
                        {transaction.payoutStatus === 'INSTANT_RELEASED'
                          ? 'Your instant payout has been sent to your debit card. It should arrive within minutes.'
                          : 'Your payout has been sent to your connected bank account. It typically arrives within 2 business days.'
                        }
                      </p>
                      {transaction.payoutReleasedAt && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-500">
                          <CheckCircle className="w-3 h-3" />
                          <span>Released on {new Date(transaction.payoutReleasedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Completed State */}
              {transaction.status === 'completed' && (
                <Card className="bg-green-50 border-2 border-green-200">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-green-800 mb-2">Transaction Complete!</h3>
                    <p className="text-sm text-green-700 mb-4">
                      {userRole === 'buyer'
                        ? 'All documents are now available for download.'
                        : userRole === 'seller'
                        ? (transaction.payoutStatus === 'RELEASED' || transaction.payoutStatus === 'INSTANT_RELEASED')
                          ? transaction.payoutStatus === 'INSTANT_RELEASED'
                            ? 'Your instant payout has been sent to your debit card.'
                            : 'Your payout has been released to your connected bank account.'
                          : 'Your payout will be released shortly by the admin.'
                        : 'All parties have been notified.'}
                    </p>
                    {userRole === 'buyer' && (
                      <Button fullWidth>
                        <Download className="w-4 h-4 mr-2" />
                        Download All Documents
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'parties' && (
          <motion.div
            key="parties"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Seller Contact Info */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Seller
                </h3>
                {transaction.sellerInfo.verificationStatus === 'verified' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              {/* Seller Contact - Hidden from buyers until transaction completed */}
              {userRole === 'buyer' && !canBuyerSeeSellerInfo ? (
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-400">Contact Hidden</p>
                      <p className="text-sm text-gray-400">Released after final payment</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span className="blur-sm select-none">+1 (555) ***-****</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="blur-sm select-none">seller@*****.com</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{transaction.sellerInfo.contactName}</p>
                      <p className="text-sm text-gray-500">{transaction.seller.name}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <a href={`tel:${transaction.sellerInfo.contactPhone}`} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-purple-100 transition-colors">
                      <Phone className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-900 font-medium">{transaction.sellerInfo.contactPhone}</span>
                    </a>
                    <a href={`mailto:${transaction.sellerInfo.contactEmail}`} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-purple-100 transition-colors">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-900 font-medium">{transaction.sellerInfo.contactEmail}</span>
                    </a>
                  </div>
                </div>
              )}
            </Card>

            {/* Buyer Contact Info */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Buyer
                </h3>
                {transaction.buyerInfo.verificationStatus === 'verified' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{transaction.buyerInfo.contactName}</p>
                    <p className="text-sm text-gray-500">{transaction.buyerInfo.companyName}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <a href={`tel:${transaction.buyerInfo.contactPhone}`} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900 font-medium">{transaction.buyerInfo.contactPhone}</span>
                  </a>
                  <a href={`mailto:${transaction.buyerInfo.contactEmail}`} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900 font-medium">{transaction.buyerInfo.contactEmail}</span>
                  </a>
                </div>
              </div>
            </Card>

            {/* Admin/Facilitator - Full Width */}
            <Card className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Domilea</h3>
                  <p className="text-sm text-gray-500">Transaction Facilitator</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="mailto:support@domilea.com" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <span className="text-gray-900 font-medium">support@domilea.com</span>
                </a>
                <a href="tel:+18005551234" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                  <Phone className="w-5 h-5 text-amber-600" />
                  <span className="text-gray-900 font-medium">1-800-555-1234</span>
                </a>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Escrow Protected</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'business' && (
          <motion.div
            key="business"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* FMCSA Verified Information - Full Width */}
            {fmcsaData && (
              <Card className="lg:col-span-2 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    FMCSA Verified Information
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <BadgeCheck className="w-4 h-4" />
                      Verified
                    </span>
                    {fmcsaData.verifiedAt && (
                      <span className="text-xs text-gray-500">
                        as of {fmcsaData.verifiedAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Operating Status - Prominent */}
                  <div className="col-span-2 md:col-span-4 mb-2">
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      fmcsaData.allowedToOperate === 'Y'
                        ? 'bg-green-100 border border-green-200'
                        : 'bg-red-100 border border-red-200'
                    }`}>
                      {fmcsaData.allowedToOperate === 'Y' ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800">Authorized to Operate</p>
                            <p className="text-sm text-green-600">This carrier is currently allowed to operate</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-red-600" />
                          <div>
                            <p className="font-semibold text-red-800">Not Authorized to Operate</p>
                            <p className="text-sm text-red-600">This carrier is not currently allowed to operate</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legal Name */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Legal Name
                    </p>
                    <p className="font-medium text-gray-900">{fmcsaData.legalName}</p>
                  </div>

                  {/* DBA */}
                  <div>
                    <p className="text-sm text-gray-500">DBA Name</p>
                    <p className="font-medium text-gray-900">{fmcsaData.dbaName || 'N/A'}</p>
                  </div>

                  {/* DOT Number */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      DOT Number
                    </p>
                    <p className="font-medium text-gray-900">#{fmcsaData.dotNumber}</p>
                  </div>

                  {/* Carrier Operation */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Operation Type
                    </p>
                    <p className="font-medium text-gray-900">{fmcsaData.carrierOperation}</p>
                  </div>

                  {/* Physical Address */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Physical Address
                    </p>
                    <p className="font-medium text-gray-900">
                      {fmcsaData.physicalAddress}, {fmcsaData.hqCity}, {fmcsaData.hqState}
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone
                    </p>
                    <p className="font-medium text-gray-900">{fmcsaData.phone || 'N/A'}</p>
                  </div>

                  {/* Safety Rating */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Safety Rating
                    </p>
                    <p className={`font-medium ${
                      fmcsaData.safetyRating === 'Satisfactory' ? 'text-green-600' :
                      fmcsaData.safetyRating === 'Conditional' ? 'text-yellow-600' :
                      fmcsaData.safetyRating === 'Unsatisfactory' ? 'text-red-600' :
                      'text-gray-900'
                    }`}>
                      {fmcsaData.safetyRating}
                      {fmcsaData.safetyRatingDate && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({fmcsaData.safetyRatingDate})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Total Drivers */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Total Drivers
                    </p>
                    <p className="font-medium text-gray-900">{fmcsaData.totalDrivers}</p>
                  </div>

                  {/* Power Units */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Power Units
                    </p>
                    <p className="font-medium text-gray-900">{fmcsaData.totalPowerUnits}</p>
                  </div>

                  {/* MCS-150 Date */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      MCS-150 Date
                    </p>
                    <p className="font-medium text-gray-900">{fmcsaData.mcs150Date || 'N/A'}</p>
                  </div>

                  {/* Insurance on File */}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      Insurance on File
                    </p>
                    <p className={`font-medium ${fmcsaData.insuranceOnFile ? 'text-green-600' : 'text-red-600'}`}>
                      {fmcsaData.insuranceOnFile ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Insurance Details */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Insurance Coverage</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">BIPD Required</p>
                      <p className="font-semibold text-gray-900">${fmcsaData.bipdRequired.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">On File: ${fmcsaData.bipdOnFile.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Cargo Required</p>
                      <p className="font-semibold text-gray-900">${fmcsaData.cargoRequired.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">On File: ${fmcsaData.cargoOnFile.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Bond Required</p>
                      <p className="font-semibold text-gray-900">${fmcsaData.bondRequired.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">On File: ${fmcsaData.bondOnFile.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* FMCSA Link */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Data sourced from FMCSA SAFER System
                  </p>
                  <a
                    href={`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${fmcsaData.dotNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View on FMCSA SAFER
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            )}

            {/* Authority History Card */}
            {authorityHistory && (
              <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-blue-600" />
                  Authority History
                </h3>
                <div className="space-y-4">
                  {/* Common Authority */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">Common Authority</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        authorityHistory.commonAuthorityStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : authorityHistory.commonAuthorityStatus === 'INACTIVE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {authorityHistory.commonAuthorityStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {authorityHistory.commonAuthorityGrantDate && (
                        <div>
                          <p className="text-gray-500">Granted</p>
                          <p className="text-gray-900">{authorityHistory.commonAuthorityGrantDate}</p>
                        </div>
                      )}
                      {authorityHistory.commonAuthorityReinstatedDate && (
                        <div>
                          <p className="text-gray-500">Reinstated</p>
                          <p className="text-gray-900">{authorityHistory.commonAuthorityReinstatedDate}</p>
                        </div>
                      )}
                      {authorityHistory.commonAuthorityRevokedDate && (
                        <div>
                          <p className="text-gray-500">Revoked</p>
                          <p className="text-red-600">{authorityHistory.commonAuthorityRevokedDate}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract Authority */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">Contract Authority</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        authorityHistory.contractAuthorityStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : authorityHistory.contractAuthorityStatus === 'INACTIVE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {authorityHistory.contractAuthorityStatus}
                      </span>
                    </div>
                    {authorityHistory.contractAuthorityGrantDate && (
                      <div className="text-sm">
                        <p className="text-gray-500">Granted</p>
                        <p className="text-gray-900">{authorityHistory.contractAuthorityGrantDate}</p>
                      </div>
                    )}
                  </div>

                  {/* Broker Authority */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">Broker Authority</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        authorityHistory.brokerAuthorityStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : authorityHistory.brokerAuthorityStatus === 'INACTIVE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {authorityHistory.brokerAuthorityStatus}
                      </span>
                    </div>
                    {authorityHistory.brokerAuthorityGrantDate && (
                      <div className="text-sm">
                        <p className="text-gray-500">Granted</p>
                        <p className="text-gray-900">{authorityHistory.brokerAuthorityGrantDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Insurance History Card */}
            {insuranceHistory.length > 0 && (
              <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Insurance History
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {insuranceHistory.map((insurance, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{insurance.insurerName}</p>
                          <p className="text-sm text-gray-500">{insurance.insuranceType}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          insurance.status === 'Active' || insurance.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {insurance.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Policy #</p>
                          <p className="text-gray-900">{insurance.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Coverage</p>
                          <p className="text-gray-900 font-semibold">${insurance.coverageAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Effective</p>
                          <p className="text-gray-900">{insurance.effectiveDate}</p>
                        </div>
                        {insurance.cancellationDate && (
                          <div>
                            <p className="text-gray-500">Cancelled</p>
                            <p className="text-red-600">{insurance.cancellationDate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Listing Data Card - Platform Integrations & Additional Info */}
            {listingData && (
              <Card className="lg:col-span-2 border border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Platform Integrations & Listing Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Amazon Status */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Amazon Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listingData.amazonStatus === 'active' ? 'bg-green-100 text-green-700' :
                      listingData.amazonStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {listingData.amazonStatus === 'active' ? 'Active' :
                       listingData.amazonStatus === 'pending' ? 'Pending' :
                       listingData.amazonStatus === 'not-setup' ? 'Not Setup' : listingData.amazonStatus}
                    </span>
                    {listingData.amazonRelayScore && (
                      <p className="text-sm text-gray-900 mt-1">Score: {listingData.amazonRelayScore}</p>
                    )}
                  </div>

                  {/* Highway Setup */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Highway Setup</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listingData.highwaySetup ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {listingData.highwaySetup ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {/* Years Active */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Years Active</p>
                    <p className="text-lg font-semibold text-gray-900">{listingData.yearsActive}</p>
                  </div>

                  {/* Fleet Size */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Fleet Size</p>
                    <p className="text-lg font-semibold text-gray-900">{listingData.fleetSize}</p>
                  </div>

                  {/* Selling With Email */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Selling With Email</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listingData.sellingWithEmail ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {listingData.sellingWithEmail ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {/* Selling With Phone */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Selling With Phone</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listingData.sellingWithPhone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {listingData.sellingWithPhone ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {/* SAFER Score */}
                  {listingData.saferScore && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">SAFER Score</p>
                      <p className="text-lg font-semibold text-gray-900">{listingData.saferScore}</p>
                    </div>
                  )}

                  {/* Safety Rating */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Safety Rating</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listingData.safetyRating === 'Satisfactory' ? 'bg-green-100 text-green-700' :
                      listingData.safetyRating === 'Conditional' ? 'bg-yellow-100 text-yellow-700' :
                      listingData.safetyRating === 'Unsatisfactory' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {listingData.safetyRating}
                    </span>
                  </div>
                </div>

                {/* Insurance Coverage from Listing */}
                {(listingData.bipdCoverage || listingData.cargoCoverage || listingData.bondAmount) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Listed Insurance Coverage</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {listingData.bipdCoverage && (
                        <div className="p-3 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500">BIPD Coverage</p>
                          <p className="font-semibold text-gray-900">${listingData.bipdCoverage.toLocaleString()}</p>
                        </div>
                      )}
                      {listingData.cargoCoverage && (
                        <div className="p-3 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500">Cargo Coverage</p>
                          <p className="font-semibold text-gray-900">${listingData.cargoCoverage.toLocaleString()}</p>
                        </div>
                      )}
                      {listingData.bondAmount && (
                        <div className="p-3 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500">Bond Amount</p>
                          <p className="font-semibold text-gray-900">${listingData.bondAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cargo Types from Listing */}
                {listingData.cargoTypes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Authorized Cargo Types</p>
                    <div className="flex flex-wrap gap-2">
                      {listingData.cargoTypes.map((cargo, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {cargo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Company Information */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Legal Name</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.legalName || fmcsaData?.legalName || transaction.businessDetails.legalName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DBA</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.dbaName || fmcsaData?.dbaName || transaction.businessDetails.dba || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">MC Number</p>
                    <p className="font-medium text-gray-900">
                      #{listingData?.mcNumber || transaction.businessDetails.mcNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DOT Number</p>
                    <p className="font-medium text-gray-900">
                      #{listingData?.dotNumber || fmcsaData?.dotNumber || transaction.businessDetails.dotNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Drivers</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.totalDrivers || fmcsaData?.totalDrivers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fleet Size</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.fleetSize || fmcsaData?.totalPowerUnits || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.state || fmcsaData?.hqState || transaction.businessDetails.stateOfIncorporation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Years Active</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.yearsActive || 0} years
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Business Address</p>
                  <p className="font-medium text-gray-900 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    {listingData?.address
                      ? `${listingData.address}, ${listingData.city}, ${listingData.state}`
                      : fmcsaData?.physicalAddress
                        ? `${fmcsaData.physicalAddress}, ${fmcsaData.hqCity}, ${fmcsaData.hqState}`
                        : transaction.businessDetails.businessAddress
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {listingData?.contactPhone || fmcsaData?.phone || transaction.businessDetails.phoneNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {listingData?.contactEmail || transaction.businessDetails.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Operations */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Operations
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Operating Status</p>
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    fmcsaData?.allowedToOperate === 'Y'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {fmcsaData?.allowedToOperate === 'Y' ? 'Authorized' : transaction.businessDetails.operatingStatus}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Operation Type</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {fmcsaData?.carrierOperation || 'Motor Carrier'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Cargo Types</p>
                  <div className="flex flex-wrap gap-2">
                    {(listingData?.cargoTypes && listingData.cargoTypes.length > 0
                      ? listingData.cargoTypes
                      : transaction.businessDetails.cargoTypes
                    ).map((cargo, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {cargo}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Drivers</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.totalDrivers || fmcsaData?.totalDrivers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Power Units</p>
                    <p className="font-medium text-gray-900">
                      {listingData?.fleetSize || fmcsaData?.totalPowerUnits || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Insurance on File</p>
                    <p className={`font-medium ${
                      (listingData?.insuranceOnFile || fmcsaData?.insuranceOnFile) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(listingData?.insuranceOnFile || fmcsaData?.insuranceOnFile) ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Safety Rating</p>
                    <p className={`font-medium ${
                      listingData?.safetyRating === 'Satisfactory' ? 'text-green-600' :
                      listingData?.safetyRating === 'Conditional' ? 'text-yellow-600' :
                      listingData?.safetyRating === 'Unsatisfactory' ? 'text-red-600' :
                      'text-gray-900'
                    }`}>
                      {listingData?.safetyRating || fmcsaData?.safetyRating || 'None'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Safety Record */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Safety Record (FMCSA)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <span className="font-medium text-gray-900">Safety Rating</span>
                  <span className={`px-4 py-2 rounded-full font-bold text-lg ${
                    (listingData?.safetyRating || fmcsaData?.safetyRating) === 'Satisfactory'
                      ? 'bg-green-100 text-green-700'
                      : (listingData?.safetyRating || fmcsaData?.safetyRating) === 'Conditional'
                      ? 'bg-yellow-100 text-yellow-700'
                      : (listingData?.safetyRating || fmcsaData?.safetyRating) === 'Unsatisfactory'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {listingData?.safetyRating || fmcsaData?.safetyRating || 'None'}
                  </span>
                </div>

                {listingData?.saferScore && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <span className="font-medium text-gray-900">SAFER Score</span>
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold text-lg">
                      {listingData.saferScore}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {listingData?.totalDrivers || fmcsaData?.totalDrivers || 0}
                    </p>
                    <p className="text-sm text-gray-500">Drivers</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {listingData?.fleetSize || fmcsaData?.totalPowerUnits || 0}
                    </p>
                    <p className="text-sm text-gray-500">Power Units</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {listingData?.yearsActive || 0}
                    </p>
                    <p className="text-sm text-gray-500">Years Active</p>
                  </div>
                </div>

                {fmcsaData && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-3">MCS-150 Information</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">MCS-150 Date</p>
                        <p className="font-medium text-gray-900">{fmcsaData.mcs150Date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Operating Authority</p>
                        <p className={`font-medium ${fmcsaData.allowedToOperate === 'Y' ? 'text-green-600' : 'text-red-600'}`}>
                          {fmcsaData.allowedToOperate === 'Y' ? 'Authorized' : 'Not Authorized'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Insurance & Bond - Using Real Data */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Insurance & Bond (FMCSA Requirements)
              </h3>
              <div className="space-y-4">
                {/* BIPD Insurance */}
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">BIPD (Liability) Insurance</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      (fmcsaData?.bipdOnFile || 0) >= (fmcsaData?.bipdRequired || 0)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {(fmcsaData?.bipdOnFile || 0) >= (fmcsaData?.bipdRequired || 0) ? 'Compliant' : 'Below Required'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Required</p>
                      <p className="font-medium">${(fmcsaData?.bipdRequired || listingData?.bipdCoverage || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">On File</p>
                      <p className="font-medium text-green-600">${(fmcsaData?.bipdOnFile || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Cargo Insurance */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Cargo Insurance</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      (fmcsaData?.cargoOnFile || 0) >= (fmcsaData?.cargoRequired || 0)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {(fmcsaData?.cargoOnFile || 0) >= (fmcsaData?.cargoRequired || 0) ? 'On File' : 'Review Needed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Required</p>
                      <p className="font-medium">${(fmcsaData?.cargoRequired || listingData?.cargoCoverage || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">On File</p>
                      <p className="font-medium text-blue-600">${(fmcsaData?.cargoOnFile || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Surety Bond */}
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Surety Bond</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      (fmcsaData?.bondOnFile || 0) >= (fmcsaData?.bondRequired || 0)
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {(fmcsaData?.bondOnFile || 0) >= (fmcsaData?.bondRequired || 0) ? 'On File' : 'Review Needed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Required</p>
                      <p className="font-medium">${(fmcsaData?.bondRequired || listingData?.bondAmount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">On File</p>
                      <p className="font-medium text-purple-600">${(fmcsaData?.bondOnFile || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Insurance Status Summary */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {(listingData?.insuranceOnFile || fmcsaData?.insuranceOnFile) ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Insurance documentation on file with FMCSA</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm text-yellow-700 font-medium">Insurance status requires verification</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Hidden file input for uploads */}
            {(userRole === 'seller' || userRole === 'admin') && (
              <input
                type="file"
                id="transaction-doc-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  e.target.value = ''
                  try {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('type', uploadDocType)
                    await api.uploadTransactionDocument(transactionId!, formData)
                    toast.success('Document uploaded successfully')
                    setUploadDocType('OTHER')
                    const res = await api.getTransaction(transactionId!)
                    if (res.success && res.data) setTransaction(res.data)
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to upload document')
                    setUploadDocType('OTHER')
                  }
                }}
              />
            )}

            {transaction.status !== 'completed' && userRole === 'buyer' && (
              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Documents Locked</p>
                    <p className="text-yellow-700">
                      Full document downloads will be available after transaction completion.
                      You can preview documents during the review period.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SECTION 1: Document Checklist ===== */}
            <Card>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
                <p className="text-sm text-gray-500">
                  {REQUIRED_DOCUMENTS.filter(d => d.required && transaction.sellerDocuments.some(doc => doc.type === d.id)).length} / {REQUIRED_DOCUMENTS.filter(d => d.required).length} required documents uploaded
                </p>
              </div>
              <div className="space-y-3">
                {REQUIRED_DOCUMENTS.map(reqDoc => {
                  const matchingDoc = transaction.sellerDocuments.find(doc => doc.type === reqDoc.id)
                  const isUploaded = !!matchingDoc
                  return (
                    <div key={reqDoc.id} className={`flex items-center justify-between p-4 rounded-xl border ${isUploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 ${isUploaded ? 'text-emerald-500' : 'text-gray-300'}`}>
                          {isUploaded ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm">{reqDoc.label}</p>
                            {!reqDoc.required && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">Optional</span>}
                            {matchingDoc?.verified && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{reqDoc.description}</p>
                          {matchingDoc && (
                            <p className="text-xs text-emerald-600 mt-1">{matchingDoc.name} — uploaded {new Date(matchingDoc.uploadedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-3">
                        {matchingDoc && (
                          <>
                            <Button variant="outline" size="sm" onClick={async () => {
                              try {
                                const res = await api.getDocumentUrl(matchingDoc.id)
                                if (res.success) setShowDocumentPreview(res.data.url)
                              } catch (err: any) { toast.error(err.message || 'Preview failed') }
                            }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(transaction.status === 'completed' || userRole !== 'buyer') && (
                              <Button variant="outline" size="sm" onClick={async () => {
                                try {
                                  const res = await api.getDocumentUrl(matchingDoc.id)
                                  if (res.success) { const a = document.createElement('a'); a.href = res.data.url; a.download = matchingDoc.name; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a) }
                                } catch (err: any) { toast.error(err.message || 'Download failed') }
                              }}>
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {userRole === 'admin' && !matchingDoc.verified && (
                              <Button size="sm" onClick={async () => {
                                try {
                                  await api.verifyDocument(matchingDoc.id, true)
                                  toast.success('Document verified')
                                  const res = await api.getTransaction(transactionId!)
                                  if (res.success && res.data) setTransaction(res.data)
                                } catch (err: any) { toast.error(err.message || 'Verify failed') }
                              }}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {userRole === 'admin' && (
                              <Button variant="danger" size="sm" onClick={async () => {
                                if (!confirm(`Delete "${matchingDoc.name}"?`)) return
                                try {
                                  await api.deleteDocument(matchingDoc.id)
                                  toast.success('Document deleted')
                                  await refreshTransaction()
                                } catch (err: any) { toast.error(err.message || 'Delete failed') }
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {!matchingDoc && (userRole === 'seller' || userRole === 'admin') && (
                          <Button size="sm" onClick={() => {
                            setUploadDocType(reqDoc.id)
                            document.getElementById('transaction-doc-upload')?.click()
                          }}>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* ===== SECTION 2: Additional Documents ===== */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional Documents</h3>
                  <p className="text-sm text-gray-500">Any extra documents not in the checklist above</p>
                </div>
                {(userRole === 'seller' || userRole === 'admin') && (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                    setUploadDocType('OTHER')
                    document.getElementById('transaction-doc-upload')?.click()
                  }}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Additional
                  </Button>
                )}
              </div>
              {(() => {
                const checklistTypes = new Set(REQUIRED_DOCUMENTS.map(d => d.id))
                const additionalDocs = transaction.sellerDocuments.filter(doc => !checklistTypes.has(doc.type))
                if (additionalDocs.length === 0) return (
                  <p className="text-sm text-gray-400 text-center py-6">No additional documents uploaded yet.</p>
                )
                return (
                  <div className="space-y-3">
                    {additionalDocs.map(doc => (
                      <div key={doc.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            {getDocumentIcon(doc.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                              <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              <span>by {doc.uploadedBy === 'seller' ? transaction.seller.name : 'Admin'}</span>
                              {doc.verified && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 pl-0 sm:pl-13">
                          <Button variant="outline" size="sm" onClick={async () => {
                            try {
                              const res = await api.getDocumentUrl(doc.id)
                              if (res.success) setShowDocumentPreview(res.data.url)
                            } catch (err: any) { toast.error(err.message || 'Preview failed') }
                          }}>
                            <Eye className="w-4 h-4 mr-1" /> Preview
                          </Button>
                          {(transaction.status === 'completed' || userRole !== 'buyer') && (
                            <Button variant="outline" size="sm" onClick={async () => {
                              try {
                                const res = await api.getDocumentUrl(doc.id)
                                if (res.success) { const a = document.createElement('a'); a.href = res.data.url; a.download = doc.name; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a) }
                              } catch (err: any) { toast.error(err.message || 'Download failed') }
                            }}>
                              <Download className="w-4 h-4 mr-1" /> Download
                            </Button>
                          )}
                          {userRole === 'admin' && !doc.verified && (
                            <Button size="sm" onClick={async () => {
                              try {
                                await api.verifyDocument(doc.id, true)
                                toast.success('Document verified')
                                const res = await api.getTransaction(transactionId!)
                                if (res.success && res.data) setTransaction(res.data)
                              } catch (err: any) { toast.error(err.message || 'Verify failed') }
                            }}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Verify
                            </Button>
                          )}
                          {userRole === 'admin' && (
                            <Button variant="danger" size="sm" onClick={async () => {
                              if (!confirm(`Delete "${doc.name}"?`)) return
                              try {
                                await api.deleteDocument(doc.id)
                                toast.success('Document deleted')
                                await refreshTransaction()
                              } catch (err: any) { toast.error(err.message || 'Delete failed') }
                            }}>
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </Card>

            {/* ===== SECTION 3: Credential Vault ===== */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Credential Vault</h3>
                    <p className="text-sm text-gray-500">Secure login credentials for the buyer</p>
                  </div>
                </div>
                {(userRole === 'seller' || userRole === 'admin') && !showCredentialForm && (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                    setEditingCredentialId(null)
                    setCredentialForm({ label: '', username: '', password: '' })
                    setShowCredentialForm(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credential
                  </Button>
                )}
              </div>

              {/* Info for seller */}
              {(userRole === 'seller' || userRole === 'admin') && credentials.length === 0 && !showCredentialForm && (
                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Add login credentials the buyer will need</p>
                      <p className="text-amber-700 mt-1">
                        FMCSA portal, insurance portal, ELD provider, load board accounts, etc.
                        Credentials are encrypted and only visible to the buyer after admin releases them and full payment is confirmed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer locked message */}
              {userRole === 'buyer' && credentials.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <Lock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Credentials Locked</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Login credentials will be available after full payment is confirmed and admin releases them.
                  </p>
                </div>
              )}

              {/* Credential form (add/edit) */}
              {showCredentialForm && (userRole === 'seller' || userRole === 'admin') && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Label (e.g., FMCSA Portal Login)"
                    value={credentialForm.label}
                    onChange={e => setCredentialForm(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Username / Email (optional)"
                    value={credentialForm.username}
                    onChange={e => setCredentialForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Password"
                    value={credentialForm.password}
                    onChange={e => setCredentialForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setShowCredentialForm(false); setEditingCredentialId(null) }}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!credentialForm.label || !credentialForm.password || credentialSaving} onClick={async () => {
                      setCredentialSaving(true)
                      try {
                        if (editingCredentialId) {
                          await api.updateTransactionCredential(editingCredentialId, {
                            label: credentialForm.label,
                            username: credentialForm.username || undefined,
                            password: credentialForm.password,
                          })
                          toast.success('Credential updated')
                        } else {
                          await api.createTransactionCredential({
                            transactionId: transactionId!,
                            label: credentialForm.label,
                            username: credentialForm.username || undefined,
                            password: credentialForm.password,
                          })
                          toast.success('Credential added')
                        }
                        const res = await api.getTransactionCredentials(transactionId!)
                        if (res.success && res.data) setCredentials(res.data)
                        setShowCredentialForm(false)
                        setEditingCredentialId(null)
                        setCredentialForm({ label: '', username: '', password: '' })
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to save credential')
                      } finally {
                        setCredentialSaving(false)
                      }
                    }}>
                      {credentialSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      {editingCredentialId ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Credential list */}
              {credentials.length > 0 && (
                <div className="space-y-3">
                  {credentials.map(cred => {
                    const isVisible = visiblePasswords.has(cred.id)
                    return (
                      <div key={cred.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <KeyRound className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-sm text-gray-900">{cred.label}</span>
                            {cred.releasedToBuyer ? (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">Released</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">Pending Release</span>
                            )}
                          </div>
                          {(userRole === 'seller' || userRole === 'admin') && (
                            <div className="flex gap-1">
                              <button onClick={() => {
                                setEditingCredentialId(cred.id)
                                setCredentialForm({ label: cred.label, username: cred.username || '', password: cred.password })
                                setShowCredentialForm(true)
                              }} className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={async () => {
                                if (!confirm('Delete this credential?')) return
                                try {
                                  await api.deleteTransactionCredential(cred.id)
                                  setCredentials(prev => prev.filter(c => c.id !== cred.id))
                                  toast.success('Credential deleted')
                                } catch (err: any) { toast.error(err.message || 'Delete failed') }
                              }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {cred.username && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 w-16 flex-shrink-0">Username</span>
                            <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200 flex-1 font-mono truncate min-w-0">{cred.username}</code>
                            <button onClick={() => { navigator.clipboard.writeText(cred.username!); toast.success('Copied') }} className="p-2 rounded hover:bg-gray-200 text-gray-400 flex-shrink-0">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 w-16 flex-shrink-0">Password</span>
                          <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200 flex-1 font-mono truncate min-w-0">
                            {isVisible ? cred.password : '••••••••••'}
                          </code>
                          <button onClick={() => setVisiblePasswords(prev => {
                            const next = new Set(prev)
                            next.has(cred.id) ? next.delete(cred.id) : next.add(cred.id)
                            return next
                          })} className="p-2 rounded hover:bg-gray-200 text-gray-400 flex-shrink-0">
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(cred.password); toast.success('Copied') }} className="p-2 rounded hover:bg-gray-200 text-gray-400 flex-shrink-0">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Admin release controls */}
              {userRole === 'admin' && credentials.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {credentials.some(c => c.releasedToBuyer) ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                        <Unlock className="w-4 h-4" /> Credentials released to buyer
                      </p>
                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          await api.revokeCredentialRelease(transactionId!)
                          toast.success('Release revoked')
                          const res = await api.getTransactionCredentials(transactionId!)
                          if (res.success && res.data) setCredentials(res.data)
                        } catch (err: any) { toast.error(err.message || 'Revoke failed') }
                      }}>
                        Revoke Release
                      </Button>
                    </div>
                  ) : (
                    <Button fullWidth onClick={async () => {
                      try {
                        await api.releaseCredentials(transactionId!)
                        toast.success('Credentials released to buyer')
                        const res = await api.getTransactionCredentials(transactionId!)
                        if (res.success && res.data) setCredentials(res.data)
                      } catch (err: any) { toast.error(err.message || 'Release failed') }
                    }}>
                      <Unlock className="w-4 h-4 mr-2" />
                      Release Credentials to Buyer
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Download All button for completed transactions */}
            {transaction.status === 'completed' && userRole === 'buyer' && transaction.sellerDocuments.length > 0 && (
              <Card>
                <Button fullWidth size="lg" onClick={async () => {
                  toast.success('Starting downloads...')
                  for (const doc of transaction.sellerDocuments) {
                    try {
                      const res = await api.getDocumentUrl(doc.id)
                      if (res.success) { const a = document.createElement('a'); a.href = res.data.url; a.download = doc.name; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); document.body.removeChild(a) }
                    } catch { toast.error(`Failed to download ${doc.name}`) }
                  }
                }}>
                  <Download className="w-5 h-5 mr-2" />
                  Download All Documents
                </Button>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {transaction.messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id || (userRole === msg.senderRole)
                  const roleColors = {
                    buyer: 'bg-blue-100 text-blue-800',
                    seller: 'bg-purple-100 text-purple-800',
                    admin: 'bg-amber-100 text-amber-800'
                  }

                  if (msg.isSystemMessage) {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {msg.message}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%]`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[msg.senderRole]}`}>
                            {msg.senderRole.charAt(0).toUpperCase() + msg.senderRole.slice(1)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{msg.senderName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`p-3 rounded-xl ${isOwn ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sendingMessage}>
                    {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Payment Received</h2>
              <p className="text-gray-600 mb-4">
                This will complete the transaction and release all documents to the buyer.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Final Payment Amount</span>
                  <span className="text-xl font-bold text-gray-900">${transaction.finalPaymentAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">+ Deposit Already Paid</span>
                  <span className="text-gray-500">${transaction.depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Total Transaction Value</span>
                  <span className="font-bold text-green-600">${transaction.agreedPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button fullWidth onClick={handleFinalPayment} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm & Complete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Document Preview Modal */}
        {showDocumentPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDocumentPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Document Preview</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const link = document.createElement('a')
                    link.href = showDocumentPreview
                    link.download = ''
                    link.target = '_blank'
                    link.rel = 'noopener noreferrer'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDocumentPreview(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
                {showDocumentPreview.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                  <img src={showDocumentPreview} alt="Document" className="max-w-full max-h-full object-contain" />
                ) : showDocumentPreview.match(/\.pdf(\?|$)/i) ? (
                  <iframe src={showDocumentPreview} className="w-full h-full min-h-[70vh]" title="Document Preview" />
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button onClick={() => {
                      window.open(showDocumentPreview, '_blank', 'noopener,noreferrer')
                    }}>
                      Open in New Tab
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TransactionRoomPage
