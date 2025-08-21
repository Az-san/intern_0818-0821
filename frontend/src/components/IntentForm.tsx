import React from 'react'
import { Intent } from '../types'

type Props = { value: Intent; onChange: (v: Intent) => void }

export const IntentForm: React.FC<Props> = ({ value, onChange }) => {
  const update = <K extends keyof Intent>(key: K, val: Intent[K]) => onChange({ ...value, [key]: val })
  return (
    <div className="card">
      <h2>ご希望を選択</h2>
      <div className="row">
        <label>到着・出発</label>
        <input type="date" value={value.day} onChange={(e) => update('day', e.target.value)} />
        <input type="time" value={value.window.start} onChange={(e) => update('window', { ...value.window, start: e.target.value })} />
        <input type="time" value={value.window.end} onChange={(e) => update('window', { ...value.window, end: e.target.value })} />
      </div>
      <div className="row">
        <label>混雑回避</label>
        <select value={value.constraints.crowdAvoid} onChange={(e) => update('constraints', { ...value.constraints, crowdAvoid: e.target.value as any })}>
          <option value="off">なし</option>
          <option value="mid">中</option>
          <option value="high">強</option>
        </select>
      </div>
    </div>
  )
}


