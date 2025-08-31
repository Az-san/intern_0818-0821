"""
APIルーティング定義
実際の処理はservicesパッケージに分離
"""

from flask import Blueprint, request, jsonify
from services.destination_service import DestinationService
from services.route_service import RouteService
from services.itinerary_service import ItineraryService
from services.llm_reranker import LLMReranker, SUGGEST_SCHEMA
from data.data_loader import data_loader

api_bp = Blueprint('api', __name__)

# サービスインスタンス
destination_service = DestinationService()
route_service = RouteService()
itinerary_service = ItineraryService()
llm_reranker = LLMReranker()

@api_bp.route('/destinations', methods=['GET'])
def get_destinations():
    """候補地取得API"""
    try:
        customer_id = request.args.get('customer_id')
        weather = request.args.get('weather', 'sunny')
        season = request.args.get('season', 'spring')
        budget_yen = request.args.get('budget_yen')
        crowd_avoid = request.args.get('crowd_avoid')
        try:
            budget_yen = int(budget_yen) if budget_yen is not None else None
        except Exception:
            budget_yen = None
        
        if not customer_id:
            return jsonify({
                'status': 'error',
                'message': 'customer_idが必要です'
            }), 400
        
        result = destination_service.get_recommended_destinations(
            customer_id=customer_id,
            weather=weather,
            season=season,
            budget_yen=budget_yen,
            crowd_avoid=crowd_avoid
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
        
        optimize = bool(data.get('optimize'))
        result = route_service.get_optimized_route(data['destinations']) if optimize else route_service.calculate_route(data['destinations'])
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'エラーが発生しました: {str(e)}'
        }), 500

@api_bp.route('/test-osrm', methods=['GET'])
def test_osrm_connection():
    """OSRM接続テストAPI"""
    try:
        from utils.osrm_client import osrm_client
        
        # 接続テストを実行
        success = osrm_client.test_connection()
        
        return jsonify({
            'status': 'success' if success else 'error',
            'message': 'OSRM接続テスト完了',
            'current_server': osrm_client.base_url,
            'available_servers': osrm_client.base_urls,
            'connection_success': success
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'OSRM接続テストでエラーが発生しました: {str(e)}'
        }), 500

@api_bp.route('/customers', methods=['GET'])
def list_customers():
    """顧客一覧API（CSV/DB由来）"""
    try:
        customers = data_loader.load_customers()
        return jsonify({ 'status': 'success', 'customers': customers })
    except Exception as e:
        return jsonify({ 'status': 'error', 'message': str(e) }), 500

@api_bp.route('/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id: str):
    """顧客詳細API"""
    try:
        customer = data_loader.get_customer_by_id(customer_id)
        if not customer:
            return jsonify({ 'status': 'error', 'message': 'not found' }), 404
        return jsonify({ 'status': 'success', 'customer': customer })
    except Exception as e:
        return jsonify({ 'status': 'error', 'message': str(e) }), 500

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

@api_bp.route('/plan/suggest', methods=['POST'])
def plan_suggest():
    """LLM 再ランキング API。候補 TopN を受け取り、ranked/rejected を返す。
    入力例:
    {
      "customer_id": "C001",
      "constraints": {"weather":"sunny","season":"summer","budget_yen":5000,"crowd_avoid":"mid"},
      "candidates": [ {"destination_id":"a001", ...}, ... ],
      "top_k": 10,
      "model_profile": "cheap|balanced|quality"
    }
    """
    try:
        data = request.get_json() or {}
        customer_id = data.get('customer_id')
        constraints = data.get('constraints') or {}
        candidates = data.get('candidates') or []
        top_k = int(data.get('top_k') or 10)
        model_profile = data.get('model_profile') or 'balanced'

        if not customer_id:
            return jsonify({ 'status': 'error', 'message': 'customer_id が必要です' }), 400
        if not candidates:
            # サーバ側で推薦TopNを補う: 既存エンジンからTop50を取得
            base = destination_service.get_recommended_destinations(customer_id=customer_id, limit=50,
                weather=constraints.get('weather') or 'sunny',
                season=constraints.get('season') or 'spring',
                budget_yen=constraints.get('budget_yen'),
                crowd_avoid=constraints.get('crowd_avoid'))
            if base.get('status') != 'success':
                return jsonify(base), 400
            candidates = base.get('destinations', []) + base.get('others', [])

        customer = data_loader.get_customer_by_id(customer_id) or { '顧客ID': customer_id }
        result = llm_reranker.rerank(customer, constraints, candidates, top_k=top_k, model_profile=model_profile)

        return jsonify({ 'status': 'success', 'suggest': result })
    except Exception as e:
        return jsonify({ 'status': 'error', 'message': str(e) }), 500

@api_bp.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({
        'status': 'healthy',
        'message': 'APIサーバーは正常に動作しています'
    })
