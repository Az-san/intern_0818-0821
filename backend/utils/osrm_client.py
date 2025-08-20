"""
OSRM API クライアント
Open Source Routing Machine の公開デモサーバーとの通信
"""

import requests
import time
from typing import List, Dict, Tuple, Optional

class OSRMClient:
    """OSRM API クライアント"""
    
    def __init__(self):
        self.base_url = "http://router.project-osrm.org"
        self.timeout = 30  # タイムアウト秒数
        self.retry_count = 3  # リトライ回数
        self.retry_delay = 1  # リトライ間隔（秒）
    
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
                  profile: str = 'driving', *, snap: bool = True) -> Optional[Dict]:
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
        
        # スナップしてから問い合わせ（道路外の座標を補正）
        snapped: List[Tuple[float, float]] = []
        for lon, lat in coordinates:
            if snap:
                loc = self.nearest(lon, lat)
                snapped.append(loc if loc else (lon, lat))
            else:
                snapped.append((lon, lat))
        # 座標を文字列に変換
        coords_str = ";".join([f"{lon},{lat}" for lon, lat in snapped])
        
        url = f"{self.base_url}/route/v1/{profile}/{coords_str}"
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'true',
            'alternatives': 'false'
        }
        
        for attempt in range(self.retry_count):
            try:
                response = requests.get(url, params=params, timeout=self.timeout)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get('code') == 'Ok':
                    return self._format_route_response(data)
                else:
                    print(f"OSRM API エラー: {data.get('message', 'Unknown error')}")
                    return None
                    
            except requests.exceptions.RequestException as e:
                print(f"OSRM API リクエストエラー (試行 {attempt + 1}/{self.retry_count}): {e}")
                if attempt < self.retry_count - 1:
                    time.sleep(self.retry_delay)
                else:
                    return None
        
        return None
    
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
        if not osrm_data.get('routes'):
            return {}
        
        route = osrm_data['routes'][0]  # 最初のルートを使用
        
        return {
            'geometry': route.get('geometry'),
            'distance_meters': route.get('distance', 0),
            'duration_seconds': route.get('duration', 0),
            'distance_km': round(route.get('distance', 0) / 1000, 2),
            'duration_minutes': round(route.get('duration', 0) / 60, 1),
            'legs': self._format_legs(route.get('legs', [])),
            'waypoints': osrm_data.get('waypoints', [])
        }
    
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
    
    def test_connection(self) -> bool:
        """OSRM サーバーとの接続テスト"""
        try:
            # 沖縄本島内の2点でテスト
            test_coords = [
                (127.7199, 26.2173),  # 首里城
                (127.6792, 26.2124)   # 国際通り
            ]
            
            result = self.get_route(test_coords)
            return result is not None
            
        except Exception as e:
            print(f"OSRM 接続テスト失敗: {e}")
            return False

# シングルトンインスタンス
osrm_client = OSRMClient()
