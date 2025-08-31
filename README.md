## ホテルコンシェルジュ向けシステム

本リポジトリは「旅行プランナー（Vite + React）」と「ホテルアプリ（Next.js）」および共通バックエンド（Flask/FastAPI）を含むモノレポである。

### 構成
- backend: Flask `:5001`（/api/*）、FastAPI `:8000`
- frontend（旅行プランナー）: Vite `:5173`
- hotel-app（ホテルアプリ）: Next.js `:3000`
- DB: `backend/instance/app.db`（自動作成・Git除外）

### セットアップ
PowerShell で以下を実行する。
```powershell
# backend
cd backend
python -m venv venv
. venv\Scripts\Activate.ps1
pip install -U pip
pip install -r requirements.txt

# frontend / hotel-app
cd ../frontend && npm install
cd ../hotel-app && npm install
```

### 起動
```powershell
# Flask (5001)
cd backend; . venv\Scripts\Activate.ps1; python start_server.py

# FastAPI (8000)
cd backend; . venv\Scripts\Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 旅行プランナー (5173)
cd frontend; npm run dev -- --host 0.0.0.0 --port 5173

# ホテルアプリ (3000)
cd hotel-app; npm run dev -- -H 0.0.0.0 -p 3000
```
一括起動は `scripts/dev.ps1` を使う。

### 環境変数（任意）
- frontend: `VITE_API_BASE`（既定: `http://localhost:8000`）, `VITE_API2_BASE`（既定: `http://localhost:5001`）
- hotel-app: `NEXT_PUBLIC_BACKEND_BASE`
- backend（LLM）: `OPENAI_API_KEY`, `OPENAI_MODEL`（既定: `gpt-4o-mini`）
- backend（OSRM 任意）: `OSRM_BASE_URL`

### APIメモ
- 候補地: `GET /api/destinations`
- ルート: `POST /api/route`
- 旅程: `POST /api/itinerary`
- LLM再ランキング: `POST /api/plan/suggest`（候補未指定時はサーバ側でTop50を補完）
