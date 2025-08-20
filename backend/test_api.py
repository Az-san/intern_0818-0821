"""
API テストスクリプト
各エンドポイントの動作確認
"""

import json
import sys
import os

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.destination_service import DestinationService
from services.route_service import RouteService
from services.itinerary_service import ItineraryService
from utils.osrm_client import OSRMClient

def test_destination_service():
    """候補地取得サービスのテスト"""
    print("=== 候補地取得サービステスト ===")
    
    service = DestinationService()
    
    # 顧客C001の推薦観光地を取得
    result = service.get_recommended_destinations(
        customer_id="C001",
        weather="sunny",
        season="spring",
        limit=5
    )
    
    print(f"結果: {result['status']}")
    if result['status'] == 'success':
        print(f"顧客情報: {result['customer_info']}")
        print(f"推薦観光地数: {len(result['destinations'])}")
        for i, dest in enumerate(result['destinations'][:3]):
            print(f"  {i+1}. {dest['name']} (スコア: {dest['recommendation_score']})")
    else:
        print(f"エラー: {result['message']}")
    
    print()

def test_osrm_connection():
    """OSRM 接続テスト"""
    print("=== OSRM 接続テスト ===")
    
    client = OSRMClient()
    is_connected = client.test_connection()
    
    if is_connected:
        print("✓ OSRM 公開デモサーバーに正常に接続できました")
    else:
        print("✗ OSRM 接続に失敗しました")
    
    print()

def test_route_service():
    """ルート取得サービスのテスト"""
    print("=== ルート取得サービステスト ===")
    
    service = RouteService()
    
    # 首里城 → 国際通り → 美ら海水族館のルートを計算
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
        },
        {
            "destination_id": "D002",
            "latitude": 26.6940,
            "longitude": 127.8779
        }
    ]
    
    result = service.calculate_route(test_destinations)
    
    print(f"結果: {result['status']}")
    if result['status'] == 'success':
        route = result['route']
        print(f"総距離: {route['total_distance_km']}km")
        print(f"総移動時間: {route['total_duration_minutes']}分")
        print(f"推定総所要時間: {result['summary']['estimated_total_time']}分")
        print("ウェイポイント:")
        for wp in route['waypoints']:
            print(f"  {wp['order']}. {wp['name']}")
            if wp['travel_to_next']:
                print(f"     → 次まで {wp['travel_to_next']['distance_km']}km, {wp['travel_to_next']['duration_minutes']}分")
    else:
        print(f"エラー: {result['message']}")
    
    print()
    return result if result['status'] == 'success' else None

def test_itinerary_service(route_data=None):
    """旅程作成サービスのテスト"""
    print("=== 旅程作成サービステスト ===")
    
    service = ItineraryService()
    
    if not route_data:
        print("ルートデータがないため、テストをスキップします")
        return
    
    result = service.create_itinerary(
        route=route_data['route'],
        start_time="09:00",
        travel_date="2024-03-15"
    )
    
    print(f"結果: {result['status']}")
    if result['status'] == 'success':
        itinerary = result['itinerary']
        print(f"日付: {itinerary['date']}")
        print(f"開始時刻: {itinerary['start_time']}")
        print(f"終了時刻: {itinerary['end_time']}")
        print(f"総所要時間: {itinerary['total_duration_hours']}時間")
        print()
        print("スケジュール:")
        for event in itinerary['schedule'][:8]:  # 最初の8イベントのみ表示
            if event['activity_type'] == 'sightseeing':
                print(f"  {event['time']} - {event['location']} ({event.get('duration_minutes', 0)}分)")
            elif event['activity_type'] == 'travel':
                print(f"  {event['time']} - 移動: {event.get('from', '')} → {event.get('to', '')}")
        
        # テキスト形式のエクスポートテスト
        text_output = service.export_itinerary_text(result)
        print("\n--- テキスト形式 ---")
        print(text_output[:300] + "..." if len(text_output) > 300 else text_output)
    else:
        print(f"エラー: {result['message']}")
    
    print()

def main():
    """メインテスト関数"""
    print("旅行プラン作成API テストスイート")
    print("=" * 50)
    
    # 1. 候補地取得テスト
    test_destination_service()
    
    # 2. OSRM 接続テスト
    test_osrm_connection()
    
    # 3. ルート取得テスト
    route_result = test_route_service()
    
    # 4. 旅程作成テスト
    test_itinerary_service(route_result)
    
    print("テスト完了")

if __name__ == "__main__":
    main()
