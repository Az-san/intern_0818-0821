export type Intent = {
  goals: string[]
  party: { adults: number; children: number; seniors: number; stroller?: boolean; wheelchair?: boolean }
  constraints: { walkKm: number; moves: number; rainPolicy: 'parallel' | 'ignore'; budget: 'low' | 'mid' | 'high'; crowdAvoid: 'off' | 'mid' | 'high' }
  mustInclude: string[]
  mustExclude: string[]
  day: string
  window: { start: string; end: string }
}

export type Piece = {
  id: string
  catalogId: string
  name: string
  type: 'restaurant' | 'activity' | 'hotel'
  start: string
  end: string
  people: number
  status: 'ok' | 'warn' | 'ng'
  reasons: string[]
  metrics: { walkDeltaM: number; costDeltaYen: number }
}

export type CatalogItem = { id: string; name: string; type: 'restaurant'|'activity'|'hotel'; durationMin: number; priceMin: number; lat?: number; lng?: number; category?: string; staffPick?: boolean; indoor?: boolean }

export type Customer = { id: string; adults: number; children: number; seniors: number; stroller: boolean; wheelchair: boolean }

export type Itinerary = { id?: string; items: Piece[]; totals: { walkM: number; moves: number; costYen: number } }

export type RoutePlan = {
  status: string
  route?: { geometry?: any; total_distance_km?: number; total_duration_minutes?: number; waypoints?: Array<any> }
  destinations?: Array<any>
  summary?: { total_destinations: number; total_travel_time: number; total_stay_time: number; estimated_total_time: number }
}


