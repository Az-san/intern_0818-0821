## ホテルコンシェルジュ向けシステム

本リポジトリは「旅行プランナー（Vite + React）」と「ホテルコンシェルジュアプリ（Next.js）」、および共通バックエンド（Flask/FastAPI）を含む統合プロジェクトです。スマホから同一LAN内でアクセスでき、ホテルアプリから旅行プランナーへ顧客情報を引き継いで遷移できます。

### 構成
- backend
  - Flask: `:5001`（/api/*: 候補地/ルート/旅程/顧客 API）
  - FastAPI: `:8000`（カタログ/天気/メディア等）
- frontend（旅行プランナー）: Vite + React `:5173`
- hotel-app（ホテルアプリ）: Next.js `:3000`

### 前提
- Windows PowerShell
- Python 3.9+ / Node.js 18+
- 同一Wi-Fi内のスマホからアクセスする場合は、各サーバーを 0.0.0.0 で起動し、Windows Firewall の受信規則を許可してください。

---

## セットアップ

1) 依存関係のインストール
```powershell
# backend (Flask/FastAPI)
cd backend
python -m venv venv
. venv\Scripts\Activate.ps1
pip install -U pip
pip install -r requirements.txt

# frontend (Vite)
cd ../frontend
npm install

# hotel-app (Next.js)
cd ../hotel-app
npm install
```

2) 環境変数（任意）
- frontend
  - `VITE_API_BASE` FastAPI 基本URL（既定: `http://localhost:8000`）
  - `VITE_API2_BASE` Flask 基本URL（既定: `http://localhost:5001`）
- hotel-app
  - `NEXT_PUBLIC_BACKEND_BASE` Flask 基本URL（未設定時は `http://<アクセス元ホスト>:5001` を自動使用）
- backend（OSRM 任意）
  - `OSRM_BASE_URL` OSRM サーバ（未設定時は公開デモを自動選択）

---

## 起動方法

PowerShell でプロジェクトルートから順に実行してください。

1) バックエンド（Flask 5001: /api/*）
```powershell
cd backend
. venv\Scripts\Activate.ps1
python start_server.py  # 0.0.0.0:5001 で起動
```

2) バックエンド（FastAPI 8000）
```powershell
cd backend
. venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

3) フロントエンド（旅行プランナー 5173）
```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

4) ホテルアプリ（Next.js 3000）
```powershell
cd hotel-app
npm run dev -- -H 0.0.0.0 -p 3000
```

---

## スマホからのアクセス（同一LAN）
- PC の IP を確認: `ipconfig` の IPv4 アドレス（例: `XXX.XXX.XX.XX`）
- スマホのブラウザでアクセス
  - ホテルアプリ: `http://<PCのIP>:3000`
  - 旅行プランナー: `http://<PCのIP>:5173`
- Windows Firewall で 3000/5001/8000/5173 の受信を許可
- CORS は緩和設定済み（Flask/FastAPI）

---

## 主要機能
- 候補地レコメンド（顧客属性・混雑回避・予算・天気・季節）
- 地図でのピン選択と「タップ順に番号付与」→ ルート作成（OSRM）
- 直線→道路沿いルートへの自動切替（OSRM成功時）
- 旅のしおり（Travel Brochure）表示（分単位での移動時間/滞在時間）
- 画像サムネイル: Wikipedia 検索＋一部固定ファイル（`frontend/public/*.jpg`）
- ホテルアプリから旅行プランナーへ顧客情報を付与して遷移

---

## 旅行プランの推薦システム

バックエンドの Flask API（`/api/destinations`）で候補地をスコアリングし、推薦とその他を返します。

補足: SQLite は `backend/instance/app.db` に配置されます（自動作成）。`backend/instance/` は Git から除外されています。

- 入力（クエリ）
  - `customer_id`: 例 `C001`
  - 任意: `weather`（`sunny|rainy|cloudy`）、`season`（`spring|summer|autumn|winter`）
  - 任意: `budget_yen`（目安予算）、`crowd_avoid`（`off|mid|high`）

- 参照データ（`backend/data/okinawa_destinations.csv`）
  - `crowd_level` 混雑度、`price_min_yen/price_max_yen` 価格帯
  - `indoor` 屋内可、`barrier_free`、`stroller_friendly`
  - 緯度経度、カテゴリ、推奨滞在時間など

- スコア構成（`backend/utils/recommendation.py`）
  - 予算適合度: 希望予算に近いスポットを加点
  - 混雑回避: `crowd_avoid` が強いほど混雑度の高いスポットを減点
  - アクセシビリティ: ベビーカー/バリアフリー要件に合致で加点
  - 天気・季節: `weather` と `season` に応じて屋外/屋内、海/自然/文化などを加点・減点

- 出力（成功時）
  - `destinations`: 推薦順の配列（上位）
  - `others`: 推薦外だが候補の配列（下位）

- フロントからの使い方（例）
  - `fetchDestinations(customerId, { weather: 'sunny', season: 'summer', budget_yen: 5000, crowd_avoid: 'mid' })`
  - 未指定時の既定: `weather=sunny`, `season=spring`

- 重み調整
  - 重みは `backend/utils/recommendation.py` 内で調整可能です。必要に応じて係数を変更してください。

---

## よくあるトラブル
- 5173/3000 にアクセスできない
  - サーバが `0.0.0.0` で起動しているか確認
  - ポート競合は `Get-NetTCPConnection -LocalPort 5173` などで確認→プロセスを停止
  - Firewall 受信規則を許可
- 地図が直線のまま
  - 公開 OSRM がレート制限・タイムアウトの場合があります。リトライで復帰することがあります
  - 直線でもプランは分単位計算の概算に切替済み
- サムネイルが出ない
  - `frontend/public/` に指定ファイルが存在するか確認

---

## 開発補足
- フロントは状態を `localStorage` に保持（選択順・ルート座標・旅程データ）
- OSRM レスポンスが無い場合も概算レッグを生成し、旅程は分単位で算出
- ホテルアプリは `NEXT_PUBLIC_BACKEND_BASE` 未設定時、アクセス元のホストを自動使用（モバイルOK）

---

## デプロイ/Push
- 通常: `git add -A && git commit -m "message" && git push origin main`
- 強制: `git push --force-with-lease origin main`（注意: リモート履歴を上書きします）
