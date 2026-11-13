import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Scale, X, ExternalLink, Copy, Check, FileText, AlertTriangle } from 'lucide-react'
import type { V2InspectionRecord } from './mockData'
import api, { type CfrRegulation } from '../../services/api'

// Session cache so re-expanding an inspection doesn't refetch.
const regCache = new Map<string, CfrRegulation | null>()

function useRegulations(codes: string[]): Record<string, CfrRegulation | null> {
  const key = [...new Set(codes)].sort().join(',')
  const [, force] = useState(0)
  useEffect(() => {
    const missing = key ? key.split(',').filter((c) => !regCache.has(c)) : []
    if (missing.length === 0) return
    let alive = true
    api.getRegulations(missing)
      .then((res) => {
        for (const c of missing) regCache.set(c, res?.data?.[c] ?? null)
        if (alive) force((n) => n + 1)
      })
      .catch(() => { /* regulation text is a nice-to-have */ })
    return () => { alive = false }
  }, [key])
  const out: Record<string, CfrRegulation | null> = {}
  for (const c of codes) out[c] = regCache.get(c) ?? null
  return out
}

const shortReg = (t: string, n = 320) => (t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t)

type Violation = V2InspectionRecord['violationDetails'][number]

export interface InspectionContext {
  date: string
  state: string
  reportNumber: string
  levelLabel: string
}

export interface CarrierContext {
  dotNumber?: string
  legalName?: string
}

const DATAQS_URL = 'https://dataqs.fmcsa.dot.gov'

const severityColor = (s: number) => (s >= 8 ? 'bg-red-500' : s >= 5 ? 'bg-yellow-500' : 'bg-blue-500')

// ─── What to gather, by the CFR part the violation was written under ───
interface Guidance {
  topic: string
  validGrounds: string[]
  evidence: string[]
  caution?: string
}

function guidanceFor(code: string | undefined, description: string): Guidance {
  const c = (code || '').toUpperCase()
  const part = (/^(\d{3})/.exec(c) || [])[1] || ''

  if (/^392\.?2-?SL/.test(c) || /state\/local/i.test(description)) {
    return {
      topic: 'State / local law (e.g. speeding, size & weight)',
      validGrounds: [
        'The citation (ticket) for this violation was dismissed, or you were found not guilty — FMCSA removes the violation from SMS.',
        'You were convicted of a different / lesser charge — the violation is changed to match.',
        'The facts on the report are wrong (wrong speed range, wrong carrier, wrong vehicle).',
      ],
      evidence: [
        'Court disposition / final judgment showing dismissal, not guilty, or the amended charge',
        'Copy of the citation (match the citation number on the inspection)',
        'GPS / ELD / telematics speed data for the time of the stop, if the speed is disputed',
      ],
      caution: 'Paying the ticket counts as a conviction. If you plan to challenge, fight the citation in court first, then file the DataQ with the result.',
    }
  }
  if (part === '395') {
    return {
      topic: 'Hours of Service',
      validGrounds: [
        'The driver was within their hours, or an exemption applied (short-haul 395.1(e), agricultural, adverse driving conditions, personal conveyance, yard moves).',
        'An ELD malfunction was properly noted and paper logs were being kept.',
        'The log/time math on the report is wrong.',
      ],
      evidence: [
        'ELD records / RODS for the day of inspection and the prior 7 days',
        'Supporting documents (fuel receipts, bills of lading, dispatch records, toll records)',
        'ELD malfunction notice and paper logs, if applicable',
        'Documentation of the exemption used (e.g. short-haul time records)',
      ],
    }
  }
  if (part === '391' || part === '383') {
    return {
      topic: 'Driver qualification / licensing',
      validGrounds: [
        'The driver had a valid medical certificate, CDL, or endorsement on the inspection date but did not have it in hand or it was not visible in the state system yet.',
        'The restriction/endorsement cited does not apply to the vehicle that was driven.',
      ],
      evidence: [
        'Medical examiner’s certificate valid on the inspection date (and National Registry listing)',
        'CDL / endorsements / MVR showing status on the inspection date',
        'Vehicle registration / GVWR showing which license class was actually required',
      ],
      caution: 'Forgetting to carry a document that was valid is often still a violation in some states — the challenge works best when the record itself was wrong.',
    }
  }
  if (part === '382' || /^392\.?[45]/.test(c)) {
    return {
      topic: 'Controlled substances / alcohol',
      validGrounds: ['Lab or test results contradict the violation, or the substance was not a prohibited one.'],
      evidence: ['Negative test results (MRO-verified)', 'Court disposition for any related charge'],
    }
  }
  if (part === '392') {
    return {
      topic: 'Driving behavior',
      validGrounds: [
        'The behavior did not happen as described, or the wrong driver/carrier was recorded.',
        'Any related citation was dismissed or found not guilty.',
      ],
      evidence: [
        'Dash-cam / in-cab video for the time of the stop',
        'Court disposition if a citation was issued',
        'Telematics data (speed, hard braking, seat-belt sensor)',
      ],
    }
  }
  if (part === '393' || part === '396') {
    return {
      topic: 'Vehicle / equipment',
      validGrounds: [
        'The defect did not exist (photos, specs, or measurements prove the part was compliant).',
        'The vehicle cited is not yours (VIN / plate belongs to another carrier, or a leased-on unit under another DOT).',
        'The regulation cited does not apply to that equipment (e.g. part not required on that vehicle type).',
      ],
      evidence: [
        'Dated photos of the part taken at or right after the inspection',
        'Driver pre-trip / post-trip inspection report (DVIR) for that day',
        'Annual (periodic) inspection report and maintenance records',
        'Manufacturer specs (e.g. ATIS-equipped tires, auto slack adjusters)',
        'Registration / lease agreement if the unit belongs to someone else',
      ],
      caution: 'A repair receipt after the inspection does NOT remove a violation — it only proves you fixed it. Challenge only if the defect was not there or was recorded wrong.',
    }
  }
  if (part === '390') {
    return {
      topic: 'General (marking, registration, operating authority)',
      validGrounds: [
        'The vehicle was correctly marked / the carrier had active authority on that date.',
        'The vehicle was operating under another carrier’s authority (leased on).',
      ],
      evidence: [
        'Photos of the USDOT marking on both sides of the vehicle',
        'FMCSA authority / registration records active on the inspection date',
        'Lease agreement and the other carrier’s DOT if leased on',
      ],
    }
  }
  if (part === '397' || ['171', '172', '173', '177', '178', '180'].includes(part)) {
    return {
      topic: 'Hazardous materials',
      validGrounds: ['The shipment was not hazmat, was below placarding thresholds, or the papers/placards were correct.'],
      evidence: ['Shipping papers / bill of lading', 'Photos of placards and markings', 'SDS for the material'],
    }
  }
  return {
    topic: 'General',
    validGrounds: [
      'The violation did not occur, or the facts on the report are wrong.',
      'The inspection belongs to another carrier, driver, or vehicle.',
      'A related citation was dismissed or found not guilty.',
    ],
    evidence: ['Any document, photo, or record that proves the report is wrong', 'Court disposition for any related citation'],
  }
}

function buildLetter(v: Violation | null, insp: InspectionContext, carrier: CarrierContext, reg: CfrRegulation | null): string {
  const who = carrier.legalName ? `${carrier.legalName}${carrier.dotNumber ? ` (USDOT ${carrier.dotNumber})` : ''}` : carrier.dotNumber ? `USDOT ${carrier.dotNumber}` : '[Carrier name / USDOT]'
  const subject = v
    ? `violation ${v.code || '[code]'} — "${v.description || '[description]'}"`
    : 'this inspection'
  return [
    `Re: Request for Data Review — Inspection Report ${insp.reportNumber || '[report #]'}`,
    `Inspection date: ${insp.date || '[date]'}   State: ${insp.state || '[state]'}   ${insp.levelLabel}`,
    ...(v?.citationNumber ? [`Citation number: ${v.citationNumber}`] : []),
    '',
    `On behalf of ${who}, I am requesting a review of ${subject}${v?.unit ? ` cited on ${v.unit}` : ''}.`,
    ...(reg
      ? [
          '',
          `Per FMCSA regulation ${reg.citation} (${reg.title}): "${shortReg(reg.text, 500)}"`,
        ]
      : []),
    '',
    'Reason for the request:',
    '[One or two sentences stating plainly what is wrong. Example: "The citation issued for this violation was dismissed by the ___ County Court on __/__/____ (case #____). Per FMCSA policy on adjudicated citations, we request the violation be removed." or "The tire was not underinflated — see attached photo taken at the scene and the ATIS specification."]',
    '',
    'Supporting documents attached:',
    '1. [e.g. Court disposition]',
    '2. [e.g. Dated photo / DVIR / ELD record]',
    '',
    `We ask that ${v ? 'the violation be removed (or corrected) from' : 'the inspection be corrected in'} the carrier's SMS record.`,
    '',
    'Thank you,',
    '[Name, title]',
    '[Phone / email]',
  ].join('\n')
}

// "Per FMCSA regulation 49 CFR 393.75(a)(3) — Tires: …" with a link to eCFR.
function RegulationNote({ reg }: { reg: CfrRegulation }) {
  const [open, setOpen] = useState(false)
  const long = reg.text.length > 320
  return (
    <div className="mt-2 rounded-lg border-l-2 border-indigo-300 bg-indigo-50/50 px-3 py-2">
      <p className="text-[11px] text-gray-700 leading-relaxed">
        <span className="font-semibold text-gray-900">Per FMCSA regulation </span>
        <a href={reg.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 hover:underline">
          {reg.citation}
        </a>
        {reg.title && <span className="text-gray-500"> — {reg.title}</span>}
        <span>: “{open || !long ? reg.text : shortReg(reg.text)}”</span>
        {long && (
          <button onClick={() => setOpen(!open)} className="ml-1 text-indigo-600 hover:underline">
            {open ? 'less' : 'more'}
          </button>
        )}
      </p>
    </div>
  )
}

// ─── DataQs guide modal ───
export function DataQsGuideModal({
  violation,
  inspection,
  carrier,
  regulation = null,
  onClose,
}: {
  violation: Violation | null
  inspection: InspectionContext
  carrier: CarrierContext
  regulation?: CfrRegulation | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const g = guidanceFor(violation?.code, violation?.description || '')
  const letter = buildLetter(violation, inspection, carrier, regulation)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — user can select the text */
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Challenge with DataQs
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Report {inspection.reportNumber || '—'} · {inspection.date} · {inspection.state}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 text-sm text-gray-700">
          {violation && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                {violation.code && <span className="font-mono text-xs font-bold text-gray-900 bg-white border border-gray-300 px-2 py-0.5 rounded">{violation.code}</span>}
                {violation.oos && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">OOS</span>}
                <span className="text-xs text-gray-500">{g.topic}</span>
              </div>
              <p className="text-sm text-gray-800 mt-1.5">{violation.description}</p>
              {regulation && <RegulationNote reg={regulation} />}
            </div>
          )}

          <section>
            <h4 className="font-semibold text-gray-900 mb-1.5">What DataQs is</h4>
            <p className="text-gray-600 leading-relaxed">
              DataQs is FMCSA’s official system for asking that inspection, violation, or crash data be reviewed. Your request goes to the
              agency that did the inspection (usually the state police / DOT of {inspection.state || 'that state'}), and they decide.
              If a violation is removed, it drops out of your SMS / BASIC scores.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-1.5">When a challenge can work</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              {g.validGrounds.map((t) => <li key={t}>{t}</li>)}
            </ul>
            {g.caution && (
              <p className="mt-2 flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                {g.caution}
              </p>
            )}
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-1.5">Evidence to gather</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              {g.evidence.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-1.5">How to file — step by step</h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
              <li>Go to <a href={DATAQS_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">dataqs.fmcsa.dot.gov</a> and sign in or create an account (carrier accounts are linked to your USDOT number).</li>
              <li>Click <b>Add New Request</b> and choose <b>Inspection</b> as the request type.</li>
              <li>Pick the reason that fits — e.g. <i>Inspection – Violation</i> (incorrect or dismissed violation), <i>Inspection – Assigned to wrong carrier</i>, <i>Duplicate inspection</i>, or <i>Citation with associated violation</i>.</li>
              <li>Enter report number <b>{inspection.reportNumber || '(from the report)'}</b>, state <b>{inspection.state || '—'}</b>, and inspection date <b>{inspection.date || '—'}</b> so the system finds the inspection.</li>
              <li>Paste your explanation (template below), edit the bracketed parts, and upload your evidence as PDFs or photos.</li>
              <li>Submit and watch your DataQs inbox — the state may ask for more information. If denied, you can request <b>one reconsideration</b> with new evidence.</li>
            </ol>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-1.5">Tips that get requests approved</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>One request per inspection — list every violation you’re disputing on that report in the same request.</li>
              <li>Stick to facts and documents. Don’t argue about the officer; show what the record got wrong.</li>
              <li>Have a court date pending? Wait for the result, then file with the disposition attached.</li>
              <li>Don’t file without evidence — repeated unsupported requests can get an account flagged.</li>
              <li>Crashes use a separate request type (Crash Preventability Determination Program).</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-semibold text-gray-900 flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-400" /> What to write</h4>
              <button onClick={copy} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <textarea readOnly value={letter} rows={14} className="w-full font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-y" />
          </section>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Link to="/product/safety" className="text-xs text-gray-500 hover:text-indigo-600">Want us to file it for you? See Safety Services →</Link>
          <a href={DATAQS_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg">
            Open DataQs <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Violation table with codes, full descriptions, and DataQs entry points ───
export default function InspectionViolationsTable({
  violations,
  inspection,
  carrier,
}: {
  violations: Violation[]
  inspection: InspectionContext
  carrier: CarrierContext
}) {
  const [guideFor, setGuideFor] = useState<Violation | null | undefined>(undefined)
  const regs = useRegulations(violations.map((v) => v.code || '').filter(Boolean))

  return (
    <>
      <div className="divide-y divide-gray-100">
        {violations.map((v, i) => {
          const severityKnown = v.inSms !== false && v.severity > 0
          return (
            <div key={i} className={`px-4 py-3 ${v.oos ? 'bg-red-50/50' : 'bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {v.code && (
                      <span className="font-mono text-[11px] font-bold text-gray-900 bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded" title="Federal Motor Carrier Safety Regulation (49 CFR) section cited">
                        {v.code}
                      </span>
                    )}
                    {v.oos && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">OUT OF SERVICE</span>}
                    {v.category && (
                      <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                        {v.category}{v.inSms === false ? ' (est.)' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-1.5 leading-snug">{v.description || 'No description on file'}</p>
                  {v.code && regs[v.code] && <RegulationNote reg={regs[v.code]!} />}
                  <p className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {v.group && <span>Group: {v.group}</span>}
                    {v.unit && <span>Cited on: {v.unit}</span>}
                    {v.citationNumber && <span>Citation #{v.citationNumber}</span>}
                    <span className="inline-flex items-center gap-1">
                      Severity:
                      {severityKnown ? (
                        <><span className={`w-2 h-2 rounded-full ${severityColor(v.severity)}`} /><b className="text-gray-800">{v.severity}</b>/10</>
                      ) : (
                        <span className="text-gray-400" title="Not yet weighted in FMCSA SMS, or counts toward no BASIC">—</span>
                      )}
                    </span>
                  </p>
                </div>
                <button onClick={() => setGuideFor(v)}
                  className="flex-shrink-0 flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md"
                  title="How to challenge this violation with FMCSA DataQs">
                  <Scale className="w-3.5 h-3.5" /> DataQ
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">Think something on this report is wrong? You can ask FMCSA to review it.</p>
        <button onClick={() => setGuideFor(null)} className="flex-shrink-0 text-[11px] font-semibold text-indigo-600 hover:underline">
          How to challenge this inspection →
        </button>
      </div>
      {guideFor !== undefined && (
        <DataQsGuideModal violation={guideFor} inspection={inspection} carrier={carrier}
          regulation={guideFor?.code ? regs[guideFor.code] : null} onClose={() => setGuideFor(undefined)} />
      )}
    </>
  )
}
