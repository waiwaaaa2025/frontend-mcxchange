import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  BadgeCheck,
  Briefcase,
} from 'lucide-react'
import Card from './ui/Card'
import { AUTHORITY_TYPE_BADGE_LABELS, normalizeAuthorityType } from '../constants/authority'
import clsx from 'clsx'

interface SoldMCCardProps {
  listing: {
    id: string
    mcNumber: string
    state: string
    city?: string
    price: number
    yearsActive: number
    fleetSize: number
    safetyRating: string
    amazonStatus?: string
    amazonRelayScore?: string | null
    highwaySetup?: boolean
    sellingWithEmail?: boolean
    sellingWithPhone?: boolean
    authorityType?: string
    soldAt?: string
  }
}

const SoldMCCard = ({ listing }: SoldMCCardProps) => {
  // Heavily mask MC number — show only first 2 digits
  const maskedMC = listing.mcNumber
    ? listing.mcNumber.substring(0, 2) + '••••••'
    : '••••••••'

  const locationDisplay = listing.city
    ? `${listing.city}, ${listing.state}`
    : listing.state

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

  return (
    <Card className="group relative overflow-hidden opacity-75">
      {/* SOLD Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 shadow-sm">
          <BadgeCheck className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold tracking-wide text-white">SOLD</span>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="rounded-xl -mx-2 -mt-2 mb-3 px-4 py-3 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              MC #{maskedMC}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="font-medium truncate">{locationDisplay}</span>
            </div>
          </div>
        </div>

        {/* Price + Key Stats Row */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-2xl font-bold text-emerald-700">
              ${(listing.price || 0).toLocaleString()}
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
        </div>

        {/* Included in Sale */}
        <div className="mb-3 flex items-center gap-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Included</div>
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

        {/* Sold indicator */}
        <motion.div
          className="mt-3 w-full text-center py-2.5 rounded-xl font-medium text-sm bg-emerald-100 text-emerald-700 cursor-default"
        >
          Sold
        </motion.div>
      </div>
    </Card>
  )
}

export default SoldMCCard
