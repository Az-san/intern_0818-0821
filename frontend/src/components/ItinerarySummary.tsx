import React from 'react'
import { Itinerary } from '../types'

type Props = { itinerary: Itinerary }

export const ItinerarySummary: React.FC<Props> = ({ itinerary }) => {
  return (
    <div className="card">
      <h2>合計</h2>
      <div>合計歩行: {itinerary.totals.walkM}m / 移動: {itinerary.totals.moves}回 / 費用: ¥{itinerary.totals.costYen}</div>
    </div>
  )
}


