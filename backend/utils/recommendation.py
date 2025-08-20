"""
推薦ロジック実装
顧客の属性に基づく観光地推薦アルゴリズム
"""

from typing import Dict, List

class RecommendationEngine:
    """推薦エンジン"""
    
    def __init__(self):
        # 年齢層別重み設定
        self.age_weights = {
            'young': (20, 35),    # 若年層
            'middle': (36, 55),   # 中年層  
            'senior': (56, 80)    # シニア層
        }
        
        # カテゴリ別年齢層適性
        self.category_age_preference = {
            'エンターテイメント': {'young': 0.3, 'middle': 0.1, 'senior': 0.05},
            'ショッピング': {'young': 0.2, 'middle': 0.25, 'senior': 0.15},
            '歴史': {'young': 0.1, 'middle': 0.2, 'senior': 0.3},
            '自然': {'young': 0.2, 'middle': 0.2, 'senior': 0.25},
            '文化': {'young': 0.15, 'middle': 0.2, 'senior': 0.25}
        }
    
    def calculate_recommendation_score(self, customer: Dict, destination: Dict) -> float:
        """顧客と観光地の適合度スコアを計算"""
        score = 0.3  # ベーススコア
        
        # 年齢による調整
        age_score = self._calculate_age_score(customer, destination)
        score += age_score
        
        # 興味タグマッチング
        interest_score = self._calculate_interest_score(customer, destination)
        score += interest_score
        
        # 観光地の人気度（推定滞在時間による調整）
        popularity_score = self._calculate_popularity_score(destination)
        score += popularity_score
        
        return min(score, 1.0)  # 最大1.0に制限
    
    def _calculate_age_score(self, customer: Dict, destination: Dict) -> float:
        """年齢に基づくスコア計算"""
        try:
            age = int(customer.get('年齢', 35))
            category = destination.get('category', '')
            age_pref = destination.get('age_preference', 'all')
            
            # 年齢制限チェック
            if age_pref == 'adult' and age < 20:
                return -0.2  # 大人向けコンテンツは若年層に減点
            
            # 年齢層判定
            age_group = self._get_age_group(age)
            
            # カテゴリ別年齢適性スコア
            if category in self.category_age_preference:
                return self.category_age_preference[category].get(age_group, 0.1)
            
            return 0.1  # デフォルトスコア
            
        except (ValueError, TypeError):
            return 0.1
    
    def _calculate_interest_score(self, customer: Dict, destination: Dict) -> float:
        """興味・関心タグマッチングスコア計算"""
        customer_interests = set(customer.get('interests', []))
        destination_tags = set(destination.get('tags', []))
        
        # 完全一致するタグ数
        matching_tags = customer_interests & destination_tags
        
        if not customer_interests:
            return 0.1  # 興味タグがない場合のデフォルト
        
        # マッチング率に基づくスコア
        match_ratio = len(matching_tags) / len(customer_interests)
        return match_ratio * 0.4  # 最大0.4点
    
    def _calculate_popularity_score(self, destination: Dict) -> float:
        """観光地の人気度スコア計算"""
        try:
            duration = int(destination.get('estimated_duration_minutes', 60))
            # 滞在時間が長い = 人気/見どころが多い と仮定
            if duration >= 120:
                return 0.15
            elif duration >= 90:
                return 0.1
            elif duration >= 60:
                return 0.05
            else:
                return 0.02
                
        except (ValueError, TypeError):
            return 0.05
    
    def _get_age_group(self, age: int) -> str:
        """年齢から年齢層を判定"""
        if age <= 35:
            return 'young'
        elif age <= 55:
            return 'middle'
        else:
            return 'senior'
    
    def sort_destinations_by_score(self, customer: Dict, destinations: List[Dict]) -> List[Dict]:
        """観光地リストを推薦スコア順にソート"""
        scored_destinations = []
        
        for dest in destinations:
            score = self.calculate_recommendation_score(customer, dest)
            dest_with_score = dest.copy()
            dest_with_score['recommendation_score'] = round(score, 3)
            scored_destinations.append(dest_with_score)
        
        # スコア降順でソート
        scored_destinations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return scored_destinations

# シングルトンインスタンス
recommendation_engine = RecommendationEngine()
