## ホテルコンシェルジュ向け旅行プラン支援システム

・宿泊施設のスタッフが顧客に最適な観光プランを提案できるよう支援するシステム
・フロントエンド（Next.js + Vite）とバックエンド（Flask/FastAPI）を含む

### 特徴
- 顧客属性・天候・季節・予算などを考慮した候補地レコメンド
- OSRM によるルート最適化と所要時間の概算
- 旅程（しおり）生成
- LLM を用いた候補再ランキング（スキーマ検証付き、失敗時は安全フォールバック）

### 技術スタック
- フロント: Next.js（hotel-app）、Vite + React（planner）
- バックエンド: Flask（/api/*）/ FastAPI（補助API）
- DB: SQLite（`backend/instance/app.db`）

### ディレクトリ構成（抜粋）
```
backend/           # Flask/FastAPI とデータ、instance DB
hotel-app/         # Next.js（ホテルアプリ）
  └─ planner/      # 旅行プランナー（Vite）。開発時は /planner/* にプロキシ
scripts/           # 開発用スクリプト（一括起動など）
```

### クイックスタート（開発）
```powershell
# 依存関係
cd backend; python -m venv venv; . venv\Scripts\Activate.ps1; pip install -r requirements.txt
cd ../hotel-app; npm install
cd ./planner; npm install

# 起動（個別）
# Flask (5001)
cd ../../backend; . venv\Scripts\Activate.ps1; python start_server.py
# FastAPI (8000)
cd ../../backend; . venv\Scripts\Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Planner (5173)
cd ../../hotel-app/planner; npm run dev -- --host 0.0.0.0 --port 5173
# Next.js (3000)
cd ../../hotel-app; npm run dev -- -H 0.0.0.0 -p 3000

# 一括起動（推奨）
cd ..\..\scripts; ./dev.ps1
```

### 環境変数（例）
- backend（LLM）: `OPENAI_API_KEY`, `OPENAI_MODEL`（既定: `gpt-4o-mini`）
- backend（OSRM 任意）: `OSRM_BASE_URL`
- planner: `VITE_API_BASE`（既定: `http://localhost:8000`）, `VITE_API2_BASE`（既定: `http://localhost:5001`）
- hotel-app: `NEXT_PUBLIC_BACKEND_BASE`

### API（代表例）
- `GET /api/health` 健全性確認
- `GET /api/destinations` 候補地の取得
- `POST /api/route` ルート計算（OSRM）
- `POST /api/itinerary` 旅程生成
- `POST /api/plan/suggest` LLM 再ランキング（候補未指定時は Top50 を補完）

### ライセンス
本リポジトリは学習・検証目的で公開している。必要に応じて各ライブラリのライセンスに従うものとする。
