# ホテルコンシェルジュ向け旅行プラン作成補助API

沖縄県の観光地を対象とした、旅行プラン作成を支援するWebAPIです。顧客の属性に基づく観光地推薦、ルート検索、詳細旅程作成の機能を提供します。

## 機能概要

### 1. 候補地取得API (`/api/destinations`)
- 顧客の年齢、性別、興味・関心タグに基づく観光地推薦
- 沖縄県内の20の観光地から最適な候補を提案
- 推薦スコア付きでソート済みリストを返却

### 2. ルート取得API (`/api/route`)
- OSRM（Open Source Routing Machine）を使用した最適ルート計算
- 複数観光地間の移動距離・時間を算出
- GeoJSON形式でのルート情報を提供

### 3. 旅程作成API (`/api/itinerary`)
- ルート情報を基にした詳細スケジュール生成
- 各観光地での滞在時間と移動時間を考慮
- 15分刻みの細かい時間割を作成

## 技術スタック

- **フレームワーク**: Flask 2.3.3
- **言語**: Python 3.8+
- **データ管理**: CSV ファイル
- **ルーティング**: OSRM公開デモサーバー
- **依存関係**: requests, pandas, python-dotenv

## セットアップ

### 1. 依存関係のインストール
```bash
cd backend
pip install -r requirements.txt
```

### 2. サーバー起動
```bash
python app.py
```

サーバーは `http://localhost:5001` で起動します。

## API使用方法

### 候補地取得
```bash
curl "http://localhost:5001/api/destinations?customer_id=C001&weather=sunny&season=spring"
```

### ルート取得
```bash
curl -X POST "http://localhost:5001/api/route" \
  -H "Content-Type: application/json" \
  -d '{
    "destinations": [
      {"destination_id": "D001", "latitude": 26.2173, "longitude": 127.7199},
      {"destination_id": "D003", "latitude": 26.2124, "longitude": 127.6792}
    ]
  }'
```

### 旅程作成
```bash
curl -X POST "http://localhost:5001/api/itinerary" \
  -H "Content-Type: application/json" \
  -d '{
    "route": {<ルート取得APIの結果>},
    "start_time": "09:00",
    "travel_date": "2024-03-15"
  }'
```

## テスト実行

### 基本機能テスト
```bash
python test_api.py
```

### HTTPエンドポイントテスト
```bash
python test_flask_app.py
```

## データ構造

### 観光地データ (`data/okinawa_destinations.csv`)
- 沖縄県内20箇所の観光地情報
- 位置情報、カテゴリ、推定滞在時間、タグ情報

### 顧客データ (`../data/customer.csv`)
- 年齢、性別、興味・関心タグ
- 100件のサンプル顧客データ

## プロジェクト構造

```
backend/
├── app.py                          # メインアプリケーション
├── requirements.txt                # 依存関係
├── routes/
│   └── api_routes.py              # APIルーティング
├── services/                      # ビジネスロジック
│   ├── destination_service.py     # 候補地取得サービス
│   ├── route_service.py          # ルート取得サービス
│   └── itinerary_service.py      # 旅程作成サービス
├── data/
│   ├── okinawa_destinations.csv   # 沖縄観光地データ
│   └── data_loader.py            # データ読み込みユーティリティ
├── utils/
│   ├── recommendation.py         # 推薦ロジック
│   └── osrm_client.py           # OSRM通信クライアント
├── models/
│   └── schemas.py                # データモデル定義
├── test_api.py                   # APIテストスクリプト
└── test_flask_app.py            # HTTPテストスクリプト
```

## API仕様詳細

### 候補地取得API
- **エンドポイント**: `GET /api/destinations`
- **パラメータ**: 
  - `customer_id` (必須): 顧客ID
  - `weather` (オプション): 天気 (future use)
  - `season` (オプション): 季節 (future use)
  - `limit` (オプション): 取得件数上限 (デフォルト: 10)

### ルート取得API
- **エンドポイント**: `POST /api/route`
- **リクエスト**: 観光地の位置情報リスト
- **レスポンス**: GeoJSONルート、距離、時間情報

### 旅程作成API
- **エンドポイント**: `POST /api/itinerary`
- **リクエスト**: ルート情報、開始時刻、旅行日
- **レスポンス**: 詳細スケジュール、テキスト形式エクスポート機能

## 将来拡張予定

- 天気・季節を考慮した推薦ロジック
- TSP最適化によるルート順序最適化
- 食事時間・休憩時間の自動挿入
- 個人の好みに応じたカスタマイズ機能
- 推薦精度向上のための機械学習モデル導入

## 注意事項

- OSRM公開デモサーバーを使用しているため、リクエスト制限があります
- 本実装は開発用であり、本番環境での使用には追加のセキュリティ対策が必要です
- CSVデータは模擬データであり、実際の観光地情報と異なる場合があります




