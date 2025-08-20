import { Intent, Piece, CatalogItem, Customer } from './types'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000'
const API2_BASE = (import.meta as any).env?.VITE_API2_BASE || 'http://localhost:5001'

export async function fetchCatalogItems(): Promise<CatalogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/catalog/items`)
    if (!res.ok) throw new Error('bad status')
    return await res.json()
  } catch (e) {
    console.warn('catalog fallback', e)
    return [
      { id: 'r001', name: '沖縄そば処', type: 'restaurant', durationMin: 60, priceMin: 1200 },
      { id: 'a001', name: '首里城散策', type: 'activity', durationMin: 90, priceMin: 0 },
      { id: 'a002', name: '美ら海水族館', type: 'activity', durationMin: 120, priceMin: 2180 },
      { id: 'r002', name: '海辺のカフェ', type: 'restaurant', durationMin: 45, priceMin: 900 },
    ]
  }
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('customer not found')
  return await res.json()
}

export async function fetchWeather(lat = 26.212, lon = 127.679): Promise<{ temperatureC: number; humidity: number; raining: boolean; feelsIcon: string }>{
  const res = await fetch(`${API_BASE}/weather/current?lat=${lat}&lon=${lon}`)
  if (!res.ok) throw new Error('weather error')
  return await res.json()
}

export async function fetchPhotoUrl(query: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/media/photo?query=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  } catch {
    return null
  }
}

// New Flask API (backend/app.py -> /api/*)
export async function fetchDestinations(customerId: string, params?: { weather?: string; season?: string }) {
  const url = new URL(`${API2_BASE}/api/destinations`)
  url.searchParams.set('customer_id', customerId)
  if (params?.weather) url.searchParams.set('weather', params.weather)
  if (params?.season) url.searchParams.set('season', params.season)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('destinations error')
  const data = await res.json()
  if (data.status !== 'success') throw new Error(data.message || 'destinations failed')
  return data as { status: string; destinations: Array<{ destination_id: string; name: string; latitude: number; longitude: number; category?: string; estimated_duration?: number }> }
}

export async function fetchRoute(destinations: Array<{ destination_id?: string; latitude: number; longitude: number }>) {
  const res = await fetch(`${API2_BASE}/api/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destinations }) })
  if (!res.ok) throw new Error('route error')
  return await res.json()
}

export async function createItinerary(route: any, opts?: { start_time?: string; travel_date?: string }) {
  const body: any = { route, start_time: opts?.start_time, travel_date: opts?.travel_date }
  const res = await fetch(`${API2_BASE}/api/itinerary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error('itinerary error')
  return await res.json()
}

export async function summarizePlanLLM(payload: { route: any; itinerary: any; summary: any }) {
  const res = await fetch(`${API2_BASE}/api/plan/llm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('plan llm error')
  return await res.json()
}

export async function requestFixes(items: Piece[], intent: Intent) {
  // デモ用に「+15分」案のみを実装
  return [
    {
      label: '+15分',
      apply: (current: Piece[]) => current.map((p) => ({ ...p, start: addMinutes(p.start, 15), end: addMinutes(p.end, 15) })),
      deltas: { walk: 0, cost: 0 },
    },
  ]
}

function addMinutes(t: string, delta: number): string { const [h,m] = t.split(':').map(Number); const total = h*60+m+delta; const hh = Math.floor(total/60)%24; const mm = total%60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}` }


