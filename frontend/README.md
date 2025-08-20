## Itinerary Demo Frontend

### セットアップ
1. Node.js 18+ を用意
2. 依存インストール
```bash
cd frontend
npm i
```
3. 開発起動
```bash
npm run dev
```

### 概要
- React + Vite + TypeScript の最小実装
- 主要コンポーネント: `IntentForm`, `PieceLibrary`, `Timeline`, `SummaryBar`, `FixModal`, `ItinerarySummary`
- 型: `src/types.ts`
- バリデーション: `src/validation.ts`（歩行・移動・重なりの簡易チェック）
- 疑似API/カタログ: `src/api.ts`

### 今後の拡張候補
- MapThumb/MapFull の追加
- fixes を 3案すべて実装（近場へ差替／滞在-10分）
- validate の詳細化（L.O.・年齢制限など）



