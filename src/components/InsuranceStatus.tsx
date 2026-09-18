/**
 * One vocabulary for a carrier's liability coverage, shared by Company Leads,
 * Admin Leads and Lead Generator. The backend hands all three the same verdict
 * (`fmcsaLeadsService`), so the words on screen have to match too — a carrier
 * that reads "No insurance" in one tool can't read "Lapsed" or "Pending
 * cancellation" in another.
 */

export type InsuranceStatusCode =
  | 'COVERAGE_LAPSED'
  | 'CANCELLATION_SCHEDULED'
  | 'RENEWAL_DUE'
  | 'COVERED'
  | string

type Tone = 'lapsed' | 'scheduled' | 'renewal' | 'covered' | 'unknown'

// A covered carrier's renewal is worth flagging inside this many days.
const RENEWAL_HORIZON_DAYS = 30

function daysUntil(isoDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return null
  const startOfToday = new Date(new Date().toISOString().slice(0, 10)).getTime()
  const target = new Date(isoDate.slice(0, 10)).getTime()
  if (Number.isNaN(target)) return null
  return Math.round((target - startOfToday) / 86_400_000)
}

/** The single phrasing every tool prints. */
export function insuranceLabel(
  status?: InsuranceStatusCode | null,
  date?: string | null,
  renewalDate?: string | null
): { text: string; tone: Tone } {
  const day = date ? date.slice(0, 10) : null

  if (status === 'COVERAGE_LAPSED') {
    return { text: day ? `No insurance · ${day}` : 'No insurance', tone: 'lapsed' }
  }

  if (status === 'CANCELLATION_SCHEDULED') {
    if (!day) return { text: 'Cancels soon', tone: 'scheduled' }
    const left = daysUntil(day)
    const suffix =
      left == null || left < 0
        ? ''
        : left === 0
          ? ' · today'
          : ` · ${left} day${left === 1 ? '' : 's'} left`
    return { text: `Cancels ${day}${suffix}`, tone: 'scheduled' }
  }

  // Renewal dates are estimated from the anniversary of the FMCSA filing.
  const renewal = status === 'RENEWAL_DUE' ? day || renewalDate?.slice(0, 10) : renewalDate?.slice(0, 10)
  if (status === 'RENEWAL_DUE' || status === 'COVERED') {
    const left = renewal ? daysUntil(renewal) : null
    if (renewal && left != null && left >= 0 && (status === 'RENEWAL_DUE' || left <= RENEWAL_HORIZON_DAYS)) {
      const suffix = left === 0 ? ' · today' : ` · ${left} day${left === 1 ? '' : 's'} left`
      return { text: `Renews ${renewal}${suffix}`, tone: 'renewal' }
    }
    if (status === 'RENEWAL_DUE') return { text: 'Renewal due', tone: 'renewal' }
  }

  if (status === 'COVERED') return { text: 'Covered', tone: 'covered' }
  return { text: '—', tone: 'unknown' }
}

const TEXT_TONE: Record<Tone, string> = {
  lapsed: 'text-red-600 font-medium',
  scheduled: 'text-amber-700',
  renewal: 'text-blue-700',
  covered: 'text-gray-400',
  unknown: 'text-gray-400',
}

const BADGE_TONE: Record<Tone, string> = {
  lapsed: 'bg-red-50 text-red-700',
  scheduled: 'bg-amber-50 text-amber-700',
  renewal: 'bg-blue-50 text-blue-700',
  covered: 'bg-gray-100 text-gray-600',
  unknown: 'bg-gray-100 text-gray-500',
}

/** Table-cell form, for the Leads and Lead Generator result grids. */
export function InsuranceText({
  status,
  date,
  company,
  renewalDate,
}: {
  status?: InsuranceStatusCode | null
  date?: string | null
  // Insurer on the policy being cancelled / renewed; shown under the status when known.
  company?: string | null
  renewalDate?: string | null
}) {
  const { text, tone } = insuranceLabel(status, date, renewalDate)
  if (!company || tone === 'covered' || tone === 'unknown') {
    return <span className={TEXT_TONE[tone]}>{text}</span>
  }
  return (
    <span className="block">
      <span className={TEXT_TONE[tone]}>{text}</span>
      <span className="block text-xs text-gray-500">{company}</span>
    </span>
  )
}

/** Pill form, for the Company Leads cards. */
export function InsuranceBadge({
  status,
  date,
  renewalDate,
}: {
  status?: InsuranceStatusCode | null
  date?: string | null
  renewalDate?: string | null
}) {
  const { text, tone } = insuranceLabel(status, date, renewalDate)
  return <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_TONE[tone]}`}>{text}</span>
}
