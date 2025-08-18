## 顧客データ（customer.csv）README



### スキーマ（列定義）
| 列名 | 型 | 例 | 説明 |
|---|---|---|---|
| 顧客ID | string | C001 | 先頭が `C`、3 桁ゼロ埋めの連番 |
| 姓 | string | 佐藤 | 姓（日本人/外国人で候補が異なる） |
| 名 | string | 太郎 | 名（日本人/外国人で候補が異なる） |
| 住所（都道府県など） | string | 東京都 / London | 居住地（日本人は都道府県、外国籍は海外都市） |
| メールアドレス | string | taro.sato@example.com | 生成規則に基づくダミーアドレス |
| 電話番号 | string | 090-1234-5678 | 言語により形式が異なる（JA は国内形式） |
| 年齢 | int | 34 | 20〜75 の整数 |
| 性別（コード値） | int | 1 | 1:男性, 2:女性, 9:その他（重み付けあり） |
| 使用言語 | string | JA | JA / EN / KO / ZH のいずれか |
| 同行者情報 | string(JSON) | [{...}] | JSON 配列の文字列（後述）。単独の場合は空文字列 |
| 宿泊回数 | int | 3 | セグメントに応じて分布（後述） |
| 顧客セグメント | string | repeater | first_time / repeater / vip |
| コミュニケーション設定 | string | digital | digital / analog |
| 興味・関心タグ | string | #グルメ, #歴史 | `, ` 区切りの文字列（1〜3 個） |
| 特記事項 | string | 特になし | 条件に応じて備考を付与（後述） |




## 対応テーブル（support_dummy_data.csv）

### 概要
- **追加目的**: 過去に対応したコンシェルジュを管理するための履歴テーブル
- **ファイル**: `data/support_dummy_data.csv`

### スキーマ（列定義）
| 列名 | 型 | 例 | 説明 |
|---|---|---|---|
| 対応ID | string | S001 | 主キー（PK） |
| 従業員ID | string | STF001 | 外部キー（FK）。従業員テーブルを想定 |
| 顧客ID | string | C001 | 外部キー（FK）。`customer.csv` の `顧客ID` を参照 |
| 対応内容 | string | チェックイン手続きのサポート | 対応の要約説明 |
| 対応日時 | datetime | 2024-02-01 15:15:00 | 対応が実施された日時（YYYY-MM-DD HH:MM:SS） |

### キーとリレーション
- PK: `対応ID`
- FK: `顧客ID` → `customer.csv`.`顧客ID`
- FK: `従業員ID` → 従業員テーブル（別途定義を想定）

※ `customer.csv` と `support_dummy_data.csv` は `顧客ID` で結合可能です。

