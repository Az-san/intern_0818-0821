"""
データモデル定義
API リクエスト・レスポンスの型定義
"""

from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class Coordinate:
    """座標クラス"""
    latitude: float
    longitude: float

@dataclass
class Destination:
    """観光地情報クラス"""
    destination_id: str
    name: str
    latitude: float
    longitude: float
    category: str
    description: str
    estimated_duration: int
    tags: List[str]
    recommendation_score: Optional[float] = None

@dataclass
class Customer:
    """顧客情報クラス"""
    customer_id: str
    age: int
    gender: str
    interests: List[str]
    segment: str

@dataclass
class RouteRequest:
    """ルート取得リクエスト"""
    destinations: List[Dict]

@dataclass
class ItineraryRequest:
    """旅程作成リクエスト"""
    route: Dict
    start_time: str = "09:00"
    travel_date: str = "2024-03-15"

# APIレスポンスの定型フォーマット
class APIResponse:
    """API レスポンス基底クラス"""
    
    @staticmethod
    def success(data: Dict, message: str = None) -> Dict:
        """成功レスポンス"""
        response = {
            'status': 'success',
            'data': data
        }
        if message:
            response['message'] = message
        return response
    
    @staticmethod
    def error(message: str, error_code: str = None) -> Dict:
        """エラーレスポンス"""
        response = {
            'status': 'error',
            'message': message
        }
        if error_code:
            response['error_code'] = error_code
        return response
