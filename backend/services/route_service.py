"""
ルート取得サービス
OSRM を使用した最適ルート計算
"""

from typing import List, Dict, Tuple
from utils.osrm_client import osrm_client
from data.data_loader import data_loader

class RouteService:
    """ルート取得サービス"""
    
    def __init__(self):
        self.osrm_client = osrm_client
        self.data_loader = data_loader
    
    def calculate_route(self, destinations: List[Dict]) -> Dict:
        """
        選択された観光地のルートを計算
        
        Args:
            destinations: [{"destination_id": "D001", "latitude": 26.2173, "longitude": 127.7199}, ...]
            
        Returns:
            ルート情報を含む辞書
        """
        try:
            if not destinations or len(destinations) < 2:
                return {
                    'status': 'error',
                    'message': '最低2つの観光地が必要です'
                }
            
            # 座標リストを作成 (longitude, latitude)
            coordinates = []
            destination_info = []
            
            for dest in destinations:
                if not all(key in dest for key in ['latitude', 'longitude']):
                    return {
                        'status': 'error',
                        'message': 'latitude と longitude が必要です'
                    }
                
                lat = float(dest['latitude'])
                lon = float(dest['longitude'])
                coordinates.append((lon, lat))
                
                # 観光地詳細情報を取得
                dest_details = None
                dest_id = str(dest.get('destination_id') or '')
                if dest_id:
                    dest_details = self.data_loader.get_destination_by_id(dest_id)

                # START（ホテル出発）を特別扱い
                if dest_id.upper() == 'START':
                    destination_info.append({
                        'destination_id': 'START',
                        'latitude': lat,
                        'longitude': lon,
                        'name': 'ホテル',
                        'estimated_stay_minutes': 0,
                    })
                else:
                    destination_info.append({
                        'destination_id': dest.get('destination_id'),
                        'latitude': lat,
                        'longitude': lon,
                        'name': (dest_details.get('name') if dest_details else f"地点{len(destination_info)+1}"),
                        'estimated_stay_minutes': (int(dest_details.get('estimated_duration_minutes', 60)) if dest_details else 60)
                    })
            
            # OSRM でルート計算（正確性重視でスナップON）
            print(f"🔍 OSRM API呼び出し開始: {len(coordinates)}地点")
            print(f"📍 座標: {coordinates}")
            
            route_data = self.osrm_client.get_route(coordinates, profile='driving', snap=True)
            
            print(f"📊 OSRM API結果: {route_data is not None}")
            if route_data:
                print(f"✅ ルート取得成功: 距離{route_data.get('distance_km', 'N/A')}km, 時間{route_data.get('duration_minutes', 'N/A')}分")
                print(f"📊 ルートデータ詳細:")
                print(f"   - ジオメトリ: {type(route_data.get('geometry', 'N/A'))}")
                print(f"   - 座標数: {len(route_data.get('geometry', {}).get('coordinates', [])) if route_data.get('geometry') else 'N/A'}")
                print(f"   - 距離: {route_data.get('distance_km', 'N/A')}km")
                print(f"   - 時間: {route_data.get('duration_minutes', 'N/A')}分")
                print(f"   - 全データ: {route_data}")
            else:
                print(f"❌ ルート取得失敗: OSRM APIがNoneを返しました")
            
            if not route_data:
                return {
                    'status': 'error',
                    'message': 'ルート計算に失敗しました'
                }
            
            # レスポンス形式に整形
            return {
                'status': 'success',
                'route': {
                    'geometry': route_data['geometry'],
                    'total_distance_km': route_data['distance_km'],
                    'total_duration_minutes': route_data['duration_minutes'],
                    'waypoints': self._create_waypoints_info(destination_info, route_data)
                },
                'destinations': destination_info,
                'summary': {
                    'total_destinations': len(destinations),
                    'total_travel_time': route_data['duration_minutes'],
                    'total_stay_time': sum(d['estimated_stay_minutes'] for d in destination_info),
                    'estimated_total_time': route_data['duration_minutes'] + sum(d['estimated_stay_minutes'] for d in destination_info)
                }
            }
            
        except ValueError as e:
            return {
                'status': 'error',
                'message': f'入力データエラー: {str(e)}'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'ルート計算中にエラーが発生しました: {str(e)}'
            }
    
    def get_optimized_route(self, destinations: List[Dict], start_point: Dict = None) -> Dict:
        """
        訪問順序を最適化したルートを計算
        現在は単純な順序で処理、将来的にTSP最適化を実装予定
        """
        try:
            if not destinations or len(destinations) < 2:
                return {
                    'status': 'error',
                    'message': '最低2つの観光地が必要です'
                }

            # 準備: coordinates/destination_info を作成
            coords: List[Tuple[float, float]] = []
            info: List[Dict] = []
            for dest in destinations:
                lat = float(dest['latitude']); lon = float(dest['longitude'])
                coords.append((lon, lat))
                dest_id = str(dest.get('destination_id') or '')
                details = self.data_loader.get_destination_by_id(dest_id) if dest_id else None
                if dest_id.upper() == 'START':
                    info.append({
                        'destination_id': 'START', 'latitude': lat, 'longitude': lon,
                        'name': 'ホテル', 'estimated_stay_minutes': 0,
                    })
                else:
                    info.append({
                        'destination_id': dest.get('destination_id'), 'latitude': lat, 'longitude': lon,
                        'name': (details.get('name') if details else f"地点{len(info)+1}"),
                        'estimated_stay_minutes': (int(details.get('estimated_duration_minutes', 60)) if details else 60)
                    })

            # Nearest Neighbor で順序最適化（0番目＝出発地固定）
            order = [0]
            remaining = list(range(1, len(coords)))
            def hav(a, b):
                import math
                (lon1, lat1), (lon2, lat2) = coords[a], coords[b]
                R=6371.0
                dlat=math.radians(lat2-lat1); dlon=math.radians(lon2-lon1)
                x=math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
                return 2*R*math.asin(min(1, math.sqrt(x)))
            while remaining:
                cur = order[-1]
                nxt = min(remaining, key=lambda j: hav(cur, j))
                order.append(nxt)
                remaining.remove(nxt)

            coords_ord = [coords[i] for i in order]
            info_ord = [info[i] for i in order]

            route_data = self.osrm_client.get_route(coords_ord, profile='driving', snap=True)
            if not route_data:
                return { 'status': 'error', 'message': 'ルート計算に失敗しました' }

            return {
                'status': 'success',
                'route': {
                    'geometry': route_data['geometry'],
                    'total_distance_km': route_data['distance_km'],
                    'total_duration_minutes': route_data['duration_minutes'],
                    'waypoints': self._create_waypoints_info(info_ord, route_data)
                },
                'destinations': info_ord,
                'summary': {
                    'total_destinations': len(info_ord),
                    'total_travel_time': route_data['duration_minutes'],
                    'total_stay_time': sum(d['estimated_stay_minutes'] for d in info_ord),
                    'estimated_total_time': route_data['duration_minutes'] + sum(d['estimated_stay_minutes'] for d in info_ord)
                }
            }
        except Exception as e:
            return { 'status': 'error', 'message': f'最適化中にエラー: {e}' }
    
    def _create_waypoints_info(self, destinations: List[Dict], route_data: Dict) -> List[Dict]:
        """ウェイポイント情報を作成"""
        waypoints = []
        legs = route_data.get('legs', [])
        
        for i, dest in enumerate(destinations):
            waypoint = {
                'order': i + 1,
                'destination_id': dest['destination_id'],
                'name': dest['name'],
                'latitude': dest['latitude'],
                'longitude': dest['longitude'],
                'estimated_stay_minutes': dest['estimated_stay_minutes']
            }
            
            # 次の地点への移動情報を追加
            if i < len(legs):
                leg = legs[i]
                waypoint['travel_to_next'] = {
                    'distance_km': leg['distance_km'],
                    'duration_minutes': leg['duration_minutes']
                }
            else:
                waypoint['travel_to_next'] = None  # 最後の地点
            
            waypoints.append(waypoint)
        
        return waypoints
    
    def test_route_service(self) -> Dict:
        """ルートサービスのテスト"""
        test_destinations = [
            {
                "destination_id": "D001",
                "latitude": 26.2173,
                "longitude": 127.7199
            },
            {
                "destination_id": "D003", 
                "latitude": 26.2124,
                "longitude": 127.6792
            }
        ]
        
        return self.calculate_route(test_destinations)
