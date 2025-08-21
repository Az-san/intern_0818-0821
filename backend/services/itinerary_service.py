"""
旅程作成サービス
ルート情報から詳細な旅程表を生成
"""

from typing import Dict, List
from datetime import datetime, timedelta
import json

class ItineraryService:
    """旅程作成サービス"""
    
    def __init__(self):
        self.default_buffer_minutes = 15  # 各活動間のバッファ時間
        self.default_start_time = "09:00"
    
    def create_itinerary(self, route: Dict, start_time: str = None, 
                        travel_date: str = None) -> Dict:
        """
        ルート情報から詳細旅程を作成
        
        Args:
            route: ルート情報辞書
            start_time: 開始時刻 (HH:MM format)
            travel_date: 旅行日 (YYYY-MM-DD format)
            
        Returns:
            旅程表を含む辞書
        """
        try:
            if not route or 'waypoints' not in route:
                return {
                    'status': 'error',
                    'message': 'ルート情報が不正です'
                }
            
            start_time = start_time or self.default_start_time
            travel_date = travel_date or datetime.now().strftime('%Y-%m-%d')
            
            # 開始時刻をパース
            current_time = self._parse_time(start_time)
            if not current_time:
                return {
                    'status': 'error',
                    'message': '開始時刻の形式が不正です (HH:MM)'
                }
            
            waypoints = route['waypoints']
            schedule = []

            # 先頭が出発地（START/スタート）の場合は、到着・滞在を入れずに「出発→移動」を先に記録
            start_index = 0
            if waypoints:
                w0 = waypoints[0]
                w0_id = str(w0.get('destination_id') or '').upper()
                w0_name = str(w0.get('name') or '')
                is_start = (
                    w0_id == 'START' or
                    w0_name in ['スタート', 'START'] or
                    int(w0.get('estimated_stay_minutes', 0) or 0) == 0
                )
                if is_start and len(waypoints) >= 2:
                    origin_label = 'ホテル'
                    # 出発イベント
                    schedule.append({
                        'time': current_time.strftime('%H:%M'),
                        'activity_type': 'departure',
                        'location': origin_label,
                        'description': f"{origin_label}から出発"
                    })
                    # 移動イベント（スタート→最初の実スポット）
                    travel_info = w0.get('travel_to_next')
                    if travel_info:
                        travel_duration = travel_info['duration_minutes']
                        next_location = waypoints[1]['name']
                        schedule.append({
                            'time': f"{current_time.strftime('%H:%M')}-{(current_time + timedelta(minutes=travel_duration)).strftime('%H:%M')}",
                            'activity_type': 'travel',
                            'from': origin_label,
                            'to': next_location,
                            'description': f"移動 ({travel_info['distance_km']}km, {travel_duration}分)",
                            'travel_time_minutes': travel_duration,
                            'distance_km': travel_info['distance_km']
                        })
                        # 時間を進める（移動＋バッファ）
                        current_time += timedelta(minutes=travel_duration)
                        current_time += timedelta(minutes=self.default_buffer_minutes)
                    start_index = 1

            for i in range(start_index, len(waypoints)):
                waypoint = waypoints[i]
                # 到着イベント
                arrival_event = {
                    'time': current_time.strftime('%H:%M'),
                    'activity_type': 'arrival',
                    'location': waypoint['name'],
                    'description': f"{waypoint['name']}に到着"
                }
                schedule.append(arrival_event)
                
                # 観光・滞在イベント
                stay_duration = waypoint.get('estimated_stay_minutes', 60)
                sightseeing_event = {
                    'time': current_time.strftime('%H:%M'),
                    'activity_type': 'sightseeing',
                    'location': waypoint['name'],
                    'description': f"{waypoint['name']}で観光",
                    'duration_minutes': stay_duration
                }
                schedule.append(sightseeing_event)
                
                # 滞在時間を進める
                current_time += timedelta(minutes=stay_duration)
                
                # 出発イベント（最後以外）
                if i < len(waypoints) - 1:
                    departure_event = {
                        'time': current_time.strftime('%H:%M'),
                        'activity_type': 'departure',
                        'location': waypoint['name'],
                        'description': f"{waypoint['name']}から出発"
                    }
                    schedule.append(departure_event)
                    
                    # 移動イベント
                    travel_info = waypoint.get('travel_to_next')
                    if travel_info:
                        travel_duration = travel_info['duration_minutes']
                        next_location = waypoints[i + 1]['name']
                        
                        travel_event = {
                            'time': f"{current_time.strftime('%H:%M')}-{(current_time + timedelta(minutes=travel_duration)).strftime('%H:%M')}",
                            'activity_type': 'travel',
                            'from': waypoint['name'],
                            'to': next_location,
                            'description': f"移動 ({travel_info['distance_km']}km, {travel_duration}分)",
                            'travel_time_minutes': travel_duration,
                            'distance_km': travel_info['distance_km']
                        }
                        schedule.append(travel_event)
                        
                        # 移動時間を進める
                        current_time += timedelta(minutes=travel_duration)
                        
                        # バッファ時間を追加
                        current_time += timedelta(minutes=self.default_buffer_minutes)
            
            # 終了時刻を計算
            end_time = current_time.strftime('%H:%M')
            total_duration_hours = (current_time - self._parse_time(start_time)).total_seconds() / 3600
            
            # サマリー情報を計算
            summary = self._calculate_summary(route, schedule, start_time, end_time)
            
            return {
                'status': 'success',
                'itinerary': {
                    'date': travel_date,
                    'start_time': start_time,
                    'end_time': end_time,
                    'total_duration_hours': round(total_duration_hours, 1),
                    'schedule': schedule
                },
                'summary': summary
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'旅程作成中にエラーが発生しました: {str(e)}'
            }
    
    def create_detailed_schedule(self, route: Dict, preferences: Dict = None) -> Dict:
        """
        より詳細な旅程を作成（将来拡張用）
        
        Args:
            route: ルート情報
            preferences: 旅行者の好み設定
            
        Returns:
            詳細旅程
        """
        # 基本旅程を作成
        basic_itinerary = self.create_itinerary(route)
        
        if basic_itinerary['status'] != 'success':
            return basic_itinerary
        
        # 将来実装予定の機能：
        # - 食事時間の自動挿入
        # - 休憩時間の提案
        # - 天候に応じた調整
        # - 個人の好みに応じたカスタマイズ
        
        return basic_itinerary
    
    def _parse_time(self, time_str: str) -> datetime:
        """時刻文字列をdatetimeオブジェクトに変換"""
        try:
            return datetime.strptime(time_str, '%H:%M')
        except ValueError:
            return None
    
    def _calculate_summary(self, route: Dict, schedule: List[Dict], 
                          start_time: str, end_time: str) -> Dict:
        """旅程のサマリー情報を計算"""
        total_destinations = len([s for s in schedule if s['activity_type'] == 'sightseeing'])
        total_travel_time = sum([s.get('travel_time_minutes', 0) for s in schedule if s['activity_type'] == 'travel'])
        total_sightseeing_time = sum([s.get('duration_minutes', 0) for s in schedule if s['activity_type'] == 'sightseeing'])
        total_distance = route.get('total_distance_km', 0)
        
        return {
            'total_destinations': total_destinations,
            'total_travel_time_minutes': total_travel_time,
            'total_sightseeing_time_minutes': total_sightseeing_time,
            'total_distance_km': total_distance,
            'start_time': start_time,
            'end_time': end_time
        }
    
    def export_itinerary_text(self, itinerary: Dict) -> str:
        """旅程をテキスト形式でエクスポート"""
        if itinerary.get('status') != 'success':
            return "旅程の生成に失敗しました"
        
        lines = []
        lines.append(f"旅程表 - {itinerary['itinerary']['date']}")
        lines.append("=" * 40)
        lines.append(f"開始: {itinerary['itinerary']['start_time']}")
        lines.append(f"終了: {itinerary['itinerary']['end_time']}")
        lines.append(f"総所要時間: {itinerary['itinerary']['total_duration_hours']}時間")
        lines.append("")
        
        for event in itinerary['itinerary']['schedule']:
            if event['activity_type'] == 'sightseeing':
                lines.append(f"{event['time']} - {event['location']}")
                lines.append(f"  {event['description']} ({event.get('duration_minutes', 0)}分)")
            elif event['activity_type'] == 'travel':
                lines.append(f"{event['time']} - 移動")
                lines.append(f"  {event['from']} → {event['to']}")
                lines.append(f"  距離: {event.get('distance_km', 0)}km, 時間: {event.get('travel_time_minutes', 0)}分")
            lines.append("")
        
        return "\n".join(lines)
