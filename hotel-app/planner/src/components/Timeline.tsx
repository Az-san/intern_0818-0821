import React from 'react'
import { Piece } from '../types'

type Props = { items: Piece[]; onChange: (items: Piece[]) => void; day: string; window: { start: string; end: string } }

export const Timeline: React.FC<Props> = ({ items, onChange, day }) => {
  const remove = (id: string) => onChange(items.filter((p) => p.id !== id))
  return (
    <div className="card">
      <h2>行程</h2>
      <div className="timeline">
        {items.map((p) => (
          <div key={p.id} className={`piece piece--${p.status}`}>
            <div className="piece__head">
              <span className="badge">{p.status.toUpperCase()}</span>
            </div>
            <div className="piece__body">
              <b>{p.name}</b>
              <div className="muted">理由: {p.reasons.slice(0,2).join(' / ') || '—'}</div>
            </div>
            <div className="piece__foot">
              <button onClick={() => remove(p.id)}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


