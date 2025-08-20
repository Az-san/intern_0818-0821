import React, { useMemo, useState } from 'react'
import { Intent, Itinerary, Piece } from './types'
import { IntentForm } from './components/IntentForm'
import { PieceLibrary } from './components/PieceLibrary'
import { Timeline } from './components/Timeline'
import { SummaryBar } from './components/SummaryBar'
import { FixModal } from './components/FixModal'
import { ItinerarySummary } from './components/ItinerarySummary'
import { MapScreen } from './components/MapScreen'
import { WeatherBar } from './components/WeatherBar'
import { TabBar } from './components/TabBar'
import { ItineraryCards } from './components/ItineraryCards'
import { validateItinerary } from './validation'
import { fetchCatalogItems, requestFixes, fetchCustomer, fetchWeather, fetchDestinations, fetchRoute, createItinerary, summarizePlanLLM } from './api'

const defaultIntent: Intent = {
  goals: [],
  party: { adults: 2, children: 0, seniors: 0, stroller: false },
  constraints: { walkKm: 3, moves: 6, rainPolicy: 'ignore', budget: 'mid', crowdAvoid: 'off' },
  mustInclude: [],
  mustExclude: [],
  day: new Date().toISOString().slice(0, 10),
  window: { start: '09:00', end: '22:00' },
}

type Screen = 'select' | 'map' | 'planning'

export default function App(): JSX.Element {
  const [intent, setIntent] = useState<Intent>(defaultIntent)
  const [items, setItems] = useState<Piece[]>([])
  const [showFixes, setShowFixes] = useState(false)
  const [catalog, setCatalog] = useState<any[]>([])
  const [screen, setScreen] = useState<Screen>('select')
  const [customer, setCustomer] = useState<any | null>(null)
  const [weather, setWeather] = useState<any | null>(null)
  const [routePlan, setRoutePlan] = useState<any | null>(null)
  const [itineraryText, setItineraryText] = useState<string>('')
  const [itineraryData, setItineraryData] = useState<any | null>(null)
  const [itineraryError, setItineraryError] = useState<string>('')
  const [llmBlocks, setLlmBlocks] = useState<any[] | null>(null)
  const [mapPathEnabled, setMapPathEnabled] = useState<boolean>(false)
  const [mapRouteCoords, setMapRouteCoords] = useState<[number, number][]>([])

  React.useEffect(() => {
    // 新API（Flask）から顧客ベースの候補地を取得。失敗時は従来カタログへフォールバック
    fetchDestinations('C001').then((res) => {
      const mapped = res.destinations.map((d) => ({
        id: d.destination_id,
        name: d.name,
        type: 'activity' as const,
        durationMin: d.estimated_duration ?? 60,
        priceMin: 0,
        lat: d.latitude,
        lng: d.longitude,
        category: d.category,
      }))
      setCatalog(mapped)
      // 既存itemsのIDが新しいcatalogに存在しない場合は除外（ピン未表示の原因対策）
      setItems((prev) => prev.filter((p) => mapped.some((c) => c.id === p.catalogId)))
    }).catch(() => {
      fetchCatalogItems().then(setCatalog)
    })
    fetchCustomer('C001').then(setCustomer).catch(() => setCustomer(null))
    fetchWeather().then(setWeather).catch(() => setWeather(null))
    // restore UI state
    try {
      const savedItems = localStorage.getItem('itinerary-items')
      if (savedItems) setItems(JSON.parse(savedItems))
      const savedIntent = localStorage.getItem('ui-intent')
      if (savedIntent) setIntent(JSON.parse(savedIntent))
      const savedScreen = localStorage.getItem('ui-screen') as Screen | null
      if (savedScreen === 'map' || savedScreen === 'select' || savedScreen === 'planning') setScreen(savedScreen)
      const savedPath = localStorage.getItem('map-path-enabled')
      if (savedPath) setMapPathEnabled(savedPath === 'true')
      const savedRoute = localStorage.getItem('map-route-coords')
      if (savedRoute) setMapRouteCoords(JSON.parse(savedRoute))
    } catch {}
  }, [])

  React.useEffect(() => {
    try { localStorage.setItem('itinerary-items', JSON.stringify(items)) } catch {}
  }, [items])

  React.useEffect(() => {
    try { localStorage.setItem('ui-intent', JSON.stringify(intent)) } catch {}
  }, [intent])

  React.useEffect(() => {
    try { localStorage.setItem('ui-screen', screen) } catch {}
  }, [screen])

  React.useEffect(() => {
    try { localStorage.setItem('map-path-enabled', String(mapPathEnabled)) } catch {}
  }, [mapPathEnabled])

  React.useEffect(() => {
    try { localStorage.setItem('map-route-coords', JSON.stringify(mapRouteCoords)) } catch {}
  }, [mapRouteCoords])

  // 自動プラン生成: itemsが変わるたびに最新ルート→旅程を更新
  const computePlan = React.useCallback(async () => {
    if (catalog.length === 0 || items.length < 1) { setRoutePlan(null); setItineraryData(null); return }
    const idToCat: Record<string, any> = Object.fromEntries(catalog.map((c:any)=>[c.id,c]))
    const payload = items.map(i => ({ destination_id: i.catalogId, latitude: idToCat[i.catalogId]?.lat, longitude: idToCat[i.catalogId]?.lng }))
    let routeRes: any
    if (payload.length >= 2) {
      routeRes = await fetchRoute(payload)
    } else {
      const only = payload[0]
      routeRes = {
        route: {
          geometry: null,
          total_distance_km: 0,
          total_duration_minutes: 0,
          waypoints: [
            { name: 'スタート', latitude: 26.3105, longitude: 127.7723, estimated_stay_minutes: 0 },
            { name: idToCat[items[0].catalogId]?.name || '目的地', latitude: only.latitude, longitude: only.longitude, estimated_stay_minutes: 60 }
          ]
        },
        summary: { total_destinations: 1, total_travel_time: 0 }
      }
    }
    setRoutePlan(routeRes)
    try {
      setItineraryError('')
      const iti = await createItinerary(routeRes.route, { start_time: intent.window.start, travel_date: intent.day })
      if (iti.status === 'success') {
        setItineraryData(iti)
        const sch = iti.itinerary.schedule as any[]
        const lines = sch.map(s => {
          if (s.activity_type === 'sightseeing') return `${s.time} 滞在: ${s.location} (${s.duration_minutes}分)`
          if (s.activity_type === 'travel') return `${s.time} 移動: ${s.from} → ${s.to} (${s.distance_km}km, ${s.travel_time_minutes}分)`
          return `${s.time} ${s.description}`
        })
        setItineraryText(lines.join('\n'))
      } else {
        setItineraryError(JSON.stringify(iti))
      }
    } catch (e:any) {
      setItineraryError(String(e?.message || e))
    }
    try {
      if (routeRes?.route && itineraryData) {
        const r = await summarizePlanLLM({ route: routeRes.route, itinerary: itineraryData.itinerary, summary: itineraryData.summary })
        if (r.status === 'success') setLlmBlocks(r.blocks || [])
      }
    } catch {}
  }, [catalog, items, intent.window.start, intent.day])

  React.useEffect(() => {
    // 300ms デバウンス
    const t = setTimeout(() => { computePlan().catch(()=>{}) }, 300)
    return () => clearTimeout(t)
  }, [computePlan])

  const itinerary: Itinerary = useMemo(() => {
    const totals = items.reduce(
      (acc, p) => ({
        walkM: acc.walkM + Math.max(0, p.metrics.walkDeltaM),
        moves: acc.moves + 1,
        costYen: acc.costYen + Math.max(0, p.metrics.costDeltaYen),
      }),
      { walkM: 0, moves: 0, costYen: 0 }
    )
    return { items, totals }
  }, [items])

  const validation = useMemo(() => validateItinerary(itinerary, intent), [itinerary, intent])

  const theme = (() => {
    const t = weather?.temperatureC
    if (weather?.raining) return 'rain'
    if (typeof t === 'number') {
      if (t <= 8) return 'cold'
      if (t >= 28) return 'hot'
    }
    return 'mild'
  })()

  return (
    <div className="app">
      <header className={`app__header app__header--${theme}`} style={{display:'flex', gap:12, alignItems:'center'}}>
        <h1>旅程プランナー</h1>
        <div style={{flex:1}}>
          <WeatherBar weather={weather} />
        </div>
        {customer && (<div>{customer.stroller ? '🧺' : ''}{customer.wheelchair ? '♿' : ''}</div>)}
        <SummaryBar intent={intent} totals={itinerary.totals} validation={validation} />
        {/* 直接遷移ボタンは撤去済み（タブで切替） */}
      </header>

      <TabBar
        active={screen}
        onChange={(t) => setScreen(t)}
        showMap={items.length > 0}
        showPlanning={items.length > 0}
      />

      {screen === 'select' ? (
        <main className="layout">
          <section className="left glass card" style={{gridColumn:'1 / span 2'}}>
            <IntentForm value={intent} onChange={setIntent} />
            <PieceLibrary
              catalog={catalog}
              selectedCatalogIds={new Set(items.map(i => i.catalogId))}
              onToggleCatalog={(c) => {
                setItems((prev) => {
                  const exists = prev.some(p => p.catalogId === c.id)
                  if (exists) return prev.filter(p => p.catalogId !== c.id)
                  return [...prev, {
                    id: Math.random().toString(36).slice(2),
                    catalogId: c.id,
                    name: c.name,
                    type: c.type,
                    start: '',
                    end: '',
                    people: 2,
                    status: 'ok',
                    reasons: [],
                    metrics: { walkDeltaM: 300, costDeltaYen: c.priceMin }
                  }]
                })
              }}
            />
          </section>
        </main>
      ) : screen === 'map' ? (
        <MapScreen
          catalog={catalog}
          items={items}
          onAdd={(p) => setItems((prev) => [...prev, p])}
          isActive={screen==='map'}
          onReorder={setItems}
          pathEnabled={mapPathEnabled}
          setPathEnabled={setMapPathEnabled}
          routeCoords={mapRouteCoords}
          setRouteCoords={setMapRouteCoords}
        />
      ) : (
        <div className="layout">
          <section className="left glass card" style={{gridColumn:'1 / span 2'}}>
            <h2>プランニング</h2>
            <div className="row muted">選択・順序の変更に応じて自動更新されます。</div>
            {itineraryData?.status === 'success' && (
              <ItineraryCards data={itineraryData} llmBlocks={llmBlocks ?? []} />
            )}
            {itineraryError && (
              <div className="card" style={{color:'#dc2626'}}>
                旅程生成エラー: {itineraryError}
              </div>
            )}
            {!itineraryData && routePlan && (
              <div className="muted">ルート取得済み。旅程の生成を待機中…</div>
            )}
          </section>
        </div>
      )}

      {showFixes && (
        <FixModal
          onClose={() => setShowFixes(false)}
          onApply={async () => {
            const fixes = await requestFixes(items, intent)
            if (fixes[0]) setItems(fixes[0].apply(items))
            setShowFixes(false)
          }}
        />
      )}

      {/* フッターCTAは一旦非表示（タブ操作に統一） */}
    </div>
  )
}


