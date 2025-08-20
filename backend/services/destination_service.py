"""
候補地取得サービス
顧客属性に基づく観光地推薦機能
"""

from typing import Dict, List, Optional
from data.data_loader import data_loader
from utils.recommendation import recommendation_engine

class DestinationService:
    """候補地取得サービス"""
    
    def __init__(self):
        self.data_loader = data_loader
        self.recommendation_engine = recommendation_engine
    
    def get_recommended_destinations(self, customer_id: str, weather: str = 'sunny', 
                                   season: str = 'spring', limit: int = 10) -> Dict:
        """
        顧客に対する推薦観光地を取得
        
        Args:
            customer_id: 顧客ID
            weather: 天気 (future use)
            season: 季節 (future use) 
            limit: 返却する候補地数の上限
            
        Returns:
            推薦結果とメタデータを含む辞書
        """
        try:
            # 顧客情報を取得
            customer = self.data_loader.get_customer_by_id(customer_id)
            if not customer:
                return {
                    'status': 'error',
                    'message': f'顧客ID {customer_id} が見つかりません'
                }
            
            # 全観光地データを取得
            all_destinations = self.data_loader.load_destinations()
            if not all_destinations:
                return {
                    'status': 'error',
                    'message': '観光地データが見つかりません'
                }
            
            # 天気・季節フィルタリング（将来実装用の準備）
            filtered_destinations = self._filter_by_weather_season(
                all_destinations, weather, season
            )
            
            # 推薦スコア計算とソート
            recommended_destinations = self.recommendation_engine.sort_destinations_by_score(
                customer, filtered_destinations
            )
            
            # 上位limit件に制限
            top_destinations = recommended_destinations[:limit]
            
            # レスポンス形式に整形
            return {
                'status': 'success',
                'customer_info': {
                    'customer_id': customer_id,
                    'age': customer.get('年齢'),
                    'gender': customer.get('性別（コード値）'),
                    'interests': customer.get('interests', []),
                    'segment': customer.get('顧客セグメント')
                },
                'search_params': {
                    'weather': weather,
                    'season': season,
                    'limit': limit
                },
                'destinations': [
                    self._format_destination_response(dest) 
                    for dest in top_destinations
                ],
                'total_found': len(recommended_destinations)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'推薦処理中にエラーが発生しました: {str(e)}'
            }
    
    def get_destination_details(self, destination_id: str) -> Optional[Dict]:
        """指定された観光地の詳細情報を取得"""
        destination = self.data_loader.get_destination_by_id(destination_id)
        if destination:
            return self._format_destination_response(destination)
        return None
    
    def _filter_by_weather_season(self, destinations: List[Dict], 
                                 weather: str, season: str) -> List[Dict]:
        """
        天気と季節による観光地フィルタリング
        現在は全ての観光地を返すが、将来的にフィルタリングロジックを追加
        """
        # 将来実装：
        # - 雨天時は屋内施設を優先
        # - 夏季はビーチ、冬季は温泉を優先 など
        
        return destinations
    
    def _format_destination_response(self, destination: Dict) -> Dict:
        """観光地データをAPIレスポンス形式に整形"""
        return {
            'destination_id': destination.get('destination_id'),
            'name': destination.get('name'),
            'latitude': float(destination.get('latitude', 0)),
            'longitude': float(destination.get('longitude', 0)),
            'category': destination.get('category'),
            'description': destination.get('description'),
            'estimated_duration': int(destination.get('estimated_duration_minutes', 60)),
            'tags': destination.get('tags', []),
            'recommendation_score': destination.get('recommendation_score', 0)
        }
