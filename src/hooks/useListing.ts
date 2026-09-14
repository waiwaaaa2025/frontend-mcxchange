import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type {
  MCListingExtended,
  AmazonStatus,
  SafetyRating,
  ListingStatus,
  ListingVisibility
} from '../types'
import { getTrustLevel } from '../utils/helpers'

interface UseListingResult {
  listing: MCListingExtended | null
  loading: boolean
  error: string | null
  isUnlocked: boolean
  unlocking: boolean
  unlock: () => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * Custom hook to fetch and manage a single MC listing
 * Handles data transformation from backend format to frontend types
 */
export function useListing(listingId: string | undefined): UseListingResult {
  const { isAuthenticated, user } = useAuth()
  const [listing, setListing] = useState<MCListingExtended | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  /**
   * Transform raw backend data to MCListingExtended type
   */
  const transformListing = useCallback((data: any): MCListingExtended => {
    const trustScore = data.seller?.trustScore || 50

    return {
      // Core listing fields
      id: data.id,
      mcNumber: data.mcNumber,
      sellerId: data.sellerId,
      seller: data.seller || {
        id: data.sellerId,
        name: 'Unknown',
        email: '',
        role: 'seller',
        verified: false,
        trustScore: 50,
        memberSince: new Date(),
        completedDeals: 0,
        reviews: []
      },
      title: data.title,
      description: data.description || '',
      askingPrice: parseFloat(data.askingPrice) || 0,
      listingPrice: data.listingPrice ? parseFloat(data.listingPrice) : undefined,
      price: parseFloat(data.listingPrice || data.askingPrice || data.price) || 0,

      // Trust & Verification
      trustScore,
      trustLevel: getTrustLevel(trustScore),
      verified: data.seller?.verified || false,
      verificationBadges: [],

      // MC Details
      yearsActive: data.yearsActive || 0,
      operationType: parseCargoTypes(data.cargoTypes),
      fleetSize: data.fleetSize || 0,
      safetyRating: normalizeSafetyRating(data.safetyRating),
      insuranceStatus: data.insuranceOnFile ? 'active' : 'pending',

      // Location
      state: data.state || '',

      // Platform Integrations
      amazonStatus: normalizeAmazonStatus(data.amazonStatus),
      amazonRelayScore: data.amazonRelayScore || null,
      highwaySetup: Boolean(data.highwaySetup),

      // What's Included
      sellingWithEmail: Boolean(data.sellingWithEmail),
      sellingWithPhone: Boolean(data.sellingWithPhone),

      // Premium listing
      isPremium: Boolean(data.isPremium),
      isVip: Boolean(data.isVip),
      freeToUnlock: Boolean(data.freeToUnlock),

      // Documents
      documents: data.documents || [],

      // Status
      status: normalizeListingStatus(data.status),
      visibility: normalizeVisibility(data.visibility),

      // Metadata
      views: data.views || 0,
      saves: data.saves || 0,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      soldAt: data.soldAt ? new Date(data.soldAt) : undefined,

      // Extended FMCSA fields
      dotNumber: data.dotNumber || '',
      _realDotNumber: data._realDotNumber || undefined,
      legalName: data.legalName || '',
      dbaName: data.dbaName || '',
      city: data.city || '',
      address: data.address || '',
      totalDrivers: data.totalDrivers || 0,

      // Insurance details
      bipdCoverage: data.bipdCoverage,
      cargoCoverage: data.cargoCoverage,
      bondAmount: data.bondAmount,
      insuranceOnFile: Boolean(data.insuranceOnFile),

      // Contact info
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',

      // Safety
      saferScore: data.saferScore || '',

      // Unlock/ownership status
      isUnlocked: Boolean(data.isUnlocked),
      isSaved: Boolean(data.isSaved),
      isOwner: Boolean(data.isOwner),
    }
  }, [])

  /**
   * Fetch listing data from API
   */
  // `quiet` refetches in the background without dropping into the page-level
  // loading state — used after an unlock, where flashing the spinner (or
  // blanking the listing on a transient error) would throw away a page the
  // buyer just spent a credit on.
  const fetchListing = useCallback(async (quiet = false) => {
    if (!listingId) return

    try {
      if (!quiet) setLoading(true)
      setError(null)

      const response = await api.getListing(listingId)
      const data = response.data || response.listing || response
      const transformedListing = transformListing(data)

      setListing(transformedListing)

      // Set unlock status from API response
      if (data.isUnlocked || data.isOwner) {
        setIsUnlocked(true)
      } else if (isAuthenticated && user?.role === 'buyer') {
        // Fallback: Check if listing is already unlocked
        try {
          const unlocked = await api.checkListingUnlocked(listingId)
          setIsUnlocked(unlocked)
        } catch (err) {
          console.error('Failed to check unlock status:', err)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch listing:', err)
      if (!quiet) {
        const msg = err?.message || 'Failed to load listing details'
        const code = err?.code || ''
        setError(code === 'ENTERPRISE_REQUIRED' ? 'ENTERPRISE_REQUIRED' : msg)
        setListing(null)
      }
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [listingId, isAuthenticated, user?.role, transformListing])

  /**
   * Unlock the listing using a credit
   */
  const unlock = useCallback(async (): Promise<boolean> => {
    if (!listingId || !isAuthenticated || user?.role !== 'buyer') {
      return false
    }

    setUnlocking(true)
    try {
      const response = await api.unlockListing(listingId)
      if (response.success) {
        setIsUnlocked(true)
        // The MC/DOT the buyer just paid for are masked server-side and only
        // come back unmasked on a fresh read, so refetch or the page keeps
        // showing the bulleted numbers from the pre-unlock payload.
        await fetchListing(true)
        return true
      }
      return false
    } catch (err: any) {
      console.error('Failed to unlock listing:', err)
      throw err
    } finally {
      setUnlocking(false)
    }
  }, [listingId, isAuthenticated, user?.role, fetchListing])

  // Fetch listing on mount and when dependencies change
  useEffect(() => {
    fetchListing()
  }, [fetchListing])

  // Auto-unlock free-to-unlock listings for Premium/Enterprise/VIP subscribers
  const autoUnlockAttempted = useRef(false)
  useEffect(() => {
    if (
      listing?.freeToUnlock &&
      !isUnlocked &&
      !unlocking &&
      !autoUnlockAttempted.current &&
      isAuthenticated &&
      user?.role === 'buyer' &&
      listingId
    ) {
      // Check if buyer has an eligible subscription plan
      let active = true
      autoUnlockAttempted.current = true
      api.getSubscription().then((res) => {
        if (!active) return
        const plan = res.data?.subscription?.plan?.toUpperCase()
        const status = res.data?.subscription?.status
        const eligible = status === 'ACTIVE' && (plan === 'PREMIUM' || plan === 'ENTERPRISE' || plan === 'VIP' || plan === 'VIP_ACCESS')
        if (eligible) {
          setUnlocking(true)
          api.unlockListing(listingId).then((response) => {
            if (active && response.success) {
              setIsUnlocked(true)
              fetchListing(true)
            }
          }).catch((err) => {
            console.error('Auto-unlock failed:', err)
          }).finally(() => {
            if (active) setUnlocking(false)
          })
        }
      }).catch(() => {})
      return () => { active = false }
    }
  }, [listing?.freeToUnlock, isUnlocked, unlocking, isAuthenticated, user?.role, listingId, fetchListing])

  return {
    listing,
    loading,
    error,
    isUnlocked,
    unlocking,
    unlock,
    // Wrapped, not passed through: a caller wiring this straight to an onClick
    // would otherwise hand the click event in as `quiet`.
    refetch: () => fetchListing(),
  }
}

// Helper functions for data normalization

function parseCargoTypes(cargoTypes: unknown): string[] {
  if (!cargoTypes) return []
  if (Array.isArray(cargoTypes)) return cargoTypes
  if (typeof cargoTypes === 'string') {
    try {
      return JSON.parse(cargoTypes)
    } catch {
      return []
    }
  }
  return []
}

function normalizeSafetyRating(rating: string | undefined): SafetyRating {
  if (!rating) return 'not-rated'
  const normalized = rating.toLowerCase()
  if (normalized === 'satisfactory') return 'satisfactory'
  if (normalized === 'conditional') return 'conditional'
  if (normalized === 'unsatisfactory') return 'unsatisfactory'
  return 'not-rated'
}

function normalizeAmazonStatus(status: string | undefined): AmazonStatus {
  if (!status) return 'none'
  const normalized = status.toLowerCase()
  if (normalized === 'active') return 'active'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'suspended') return 'suspended'
  return 'none'
}

function normalizeListingStatus(status: string | undefined): ListingStatus {
  if (!status) return 'active'
  const normalized = status.toLowerCase().replace('_', '-')
  if (normalized === 'active') return 'active'
  if (normalized === 'pending-verification') return 'pending-verification'
  if (normalized === 'sold') return 'sold'
  if (normalized === 'reserved') return 'reserved'
  if (normalized === 'suspended') return 'suspended'
  return 'active'
}

function normalizeVisibility(visibility: string | undefined): ListingVisibility {
  if (!visibility) return 'public'
  const normalized = visibility.toLowerCase()
  if (normalized === 'public') return 'public'
  if (normalized === 'private') return 'private'
  if (normalized === 'unlisted') return 'unlisted'
  return 'public'
}

export default useListing
