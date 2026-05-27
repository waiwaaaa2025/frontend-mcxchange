import {
  Loader2, AlertTriangle, ShieldCheck, ShieldAlert, Truck, Users, MapPin, FileText,
  Building2, Phone, Mail, Calendar, Gauge, DollarSign, Activity, AlertOctagon,
  Package, Award, GitBranch, Eye,
} from 'lucide-react'

interface Props {
  loading: boolean
  carrier: any | null   // /v1/carriers/{dot} response
  insurance: any | null // /v1/carriers/{dot}/insurance response
  report: any | null    // /v1/carriers/{dot}/report?format=json response — the kitchen sink
}

// Renders the entire LINQ profile for a managed company. Reads from
// /v1/carriers/{dot}/report — every meaningful section gets surfaced.
export default function LinqCarrierProfile({ loading, carrier, insurance, report }: Props) {
  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-12 flex items-center justify-center gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading live FMCSA snapshot…
      </div>
    )
  }
  if (!report && !carrier) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> No live data returned from LINQ.
      </div>
    )
  }

  const profile = report?.profile || carrier || {}
  const authority = report?.authority || {}
  const safety = report?.safety || {}
  const ins = report?.insurance || insurance || {}
  const fleet = report?.fleet || {}
  const cargo = report?.cargo || {}
  const docs = report?.documents || {}
  const cham = report?.chameleon || {}
  const crashes = report?.crashes || { total: 0, records: [] }
  const violations: any[] = report?.violations || []
  const oosOrders: any[] = report?.oos_orders || []
  const revocations: any[] = report?.revocations || []
  const related: any[] = report?.related?.related_carriers || []

  const status = profile.operating_status || carrier?.operating_status || '—'
  const isActive = String(status).toUpperCase() === 'ACTIVE'

  return (
    <div className="space-y-4">
      {/* Hero stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={isActive ? ShieldCheck : ShieldAlert} color={isActive ? 'green' : 'red'} label="Authority" value={status} sub={authority.docket_number || profile.operating_authority?.docket1 ? `MC ${authority.docket_number?.replace(/^MC/, '') || profile.operating_authority?.docket1}` : ''} />
        <Tile icon={Truck} color="blue" label="Power units" value={fleet.power_units ?? '—'} sub={`${fleet.total_drivers ?? '—'} drivers`} />
        <Tile icon={MapPin} color="indigo" label="Based in"
          value={profile.physical_address?.state || '—'}
          sub={profile.physical_address?.city || ''} />
        <Tile icon={DollarSign} color={ins.summary?.earliest_cancellation_date ? expiryColor(ins.summary.earliest_cancellation_date) : 'gray'}
          label="Insurance cancels"
          value={ins.summary?.earliest_cancellation_date ? new Date(ins.summary.earliest_cancellation_date).toLocaleDateString() : '—'}
          sub={ins.summary?.total_active_coverage ? `$${Number(ins.summary.total_active_coverage).toLocaleString()} active` : ''} />
      </div>

      {/* Chameleon / fraud risk — important enough to surface near top */}
      {cham?.risk_level && (
        <Section icon={Eye} title="Chameleon / fraud signal">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-lg text-white font-bold text-sm" style={{ background: cham.risk_color || '#9CA3AF' }}>
              {cham.risk_level} · {cham.score}
            </div>
            <div className="text-sm text-gray-700">
              {cham.risk_action || '—'}
              <div className="text-xs text-gray-500">{cham.signals_detected || 0} of {(cham.signals || []).length} signals tripped</div>
            </div>
          </div>
          {Array.isArray(cham.signals) && cham.signals.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {cham.signals.map((s: any) => (
                <div key={s.name} className={`border rounded p-2 ${s.detected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{s.name}</span>
                    <span className={`text-[10px] uppercase ${s.detected ? 'text-red-700' : 'text-gray-500'}`}>{s.detected ? '⚠️ Detected' : 'OK'}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.detail}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* OOS orders + revocations — only render if present */}
      {(oosOrders.length > 0 || revocations.length > 0) && (
        <Section icon={AlertOctagon} title="Out-of-service orders & revocations" accent="red">
          {oosOrders.length > 0 && (
            <div className="text-sm">
              <div className="font-semibold text-red-700 mb-1">OOS orders ({oosOrders.length})</div>
              <pre className="text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto">{JSON.stringify(oosOrders, null, 2).slice(0, 800)}</pre>
            </div>
          )}
          {revocations.length > 0 && (
            <div className="text-sm mt-3">
              <div className="font-semibold text-red-700 mb-1">Revocations ({revocations.length})</div>
              <pre className="text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto">{JSON.stringify(revocations, null, 2).slice(0, 800)}</pre>
            </div>
          )}
        </Section>
      )}

      {/* Identity & contact */}
      <Section icon={Building2} title="Identity & contact">
        <KVGrid pairs={[
          ['Legal name', profile.legal_name],
          ['DBA', profile.dba_name || '—'],
          ['Entity type', profile.entity_type || profile.carship || '—'],
          ['Phone', formatPhone(profile.phone)],
          ['Cell', formatPhone(profile.cell_phone)],
          ['Fax', formatPhone(profile.fax)],
          ['Email', profile.email || '—'],
          ['Date added (FMCSA)', formatLinqDate(profile.add_date)],
          ['Physical address', formatAddress(profile.physical_address)],
          ['Mailing address', formatAddress(profile.mailing_address)],
        ]} />
      </Section>

      {/* Operating authority */}
      <Section icon={Award} title="Operating authority">
        <KVGrid pairs={[
          ['Docket', authority.docket_number || profile.operating_authority?.docket1prefix + (profile.operating_authority?.docket1 || '')],
          ['Common authority', authority.common_authority || '—'],
          ['Contract authority', authority.contract_authority || '—'],
          ['Broker authority', authority.broker_authority || '—'],
          ['Property', boolLabel(authority.property)],
          ['Passenger', boolLabel(authority.passenger)],
          ['Household goods', boolLabel(authority.hhg)],
          ['Hazmat', boolLabel(fleet.hazmat) ],
          ['BIPD filing', authority.bipd_file === 'N' ? 'Not on file' : (authority.bipd_file || '—')],
          ['Cargo filing required', authority.cargo_required === 'Y' ? 'Yes' : 'No'],
          ['Bond filing required', authority.bond_required === 'Y' ? 'Yes' : 'No'],
          ['Min required coverage', authority.min_cov_amount ? `$${Number(authority.min_cov_amount).toLocaleString()}` : '—'],
        ]} />
      </Section>

      {/* Safety + BASIC scores */}
      <Section icon={Gauge} title="Safety & SMS BASIC scores">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MiniStat label="Safety rating" value={safety.safety_rating || 'NOT RATED'} />
          <MiniStat label="Rating date" value={safety.safety_rating_date || '—'} />
          <MiniStat label="Total inspections (24mo)" value={safety.total_inspections ?? '—'} />
          <MiniStat label="Crashes (24mo)" value={crashes.total ?? 0} accent={crashes.total > 0 ? 'amber' : ''} />
          <MiniStat label="Driver inspections" value={safety.driver_inspections ?? '—'} sub={`${safety.driver_oos_inspections ?? 0} OOS`} />
          <MiniStat label="Vehicle inspections" value={safety.vehicle_inspections ?? '—'} sub={`${safety.vehicle_oos_inspections ?? 0} OOS`} />
          <MiniStat label="Driver OOS rate" value={safety.driver_oos_rate != null ? `${safety.driver_oos_rate}%` : '—'} accent={safety.driver_oos_rate > 5 ? 'amber' : ''} />
          <MiniStat label="Vehicle OOS rate" value={safety.vehicle_oos_rate != null ? `${safety.vehicle_oos_rate}%` : '—'} accent={safety.vehicle_oos_rate > 20 ? 'red' : safety.vehicle_oos_rate > 10 ? 'amber' : ''} />
        </div>

        {Array.isArray(safety.basics) && safety.basics.length > 0 && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">BASIC categories</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {safety.basics.map((b: any) => (
                <div key={b.category} className={`border rounded-lg p-3 ${b.alert ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{b.category}</span>
                    {b.alert && <span className="text-[10px] uppercase text-red-700 font-bold">⚠️ Alert</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Measure</div>
                      <div className="font-bold text-gray-900 tabular-nums">{b.measure ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Percentile</div>
                      <div className="font-bold text-gray-900 tabular-nums">{b.percentile ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Insp. w/ viols</div>
                      <div className="font-bold text-gray-900 tabular-nums">{b.inspections_with_violations ?? 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              FMCSA SMS recalculates monthly. Higher percentile = more risk. Alert thresholds vary by BASIC (60–80%).
            </p>
          </>
        )}
      </Section>

      {/* Insurance — full breakdown */}
      <Section icon={DollarSign} title="Insurance">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MiniStat label="Total active coverage" value={ins.summary?.total_active_coverage ? `$${Number(ins.summary.total_active_coverage).toLocaleString()}` : '—'} />
          <MiniStat label="Active policies" value={ins.summary?.active_policies ?? '—'} />
          <MiniStat label="Insurers on record" value={ins.summary?.insurers_on_record ?? '—'} />
          <MiniStat label="Earliest cancellation" value={ins.summary?.earliest_cancellation_date ? new Date(ins.summary.earliest_cancellation_date).toLocaleDateString() : '—'}
            accent={ins.summary?.earliest_cancellation_date ? expiryColor(ins.summary.earliest_cancellation_date) : ''} />
          <MiniStat label="Coverage gap days" value={ins.summary?.coverage_gap_days ?? 0} accent={(ins.summary?.coverage_gap_days || 0) > 0 ? 'red' : ''} />
          <MiniStat label="Rejected filings" value={ins.summary?.rejected_filings ?? 0} accent={(ins.summary?.rejected_filings || 0) > 0 ? 'amber' : ''} />
          <MiniStat label="Latest change" value={ins.summary?.latest_change ? new Date(ins.summary.latest_change).toLocaleDateString() : '—'} />
          <MiniStat label="Meets minimum" value={ins.summary?.coverage_meets_minimum === true ? 'Yes' : ins.summary?.coverage_meets_minimum === false ? 'No' : '—'} />
        </div>

        {Array.isArray(ins.active_policies) && ins.active_policies.length > 0 && (
          <div className="overflow-x-auto">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Active policies</div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">Insurer</th>
                  <th className="px-3 py-2">Policy #</th>
                  <th className="px-3 py-2">Form</th>
                  <th className="px-3 py-2">Effective</th>
                  <th className="px-3 py-2">Cancels</th>
                  <th className="px-3 py-2 text-right">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ins.active_policies.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{p.company}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{p.policy_number}</td>
                    <td className="px-3 py-2"><span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]" title={p.form_description}>{p.form_code}</span></td>
                    <td className="px-3 py-2 text-gray-600">{p.effective_date ? new Date(p.effective_date).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.cancellation_date ? new Date(p.cancellation_date).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">${Number(p.coverage_amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ins.by_category && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {Object.entries(ins.by_category).map(([cat, v]: any) => (
              <div key={cat} className="border border-gray-200 rounded p-2 bg-gray-50">
                <div className="uppercase tracking-wider text-[10px] text-gray-500">{cat}</div>
                <div className="font-bold text-gray-900 tabular-nums">{v.count}</div>
                <div className="text-[10px] text-gray-500">${Number(v.total_coverage || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recent violations */}
      {violations.length > 0 && (
        <Section icon={AlertOctagon} title={`Recent inspection violations (${violations.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Driver</th>
                  <th className="px-3 py-2 text-right">Vehicle</th>
                  <th className="px-3 py-2 text-right">Hazmat</th>
                  <th className="px-3 py-2 text-right">OOS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {violations.map((v: any) => (
                  <tr key={v.inspection_id} className={v.oos_total > 0 ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 text-gray-700">{v.date}</td>
                    <td className="px-3 py-2 text-gray-600">{v.report_state}</td>
                    <td className="px-3 py-2 text-gray-600">L{v.level}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{v.total_violations}</td>
                    <td className="px-3 py-2 text-right text-gray-600 tabular-nums">{v.driver_violations}</td>
                    <td className="px-3 py-2 text-right text-gray-600 tabular-nums">{v.vehicle_violations}</td>
                    <td className="px-3 py-2 text-right text-gray-600 tabular-nums">{v.hazmat_violations}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${v.oos_total > 0 ? 'font-bold text-red-700' : 'text-gray-600'}`}>{v.oos_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Crashes (if any) */}
      {crashes.total > 0 && (
        <Section icon={AlertTriangle} title={`Crashes (${crashes.total})`} accent="amber">
          <pre className="text-xs bg-amber-50 border border-amber-200 rounded p-3 overflow-x-auto">{JSON.stringify(crashes.records, null, 2).slice(0, 2000)}</pre>
        </Section>
      )}

      {/* Fleet composition */}
      <Section icon={Truck} title="Fleet composition">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <MiniStat label="Power units" value={fleet.power_units ?? '—'} />
          <MiniStat label="Truck units" value={fleet.truck_units ?? '—'} />
          <MiniStat label="Bus units" value={fleet.bus_units ?? 0} />
          <MiniStat label="Total drivers" value={fleet.total_drivers ?? '—'} />
          <MiniStat label="CDL drivers" value={fleet.total_cdl ?? '—'} />
          <MiniStat label="Interstate drivers" value={fleet.driver_inter_total ?? '—'} />
          <MiniStat label="Intrastate drivers" value={fleet.total_intrastate_drivers ?? 0} />
          <MiniStat label="Leased / month avg" value={fleet.avg_drivers_leased_per_month ?? 0} />
        </div>
        {(fleet.owned || fleet.term_leased) && (
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Owned vs term-leased</div>
        )}
        {(fleet.owned || fleet.term_leased) && (
          <div className="grid grid-cols-2 gap-3">
            <FleetBreakdownCard title="Owned" breakdown={fleet.owned} />
            <FleetBreakdownCard title="Term-leased" breakdown={fleet.term_leased} />
          </div>
        )}
      </Section>

      {/* Cargo types */}
      <Section icon={Package} title="Cargo types">
        <div className="mb-2 text-sm">
          {Array.isArray(cargo.cargo_carried) && cargo.cargo_carried.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {cargo.cargo_carried.map((c: string) => (
                <span key={c} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded">{c}</span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No cargo types declared.</span>
          )}
        </div>
        {cargo.flags && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">All cargo flags ({Object.entries(cargo.flags).filter(([_, v]) => v).length} true)</summary>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1 mt-2 text-[10px]">
              {Object.entries(cargo.flags).filter(([_, v]) => v).map(([k]) => (
                <span key={k} className="bg-gray-100 px-2 py-1 rounded text-gray-700">{k.replace(/^crgo_/, '').replace(/_/g, ' ')}</span>
              ))}
            </div>
          </details>
        )}
      </Section>

      {/* MCS-150 / documents */}
      <Section icon={FileText} title="MCS-150 & filings">
        <KVGrid pairs={[
          ['MCS-150 filing date', formatLinqDate(docs.mcs150?.date || profile.mcs150_date)],
          ['MCS-150 mileage', (docs.mcs150?.mileage || profile.mcs150_mileage) ? Number(docs.mcs150?.mileage || profile.mcs150_mileage).toLocaleString() : '—'],
          ['Mileage year', docs.mcs150?.mileage_year || profile.mcs150_mileage_year || '—'],
          ['MCS-151 mileage', docs.mcs151_mileage ? Number(docs.mcs151_mileage).toLocaleString() : '—'],
          ['Registration date (FMCSA)', formatLinqDate(docs.registration_date || profile.add_date)],
          ['D&B number', docs.dun_bradstreet_no || '—'],
        ]} />
      </Section>

      {/* Related carriers (only if any) */}
      {related.length > 0 && (
        <Section icon={GitBranch} title={`Related carriers (${related.length})`}>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">{JSON.stringify(related, null, 2).slice(0, 1500)}</pre>
        </Section>
      )}

      {/* Raw payload — for debugging */}
      <details className="bg-white border rounded-xl">
        <summary className="cursor-pointer px-4 py-3 text-xs text-gray-500 hover:text-gray-700">View raw LINQ payload</summary>
        <pre className="text-[10px] bg-gray-900 text-gray-100 p-4 rounded-b-xl overflow-x-auto max-h-[600px]">{JSON.stringify(report, null, 2)}</pre>
      </details>
    </div>
  )
}

// ==================== HELPERS ====================

function Section({ icon: Icon, title, accent, children }: { icon: any; title: string; accent?: string; children: React.ReactNode }) {
  const tone = accent === 'red' ? 'border-red-200 bg-red-50/30'
    : accent === 'amber' ? 'border-amber-200 bg-amber-50/30'
    : 'border-gray-100 bg-white'
  return (
    <div className={`border rounded-xl p-5 ${tone}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function KVGrid({ pairs }: { pairs: Array<[string, any]> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {pairs.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-1.5">
          <span className="text-xs text-gray-500 whitespace-nowrap">{k}</span>
          <span className="text-gray-900 text-right truncate" title={String(v ?? '—')}>{v ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

function MiniStat({ label, value, sub, accent }: { label: string; value: any; sub?: string; accent?: string }) {
  const cls = accent === 'red' ? 'bg-red-50 border-red-200'
    : accent === 'amber' ? 'bg-amber-50 border-amber-200'
    : accent === 'green' ? 'bg-green-50 border-green-200'
    : accent === 'gray' ? 'bg-gray-50 border-gray-200'
    : 'bg-white border-gray-100'
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900 tabular-nums">{String(value)}</div>
      {sub ? <div className="text-[10px] text-gray-500">{sub}</div> : null}
    </div>
  )
}

function Tile({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: any; sub?: string }) {
  const palette: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700' },
    red: { bg: 'bg-red-50', text: 'text-red-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
  }
  const c = palette[color] || palette.gray
  return (
    <div className="bg-white border rounded-xl p-3 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-base font-semibold text-gray-900 truncate">{String(value)}</div>
        {sub ? <div className="text-[10px] text-gray-500 truncate">{sub}</div> : null}
      </div>
    </div>
  )
}

function FleetBreakdownCard({ title, breakdown }: { title: string; breakdown: any }) {
  if (!breakdown) return null
  const entries = Object.entries(breakdown).filter(([_, v]) => v != null && v !== 0)
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
      {entries.length === 0 ? (
        <div className="text-xs text-gray-400">None reported.</div>
      ) : (
        <div className="space-y-0.5 text-xs">
          {entries.map(([k, v]: any) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-500">{k.replace(/_/g, ' ')}</span>
              <span className="font-medium text-gray-900 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—'
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return raw
}

function formatAddress(a: any): string {
  if (!a || typeof a !== 'object') return '—'
  const parts = [a.street, [a.city, a.state, a.zip].filter(Boolean).join(', ')].filter(Boolean)
  return parts.join(' · ') || '—'
}

function formatLinqDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  const s = String(raw).trim()
  // LINQ format: "YYYYMMDD HHMM" or "YYYYMMDD"
  const m = s.match(/^(\d{4})(\d{2})(\d{2})/)
  if (m) {
    const [, y, mo, d] = m
    return new Date(`${y}-${mo}-${d}`).toLocaleDateString()
  }
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s).toLocaleDateString()
  return s
}

function boolLabel(v: any): string {
  if (v === true || v === 'Y' || v === 'YES') return 'Yes'
  if (v === false || v === 'N' || v === 'NO') return 'No'
  return v ?? '—'
}

function expiryColor(iso: string): 'green' | 'amber' | 'red' | 'gray' {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'red'
  if (days <= 30) return 'red'
  if (days <= 60) return 'amber'
  return 'green'
}
