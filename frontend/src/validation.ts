import { Intent, Itinerary } from './types'

export function validateItinerary(it: Itinerary, intent: Intent): { result: 'ok'|'warn'|'ng'; reasons: string[] } {
  const reasons: string[] = []
  const walkKm = it.totals.walkM / 1000
  if (walkKm > intent.constraints.walkKm) reasons.push(`歩行${walkKm.toFixed(1)}km>${intent.constraints.walkKm}km`)
  if (it.totals.moves > intent.constraints.moves) reasons.push(`移動${it.totals.moves}回>${intent.constraints.moves}回`)
  // 重なりチェック（簡易、同時刻を許容しない）
  const overlaps = hasOverlap(it)
  if (overlaps) reasons.push('時間が重なっています')
  const result: 'ok'|'warn'|'ng' = reasons.length === 0 ? 'ok' : overlaps ? 'ng' : 'warn'
  return { result, reasons: reasons.slice(0,2) }
}

function timeToMin(t: string): number { const [h,m] = t.split(':').map(Number); return h*60+m }

function hasOverlap(it: Itinerary): boolean {
  const ranges = it.items.map((p) => [timeToMin(p.start), timeToMin(p.end)] as const).sort((a,b)=>a[0]-b[0])
  for (let i=1;i<ranges.length;i++) { if (ranges[i-1][1] > ranges[i][0]) return true }
  return false
}





