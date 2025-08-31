import React from 'react'
import { CatalogItem } from '../types'
import { fetchPhotoUrl } from '../api'

type Props = {
  catalog: CatalogItem[]
  selectedCatalogIds: Set<string>
  onToggleCatalog: (c: CatalogItem) => void
}

export const PieceLibrary: React.FC<Props> = ({ catalog, selectedCatalogIds, onToggleCatalog }) => {
  const items = React.useMemo(() => {
    const sorted = [...catalog]
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    return sorted
  }, [catalog])

  const [thumbs, setThumbs] = React.useState<Record<string, string | null>>({})
  const requested = React.useRef<Set<string>>(new Set())
  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const queue = React.useRef<string[]>([])
  const active = React.useRef(0)
  const MAX_CONCURRENCY = 4

  function cacheKey(name: string) { return `photo-url:${name}` }
  function getCached(name: string): string | null {
    try { return localStorage.getItem(cacheKey(name)) } catch { return null }
  }
  function setCached(name: string, url: string | null) {
    try { if (url) localStorage.setItem(cacheKey(name), url) } catch {}
  }

  async function fetchWithTimeout(name: string, ms = 3000): Promise<string | null> {
    // 特定の候補地は固定画像を使用
    if (name.includes('ジャングリア沖縄') || name.includes('ジャングリア')) {
      return '/junglia.jpg'
    }
    if (name.includes('美ら海')) {
      return '/churami.jpg'
    }
    if (name.includes('シーグラス')) {
      return '/seagrass.jpg'
    }
    // 部瀬名（ブセナ）海中公園: 表記ゆれ多数に対応
    if (
      name.includes('部瀬名海中公園') ||
      name.includes('部瀬名') ||
      name.includes('ブセナ海中公園') ||
      name.includes('ブセナ') ||
      name.includes('ぶせな') ||
      name.includes('ぶせら海中公園') ||
      name.includes('ぶせら') ||
      name.includes('ブセラ')
    ) {
      return '/busena.jpg'
    }
    if (name.includes('こうり島') || name.includes('古宇利島') || name.includes('古宇利')) {
      return '/furuuri.jpg'
    }
    if (name.includes('恩納海浜公園')) {
      return '/ono.jpg'
    }
    if (name.includes('国際通り')) {
      return '/kokusai.jpg'
    }
    if (name.includes('アメリカンビレッジ')) {
      return '/usvillage.jpg'
    }
    // 瀬長島ビーチはウミカジ（瀬長島全般）より優先
    if (name.includes('瀬長島ビーチ')) {
      return '/senaga.jpg'
    }
    if (name.includes('瀬長島ウミカジテラス') || name.includes('ウミカジ') || name.includes('瀬長島')) {
      return '/umikazi.jpg'
    }
    if (name.includes('残波岬') || name.includes('残波')) {
      return '/zanpa.jpg'
    }
    if (name.includes('座喜味城跡') || name.includes('座喜味城') || name.includes('座喜味')) {
      return '/zagimi.jpg'
    }
    if (name.includes('ガンガラーの谷') || name.includes('ガンガラー')) {
      return '/tani.jpg'
    }
    if (name.includes('玉泉洞')) {
      return '/gyokusen.jog'
    }
    if (name.includes('OKINAWAフルーツらんど') || name.toLowerCase().includes('okinawaフルーツらんど')) {
      return '/fruit.jpg'
    }
    if (name.includes('おきなわワールド') || name.includes('ワールド')) {
      return '/world.jpg'
    }
    if (name.includes('ひめゆりの塔') || name.includes('ひめゆり')) {
      return '/himeyuri.jpg'
    }
    if (name.includes('ナゴパイナップルパーク') || name.includes('パイナップル')) {
      return '/pineapple.jpg'
    }
    if (name.includes('沖縄アウトレットモールあしびなー') || name.includes('あしびなー') || name.includes('アウトレット')) {
      return '/outlet.jpg'
    }
    if (name.includes('沖縄県立博物館・美術館') || name.includes('博物館') || name.includes('美術館')) {
      return '/museum.jpg'
    }
    if (name.includes('海中道路')) {
      return '/road.jpg'
    }
    if (name.includes('今帰仁城跡') || name.includes('今帰仁')) {
      return '/nakijin.jpg'
    }
    if (name.includes('知念岬公園') || name.includes('知念岬')) {
      return '/chinen.jpg'
    }
    if (name.includes('波上宮') || name.includes('なみのうえ') || name.includes('なみの上')) {
      return '/naminouegu.jpg'
    }
    if (name.includes('琉球村')) {
      return '/ryukyu.jpg'
    }
    if (name.includes('壺屋やちむん通り') || name.includes('やちむん')) {
      return '/yachimun.jpg'
    }
    if (name.includes('首里城')) {
      return '/shuri.jpg'
    }
    
    const cached = getCached(name)
    if (cached) return cached
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), ms)
    try {
      const url = await fetchPhotoUrl(name)
      if (url) setCached(name, url)
      return url
    } catch { return null } finally { clearTimeout(t) }
  }

  function schedule(id: string) {
    if (requested.current.has(id)) return
    requested.current.add(id)
    queue.current.push(id)
    pump()
  }

  function pump() {
    while (active.current < MAX_CONCURRENCY && queue.current.length) {
      const id = queue.current.shift() as string
      active.current += 1
      const item = items.find(i => i.id === id)
      const name = item?.name || id
      fetchWithTimeout(name).then((url) => {
        setThumbs((prev) => ({ ...prev, [id]: url }))
      }).finally(() => {
        active.current -= 1
        if (queue.current.length) pump()
      })
    }
  }

  // Lazy-load thumbnails for visible cards only (IntersectionObserver)
  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const id = (e.target as HTMLElement).dataset['id']
        if (id && e.isIntersecting && thumbs[id] === undefined) schedule(id)
      })
    }, { rootMargin: '200px 0px' })
    items.forEach((c) => {
      const el = itemRefs.current[c.id]
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [items, thumbs])

  return (
    <div>
      <h2 style={{ margin: '8px 0 12px' }}>候補一覧</h2>
      {/* おすすめ */}
      <Section title="おすすめ" items={items.filter((c:any)=>c._recommended)} selectedCatalogIds={selectedCatalogIds} thumbs={thumbs} onToggleCatalog={onToggleCatalog} itemRefs={itemRefs} />
      {/* その他 */}
      <Section title="その他" items={items.filter((c:any)=>!c._recommended)} selectedCatalogIds={selectedCatalogIds} thumbs={thumbs} onToggleCatalog={onToggleCatalog} itemRefs={itemRefs} />
    </div>
  )
}

function Section({ title, items, selectedCatalogIds, thumbs, onToggleCatalog, itemRefs }: { title: string; items: CatalogItem[]; selectedCatalogIds: Set<string>; thumbs: Record<string,string|null>; onToggleCatalog: (c: CatalogItem)=>void; itemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>> }){
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, margin: '8px 0' }}>{title}</div>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((c:any) => {
          const selected = selectedCatalogIds.has(c.id)
          const src = thumbs[c.id] || '/beach.jpg'
          return (
            <div
              key={c.id}
              className={`card selectable ${selected ? 'selected' : ''}`}
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', border: selected ? '2px solid #2563eb' : undefined, transform: selected ? 'scale(1.01)' : undefined, boxShadow: selected ? '0 6px 14px rgba(37,99,235,0.25)' : undefined, transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease' }}
              onClick={() => onToggleCatalog(c)}
              ref={(el) => { itemRefs.current[c.id] = el }}
              data-id={c.id}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f3f4f6' }}>
                {/* サムネイル */}
                <img src={src ?? '/beach.jpg'} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* 選択オーバーレイ（薄い濃さ） */}
                {selected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(37,99,235,0.15)' }} />}
                {selected && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#2563eb', color: '#fff', width: 24, height: 24, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 6px rgba(0,0,0,.25)' }}>✓</div>
                )}
                {/* レコメンドのリボン */}
                {((c as any)._recommended) && (
                  <div style={{ position: 'absolute', left: 0, top: 0, background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 8px', borderBottomRightRadius: 8 }}>おすすめ</div>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  種別: {c.type} / 目安 {c.durationMin} 分{typeof c.priceMin === 'number' ? ` / ¥${c.priceMin}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PieceLibrary


