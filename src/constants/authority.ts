import type { AuthorityType } from '../types'

export const AUTHORITY_TYPES: AuthorityType[] = [
  'MOTOR_CARRIER',
  'BROKER',
  'MOTOR_CARRIER_AND_BROKER',
  'FREIGHT_FORWARDER',
]

/** Default labels — filter panels, form labels. */
export const AUTHORITY_TYPE_LABELS: Record<AuthorityType, string> = {
  MOTOR_CARRIER: 'Motor Carrier',
  BROKER: 'Broker',
  MOTOR_CARRIER_AND_BROKER: 'Motor Carrier + Broker',
  FREIGHT_FORWARDER: 'Freight Forwarder',
}

/** Longer form used on the detail-page hero pill. */
export const AUTHORITY_TYPE_PILL_LABELS: Record<AuthorityType, string> = {
  MOTOR_CARRIER: 'Motor Carrier',
  BROKER: 'Broker Authority',
  MOTOR_CARRIER_AND_BROKER: 'Carrier + Broker',
  FREIGHT_FORWARDER: 'Freight Forwarder',
}

/** Compact form used on cards, where horizontal space is tight. */
export const AUTHORITY_TYPE_BADGE_LABELS: Record<AuthorityType, string> = {
  MOTOR_CARRIER: 'Motor Carrier',
  BROKER: 'Broker',
  MOTOR_CARRIER_AND_BROKER: 'Carrier + Broker',
  FREIGHT_FORWARDER: 'Forwarder',
}

/** Options for the authority-type selector in create/edit forms. */
export const AUTHORITY_TYPE_OPTIONS: { value: AuthorityType; label: string; sub: string }[] = [
  { value: 'MOTOR_CARRIER', label: 'Motor Carrier', sub: 'Common / Contract' },
  { value: 'BROKER', label: 'Broker', sub: 'Brokerage authority' },
  { value: 'MOTOR_CARRIER_AND_BROKER', label: 'Carrier + Broker', sub: 'Dual authority' },
  { value: 'FREIGHT_FORWARDER', label: 'Freight Forwarder', sub: 'Forwarder authority' },
]

export function normalizeAuthorityType(value?: string | null): AuthorityType {
  const upper = String(value || '').toUpperCase().trim() as AuthorityType
  return AUTHORITY_TYPES.includes(upper) ? upper : 'MOTOR_CARRIER'
}

/**
 * Brokers and freight forwarders register under a docket (MC) number and often
 * have no USDOT number, so we can't require one from them.
 */
export function requiresDotNumber(type?: string | null): boolean {
  const normalized = normalizeAuthorityType(type)
  return normalized !== 'BROKER' && normalized !== 'FREIGHT_FORWARDER'
}

/**
 * Does this authority actually operate trucks? Gates fleet size, safety ratings,
 * inspections and crash data — all meaningless for a pure broker.
 */
export function hasCarrierOperations(type?: string | null): boolean {
  const normalized = normalizeAuthorityType(type)
  return normalized === 'MOTOR_CARRIER' || normalized === 'MOTOR_CARRIER_AND_BROKER'
}

export function isBrokerAuthority(type?: string | null): boolean {
  const normalized = normalizeAuthorityType(type)
  return normalized === 'BROKER' || normalized === 'MOTOR_CARRIER_AND_BROKER'
}

/** Derive the authority type from an FMCSA authority-history response. */
export function deriveAuthorityTypeFromHistory(history: any): AuthorityType {
  if (!history) return 'MOTOR_CARRIER'
  const carrierActive =
    history.commonAuthorityStatus === 'ACTIVE' || history.contractAuthorityStatus === 'ACTIVE'
  const brokerActive = history.brokerAuthorityStatus === 'ACTIVE'
  if (carrierActive && brokerActive) return 'MOTOR_CARRIER_AND_BROKER'
  if (brokerActive) return 'BROKER'
  return 'MOTOR_CARRIER'
}
