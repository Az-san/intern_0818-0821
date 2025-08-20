"""
Flask アプリケーション HTTP テストスクリプト
実際のHTTPリクエストでAPIエンドポイントをテスト
"""

import requests
import json
import time
import threading
from app import create_app

def start_test_server():
    """テスト用Flaskサーバーを起動"""
    app = create_app()
    app.run(debug=False, host='127.0.0.1', port=5001, use_reloader=False)

def test_api_endpoints():
    """HTTPリクエストでAPIエンドポイントをテスト"""
    base_url = "http://127.0.0.1:5001/api"
    
    print("Flask APIエンドポイント HTTPテスト")
    print("=" * 50)
    
    # サーバー起動待機
    print("サーバー起動を待機中...")
    time.sleep(3)
    
    # 1. ヘルスチェック
    print("1. ヘルスチェック")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   ステータス: {response.status_code}")
        print(f"   レスポンス: {response.json()}")
    except Exception as e:
        print(f"   エラー: {e}")
    print()
    
    # 2. 候補地取得API
    print("2. 候補地取得API")
    try:
        params = {
            'customer_id': 'C001',
            'weather': 'sunny',
            'season': 'spring'
        }
        response = requests.get(f"{base_url}/destinations", params=params, timeout=10)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   推薦観光地数: {len(data.get('destinations', []))}")
            if data.get('destinations'):
                print(f"   トップ観光地: {data['destinations'][0]['name']}")
    except Exception as e:
        print(f"   エラー: {e}")
    print()
    
    # 3. ルート取得API
    print("3. ルート取得API")
    try:
        route_data = {
            "destinations": [
                {"destination_id": "D001", "latitude": 26.2173, "longitude": 127.7199},
                {"destination_id": "D003", "latitude": 26.2124, "longitude": 127.6792}
            ]
        }
        response = requests.post(f"{base_url}/route", 
                               json=route_data, 
                               headers={'Content-Type': 'application/json'},
                               timeout=15)
        print(f"   ステータス: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            route = data.get('route', {})
            print(f"   総距離: {route.get('total_distance_km')}km")
            print(f"   総移動時間: {route.get('total_duration_minutes')}分")
            
            # 旅程作成APIで使用するために保存
            global test_route_data
            test_route_data = data
    except Exception as e:
        print(f"   エラー: {e}")
    print()
    
    # 4. 旅程作成API
    print("4. 旅程作成API")
    try:
        if 'test_route_data' in globals():
            itinerary_data = {
                "route": test_route_data['route'],
                "start_time": "09:00",
                "travel_date": "2024-03-15"
            }
            response = requests.post(f"{base_url}/itinerary",
                                   json=itinerary_data,
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
            print(f"   ステータス: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                itinerary = data.get('itinerary', {})
                print(f"   開始時刻: {itinerary.get('start_time')}")
                print(f"   終了時刻: {itinerary.get('end_time')}")
                print(f"   総所要時間: {itinerary.get('total_duration_hours')}時間")
        else:
            print("   ルートデータがないため、テストをスキップ")
    except Exception as e:
        print(f"   エラー: {e}")
    
    print("\nHTTPテスト完了")

if __name__ == "__main__":
    # バックグラウンドでFlaskサーバーを起動
    server_thread = threading.Thread(target=start_test_server, daemon=True)
    server_thread.start()
    
    # APIテストを実行
    test_api_endpoints()
