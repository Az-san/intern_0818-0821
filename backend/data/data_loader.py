"""
CSVデータ読み込みユーティリティ
データキャッシュ機能付き
"""

import csv
import os
from typing import List, Dict, Optional

class DataLoader:
    """CSVデータローダー（キャッシュ機能付き）"""
    
    def __init__(self):
        self._destinations_cache = None
        self._customers_cache = None
        self._data_dir = os.path.dirname(os.path.abspath(__file__))
    
    def load_destinations(self) -> List[Dict]:
        """沖縄県観光地データを読み込み"""
        if self._destinations_cache is None:
            self._destinations_cache = self._load_csv('okinawa_destinations.csv')
            # タグの文字列を配列に変換
            for dest in self._destinations_cache:
                if dest.get('tags'):
                    dest['tags'] = [tag.strip() for tag in dest['tags'].split(',')]
                else:
                    dest['tags'] = []
        
        return self._destinations_cache
    
    def load_customers(self) -> List[Dict]:
        """顧客データを読み込み"""
        if self._customers_cache is None:
            # プロジェクトルートのdataディレクトリを指定
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            customer_file = os.path.join(project_root, 'data', 'customer.csv')
            self._customers_cache = self._load_csv_absolute(customer_file)
            
            # 興味・関心タグの文字列を配列に変換
            for customer in self._customers_cache:
                if customer.get('興味・関心タグ'):
                    customer['interests'] = [tag.strip() for tag in customer['興味・関心タグ'].split(',')]
                else:
                    customer['interests'] = []
        
        return self._customers_cache
    
    def get_customer_by_id(self, customer_id: str) -> Optional[Dict]:
        """顧客IDから顧客情報を取得"""
        customers = self.load_customers()
        
        for customer in customers:
            if customer.get('顧客ID') == customer_id:
                return customer
        return None
    
    def get_destination_by_id(self, destination_id: str) -> Optional[Dict]:
        """観光地IDから観光地情報を取得"""
        destinations = self.load_destinations()
        for dest in destinations:
            if dest.get('destination_id') == destination_id:
                return dest
        return None
    
    def _load_csv(self, filename: str) -> List[Dict]:
        """CSVファイルを読み込み（data/ディレクトリ内）"""
        filepath = os.path.join(self._data_dir, filename)
        return self._load_csv_absolute(filepath)
    
    def _load_csv_absolute(self, filepath: str) -> List[Dict]:
        """CSVファイルを絶対パスで読み込み"""
        data = []
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as file:  # BOM対応
                reader = csv.DictReader(file)
                for row in reader:
                    # キーと値を正規化
                    cleaned_row = {}
                    for key, value in row.items():
                        cleaned_key = key.strip()  # キーの前後空白除去
                        cleaned_row[cleaned_key] = value.strip() if value else value
                    data.append(cleaned_row)
        except FileNotFoundError:
            print(f"警告: ファイルが見つかりません: {filepath}")
            return []
        except Exception as e:
            print(f"エラー: ファイル読み込み失敗: {filepath}, {e}")
            return []
        
        return data
    
    def clear_cache(self):
        """キャッシュをクリア"""
        self._destinations_cache = None
        self._customers_cache = None

# シングルトンインスタンス
data_loader = DataLoader()
