import React from 'react'
import TravelBrochure from './TravelBrochure'

type Event = {
  time: string
  activity_type: 'arrival'|'sightseeing'|'departure'|'travel'
  location?: string
  description?: string
  duration_minutes?: number
  from?: string
  to?: string
  travel_time_minutes?: number
  distance_km?: number
}

type ItineraryData = {
  itinerary: { date: string; start_time: string; end_time: string; total_duration_hours: number; schedule: Event[] }
  summary: { total_destinations: number; total_travel_time_minutes: number; total_sightseeing_time_minutes: number; total_distance_km: number; start_time: string; end_time: string }
}

export const ItineraryCards: React.FC<{ data: ItineraryData; llmBlocks?: Array<{type:string; title:string; body:string}> }> = ({ data }) => {
  const { itinerary } = data
  return (
    <div>
      <TravelBrochure events={itinerary.schedule} />
    </div>
  )
}

function labelFor(t: Event['activity_type']): string {
  switch (t) {
    case 'arrival': return '到着'
    case 'sightseeing': return '滞在'
    case 'departure': return '出発'
    case 'travel': return '移動'
  }
}


