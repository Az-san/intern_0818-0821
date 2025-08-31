import React, { useMemo, useState } from 'react'
import { Home as HomeIcon } from 'lucide-react'
import { Intent, Itinerary, Piece } from './types'
import { IntentForm } from './components/IntentForm'
import { PieceLibrary } from './components/PieceLibrary'
import { Timeline } from './components/Timeline'
import { SummaryBar } from './components/SummaryBar'
import { FixModal } from './components/FixModal'
import { ItinerarySummary } from './components/ItinerarySummary'
import { MapScreen } from './components/MapScreen'
import { WeatherBar } from './components/WeatherBar'
import CustomerBadge from './components/CustomerBadge'
import { TabBar } from './components/TabBar'
import { ItineraryCards } from './components/ItineraryCards'
import { validateItinerary } from './validation'
import { fetchCatalogItems, requestFixes, fetchCustomer, fetchWeather, fetchDestinations, fetchRoute, createItinerary, summarizePlanLLM, fetchRandomCustomer } from './api'

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
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const [returnOrigin, setReturnOrigin] = useState<string | null>(null)

  React.useEffect(() => {
    // Next.jsホテルアプリ等からの連携: ?customer=<base64(json)>&return=<url>
    const params = new URLSearchParams(window.location.search)
    const encodedCustomer = params.get('customer')
    const ret = params.get('return')
    if (ret) {
      setReturnUrl(ret)
      try { setReturnOrigin(new URL(ret).origin) } catch {}
    }

    const readIntegratedCustomer = (): any | null => {
      try {
        if (encodedCustomer) {
          // UTF-8対応のBase64デコード（ホテル側がUTF-8を含む可能性があるため）
          const json = decodeURIComponent(escape(atob(encodedCustomer)))
          const obj = JSON.parse(json)
          try { sessionStorage.setItem('selectedCustomer', json) } catch {}
          return obj
        }
        const saved = sessionStorage.getItem('selectedCustomer')
        return saved ? JSON.parse(saved) : null
      } catch { return null }
    }

    const load = async () => {
      const integrated = readIntegratedCustomer()
      const budgetY = (intent as any).budgetYen ?? 5000
      const crowd = intent.constraints.crowdAvoid
      if (integrated?.id) {
        setCustomer(integrated)
        return fetchDestinations(integrated.id, { budget_yen: budgetY, crowd_avoid: crowd as any })
      }
      // 連携が無い場合はランダム顧客
      const rid = `C${String(Math.floor(Math.random()*100)+1).padStart(3,'0')}`
      try { const full = await fetchCustomer(rid); setCustomer(full) } catch { setCustomer({ id: rid } as any) }
      return fetchDestinations(rid, { budget_yen: budgetY, crowd_avoid: crowd as any })
    }

    load().then((res) => {
      const rec = res.destinations.map((d) => ({
        id: d.destination_id,
        name: d.name,
        type: 'activity' as const,
        durationMin: d.estimated_duration ?? 60,
        priceMin: 0,
        lat: d.latitude,
        lng: d.longitude,
        category: d.category,
        _recommended: true,
      }))
      const others = (res.others || []).map((d) => ({
        id: d.destination_id,
        name: d.name,
        type: 'activity' as const,
        durationMin: d.estimated_duration ?? 60,
        priceMin: 0,
        lat: d.latitude,
        lng: d.longitude,
        category: d.category,
        _recommended: false,
      }))
      const mapped = [...rec, ...others]
      setCatalog(mapped)
      // 既存itemsのIDが新しいcatalogに存在しない場合は除外（ピン未表示の原因対策）
      setItems((prev) => prev.filter((p) => mapped.some((c) => c.id === p.catalogId)))
    }).catch(async () => {
      // ランダム顧客やレコメンド取得に失敗した場合でも、C001 でフォールバック
      try {
        const res = await fetchDestinations('C001')
        const rec = res.destinations.map((d) => ({ id: d.destination_id, name: d.name, type: 'activity' as const, durationMin: d.estimated_duration ?? 60, priceMin: 0, lat: d.latitude, lng: d.longitude, category: d.category, _recommended: true }))
        const others = (res.others || []).map((d) => ({ id: d.destination_id, name: d.name, type: 'activity' as const, durationMin: d.estimated_duration ?? 60, priceMin: 0, lat: d.latitude, lng: d.longitude, category: d.category, _recommended: false }))
        setCatalog([...rec, ...others])
        setCustomer((prev:any)=> prev ?? { id: 'C001', adults:2, children:0, seniors:0, stroller:false, wheelchair:false, displayName:'山本太郎' })
      } catch {
        fetchCatalogItems().then(setCatalog)
      }
    })
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
      const savedPlan = localStorage.getItem('route-plan')
      if (savedPlan) setRoutePlan(JSON.parse(savedPlan))
      const savedIti = localStorage.getItem('itinerary-data')
      if (savedIti) setItineraryData(JSON.parse(savedIti))
    } catch {}
  }, [])

  React.useEffect(() => {
    try { localStorage.setItem('itinerary-items', JSON.stringify(items)) } catch {}
  }, [items])

  React.useEffect(() => {
    try { localStorage.setItem('ui-intent', JSON.stringify(intent)) } catch {}
    // 混雑回避が変わったら候補を更新
    if (customer?.id) {
      fetchDestinations(customer.id, { crowd_avoid: intent.constraints.crowdAvoid as any }).then((res) => {
        const rec = res.destinations.map((d) => ({ id: d.destination_id, name: d.name, type: 'activity' as const, durationMin: d.estimated_duration ?? 60, priceMin: 0, lat: d.latitude, lng: d.longitude, category: d.category, _recommended: true }))
        const others = (res.others || []).map((d) => ({ id: d.destination_id, name: d.name, type: 'activity' as const, durationMin: d.estimated_duration ?? 60, priceMin: 0, lat: d.latitude, lng: d.longitude, category: d.category, _recommended: false }))
        const mapped = [...rec, ...others]
        setCatalog(mapped)
        
        // 選択された候補地も再評価して更新
        setItems((prev) => {
          const newItems = prev.filter((p) => mapped.some((c) => c.id === p.catalogId))
          // 選択された候補地の順序を新しいレコメンド順に並び替え
          const sortedItems = newItems.sort((a, b) => {
            const aRec = mapped.find(c => c.id === a.catalogId)?._recommended
            const bRec = mapped.find(c => c.id === b.catalogId)?._recommended
            if (aRec && !bRec) return -1
            if (!aRec && bRec) return 1
            return 0
          })
          return sortedItems
        })
        
        // 選択された候補地が変更された場合、プランニングを強制更新
        if (prev.length !== newItems.length) {
          setTimeout(() => {
            computePlan().catch(() => {})
          }, 100)
        }
      }).catch(()=>{})
    }
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

  React.useEffect(() => {
    try { if (routePlan) localStorage.setItem('route-plan', JSON.stringify(routePlan)) } catch {}
  }, [routePlan])

  React.useEffect(() => {
    try { if (itineraryData) localStorage.setItem('itinerary-data', JSON.stringify(itineraryData)) } catch {}
  }, [itineraryData])

  // 自動プラン生成: itemsが変わるたびに最新ルート→旅程を更新
  const computePlan = React.useCallback(async () => {
    if (catalog.length === 0 || items.length < 1) { setRoutePlan(null); setItineraryData(null); return }
    
    // 可動ウィンドウ(到着-出発)と見積時間の超過表示
    const toMin = (t:string) => { const [h,m] = t.split(':').map(Number); return h*60+m }
    const windowMinutes = Math.max(0, toMin(intent.window.end) - toMin(intent.window.start))
    let estimatedStay = items.reduce((acc, p) => acc + (p.durationMin || 60), 0)
    // 既存ルートの移動時間があれば加算（無ければざっくり0）
    let moveMinutes = routePlan?.route?.total_duration_minutes || 0
    const estimatedTotal = Math.round(estimatedStay + moveMinutes)
    const overMinutes = Math.max(0, estimatedTotal - windowMinutes)
    if (overMinutes > 0) {
      setItineraryError(`見積 ${Math.round(estimatedTotal/60*10)/10}時間が可動ウィンドウ(${Math.round(windowMinutes/60*10)/10}時間)を超えています（超過: ${overMinutes}分）`)
    } else {
      setItineraryError('')
    }

    // 軽量な処理を優先（ルート計算の最適化）
    const idToCat: Record<string, any> = Object.fromEntries(catalog.map((c:any)=>[c.id,c]))
    const payload = items.map(i => ({ destination_id: i.catalogId, latitude: idToCat[i.catalogId]?.lat, longitude: idToCat[i.catalogId]?.lng }))
    
    let routeRes: any
    if (payload.length >= 2) {
      // ホテル（START）を出発点として先頭に追加
      const START = { destination_id: 'START', latitude: 26.3105, longitude: 127.7723 } as any
      const withStart = [START, ...payload]
      
      // ルート取得を最適化（タイムアウト短縮）
      try {
        routeRes = await Promise.race([
          fetchRoute(withStart, { optimize: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Route timeout')), 5000))
        ])
      } catch (e) {
        // タイムアウト時は概算の直線ルートを生成（分単位の移動時間も推定して保持）
        const waypoints = withStart.map((wp) => ({
          name: wp.destination_id === 'START' ? 'スタート' : idToCat[wp.destination_id]?.name || '目的地',
          latitude: wp.latitude,
          longitude: wp.longitude,
          estimated_stay_minutes: wp.destination_id === 'START' ? 0 : 60
        }))
        // 区間距離・時間を概算（40km/h）
        const legs: Array<{ distance_km: number; duration_minutes: number }> = []
        function hav(a:{lat:number;lon:number}, b:{lat:number;lon:number}){ const R=6371; const dlat=(b.lat-a.lat)*Math.PI/180; const dlon=(b.lon-a.lon)*Math.PI/180; const la1=a.lat*Math.PI/180, la2=b.lat*Math.PI/180; const x=Math.sin(dlat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dlon/2)**2; return 2*R*Math.asin(Math.min(1, Math.sqrt(x))) }
        let totalKm = 0
        for (let i=0;i<waypoints.length-1;i++){
          const a = { lat: waypoints[i].latitude, lon: waypoints[i].longitude }
          const b = { lat: waypoints[i+1].latitude, lon: waypoints[i+1].longitude }
          const km = Math.round(hav(a,b)*100)/100
          totalKm += km
          const min = Math.round((km/40)*60*10)/10
          legs.push({ distance_km: km, duration_minutes: min })
          ;(waypoints[i] as any).travel_to_next = { distance_km: km, duration_minutes: min }
        }
        ;(waypoints[waypoints.length-1] as any).travel_to_next = null
        routeRes = {
          route: {
            geometry: null,
            total_distance_km: Math.round(totalKm*100)/100,
            total_duration_minutes: Math.round(legs.reduce((s,l)=>s+l.duration_minutes,0)*10)/10,
            waypoints
          },
          summary: { total_destinations: withStart.length - 1, total_travel_time: Math.round(legs.reduce((s,l)=>s+l.duration_minutes,0)) }
        }
      }
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
    
    // 旅程生成を非同期で実行（UIブロッキングを防ぐ）
    // 直近の成功ルートがあり、今回のルートが区間情報を持たない場合は直近ルートを使用
    const hasTravelInfo = Array.isArray(routeRes?.route?.waypoints) && routeRes.route.waypoints.some((w:any)=>w && w.travel_to_next)
    const routeForIti = hasTravelInfo ? routeRes.route : (routePlan?.route ?? routeRes.route)

    createItinerary(routeForIti, { start_time: intent.window.start, travel_date: intent.day }).then((iti) => {
      if (iti.status === 'success') {
        setItineraryData(iti)
        const sch = iti.itinerary.schedule as any[]
        const lines = sch.map(s => {
          if (s.activity_type === 'sightseeing') return `${s.time} 滞在: ${s.location} (${s.duration_minutes}分)`
          if (s.activity_type === 'travel') return `${s.time} 移動: ${s.from} → ${s.to} (${s.distance_km}km, ${s.travel_time_minutes}分)`
          return `${s.time} ${s.description}`
        })
        setItineraryText(lines.join('\n'))
        
        // LLM処理も非同期で実行
        if (routeRes?.route) {
          summarizePlanLLM({ route: routeRes.route, itinerary: iti.itinerary, summary: iti.summary }).then((r) => {
            if (r.status === 'success') setLlmBlocks(r.blocks || [])
          }).catch(() => {})
        }
      } else {
        setItineraryError(JSON.stringify(iti))
      }
    }).catch((e:any) => {
      console.error('旅程生成エラー:', e)
      setItineraryError(String(e?.message || e))
      // エラー時でも基本的な旅程データを設定
      setItineraryData({
        status: 'error',
        message: '旅程生成に失敗しましたが、基本的なルート情報は表示されます。',
        itinerary: { schedule: [] },
        summary: { total_destinations: items.length, total_travel_time: 0 }
      })
    })
  }, [catalog, items, intent.window.start, intent.day])

  React.useEffect(() => {
    // 150ms デバウンス（パフォーマンス向上）
    const t = setTimeout(() => { computePlan().catch(()=>{}) }, 150)
    return () => clearTimeout(t)
  }, [computePlan])

  // 地図での順序変更完了を監視して即座にプランニング更新
  React.useEffect(() => {
    const handleReorder = () => {
      // 即座にプランニングを実行
      setTimeout(() => {
        computePlan().catch(() => {})
      }, 50)
    }
    
    window.addEventListener('reorder-complete', handleReorder)
    return () => window.removeEventListener('reorder-complete', handleReorder)
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

  const theme = 'hotel'

  return (
    <div className="app">
      <header className={`app__header app__header--${theme}`} style={{display:'flex', gap:12, alignItems:'center'}}>
        {returnUrl ? (
          <a href={returnUrl} aria-label="戻る" style={{color:'#fff', textDecoration:'none', display:'flex', alignItems:'center'}}>
            <span style={{fontSize:20}}>←</span>
          </a>
        ) : (
          <a href="#" onClick={(e)=>{e.preventDefault(); setScreen('select')}} aria-label="戻る" style={{color:'#fff', textDecoration:'none', display:'flex', alignItems:'center'}}>
            <span style={{fontSize:20}}>←</span>
          </a>
        )}
        {/* ホームマーク: lucide-react の Home アイコン */}
        <a href={returnOrigin ? `${returnOrigin}/` : '#'} onClick={(e)=>{ if(!returnOrigin){ e.preventDefault(); } }} aria-label="ホーム" style={{display:'flex', alignItems:'center', marginLeft:8, color:'#fff'}}>
          <HomeIcon className="w-5 h-5" />
        </a>
        <div style={{marginLeft:8, fontWeight:800, color:'#fff'}}>ACS</div>
      </header>

      {/* Subheader: title + weather + customer */}
      <div className="subheader">
        <div className="subheader__title">旅行プランナー</div>
        <div><WeatherBar weather={weather} /></div>
        <div className="subheader__spacer" />
        <div><CustomerBadge customer={customer} /></div>
        <div style={{marginLeft:8}}><SummaryBar intent={intent} totals={itinerary.totals} validation={validation} /></div>
      </div>

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
                
                // 即座にプランニングを実行（選択変更の即座反映）
                setTimeout(() => {
                  computePlan().catch(() => {})
                }, 50)
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
            
            {/* 基本的な旅程情報を常に表示 */}
            <div className="card" style={{marginBottom: 16}}>
              <h3>選択された候補地</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {items.map((item, index) => (
                  <span key={item.id} className="chip" style={{background: '#e0e7ff', color: '#3730a3'}}>
                    {index + 1}. {item.name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* 旅程データがある場合は表示 */}
            {itineraryData?.status === 'success' && (
              <ItineraryCards data={itineraryData} llmBlocks={llmBlocks ?? []} />
            )}
            
            {/* エラー表示 */}
            {itineraryError && (
              <div className="card" style={{color:'#dc2626', marginBottom: 16}}>
                旅程生成エラー: {itineraryError}
              </div>
            )}
            

            
            {/* データがない場合 */}
            {!itineraryData && !routePlan && items.length > 0 && (
              <div className="muted">旅程の生成を待機中…</div>
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


