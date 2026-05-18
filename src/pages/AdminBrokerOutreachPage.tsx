import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Phone, Clock, MessageSquare, CheckCircle, XCircle, ArrowLeft, Mail, User, Calendar, Loader2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import api from '../services/api'

interface OutreachRequest {
  id: string
  status: 'PENDING' | 'CONTACTED' | 'NEGOTIATING' | 'COMPLETED' | 'CLOSED' | 'FAILED'
  dotNumber: string
  mcNumber?: string
  carrierName?: string
  buyerMessage?: string
  adminNotes?: string
  contactedAt?: string
  createdAt: string
  user?: { id: string; name: string; email: string; phone?: string }
}

const STATUSES: OutreachRequest['status'][] = ['PENDING', 'CONTACTED', 'NEGOTIATING', 'COMPLETED', 'CLOSED', 'FAILED']

const statusColor = (s: string) => {
  switch (s) {
    case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'CONTACTED': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'NEGOTIATING': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200'
    case 'FAILED': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export default function AdminBrokerOutreachPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<OutreachRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [editing, setEditing] = useState<OutreachRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAdminBrokerOutreach(
        filterStatus === 'all' ? {} : { status: filterStatus }
      )
      if (res.success) setRequests(res.data || [])
      else setError('Failed to load broker outreach requests')
    } catch (e: any) {
      setError(e?.message || 'Failed to load broker outreach requests')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(true)
      const res = await api.updateAdminBrokerOutreach(id, { status, notes: notes || undefined })
      if (res.success) {
        await fetchRequests()
        setEditing(null)
        setNotes('')
      } else {
        alert(res.error || 'Update failed')
      }
    } catch (e: any) {
      alert(e?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter((r) => r.status === filterStatus)

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broker Outreach</h1>
              <p className="text-gray-500 text-sm">Buyers asking Domilea to contact carrier owners (Pending Insurance Leads)</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 border-red-200"><p className="text-red-600">{error}</p></Card>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12 text-gray-500">No broker outreach requests.</Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {req.carrierName || 'Unknown carrier'}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">DOT {req.dotNumber}{req.mcNumber ? ` · ${req.mcNumber}` : ''}</p>
                      {req.buyerMessage && (
                        <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                          <span className="font-medium text-gray-500">Buyer note: </span>{req.buyerMessage}
                        </div>
                      )}
                      {req.adminNotes && (
                        <div className="mt-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-gray-700">
                          <span className="font-medium text-indigo-600">Admin notes: </span>{req.adminNotes}
                        </div>
                      )}
                    </div>
                    <div className="w-64 shrink-0 bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                      <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium">{req.user?.name}</span></div>
                      {req.user?.email && (
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${req.user.email}`} className="text-indigo-600 truncate">{req.user.email}</a></div>
                      )}
                      {req.user?.phone && (
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><a href={`tel:${req.user.phone}`} className="text-indigo-600">{req.user.phone}</a></div>
                      )}
                      <div className="flex items-center gap-2 pt-1.5 border-t border-gray-200 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />{new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(req); setNotes(req.adminNotes || '') }}>
                      <MessageSquare className="w-4 h-4 mr-1.5" /> Edit notes / status
                    </Button>
                    {req.status === 'PENDING' && (
                      <Button size="sm" disabled={updating} onClick={() => updateStatus(req.id, 'CONTACTED')}>
                        <Clock className="w-4 h-4 mr-1.5" /> Mark contacted
                      </Button>
                    )}
                    {(req.status === 'CONTACTED' || req.status === 'NEGOTIATING') && (
                      <Button size="sm" disabled={updating} onClick={() => updateStatus(req.id, 'COMPLETED')}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Mark completed
                      </Button>
                    )}
                    {req.status !== 'FAILED' && req.status !== 'COMPLETED' && (
                      <Button variant="ghost" size="sm" disabled={updating} onClick={() => updateStatus(req.id, 'FAILED')}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Mark failed
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{editing.carrierName || 'Carrier'}</h3>
            <p className="text-sm text-gray-500 mb-4">DOT {editing.dotNumber}</p>
            <Textarea
              label="Admin notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Outcome of outreach, owner response, next steps…"
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Set status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <Button key={s} size="sm" variant="outline" disabled={updating} onClick={() => updateStatus(editing.id, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)} disabled={updating}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
