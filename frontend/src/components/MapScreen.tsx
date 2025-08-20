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
  const [orderMode, setOrderMode] = useState<boolean>(false)
  const segments: Array<{ a: [number,number]; b: [number,number]; idx: number }> = []
  for (let i=0;i<waypoints.length-1;i++) segments.push({ a: waypoints[i], b: waypoints[i+1], idx: i })

  useEffect(() => {
    if (!isActive) return
    if (waypoints.length < 2) { setRouteCoords([]); return }
    const payload = selected.map((c) => ({ destination_id: c.id, latitude: c.lat as number, longitude: c.lng as number }))
    payload.unshift({ destination_id: 'START', latitude: START.lat, longitude: START.lng } as any)
    fetchRoute(payload).then((res:any) => {
      const g = res?.route?.geometry
      if (g?.coordinates && Array.isArray(g.coordinates)) {
        setRouteCoords(g.coordinates.map((p: [number, number]) => [p[1], p[0]] as [number, number]))
      } else {
        setRouteCoords(waypoints)
      }
    }).catch(() => setRouteCoords(waypoints))
  }, [isActive, items.length])

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
      <div style={{ position:'absolute', right:16, top:52, zIndex:1000, display:'flex', gap:8 }}>
        <button className="chip" onClick={()=> setOrderMode(!orderMode)}>{orderMode ? '番号指定: ON' : '番号指定: OFF'}</button>
      </div>
      <MapContainer center={[26.212, 127.679]} zoom={10} style={{ height: '100%', borderRadius: 8 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <FitToSelected />
        {/* スタート（S）常時表示 */}
        <Marker position={[START.lat, START.lng]} icon={L.divIcon({ className:'hotel-icon', html:'<div style="font-size:20px;font-weight:700;color:#0f172a; background:#fff; border:2px solid #0f172a; border-radius:9999px; width:28px;height:28px; display:flex;align-items:center;justify-content:center">S</div>' })} />
        {selected.map((c, i) => {
          const position: [number, number] = [c.lat as number, c.lng as number]
          const circled = getCircledNumber(i+1)
          const iconHtml = `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#2563eb;color:#fff;font-size:12px;font-weight:700;">${circled}</div>`
          const onClick = () => {
            const currentIndex = items.findIndex(p => p.catalogId === c.id)
            if (currentIndex < 0) return
            if (orderMode) {
              const input = window.prompt(`番号を入力 (1-${items.length})`, String(currentIndex+1))
              const num = input ? parseInt(input, 10) : NaN
              if (!isNaN(num) && num >= 1 && num <= items.length) {
                const next = [...items]
                const [sp] = next.splice(currentIndex, 1)
                next.splice(num-1, 0, sp)
                onReorder?.(next)
                setPathEnabled(true)
              }
            } else {
              // 既存動作: 末尾へ送る
              const next = [...items]
              const [sp] = next.splice(currentIndex, 1)
              next.push(sp)
              onReorder?.(next)
              setPathEnabled(true)
            }
          }
          // 最後はGも併記
          const markers: JSX.Element[] = []
          markers.push(
            <Marker key={`${c.id}-num`} position={position} icon={L.divIcon({ className:'num-icon', html: iconHtml })} eventHandlers={{ click: onClick }} />
          )
          if (i === selected.length-1) {
            markers.push(
              <Marker key={`${c.id}-goal`} position={position} icon={L.divIcon({ className:'goal-icon', html:'<div style="font-size:20px;font-weight:700;color:#0f172a; background:#fff; border:2px solid #0f172a; border-radius:9999px; width:28px;height:28px; display:flex;align-items:center;justify-content:center">G</div>' })} />
            )
          }
          return markers
        })}
        {/* 道路沿い（/api/route geometry）or 直線 */}
        {pathEnabled && (routeCoords.length >= 2 || waypoints.length >= 2) && (
          <Polyline positions={routeCoords.length ? routeCoords : waypoints} color="#2563eb" weight={4} opacity={0.9} />
        )}
        {selected.length > 0 && (
          <Marker position={[selected[selected.length-1].lat as number, selected[selected.length-1].lng as number]} icon={L.divIcon({ className:'goal-icon', html:'★' })} />
        )}
      </MapContainer>
      {selected.length === 0 ? (
        <p className="muted" style={{ marginTop: 8 }}>入力画面で候補を選び「確定」すると、ここにピンが表示されます。</p>
      ) : (
        <p className="muted" style={{ marginTop: 8 }}>選択した場所をピン表示中。順路の最適化は「整える」で提案します。</p>
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
