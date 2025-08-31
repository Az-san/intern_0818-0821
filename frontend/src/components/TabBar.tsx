import React from 'react'

type TabKey = 'select' | 'map' | 'planning'

type Props = {
  active: TabKey
  onChange: (key: TabKey) => void
  showMap: boolean
  showPlanning: boolean
}

export const TabBar: React.FC<Props> = ({ active, onChange, showMap, showPlanning }) => {
  return (
    <nav className="tabbar">
      <button className={`tabbar__btn ${active === 'select' ? 'is-active' : ''}`} onClick={() => onChange('select')}>選択</button>
      {showMap && (
        <button className={`tabbar__btn ${active === 'map' ? 'is-active' : ''}`} onClick={() => onChange('map')}>地図</button>
      )}
      {showPlanning && (
        <button className={`tabbar__btn ${active === 'planning' ? 'is-active' : ''}`} onClick={() => onChange('planning')}>プラン</button>
      )}
    </nav>
  )
}






