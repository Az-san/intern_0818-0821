"""
OSRM API クライアント
Open Source Routing Machine の公開デモサーバーとの通信
"""

import os
import requests
import time
from typing import List, Dict, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

class OSRMClient:
    """OSRM API クライアント"""
    
    def __init__(self):
        # 環境変数でOSRMサーバーを設定
        custom_osrm_url = os.getenv("OSRM_BASE_URL")
        
        if custom_osrm_url:
            # カスタムURLが指定されている場合
            self.base_urls = [custom_osrm_url]
            print(f"カスタムOSRMサーバーを使用: {custom_osrm_url}")
        else:
            # デフォルト設定（安定性優先）
            self.base_urls = [
                "https://router.project-osrm.org",   # メインOSRMサーバー
                "https://routing.openstreetmap.de"   # バックアップOSRMサーバー
            ]
            print("デフォルトOSRMサーバー設定を使用（安定性優先）")
        
        self.current_url_index = 0
        self.base_url = self.base_urls[self.current_url_index]
        # フロントの10秒レースに収まるよう短めに設定
        self.timeout = 6
        self.retry_count = 1
        self.retry_delay = 0.5
    
    def nearest(self, lon: float, lat: float) -> Optional[Tuple[float, float]]:
        """最寄りの道路上の座標にスナップ"""
        url = f"{self.base_url}/nearest/v1/driving/{lon},{lat}"
        try:
            resp = requests.get(url, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            wp = (data.get('waypoints') or [{}])[0]
            loc = wp.get('location')
            if loc and isinstance(loc, list) and len(loc) >= 2:
                return (float(loc[0]), float(loc[1]))
        except requests.exceptions.RequestException:
            pass
        return None

    def get_route(self, coordinates: List[Tuple[float, float]], 
                  profile: str = 'driving', *, snap: bool = False, allow_fallback: bool = True) -> Optional[Dict]:
        """
        複数地点間のルートを取得
        
        Args:
            coordinates: [(longitude, latitude), ...] の座標リスト
            profile: ルーティングプロファイル (driving, walking, cycling)
            
        Returns:
            ルート情報辞書 or None（エラー時）
        """
        if len(coordinates) < 2:
            raise ValueError("最低2つの座標が必要です")
        
        print(f"🚗 OSRM get_route呼び出し: {len(coordinates)}地点, プロファイル: {profile}, スナップ: {snap}")
        print(f"🌐 使用サーバー: {self.base_url}")
        
        # OSRMのroute API自体がスナップするため、既定ではnearestを省略して低レイテンシ化
        snapped: List[Tuple[float, float]] = []
        if snap:
            for lon, lat in coordinates:
                loc = self.nearest(lon, lat)
                snapped.append(loc if loc else (lon, lat))
        else:
            snapped = list(coordinates)
        # 座標を文字列に変換
        coords_str = ";".join([f"{lon},{lat}" for lon, lat in snapped])
        
        # 軽量パラメータ（overview=simplified）
        url_path = f"/route/v1/{profile}/{coords_str}"
        params = {
            'overview': 'simplified',
            'geometries': 'geojson',
            'steps': 'false',
            'alternatives': 'false'
        }
        print(f"🔗 リクエストPATH: {url_path}")
        print(f"📋 パラメータ: {params}")

        # 複数サーバーを並列に叩き、先着勝ち
        try:
            data, meta = self._fetch_first(url_path, params)
            if data.get('code') == 'Ok':
                formatted = self._format_route_response(data)
                if formatted is not None:
                    formatted['meta'] = meta
                return formatted
        except Exception as e:
            print(f"❌ OSRM 並列取得失敗: {e}")
        
        # Fallback: OSRMに到達できない場合は直線ジオメトリを生成
        if allow_fallback:
            try:
                import math
                def hav(a: Tuple[float,float], b: Tuple[float,float]) -> float:
                    (lon1, lat1), (lon2, lat2) = a, b
                    R=6371.0
                    dlat=math.radians(lat2-lat1); dlon=math.radians(lon2-lon1)
                    x=math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
                    return 2*R*math.asin(min(1, math.sqrt(x)))
                legs = []
                total_km = 0.0
                for i in range(len(snapped)-1):
                    km = hav(snapped[i], snapped[i+1])
                    total_km += km
                    legs.append({
                        'leg_index': i,
                        'distance_meters': km*1000,
                        'duration_seconds': (km/40.0)*3600,  # 40km/h 仮
                        'distance_km': round(km, 2),
                        'duration_minutes': round((km/40.0)*60, 1),
                        'steps_count': 0,
                    })
                return {
                    'geometry': { 'type': 'LineString', 'coordinates': [(lon, lat) for lon,lat in snapped] },
                    'distance_meters': total_km*1000,
                    'duration_seconds': (total_km/40.0)*3600,
                    'distance_km': round(total_km, 2),
                    'duration_minutes': round((total_km/40.0)*60, 1),
                    'legs': legs,
                    'waypoints': [],
                    'meta': {'osrm_base': None, 'osrm_ms': None}
                }
            except Exception:
                return None
        return None

    def _fetch_first(self, url_path: str, params: Dict) -> Tuple[Dict, Dict]:
        """複数ベースURLへ並列投射し、最初に成功した結果を返す"""
        def hit(base: str):
            t0 = time.time()
            resp = requests.get(base + url_path, params=params, timeout=self.timeout)
            ms = int((time.time() - t0) * 1000)
            return resp, base, ms
        with ThreadPoolExecutor(max_workers=len(self.base_urls)) as ex:
            futs = [ex.submit(hit, b) for b in self.base_urls]
            for f in as_completed(futs):
                try:
                    r, base, ms = f.result()
                    if r.status_code == 429:
                        continue
                    r.raise_for_status()
                    data = r.json()
                    if data.get('code') == 'Ok':
                        return data, { 'osrm_base': base, 'osrm_ms': ms }
                except Exception:
                    continue
        raise RuntimeError('all OSRM backends failed')
    
    def get_distance_matrix(self, coordinates: List[Tuple[float, float]]) -> Optional[Dict]:
        """
        複数地点間の距離・時間マトリックスを取得
        
        Args:
            coordinates: [(longitude, latitude), ...] の座標リスト
            
        Returns:
            距離・時間マトリックス or None（エラー時）
        """
        coords_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        
        url = f"{self.base_url}/table/v1/driving/{coords_str}"
        params = {
            'annotations': 'distance,duration'
        }
        
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('code') == 'Ok':
                return {
                    'distances': data.get('distances', []),
                    'durations': data.get('durations', []),
                    'sources': data.get('sources', []),
                    'destinations': data.get('destinations', [])
                }
            else:
                print(f"OSRM Table API エラー: {data.get('message', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"OSRM Table API リクエストエラー: {e}")
            return None
    
    def _format_route_response(self, osrm_data: Dict) -> Dict:
        """OSRM レスポンスを統一フォーマットに変換"""
        print(f"🔧 OSRMレスポンス変換開始: {type(osrm_data)}")
        print(f"📋 生データ: {osrm_data}")
        
        if not osrm_data.get('routes'):
            print("❌ routesフィールドが存在しません")
            return {}
        
        route = osrm_data['routes'][0]  # 最初のルートを使用
        print(f"📍 ルートデータ: {route}")
        
        formatted = {
            'geometry': route.get('geometry'),
            'distance_meters': route.get('distance', 0),
            'duration_seconds': route.get('duration', 0),
            'distance_km': round(route.get('distance', 0) / 1000, 2),
            'duration_minutes': round(route.get('duration', 0) / 60, 1),
            'legs': self._format_legs(route.get('legs', [])),
            'waypoints': osrm_data.get('waypoints', [])
        }
        
        print(f"✅ 変換完了: {formatted}")
        return formatted
    
    def _format_legs(self, legs: List[Dict]) -> List[Dict]:
        """ルートの区間情報を整形"""
        formatted_legs = []
        
        for i, leg in enumerate(legs):
            formatted_legs.append({
                'leg_index': i,
                'distance_meters': leg.get('distance', 0),
                'duration_seconds': leg.get('duration', 0),
                'distance_km': round(leg.get('distance', 0) / 1000, 2),
                'duration_minutes': round(leg.get('duration', 0) / 60, 1),
                'steps_count': len(leg.get('steps', []))
            })
        
        return formatted_legs
    
    def _try_next_server(self) -> bool:
        """次のOSRMサーバーを試行"""
        self.current_url_index = (self.current_url_index + 1) % len(self.base_urls)
        self.base_url = self.base_urls[self.current_url_index]
        print(f"OSRMサーバーを切り替え: {self.base_url}")
        return True
    
    def test_connection(self) -> bool:
        """OSRM サーバーとの接続テスト"""
        print(f"OSRM接続テスト開始: {self.base_url}")
        
        # 各サーバーで接続テスト
        for i, test_url in enumerate(self.base_urls):
            try:
                print(f"サーバー {i+1} をテスト中: {test_url}")
                test_coords = "127.7723,26.3105;127.679,26.212"
                test_url_full = f"{test_url}/route/v1/driving/{test_coords}?overview=simplified&geometries=geojson&steps=false&alternatives=false"
                
                response = requests.get(test_url_full, timeout=5)
                if response.status_code == 200:
                    print(f"✅ サーバー {test_url} に接続成功")
                    # 成功したサーバーを現在のサーバーに設定
                    self.current_url_index = i
                    self.base_url = test_url
                    return True
                else:
                    print(f"❌ サーバー {test_url} のステータス: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ サーバー {test_url} の接続失敗: {e}")
                if i == 0:  # ローカルサーバーの場合
                    print("💡 ローカルOSRMサーバーが起動していない可能性があります")
                    print("   以下のコマンドでローカルOSRMサーバーを起動してください:")
                    print("   docker run -t -i -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/okinawa.osrm")
        
        print("❌ すべてのOSRMサーバーに接続失敗")
        return False

# シングルトンインスタンス
osrm_client = OSRMClient()
