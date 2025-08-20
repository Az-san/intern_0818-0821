import React from 'react'

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

export const ItineraryCards: React.FC<{ data: ItineraryData; llmBlocks?: Array<{type:string; title:string; body:string}> }> = ({ data, llmBlocks }) => {
  const { summary, itinerary } = data
  return (
    <div>
      <div className="card glass" style={{ marginBottom: 12 }}>
        <h3>サマリ</h3>
        <div className="row">出発 {summary.start_time} / 到着 {summary.end_time} / 総所要 {itinerary.total_duration_hours}h</div>
        <div className="row">移動 {summary.total_travel_time_minutes}分 / 滞在 {summary.total_sightseeing_time_minutes}分 / 距離 {summary.total_distance_km}km</div>
      </div>
      {llmBlocks && llmBlocks.length > 0 && (
        <div className="card glass" style={{ marginBottom: 12 }}>
          <h3>提案</h3>
          {llmBlocks.map((b, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <b>{b.title}</b>
              <div className="muted">{b.body}</div>
            </div>
          ))}
        </div>
      )}
      <div className="timeline">
        {itinerary.schedule.map((ev, idx) => (
          <div key={idx} className="card glass">
            <div className="piece__head">
              <span>{ev.time}</span>
              <span className="badge">{labelFor(ev.activity_type)}</span>
            </div>
            <div className="piece__body">
              {ev.activity_type === 'sightseeing' && (
                <div><b>{ev.location}</b> 滞在 {ev.duration_minutes}分</div>
              )}
              {ev.activity_type === 'arrival' && (
                <div>{ev.description}</div>
              )}
              {ev.activity_type === 'departure' && (
                <div>{ev.description}</div>
              )}
              {ev.activity_type === 'travel' && (
                <div>{ev.from} から {ev.to} へ 移動 {ev.distance_km}km / {ev.travel_time_minutes}分</div>
              )}
            </div>
          </div>
        ))}
      </div>
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


