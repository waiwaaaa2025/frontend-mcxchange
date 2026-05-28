import { useCallback, useEffect, useState } from 'react'
import { Users, Search, Loader2 } from 'lucide-react'
import Button from '../components/ui/Button'
import { api } from '../services/api'

interface SaveRow {
  id: string
  userId: string
  dotNumber: string
  carrierName: string | null
  carrierStateCode: string | null
  notes: string | null
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}

interface Filters {
  userId: string
  dotNumber: string
  from: string
  to: string
}

const EMPTY_FILTERS: Filters = { userId: '', dotNumber: '', from: '', to: '' }

export default function AdminLeadGeneratorSavesPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [rows, setRows] = useState<SaveRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (nextPage = 1) => {
    setLoading(true)
    try {
      const res = await api.leadGeneratorAdminListAllSaves({ ...filters, page: nextPage, limit: 50 })
      setRows(res.data.saves)
      setPage(res.data.page)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    } catch (err) {
      console.error('Failed to load LG saves', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load(1) }, []) // initial load

  return (
    <div className="px-4 py-6 lg:px-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users className="h-6 w-6 text-cyan-500" />
            Lead Generator — All Saves
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cross-user view of every carrier saved by subscribers. Read-only.
          </p>
        </div>
        <div className="text-sm text-slate-500">{total} total saves</div>
      </header>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
            placeholder="User ID"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={filters.dotNumber}
            onChange={(e) => setFilters((f) => ({ ...f, dotNumber: e.target.value }))}
            placeholder="DOT number"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            title="From"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            title="To"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setFilters(EMPTY_FILTERS); load(1) }}>
            Clear
          </Button>
          <Button variant="primary" onClick={() => load(1)} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {loading ? 'Loading…' : 'Filter'}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading && rows.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Saved by</th>
                <th className="px-3 py-3">DOT</th>
                <th className="px-3 py-3">Carrier</th>
                <th className="px-3 py-3">State</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Saved at</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-slate-500">
                    No saves match your filters.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    {r.user ? (
                      <div>
                        <div className="font-medium text-slate-900">{r.user.name}</div>
                        <div className="text-xs text-slate-500">{r.user.email}</div>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">{r.userId}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{r.dotNumber}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">{r.carrierName || '—'}</td>
                  <td className="px-3 py-3">{r.carrierStateCode || '—'}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {r.notes ? (r.notes.length > 80 ? r.notes.slice(0, 80) + '…' : r.notes) : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => load(page - 1)}>
                Previous
              </Button>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
