"""
APIルーティング定義
実際の処理はservicesパッケージに分離
"""

from flask import Blueprint, request, jsonify
from services.destination_service import DestinationService
from services.route_service import RouteService
from services.itinerary_service import ItineraryService

api_bp = Blueprint('api', __name__)

# サービスインスタンス
destination_service = DestinationService()
route_service = RouteService()
itinerary_service = ItineraryService()

@api_bp.route('/destinations', methods=['GET'])
def get_destinations():
    """候補地取得API"""
    try:
        customer_id = request.args.get('customer_id')
        weather = request.args.get('weather', 'sunny')
        season = request.args.get('season', 'spring')
        
        if not customer_id:
            return jsonify({
                'status': 'error',
                'message': 'customer_idが必要です'
            }), 400
        
        result = destination_service.get_recommended_destinations(
            customer_id=customer_id,
            weather=weather,
            season=season
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'エラーが発生しました: {str(e)}'
        }), 500

@api_bp.route('/route', methods=['POST'])
def get_route():
    """ルート取得API"""
    try:
        data = request.get_json()
        
        if not data or 'destinations' not in data:
            return jsonify({
                'status': 'error',
                'message': 'destinationsが必要です'
            }), 400
        
        result = route_service.calculate_route(data['destinations'])
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'エラーが発生しました: {str(e)}'
        }), 500

@api_bp.route('/itinerary', methods=['POST'])
def create_itinerary():
    """旅程作成API"""
    try:
        data = request.get_json()
        
        if not data or 'route' not in data:
            return jsonify({
                'status': 'error',
                'message': 'routeが必要です'
            }), 400
        
        start_time = data.get('start_time', '09:00')
        travel_date = data.get('travel_date', '2024-03-15')
        
        result = itinerary_service.create_itinerary(
            route=data['route'],
            start_time=start_time,
            travel_date=travel_date
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'エラーが発生しました: {str(e)}'
        }), 500


@api_bp.route('/plan/llm', methods=['POST'])
def plan_llm():
    """プランニング要約（スタブ）。
    入力の route / itinerary / summary を受け取り、
    LLMに渡す前提の要約ブロックをサーバ側で簡易生成して返す。
    後で本物のLLM呼び出しに差し替え可能な形にしている。
    """
    try:
        data = request.get_json() or {}
        route = data.get('route') or {}
        itinerary = data.get('itinerary') or {}
        summary = data.get('summary') or {}

        blocks = []
        if summary:
            blocks.append({
                'type': 'summary',
                'title': '行程サマリ',
                'body': f"移動合計: {summary.get('total_travel_time_minutes','-')}分 / 滞在合計: {summary.get('total_sightseeing_time_minutes','-')}分 / 距離: {summary.get('total_distance_km','-')}km"
            })
        wp = route.get('waypoints') or []
        for i, w in enumerate(wp):
            label = f"{i+1}. {w.get('name','スポット')}"
            dur = w.get('estimated_stay_minutes')
            blocks.append({
                'type': 'spot',
                'title': label,
                'body': f"滞在目安: {dur}分"
            })
        # 簡易な注意文（例）
        if wp:
            blocks.append({
                'type': 'note',
                'title': '注意',
                'body': '実移動時間は交通状況により変動します。雨天時は屋内候補への差替えを提案します。'
            })

        return jsonify({ 'status': 'success', 'blocks': blocks })
    except Exception as e:
        return jsonify({ 'status': 'error', 'message': str(e) }), 500

@api_bp.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({
        'status': 'healthy',
        'message': 'APIサーバーは正常に動作しています'
    })
