import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, Copy, Loader2, ExternalLink, Info } from 'lucide-react'
import api from '../services/api'

/**
 * Admin Leads → New Carriers: brand-new DOT registrations from the FMCSA census,
 * with the email each carrier filed. The census refreshes about weekly, so the
 * banner says how far the file currently goes.
 */

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const PAGE_SIZE = 50

interface Filters {
  days: string
  state: string
  name: string
  forHireOnly: boolean
  withMcOnly: boolean
  emailOnly: boolean
}

const DEFAULT_FILTERS: Filters = {
  days: '30', state: '', name: '', forHireOnly: false, withMcOnly: false, emailOnly: true,
}

type Result = Awaited<ReturnType<typeof api.newCarriersSearch>>['data']

export default function NewCarriersPanel({ onSave }: { onSave: (dot: string) => void }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS)
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'csv' | 'emails' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.newCarriersSearch({ ...applied, offset, limit: PAGE_SIZE })
      .then(res => { if (!cancelled) setData(res.data) })
      .catch((e: any) => { if (!cancelled) setError(e.message || 'Search failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [applied, offset])

  function search() {
    setOffset(0)
    setApplied({ ...filters })
  }

  async function fetchExport(format?: 'emails') {
    const url = api.newCarriersExportUrl({ ...applied, ...(format ? { format } : {}) })
    const token = localStorage.getItem('mcx_token')
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('Export failed — FMCSA may be unavailable, try again')
    return res
  }

  async function downloadCsv() {
    setBusy('csv')
    setNotice(null)
    try {
      const blob = await (await fetchExport()).blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `new-carriers-${applied.days}d-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
    } catch (e: any) {
      setNotice(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function copyEmails() {
    setBusy('emails')
    setNotice(null)
    try {
      const text = await (await fetchExport('emails')).text()
      const count = text ? text.split('\n').length : 0
      await navigator.clipboard.writeText(text)
      setNotice(`Copied ${count.toLocaleString()} emails to your clipboard`)
    } catch (e: any) {
      setNotice(e.message || 'Could not copy emails')
    } finally {
      setBusy(null)
    }
  }

  const results = data?.results ?? []
  const total = data?.total ?? 0

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 bg-white rounded-lg border p-4 space-y-3 h-fit md:sticky md:top-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">New carrier filters</h3>

        <Field label="Registered within">
          <select value={filters.days} onChange={e => setFilters(f => ({ ...f, days: e.target.value }))} className="input">
            {['7', '14', '30', '60', '90'].map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </Field>

        <Field label="State">
          <select value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))} className="input">
            <option value="">Any</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Company name">
          <input value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} placeholder="ACME Trucking" className="input" />
        </Field>

        <Check label="Has email" checked={filters.emailOnly} onChange={v => setFilters(f => ({ ...f, emailOnly: v }))} />
        <Check label="For-hire carriers only" checked={filters.forHireOnly} onChange={v => setFilters(f => ({ ...f, forHireOnly: v }))} />
        <Check label="Already has an MC number" checked={filters.withMcOnly} onChange={v => setFilters(f => ({ ...f, withMcOnly: v }))} />

        <div className="flex gap-2 pt-2">
          <button onClick={search} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={() => { setFilters(DEFAULT_FILTERS); setOffset(0); setApplied(DEFAULT_FILTERS) }} className="px-3 py-2 border rounded-lg text-sm text-gray-700">Clear</button>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <div className="bg-white rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b">
            <div className="text-sm text-gray-700">
              {loading
                ? 'Loading…'
                : <><strong className="text-gray-900">{total.toLocaleString()}</strong> new carrier{total === 1 ? '' : 's'} in the last {data?.days ?? applied.days} days</>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyEmails} disabled={!!busy || total === 0} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                {busy === 'emails' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} Copy all emails
              </button>
              <button onClick={downloadCsv} disabled={!!busy || total === 0} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {busy === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export all (CSV)
              </button>
            </div>
          </div>

          {data?.dataThrough && (
            <div className="px-4 py-2.5 text-xs bg-blue-50 border-b border-blue-100 text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-px" />
              <span>
                Straight from the FMCSA census, which updates about once a week. The file currently runs through{' '}
                <strong>{data.dataThrough}</strong>, so carriers registered after that aren't in it yet.
              </span>
            </div>
          )}
          {notice && <div className="px-4 py-2 text-sm bg-gray-50 border-b text-gray-700">{notice}</div>}
          {error && <div className="p-3 text-sm text-red-600 bg-red-50">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-3 py-2">Registered</th>
                  <th className="px-3 py-2">DOT / MC</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2 text-right">Trucks</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!loading && results.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No new carriers match these filters.</td></tr>
                )}
                {results.map(c => (
                  <tr key={c.dotNumber} className="hover:bg-gray-50 align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.registeredDate || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                      <Link to={`/admin/carrier-pulse/${c.dotNumber}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        {c.dotNumber} <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                      {c.mcNumber && <div className="text-gray-500">{c.mcNumber}</div>}
                    </td>
                    <td className="px-3 py-2 min-w-[12rem]">
                      <div className="font-medium text-gray-900">{c.legalName}</div>
                      <div className="text-xs text-gray-500">
                        {[[c.city, c.state].filter(Boolean).join(', '), c.officer, c.forHire ? 'For-hire' : 'Private'].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.powerUnits ?? '—'}</td>
                    <td className="px-3 py-2">
                      {c.email && <a href={`mailto:${c.email}`} className="block text-blue-600 hover:underline whitespace-nowrap">{c.email}</a>}
                      {c.phone && <a href={`tel:${c.phone.replace(/\D/g, '')}`} className="block text-gray-600 whitespace-nowrap">{c.phone}</a>}
                      {!c.email && !c.phone && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => onSave(c.dotNumber)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">+ Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between p-3 border-t text-sm text-gray-600">
              <span>
                {(offset + 1).toLocaleString()}–{Math.min(offset + PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()}
              </span>
              <div className="flex gap-2">
                <button disabled={offset === 0 || loading} onClick={() => setOffset(o => Math.max(o - PAGE_SIZE, 0))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
                <button disabled={!data?.hasMore || loading} onClick={() => setOffset(o => o + PAGE_SIZE)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300" />
      {label}
    </label>
  )
}
