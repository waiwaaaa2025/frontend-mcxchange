// Compliance API client — mirrors backend complianceController endpoints.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface ApiResponse<T> { success: boolean; data: T; error?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('mcx_token') || localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as any)?.error || `HTTP ${res.status}`)
  return body as T
}

export interface ManagedCompany {
  id: string
  userId: string
  dotNumber: string
  label?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  // Enriched by GET /compliance/companies — undefined on responses that don't include the snapshot join.
  mcDocket?: string | null
  snapshot?: {
    operatingStatus: string | null
    safetyRating: string | null
    chameleonScore: number | null
    chameleonRiskLevel: string | null
    lastFetchedAt: string
    mcs150DaysAgo: number | null
  } | null
  alertsCount?: number
}

export interface ComplianceDocumentRow {
  id: string
  managedCompanyId: string
  kind: string
  title: string
  expiresOn?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  company?: { id: string; dotNumber: string; label?: string }
}

export interface DriverRow {
  id: string
  managedCompanyId: string
  fullName: string
  cdlNumber?: string | null
  cdlState?: string | null
  cdlExpiresOn?: string | null
  hireDate?: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'TERMINATED'
  notes?: string | null
  createdAt: string
  updatedAt: string
  company?: { id: string; dotNumber: string; label?: string }
}

export interface DriverDocumentRow {
  id: string
  driverId: string
  kind: string
  title: string
  expiresOn?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  totalCompanies: number
  totalDrivers: number
  docsExpiring: { in7: number; in30: number; in60: number; in90: number; expired: number }
  cdlExpiring: { in7: number; in30: number; in60: number; in90: number; expired: number }
}

const complianceApi = {
  dashboardSummary: () => request<ApiResponse<DashboardSummary>>('/compliance/dashboard/summary'),

  // Companies
  listCompanies: () => request<ApiResponse<ManagedCompany[]>>('/compliance/companies'),
  addCompany: (body: { dotNumber: string; label?: string; notes?: string }) =>
    request<ApiResponse<ManagedCompany>>('/compliance/companies', { method: 'POST', body: JSON.stringify(body) }),
  getCompany: (id: string) => request<ApiResponse<{ company: ManagedCompany; linq: { carrier: any; insurance: any; report: any } }>>(`/compliance/companies/${id}`),
  updateCompany: (id: string, body: { label?: string; notes?: string }) =>
    request<ApiResponse<ManagedCompany>>(`/compliance/companies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCompany: (id: string) => request<ApiResponse<null>>(`/compliance/companies/${id}`, { method: 'DELETE' }),
  refreshCompany: (id: string) => request<ApiResponse<{ lastFetchedAt: string; changesDetected: number }>>(`/compliance/companies/${id}/refresh`, { method: 'POST' }),
  getCompanyChanges: (id: string) => request<ApiResponse<Array<{
    id: string
    field: string
    oldValue: any
    newValue: any
    severity: 'INFO' | 'WARN' | 'CRITICAL'
    description: string | null
    acknowledged: boolean
    detectedAt: string
  }>>>(`/compliance/companies/${id}/changes`),
  acknowledgeChange: (id: string) => request<ApiResponse<null>>(`/compliance/changes/${id}/acknowledge`, { method: 'POST' }),

  // Documents
  listCompanyDocuments: (companyId: string) =>
    request<ApiResponse<ComplianceDocumentRow[]>>(`/compliance/companies/${companyId}/documents`),
  listAllDocuments: () => request<ApiResponse<ComplianceDocumentRow[]>>('/compliance/documents'),
  createDocument: (companyId: string, body: { kind: string; title: string; expiresOn?: string; notes?: string }) =>
    request<ApiResponse<ComplianceDocumentRow>>(`/compliance/companies/${companyId}/documents`, { method: 'POST', body: JSON.stringify(body) }),
  updateDocument: (id: string, body: Partial<{ kind: string; title: string; expiresOn: string; notes: string }>) =>
    request<ApiResponse<ComplianceDocumentRow>>(`/compliance/documents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteDocument: (id: string) => request<ApiResponse<null>>(`/compliance/documents/${id}`, { method: 'DELETE' }),

  // Drivers
  listCompanyDrivers: (companyId: string) => request<ApiResponse<DriverRow[]>>(`/compliance/companies/${companyId}/drivers`),
  listAllDrivers: () => request<ApiResponse<DriverRow[]>>('/compliance/drivers'),
  createDriver: (companyId: string, body: Partial<Omit<DriverRow, 'id' | 'managedCompanyId' | 'createdAt' | 'updatedAt'>>) =>
    request<ApiResponse<DriverRow>>(`/compliance/companies/${companyId}/drivers`, { method: 'POST', body: JSON.stringify(body) }),
  getDriver: (id: string) => request<ApiResponse<DriverRow>>(`/compliance/drivers/${id}`),
  updateDriver: (id: string, body: Partial<DriverRow>) =>
    request<ApiResponse<DriverRow>>(`/compliance/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteDriver: (id: string) => request<ApiResponse<null>>(`/compliance/drivers/${id}`, { method: 'DELETE' }),

  // Driver documents
  listDriverDocuments: (driverId: string) => request<ApiResponse<DriverDocumentRow[]>>(`/compliance/drivers/${driverId}/documents`),
  createDriverDocument: (driverId: string, body: { kind: string; title: string; expiresOn?: string; notes?: string }) =>
    request<ApiResponse<DriverDocumentRow>>(`/compliance/drivers/${driverId}/documents`, { method: 'POST', body: JSON.stringify(body) }),
  updateDriverDocument: (id: string, body: Partial<{ kind: string; title: string; expiresOn: string; notes: string }>) =>
    request<ApiResponse<DriverDocumentRow>>(`/compliance/driver-documents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteDriverDocument: (id: string) => request<ApiResponse<null>>(`/compliance/driver-documents/${id}`, { method: 'DELETE' }),
}

export default complianceApi
