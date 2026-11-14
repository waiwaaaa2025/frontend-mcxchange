import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { ChameleonIntel } from '../types'

// One request per DOT per page session — CarrierPulse shows the same intel on
// both the Fleet and Chameleon tabs, and the check takes several seconds.
const cache = new Map<string, Promise<ChameleonIntel>>()

/** FMCSA cross-reference for a DOT (VINs under other DOTs, shared contacts, identity changes). Pass undefined to skip. */
export function useChameleonIntel(dotNumber: string | undefined) {
  const [intel, setIntel] = useState<ChameleonIntel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIntel(null)
    setError(null)
    const dot = dotNumber?.replace(/\D/g, '')
    if (!dot) return
    let active = true
    let pending = cache.get(dot)
    if (!pending) {
      pending = api.getChameleonIntel(dot).then((res) => res.data)
      cache.set(dot, pending)
      pending.catch(() => cache.delete(dot)) // let a retry refetch
    }
    setLoading(true)
    pending
      .then((data) => { if (active) setIntel(data) })
      .catch((err: any) => { if (active) setError(err.message || 'Cross-reference failed') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [dotNumber])

  return { intel, loading, error }
}
