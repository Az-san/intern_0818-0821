import React from 'react'
import { Intent } from '../types'

type Props = { value: Intent; onChange: (v: Intent) => void }

export const IntentForm: React.FC<Props> = ({ value, onChange }) => {
  const update = <K extends keyof Intent>(key: K, val: Intent[K]) => onChange({ ...value, [key]: val })
  return (
    <div className="card">
      <h2>ご希望を選択</h2>
      <div className="row">
        <label>目的タグ</label>
        <div className="chips">
          {['癒やし', '文化', '食', '写真', 'アクティブ'].map((g) => (
            <button key={g} className={value.goals.includes(g) ? 'chip chip--on' : 'chip'} onClick={() => update('goals', value.goals.includes(g) ? value.goals.filter((x) => x !== g) : [...value.goals, g])}>{g}</button>
          ))}
        </div>
      </div>
      <div className="row">
        <label>同行</label>
        <div className="grid">
          <input type="number" min={0} value={value.party.adults} onChange={(e) => update('party', { ...value.party, adults: Number(e.target.value) })} /> 大人
          <input type="number" min={0} value={value.party.children} onChange={(e) => update('party', { ...value.party, children: Number(e.target.value) })} /> 子ども
          <input type="number" min={0} value={value.party.seniors} onChange={(e) => update('party', { ...value.party, seniors: Number(e.target.value) })} /> 高齢
          <label><input type="checkbox" checked={value.party.stroller ?? false} onChange={(e) => update('party', { ...value.party, stroller: e.target.checked })} /> ベビーカー</label>
        </div>
      </div>
      <div className="row">
        <label>条件</label>
        <div className="grid">
          歩行上限(km) <input type="number" min={0} value={value.constraints.walkKm} onChange={(e) => update('constraints', { ...value.constraints, walkKm: Number(e.target.value) })} />
          予算(円)
          <div>
            <input type="number" value={(value as any).budgetYen ?? 5000} onChange={(e) => onChange({ ...value, ...(value as any), budgetYen: Number(e.target.value) })} />
            <button type="button" onClick={() => onChange({ ...value, ...(value as any), budgetYen: ((value as any).budgetYen ?? 5000) + 5000 })}>+5,000</button>
            <button type="button" onClick={() => onChange({ ...value, ...(value as any), budgetYen: Math.max(0, ((value as any).budgetYen ?? 5000) - 5000) })}>-5,000</button>
          </div>
          混雑回避 <select value={value.constraints.crowdAvoid} onChange={(e) => update('constraints', { ...value.constraints, crowdAvoid: e.target.value as any })}><option value="off">なし</option><option value="mid">中</option><option value="high">強</option></select>
        </div>
      </div>
      <div className="row">
        <label>到着・出発</label>
        <input type="date" value={value.day} onChange={(e) => update('day', e.target.value)} />
        <input type="time" value={value.window.start} onChange={(e) => update('window', { ...value.window, start: e.target.value })} />
        <input type="time" value={value.window.end} onChange={(e) => update('window', { ...value.window, end: e.target.value })} />
      </div>
      <div className="row">
        <button>編集に進む</button>
      </div>
    </div>
  )
}


