#
# final_intelligent_dummy_data_generator.py
#
import pandas as pd
import random
from datetime import datetime, timedelta
import json
import os

# --- 設定項目 ---
TOTAL_RECORDS = 100
FOREIGNER_RATIO = 0.3
FILENAME = "customer.csv"
# ----------------

# --- ダミーデータ用のデータプール ---
# (省略... 前回のコードと同じ姓・名・地名のリスト)
JP_LAST_NAMES = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤']
JP_FIRST_NAMES_MALE = ['太郎', '健太', '陽一', '誠', '大輔']
JP_FIRST_NAMES_FEMALE = ['美咲', '陽子', '恵子', 'さくら', '愛']
EN_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
EN_FIRST_NAMES_MALE = ['James', 'Robert', 'John', 'Michael', 'David']
EN_FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth']
JP_PREFECTURES = ['東京都', '大阪府', '北海道', '福岡県', '愛知県', '神奈川県', '埼玉県', '兵庫県']
FOREIGN_LOCATIONS = ['California', 'New York', 'Texas', 'London', 'Seoul', 'Beijing', 'Shanghai']

# --- 属性別の特記事項プール ---
FAMILY_NOTES_POOL = [
    'お子様がイルカのぬいぐるみを大変気に入られていた',
    'ベビーカーでの移動が多いため、エレベーターに近い部屋が望ましい',
    'お子様向けディナーメニューの「ハンバーグ」がお好き'
]
ELDERLY_NOTES_POOL = [
    'お部屋に椅子を追加でご用意すると喜ばれる',
    '静かな環境を特に好まれる',
    '朝食は和食を希望されることが多い'
]
GENERAL_NOTES_POOL = [
    '前回、夕日が見えるお部屋を大変気に入られていた',
    '読書家で、静かな時間を好まれる',
    'レストラン「琉球」の特定のディナーコースがお好き',
    '当ホテルの建築デザインに強い関心をお持ちだった',
    'アーリーチェックインを希望されることが多い'
]

def generate_customer_data(record_id, is_foreigner):
    """一人の顧客データを生成する関数"""
    
    # (省略... 前回のコードと同じ顧客基本情報の生成ロジック)
    if is_foreigner:
        language, last_name, first_name, address_prefecture = (random.choice(['EN', 'KO', 'ZH']), random.choice(EN_LAST_NAMES), random.choice(EN_FIRST_NAMES_MALE if random.random() > 0.5 else EN_FIRST_NAMES_FEMALE), random.choice(FOREIGN_LOCATIONS))
    else:
        language, last_name, first_name, address_prefecture = ('JA', random.choice(JP_LAST_NAMES), random.choice(JP_FIRST_NAMES_MALE if random.random() > 0.5 else JP_FIRST_NAMES_FEMALE), random.choice(JP_PREFECTURES))

    age = random.randint(20, 75)
    gender = random.choices([1, 2, 9], weights=[49, 49, 2], k=1)[0]
    segment, stay_count = random.choices([('first_time', 1), ('repeater', random.randint(2, 5)), ('vip', random.randint(6, 20))], weights=[60, 35, 5], k=1)[0]
    comm_pref = random.choices(['digital', 'analog'], weights=[70, 30], k=1)[0]
    interests = ['#自然が好き', '#グルメ', '#アート体験', '#ショッピング', '#歴史', '#温泉', '#ビーチ']
    interest_tags = random.sample(interests, k=random.randint(1, 3))
    
    # --- 同行者情報の詳細な生成ロジック ---
    companion_info = []
    companion_type = random.choices(['solo', 'couple', 'family'], weights=[40, 40, 20], k=1)[0]
    
    if companion_type == 'couple':
        partner_age = max(18, random.randint(age - 5, age + 5))
        partner_name = random.choice(EN_FIRST_NAMES_FEMALE if gender==1 else EN_FIRST_NAMES_MALE) if is_foreigner else random.choice(JP_FIRST_NAMES_FEMALE if gender==1 else JP_FIRST_NAMES_MALE)
        companion_info.append({'name': f'{last_name} {partner_name}', 'relationship': 'partner', 'age': partner_age, 'notes': '特になし'})

    elif companion_type == 'family' and stay_count > 1:
        partner_age = max(18, random.randint(age - 5, age + 5))
        partner_name = random.choice(EN_FIRST_NAMES_FEMALE if gender==1 else EN_FIRST_NAMES_MALE) if is_foreigner else random.choice(JP_FIRST_NAMES_FEMALE if gender==1 else JP_FIRST_NAMES_MALE)
        child_age = random.randint(3, 12)
        child_name = random.choice(EN_FIRST_NAMES_MALE if random.random() > 0.5 else EN_FIRST_NAMES_FEMALE) if is_foreigner else random.choice(JP_FIRST_NAMES_MALE if random.random() > 0.5 else JP_FIRST_NAMES_FEMALE)
        
        companion_info.append({'name': f'{last_name} {partner_name}', 'relationship': 'partner', 'age': partner_age, 'notes': '特になし'})
        companion_info.append({'name': f'{last_name} {child_name}', 'relationship': 'child', 'age': child_age, 'notes': random.choice(['イルカが好き','アレルギーなし'])})

    # --- ★★★ 特記事項のインテリジェントな生成ロジック ★★★ ---
    special_note = '特になし'
    if random.random() > 0.7: # 30%の確率で特記事項あり
        has_child = any(comp.get('relationship') == 'child' for comp in companion_info)
        is_elderly = age >= 65

        if has_child:
            special_note = random.choice(FAMILY_NOTES_POOL)
        elif is_elderly:
            special_note = random.choice(ELDERLY_NOTES_POOL)
        else:
            special_note = random.choice(GENERAL_NOTES_POOL)

    customer = {
        '顧客ID': f'C{str(record_id).zfill(3)}',
        '姓': last_name,
        '名': first_name,
        '住所（都道府県など）': address_prefecture,
        'メールアドレス': f'{first_name.lower()}.{last_name.lower()}@example.com',
        '電話番号': '090-1234-5678' if language == 'JA' else '1-234-567-8901',
        '年齢': age,
        '性別（コード値）': gender,
        '使用言語': language,
        '同行者情報': json.dumps(companion_info, ensure_ascii=False) if companion_info else '',
        '宿泊回数': stay_count,
        '顧客セグメント': segment,
        'コミュニケーション設定': comm_pref,
        '興味・関心タグ': ", ".join(interest_tags),
        '特記事項': special_note
    }
    return customer

if __name__ == '__main__':
    customer_data_list = []
    print(f"{TOTAL_RECORDS}件のダミーデータを生成します...")

    for i in range(TOTAL_RECORDS):
        is_f = (i < TOTAL_RECORDS * FOREIGNER_RATIO)
        customer_data_list.append(generate_customer_data(i + 1, is_f))

    df = pd.DataFrame(customer_data_list)
    # スクリプトと同じディレクトリにCSVとして出力
    script_dir = os.path.dirname(__file__)
    output_path = os.path.join(script_dir, FILENAME)
    df.to_csv(output_path, index=False, encoding='utf-8-sig')

    print(f"\n完了しました！ ファイル '{output_path}' が作成されました。")
    print("\nデータサンプル（最初の5件）:")
    print(df.head())