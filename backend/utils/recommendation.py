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

        # 予算適合（price_min/max_yen を参照）
        score += self._calculate_budget_score(customer, destination)

        # 混雑回避（crowd_level が小さいほど加点）
        score += self._calculate_crowd_score(customer, destination)

        # アクセシビリティ（ベビーカー/車椅子）
        score += self._calculate_accessibility_score(customer, destination)

        # 天気・季節の適性調整
        score += self._calculate_weather_season_score(customer, destination)
        
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

    def _calculate_budget_score(self, customer: Dict, destination: Dict) -> float:
        try:
            budget = customer.get('budget_yen')
            if budget is None:
                return 0.0
            low = destination.get('price_min_yen')
            high = destination.get('price_max_yen') or low
            if low is None and high is None:
                return 0.0
            # 価格帯が予算以下→加点、超過→減点
            mid = (low or high or 0 + high or low or 0) / 2 if (low or high) else 0
            price = mid or low or high or 0
            if price <= budget:
                return 0.12
            # 予算をどれくらい超えているか
            ratio = min(2.0, (price / max(1, budget)))
            return -0.12 * (ratio - 1.0)  # 最大で -0.12
        except Exception:
            return 0.0

    def _calculate_crowd_score(self, customer: Dict, destination: Dict) -> float:
        try:
            pref = (customer.get('crowd_avoid') or 'off')
            level = destination.get('crowd_level')
            if level is None or pref == 'off':
                return 0.0
            # level: 0(空)-5(混) として、midは-0.05*level、highは-0.09*level
            weight = 0.05 if pref == 'mid' else 0.09
            return -weight * float(level)
        except Exception:
            return 0.0

    def _calculate_accessibility_score(self, customer: Dict, destination: Dict) -> float:
        try:
            stroller = bool(customer.get('needs_stroller'))
            wheelchair = bool(customer.get('needs_wheelchair'))
            if not (stroller or wheelchair):
                return 0.0
            s_ok = destination.get('stroller_friendly')
            bf_ok = destination.get('barrier_free')
            score = 0.0
            if stroller:
                score += (0.08 if s_ok else -0.08)
            if wheelchair:
                score += (0.10 if bf_ok else -0.10)
            return score
        except Exception:
            return 0.0
    
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

    def _calculate_weather_season_score(self, customer: Dict, destination: Dict) -> float:
        """天気(sunny/rainy/cloudy)と季節(spring/summer/autumn/winter)に応じた加点/減点"""
        weather = (customer.get('weather') or 'sunny').lower()
        season = (customer.get('season') or 'spring').lower()
        category = (destination.get('category') or '')
        tags = set(destination.get('tags') or [])
        indoor = bool(destination.get('indoor'))

        w = 0.0
        # 天気
        if weather == 'sunny':
            # 屋外・ビーチ・絶景
            if not indoor: w += 0.06
            if 'ビーチ' in category or 'ビーチ' in tags: w += 0.06
            if '絶景' in tags or '景観' in tags: w += 0.04
        elif weather == 'rainy':
            # 屋内・ショッピング・文化、屋外は減点
            if indoor: w += 0.08
            if 'ショッピング' in category or 'ショッピング' in tags: w += 0.06
            if '文化' in category or '美術館' in tags or '博物館' in tags: w += 0.05
            if not indoor: w -= 0.06
        elif weather == 'cloudy':
            # 屋内・文化施設を少しプラス
            if indoor: w += 0.04
            if '文化' in category or '美術館' in tags or '博物館' in tags: w += 0.03

        # 季節
        if season == 'spring':
            if '自然' in category or '花' in tags or 'ハイキング' in tags: w += 0.06
        elif season == 'summer':
            if 'ビーチ' in category or 'ビーチ' in tags: w += 0.08
            if 'マリンスポーツ' in tags: w += 0.06
            if indoor: w += 0.02  # 暑さ対策で屋内を少し優遇
        elif season == 'autumn':
            if '自然' in category or '景観' in tags or 'ハイキング' in tags: w += 0.06
        elif season == 'winter':
            if indoor: w += 0.05
            if '温泉' in tags: w += 0.07
            if 'ショッピング' in category or 'ショッピング' in tags: w += 0.04

        return w

# シングルトンインスタンス
recommendation_engine = RecommendationEngine()
