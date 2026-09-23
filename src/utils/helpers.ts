import { clsx, type ClassValue } from 'clsx'

/**
 * Utility function to merge class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Mask an MC number completely (matches the backend's mask). Showing half of
 * it left few enough candidates to find the carrier by city/state.
 */
export const getPartialMCNumber = (_mcNumber?: string | null): string => '•••••••'

/**
 * Format a price with currency symbol and commas
 * @param price - The price to format
 * @returns Formatted price string (e.g., "$45,000")
 */
export const formatPrice = (price: number): string => {
  return `$${price.toLocaleString()}`
}

/**
 * Format currency with options
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatDate(d)
}

/**
 * Get trust level based on score
 * @param score - Trust score (0-100)
 * @returns Trust level ('high' | 'medium' | 'low')
 */
export const getTrustLevel = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 80) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

/**
 * Get trust score color class
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-green-600'
  if (score >= 40) return 'text-amber-600'
  if (score >= 20) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get trust score label
 */
export function getTrustScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Poor'
  return 'Critical'
}

/**
 * Get trust score background color
 */
export function getTrustScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-50'
  if (score >= 60) return 'bg-green-50'
  if (score >= 40) return 'bg-amber-50'
  if (score >= 20) return 'bg-orange-50'
  return 'bg-red-50'
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    contacted: { bg: 'bg-blue-50', text: 'text-blue-700' },
    in_progress: { bg: 'bg-secondary-50', text: 'text-secondary-700' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-700' },
    new: { bg: 'bg-purple-50', text: 'text-purple-700' },
    qualified: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
    sent_to_affiliate: { bg: 'bg-secondary-50', text: 'text-secondary-700' },
    converted: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    lost: { bg: 'bg-red-50', text: 'text-red-700' },
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    draft: { bg: 'bg-gray-50', text: 'text-gray-700' },
    pending_review: { bg: 'bg-amber-50', text: 'text-amber-700' },
    under_offer: { bg: 'bg-blue-50', text: 'text-blue-700' },
    sold: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    expired: { bg: 'bg-red-50', text: 'text-red-700' },
  }
  return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-700' }
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate initials from name
 */
export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Slugify text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Get the display price for a listing
 * Priority: listingPrice (admin set) > askingPrice (seller set) > price (legacy)
 */
export function getListingPrice(listing: { listingPrice?: number; askingPrice?: number; price?: number }): number {
  return listing.listingPrice ?? listing.askingPrice ?? listing.price ?? 0
}
