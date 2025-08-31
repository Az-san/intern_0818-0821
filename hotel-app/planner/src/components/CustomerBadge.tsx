import React from 'react'
import { Customer } from '../types'

export const CustomerBadge: React.FC<{ customer: Customer | null }> = ({ customer }) => {
  if (!customer) return null
  const dn = (customer.displayName || '').trim()
  const useDisplay = dn && dn.toLowerCase() !== 'random'
  const name = useDisplay ? `${dn} 様` : `${customer.id} 様`
  const adults = Math.max(0, Number(customer.adults || 0))
  const children = Math.max(0, Number(customer.children || 0))
  const seniors = Math.max(0, Number(customer.seniors || 0))

  const iconCircle = (content: React.ReactNode, key: string) => (
    <div key={key} style={{ width: 24, height: 24, borderRadius: 9999, background: '#fff', border: '2px solid #0b1727', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
      {content}
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontWeight: 700 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Array.from({ length: adults }).map((_, i) => iconCircle('👤', `a${i}`))}
        {Array.from({ length: children }).map((_, i) => iconCircle('🧒', `c${i}`))}
        {Array.from({ length: seniors }).map((_, i) => iconCircle('👴', `s${i}`))}
        {customer.stroller ? iconCircle('🍼', 'stroller') : null}
        {customer.wheelchair ? iconCircle('♿', 'wheelchair') : null}
      </div>
    </div>
  )
}

export default CustomerBadge


