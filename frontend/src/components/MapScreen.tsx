import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Polyline, useMap } from 'react-leaflet'
// PolylineDecorator は型がないため any import
// @ts-ignore
// 簡易な矢印表現: Polyline上に小さな三角（SVG）を重ねる擬似実装（パッケージ非依存）
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Piece, CatalogItem } from '../types'
import { fetchRoute } from '../api'

type Props = { catalog: CatalogItem[]; items: Piece[]; onAdd: (p: Piece) => void; isActive?: boolean; onReorder?: (items: Piece[]) => void; pathEnabled?: boolean; setPathEnabled?: (v:boolean)=>void; routeCoords?: [number,number][]; setRouteCoords?: (c:[number,number][])=>void }

// 簡易な地図代替: グリッド上にピンを描画し、クリックで選択→行程に追加
export const MapScreen: React.FC<Props> = ({ catalog, onAdd, items, isActive, onReorder, pathEnabled: pathEnabledProp, setPathEnabled: setPathEnabledProp, routeCoords: routeCoordsProp, setRouteCoords: setRouteCoordsProp }) => {
  const [pathEnabledState, setPathEnabledState] = useState(false)
  const pathEnabled = pathEnabledProp ?? pathEnabledState
  const setPathEnabled = setPathEnabledProp ?? setPathEnabledState
  const START = { lat: 26.3105, lng: 127.7723 }
  const selected = useMemo(() => {
    const idToCat: Record<string, CatalogItem> = Object.fromEntries(catalog.map(c => [c.id, c]))
    return items
      .map(i => idToCat[i.catalogId])
      .filter((c): c is CatalogItem => !!c && !!c.lat && !!c.lng)
  }, [catalog, items])
  const path = selected.map(c => [c.lat as number, c.lng as number])
  const waypoints: [number, number][] = [[START.lat, START.lng], ...path]
  const [routeCoordsState, setRouteCoordsState] = useState<[number, number][]>([])
  const routeCoords = routeCoordsProp ?? routeCoordsState
  const setRouteCoords = setRouteCoordsProp ?? setRouteCoordsState
  // 常時「手動番号指定」モード
  const [isRouting, setIsRouting] = useState<boolean>(false)
  const segments: Array<{ a: [number,number]; b: [number,number]; idx: number }> = []
  for (let i=0;i<waypoints.length-1;i++) segments.push({ a: waypoints[i], b: waypoints[i+1], idx: i })

  const orderKey = React.useMemo(() => items.map(p => p.catalogId).join('|'), [items])
  const pendingController = React.useRef<AbortController | null>(null)
  // 地図上での番号指定（順番にタップ）用の選択リスト
  const [pickedIds, setPickedIds] = useState<string[]>([])
  // 永続化: タブ切替やリロードでも選択順を保持
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('map-picked-ids')
      if (saved) setPickedIds(JSON.parse(saved))
    } catch {}
  }, [])
  React.useEffect(() => {
    try { localStorage.setItem('map-picked-ids', JSON.stringify(pickedIds)) } catch {}
  }, [pickedIds])
  // 表示・ルーティングに使うアイテム（pickedがあればそれを優先。なければ空=未結線）
  const activeItems = React.useMemo(() => {
    const idToCat: Record<string, CatalogItem> = Object.fromEntries(catalog.map(c => [c.id, c]))
    return pickedIds.map(id => idToCat[id]).filter((c): c is CatalogItem => !!c && !!c.lat && !!c.lng)
  }, [pickedIds.join('|'), catalog])
  const latestReqId = React.useRef(0)
  const scheduleRef = React.useRef<number | null>(null)
  const TIMEOUT_MS = 20000

  useEffect(() => {
    if (!isActive) return
    const pathFromActive = activeItems.map(c => [c.lat as number, c.lng as number] as [number,number])
    const wps: [number,number][] = [[START.lat, START.lng], ...pathFromActive]
    // 2点未満の場合は既存のルートを消さない（タブ往復での消失を防止）
    if (wps.length < 2) { return }
    
    // 即座に直線表示を開始（以前の動作を復元）
    setIsRouting(true)
    setRouteCoords(wps)
    
    const payload = activeItems.map((c) => ({ destination_id: c.id, latitude: c.lat as number, longitude: c.lng as number }))
    payload.unshift({ destination_id: 'START', latitude: START.lat, longitude: START.lng } as any)
    
    // デバウンスして最新のリクエストのみ実行
    if (scheduleRef.current) { window.clearTimeout(scheduleRef.current) }
    scheduleRef.current = window.setTimeout(() => {
      // 進行中を中断し、最新IDを採番
      pendingController.current?.abort()
      const controller = new AbortController()
      pendingController.current = controller
      const reqId = ++latestReqId.current
      const startedAt = Date.now()
      const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
      console.log('🚀 OSRM API呼び出し開始:', { waypointsCount: wps.length, reqId })

      fetchRoute(payload as any, { optimize: true, signal: controller.signal })
      .then((res:any) => {
        if (reqId !== latestReqId.current) { console.log('↩️ 古い応答を破棄', { reqId }); return }
        console.log('✅ OSRM API成功:', { ms: Date.now()-startedAt, reqId })
        
        // 複数のレスポンス形式に対応（保険）
        const coordsRaw = 
          res?.route?.geometry?.coordinates ??
          res?.routes?.[0]?.geometry?.coordinates ??
          res?.route?.geometry ??
          res?.geometry ??
          [];
        
        if (!Array.isArray(coordsRaw) || coordsRaw.length === 0) {
          console.error('❌ ジオメトリデータが不正:', coordsRaw)
        } else {
          const latlng = coordsRaw.map((p: any) => Array.isArray(p) ? ([p[1], p[0]] as [number,number]) : ([p.latitude, p.longitude] as [number,number]))
          setRouteCoords(latlng)
          // 念のため可視化フラグをON
          setPathEnabled(true)
          console.log('OSRM API success: road-aligned route displayed')
        }
      }).catch((error) => {
        if (reqId !== latestReqId.current) return
        if (error?.name === 'AbortError') {
          console.log('🔄 OSRM リクエスト中断 (client abort)', { ms: Date.now()-startedAt, reqId })
          return
        }
        console.log('❌ OSRM API失敗:', error?.message || 'Unknown error')
        console.log('🔍 エラー詳細:', error)
      }).finally(() => {
        if (reqId !== latestReqId.current) return
        window.clearTimeout(timer)
        console.log('🏁 OSRM API処理完了')
        setIsRouting(false)
      })
    }, 300)
  }, [isActive, orderKey, pickedIds.join('|')])

  const FitToSelected: React.FC = () => {
    const map = useMap()
    React.useEffect(() => {
      if (!isActive) return
      const pts = routeCoords.length ? routeCoords : (waypoints.length ? waypoints : [[26.212,127.679]])
      const bounds = L.latLngBounds(pts as [number, number] [])
      map.invalidateSize()
      map.fitBounds(bounds.pad(0.2))
    }, [map, routeCoords.length, waypoints.length, isActive])
    return null
  }
  return (
    <div style={{ height: 'calc(100vh - 120px)', padding: 12, position: 'relative' }}>
      <h2>地図で選択</h2>
      <MapContainer center={[26.212, 127.679]} zoom={10} style={{ height: '100%', borderRadius: 8 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <FitToSelected />
        {/* スタート（S）常時表示 */}
        <Marker position={[START.lat, START.lng]} icon={L.divIcon({ className:'hotel-icon', html:'<div style="font-size:20px;font-weight:700;color:#0f172a; background:#fff; border:2px solid #0f172a; border-radius:9999px; width:28px;height:28px; display:flex;align-items:center;justify-content:center">S</div>' })} />
        {selected.map((c, i) => {
          const position: [number, number] = [c.lat as number, c.lng as number]
          const pickIndex = pickedIds.indexOf(c.id)
          const isPicked = pickIndex >= 0
          const numberLabel = isPicked ? getCircledNumber(pickIndex+1) : '•'
          const bg = isPicked ? '#2563eb' : '#94a3b8'
          const iconHtml = `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:${bg};color:#fff;font-size:12px;font-weight:700;">${numberLabel}</div>`
          const onClick = () => {
            const currentIndex = items.findIndex(p => p.catalogId === c.id)
            if (currentIndex < 0) return
            // 地図での番号指定: タップ順に追加、再タップで解除（繰り上げ）
            setPickedIds((prev) => {
              const exists = prev.includes(c.id)
              const next = exists ? prev.filter(id => id !== c.id) : [...prev, c.id]
              setPathEnabled(true)
              return next
            })
          }
          // 最後はGも併記
          const markers: JSX.Element[] = []
          markers.push(
            <Marker key={`${c.id}-num`} position={position} icon={L.divIcon({ className:'num-icon', html: iconHtml })} eventHandlers={{ click: onClick }} />
          )
          // Gの位置は「最後に選ばれているスポット」
          const lastIndex = pickedIds.length>0 ? pickedIds[pickedIds.length-1] === c.id : false
          if (lastIndex) {
            markers.push(
              <Marker key={`${c.id}-goal`} position={position} icon={L.divIcon({ className:'goal-icon', html:'<div style="font-size:20px;font-weight:700;color:#0f172a; background:#fff; border:2px solid #0f172a; border-radius:9999px; width:28px;height:28px; display:flex;align-items:center;justify-content:center">G</div>' })} />
            )
          }
          return markers
        })}
        {/* 道路沿いのルート（/api/route geometry）または直線ルート */}
        {pathEnabled && (routeCoords.length >= 2) && (
          <Polyline 
            positions={routeCoords} 
            color={routeCoords === waypoints ? "#94a3b8" : "#2563eb"} 
            weight={routeCoords === waypoints ? 3 : 4} 
            opacity={routeCoords === waypoints ? 0.6 : 0.9}
            dashArray={routeCoords === waypoints ? "10, 5" : undefined}
          />
        )}
        {/* 末尾の小さな★マーカーは非表示にする */}
      </MapContainer>
      {selected.length === 0 ? (
        <p className="muted" style={{ marginTop: 8 }}>入力画面で候補を選び「確定」すると、ここにピンが表示されます。</p>
      ) : (
        <div style={{ marginTop: 8 }}>
          <p className="muted">選択した場所をピン表示中。</p>
          {routeCoords.length > 0 && (
            <p className="muted" style={{ fontSize: '12px', color: routeCoords === waypoints ? '#f59e0b' : '#10b981' }}>
              {routeCoords === waypoints 
                ? '⚠️ 直線ルート表示中（OSRM API接続不可）' 
                : '✅ 道路沿いルート表示中'
              }
            </p>
          )}
        </div>
      )}
    </div>
  )
}



function getCircledNumber(n: number): string {
  const base = 9311 // ① = U+2460 (decimal 9312) → 1の調整
  if (n >= 1 && n <= 20) {
    // ①(2460)〜⑳(2473)
    return String.fromCharCode(9311 + n)
  }
  // 21以上は通常数字
  return String(n)
}
