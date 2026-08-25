import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye,
  Heart,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Crown,
  Sparkles,
  Shield,
  Truck,
  AlertTriangle,
  ClipboardCheck,
  Briefcase
} from 'lucide-react'
import { MCListing } from '../types'
import { AUTHORITY_TYPE_BADGE_LABELS, normalizeAuthorityType } from '../constants/authority'
import Card from './ui/Card'
import { formatDistanceToNow } from 'date-fns'
import { getPartialMCNumber } from '../utils/helpers'
import clsx from 'clsx'

const NATIONAL_DRIVER_OOS_RATE = 6.67
const NATIONAL_VEHICLE_OOS_RATE = 22.26

function getOosLevel(rate: number | undefined, nationalAvg: number): 'good' | 'warning' | 'danger' {
  if (rate == null) return 'good'
  if (rate <= nationalAvg) return 'good'
  if (rate < nationalAvg * 1.5) return 'warning'
  return 'danger'
}

const oosColors = {
  good: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
} as const

interface MCCardProps {
  listing: MCListing
  onSave?: (id: string) => void
  isSaved?: boolean
}

const MCCard = ({ listing, onSave, isSaved }: MCCardProps) => {
  const isVip = listing.isVip
  const isPremium = listing.isPremium && !isVip
  const isStandard = !isVip && !isPremium

  // Tier-based design tokens
  const tier = isVip
    ? {
        badge: 'VIP',
        badgeIcon: Sparkles,
        badgeBg: 'bg-gradient-to-r from-amber-500 to-rose-500',
        badgeText: 'text-white',
        cardBorder: 'ring-1 ring-amber-200',
        headerBg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50',
        accentColor: 'text-amber-600',
        priceColor: 'text-amber-700',
        buttonBg: 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600',
        glowClass: 'shadow-lg shadow-amber-100/50',
        safetyBg: 'bg-amber-50/50',
        safetyBorder: 'border-amber-100',
      }
    : isPremium
    ? {
        badge: 'PREMIUM',
        badgeIcon: Crown,
        badgeBg: 'bg-gradient-to-r from-violet-500 to-indigo-500',
        badgeText: 'text-white',
        cardBorder: 'ring-1 ring-violet-200',
        headerBg: 'bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50',
        accentColor: 'text-violet-600',
        priceColor: 'text-violet-700',
        buttonBg: 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600',
        glowClass: 'shadow-lg shadow-violet-100/50',
        safetyBg: 'bg-violet-50/50',
        safetyBorder: 'border-violet-100',
      }
    : {
        badge: '',
        badgeIcon: Shield,
        badgeBg: '',
        badgeText: '',
        cardBorder: '',
        headerBg: 'bg-gradient-to-br from-slate-50 to-gray-50',
        accentColor: 'text-slate-600',
        priceColor: 'text-gray-900',
        buttonBg: 'bg-gray-900 hover:bg-gray-800',
        glowClass: '',
        safetyBg: 'bg-slate-50',
        safetyBorder: 'border-gray-100',
      }

  const getAmazonScoreColor = (score: string | null) => {
    if (!score) return 'text-gray-400'
    switch (score) {
      case 'A': return 'text-emerald-600'
      case 'B': return 'text-green-600'
      case 'C': return 'text-amber-600'
      case 'D': return 'text-orange-600'
      case 'F': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  // Format location: "City, ST" or just "ST"
  const locationDisplay = listing.city
    ? `${listing.city}, ${listing.state}`
    : listing.state

  return (
    <Card hover className={clsx('group relative overflow-hidden', tier.cardBorder, tier.glowClass)}>
      {/* Tier Badge */}
      {!isStandard && (
        <div className="absolute top-4 right-4 z-20">
          <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm', tier.badgeBg)}>
            <tier.badgeIcon className={clsx('w-3.5 h-3.5', tier.badgeText)} />
            <span className={clsx('text-xs font-bold tracking-wide', tier.badgeText)}>{tier.badge}</span>
          </div>
        </div>
      )}

      {/* Match Score Badge (attached when buyer has preferences set) */}
      {typeof listing.matchScore === 'number' && (
        <div
          className={clsx(
            'absolute left-4 z-20 px-2 py-1 rounded-full text-xs font-bold shadow-sm',
            !isStandard ? 'top-14' : 'top-4',
            listing.matchScore >= 80 ? 'bg-emerald-600 text-white'
              : listing.matchScore >= 60 ? 'bg-amber-500 text-white'
              : 'bg-gray-200 text-gray-700'
          )}
          title={listing.matchReasons?.slice(0, 6).join(' · ')}
        >
          {listing.matchScore}% match
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className={clsx('rounded-xl -mx-2 -mt-2 mb-3 px-4 py-3', tier.headerBg)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link to={`/mc/${listing.id}`}>
                <h3 className="text-xl font-bold text-gray-900 hover:text-secondary-600 transition-colors mb-1">
                  MC #{getPartialMCNumber(listing.mcNumber)}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="font-medium truncate">{locationDisplay}</span>
              </div>
            </div>

            {onSave && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSave(listing.id)}
                className={clsx(
                  'p-2 rounded-full bg-white/80 border border-gray-100 transition-colors',
                  isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                )}
              >
                <Heart className={clsx('w-5 h-5', isSaved && 'fill-current')} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Price + Key Stats Row */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className={clsx('text-2xl font-bold', tier.priceColor)}>
              ${(listing.listingPrice || listing.askingPrice || listing.price || 0).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1" title="Years Active">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{listing.yearsActive} yrs</span>
            </div>
            {listing.fleetSize > 0 && (
              <div className="flex items-center gap-1" title="Fleet Size">
                <Truck className="w-3.5 h-3.5" />
                <span className="font-medium">{listing.fleetSize}</span>
              </div>
            )}
          </div>
        </div>

        {/* Platform Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.freeToUnlock && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-700">FREE</span>
            </div>
          )}
          {listing.authorityType && listing.authorityType !== 'MOTOR_CARRIER' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200">
              <Briefcase className="w-3 h-3 text-indigo-600" />
              <span className="text-[11px] font-bold text-indigo-700">
                {AUTHORITY_TYPE_BADGE_LABELS[normalizeAuthorityType(listing.authorityType)]}
              </span>
            </div>
          )}
          {listing.amazonStatus === 'active' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="text-xs">📦</span>
              <span className="text-[11px] font-semibold text-emerald-700">Amazon</span>
              {listing.amazonRelayScore && (
                <span className={clsx('text-[11px] font-bold', getAmazonScoreColor(listing.amazonRelayScore))}>
                  {listing.amazonRelayScore}
                </span>
              )}
            </div>
          )}
          {listing.amazonStatus === 'pending' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
              <span className="text-xs">📦</span>
              <span className="text-[11px] font-semibold text-amber-700">Pending</span>
            </div>
          )}
          {listing.highwaySetup && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200">
              <span className="text-xs">🛣️</span>
              <span className="text-[11px] font-semibold text-blue-700">Highway</span>
            </div>
          )}
          {listing.safetyRating === 'satisfactory' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 border border-green-200">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-[11px] font-semibold text-green-700">Satisfactory</span>
            </div>
          )}
          {listing.safetyRating === 'conditional' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700">Conditional</span>
            </div>
          )}
          {listing.safetyRating === 'unsatisfactory' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 border border-red-200">
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="text-[11px] font-semibold text-red-700">Unsatisfactory</span>
            </div>
          )}
        </div>

        {/* Safety Snapshot */}
        <div className={clsx('rounded-lg border p-2.5 mb-3', tier.safetyBg, tier.safetyBorder)}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <ClipboardCheck className="w-3 h-3 text-gray-400" />
                <span className="font-semibold tabular-nums">{listing.totalInspections ?? 0}</span>
                <span>Inspections</span>
              </div>
              <div className="text-[11px]">
                {(listing.crashTotal ?? 0) > 0 ? (
                  <span className={listing.fatalCrash ? 'text-red-600 font-semibold' : 'text-amber-600 font-semibold'}>
                    {listing.crashTotal} Crash{listing.crashTotal !== 1 ? 'es' : ''}{listing.fatalCrash ? ` (${listing.fatalCrash} fatal)` : ''}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">0 Crashes</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Driver OOS</span>
              <div className="flex items-center gap-1">
                <span className={clsx('font-semibold tabular-nums', oosColors[getOosLevel(listing.driverOosRate, NATIONAL_DRIVER_OOS_RATE)])}>
                  {listing.driverOosInsp ?? 0} ({(listing.driverOosRate ?? 0).toFixed(1)}%)
                </span>
                {getOosLevel(listing.driverOosRate, NATIONAL_DRIVER_OOS_RATE) === 'good' ? (
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Vehicle OOS</span>
              <div className="flex items-center gap-1">
                <span className={clsx('font-semibold tabular-nums', oosColors[getOosLevel(listing.vehicleOosRate, NATIONAL_VEHICLE_OOS_RATE)])}>
                  {listing.vehicleOosInsp ?? 0} ({(listing.vehicleOosRate ?? 0).toFixed(1)}%)
                </span>
                {getOosLevel(listing.vehicleOosRate, NATIONAL_VEHICLE_OOS_RATE) === 'good' ? (
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Included in Sale */}
        <div className="mb-3 flex items-center gap-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Includes</div>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              listing.sellingWithEmail ? 'text-emerald-600' : 'text-gray-300'
            )}>
              {listing.sellingWithEmail ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Email</span>
            </div>
            <div className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              listing.sellingWithPhone ? 'text-emerald-600' : 'text-gray-300'
            )}>
              {listing.sellingWithPhone ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Phone</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{listing.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{listing.saves}</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-400">
            {formatDistanceToNow(listing.createdAt, { addSuffix: true })}
          </div>
        </div>

        {/* View Details Button */}
        <Link to={`/mc/${listing.id}`}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={clsx(
              'mt-3 w-full text-white text-center py-2.5 rounded-xl font-medium transition-colors text-sm',
              tier.buttonBg
            )}
          >
            View Details
          </motion.div>
        </Link>
      </div>
    </Card>
  )
}

export default MCCard
