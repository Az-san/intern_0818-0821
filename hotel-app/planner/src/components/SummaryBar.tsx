import React from 'react'
import { Intent, Itinerary } from '../types'

type Props = { intent: Intent; totals: Itinerary['totals']; validation: { result: 'ok'|'warn'|'ng'; reasons: string[] }; onFix?: () => void }

export const SummaryBar: React.FC<Props> = ({ totals, validation }) => {
  return (
    <div className="summary">
      <div>歩行: {totals.walkM}m / 移動: {totals.moves}回 / 費用: ¥{totals.costYen}</div>
      <div className={`status status--${validation.result}`}>{validation.result.toUpperCase()} {validation.reasons.slice(0,2).join(' / ')}</div>
    </div>
  )
}


