#
# final_dummy_data_generator.py
#
import pandas as pd
import random
from datetime import datetime, timedelta
import json
import os

# --- 設定項目 ---
TOTAL_RECORDS = 100
FOREIGNER_RATIO = 0.3
FILENAME = "sample.csv"
# ----------------

# --- ダミーデータ用のデータプール ---
# 日本語の姓・名
JP_LAST_NAMES = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤']
JP_FIRST_NAMES_MALE = ['太郎', '健太', '陽一', '誠', '大輔']
JP_FIRST_NAMES_FEMALE = ['美咲', '陽子', '恵子', 'さくら', '愛']

# 外国語の姓・名
EN_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
EN_FIRST_NAMES_MALE = ['James', 'Robert', 'John', 'Michael', 'David']
EN_FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth']

# 都道府県と海外の地名
JP_PREFECTURES = ['東京都', '大阪府', '北海道', '福岡県', '愛知県', '神奈川県', '埼玉県', '兵庫県']
FOREIGN_LOCATIONS = ['California', 'New York', 'Texas', 'London', 'Seoul', 'Beijing', 'Shanghai']


def generate_customer_data(record_id, is_foreigner):
    """一人の顧客データを生成する関数"""
    
    if is_foreigner:
        language = random.choice(['EN', 'KO', 'ZH'])
        last_name = random.choice(EN_LAST_NAMES)
        first_name = random.choice(EN_FIRST_NAMES_MALE if random.random() > 0.5 else EN_FIRST_NAMES_FEMALE)
        address_prefecture = random.choice(FOREIGN_LOCATIONS)
    else:
        language = 'JA'
        last_name = random.choice(JP_LAST_NAMES)
        first_name = random.choice(JP_FIRST_NAMES_MALE if random.random() > 0.5 else JP_FIRST_NAMES_FEMALE)
        address_prefecture = random.choice(JP_PREFECTURES)

    age = random.randint(20, 75)
    gender = random.choices([1, 2, 9], weights=[49, 49, 2], k=1)[0] # 1:男性, 2:女性, 9:その他

    segment, stay_count = random.choices(
        [('first_time', 1), ('repeater', random.randint(2, 5)), ('vip', random.randint(6, 20))],
        weights=[60, 35, 5], k=1
    )[0]
    
    comm_pref = random.choices(['digital', 'analog'], weights=[70, 30], k=1)[0]
    interests = ['#自然が好き', '#グルメ', '#アート体験', '#ショッピング', '#子連れOK', '#歴史']
    interest_tags = random.sample(interests, k=random.randint(1, 3))
    
    # --- 同行者情報の詳細な生成ロジック ---
    companion_info = []
    # 独り旅(40%), カップル/夫婦(40%), 家族連れ(20%) をシミュレーション
    companion_type = random.choices(['solo', 'couple', 'family'], weights=[40, 40, 20], k=1)[0]
    
    if companion_type == 'couple':
        partner_age = random.randint(age - 5, age + 5)
        partner_name = random.choice(EN_FIRST_NAMES_FEMALE if gender==1 else EN_FIRST_NAMES_MALE) if is_foreigner else random.choice(JP_FIRST_NAMES_FEMALE if gender==1 else JP_FIRST_NAMES_MALE)
        companion_info.append({'name': f'{last_name} {partner_name}', 'relationship': 'partner', 'age': partner_age, 'notes': '特になし'})

    elif companion_type == 'family' and stay_count > 1: # 家族連れはリピーターに多いと仮定
        partner_age = random.randint(age - 5, age + 5)
        partner_name = random.choice(EN_FIRST_NAMES_FEMALE if gender==1 else EN_FIRST_NAMES_MALE) if is_foreigner else random.choice(JP_FIRST_NAMES_FEMALE if gender==1 else JP_FIRST_NAMES_MALE)
        child_age = random.randint(3, 12)
        child_name = random.choice(EN_FIRST_NAMES_MALE if random.random() > 0.5 else EN_FIRST_NAMES_FEMALE) if is_foreigner else random.choice(JP_FIRST_NAMES_MALE if random.random() > 0.5 else JP_FIRST_NAMES_FEMALE)
        
        companion_info.append({'name': f'{last_name} {partner_name}', 'relationship': 'partner', 'age': partner_age, 'notes': '特になし'})
        companion_info.append({'name': f'{last_name} {child_name}', 'relationship': 'child', 'age': child_age, 'notes': random.choice(['イルカが好き','アレルギーなし'])})


    customer = {
        'GUEST_ID': f'G{str(record_id).zfill(5)}',
        '姓': last_name,
        '名': first_name,
        '住所（都道府県など）': address_prefecture,
        'メールアドレス': f'{first_name.lower()}.{last_name.lower()}@example.com',
        '電話番号': '090-1234-5678' if language == 'JA' else '1-234-567-8901',
        '年齢': age,
        '性別（コード値）': gender,
        '使用言語': language,
        '同行者情報': json.dumps(companion_info, ensure_ascii=False) if companion_info else '', # JSON形式の文字列として格納
        '宿泊回数': stay_count,
        '顧客セグメント': segment,
        'コミュニケーション設定': comm_pref,
        '興味・関心タグ': ", ".join(interest_tags),
        '特記事項': '特になし' if random.random() > 0.1 else '前回、泡盛のテイスティングを楽しまれた'
    }
    return customer

if __name__ == '__main__':
    customer_data_list = []
    print(f"{TOTAL_RECORDS}件のダミーデータを生成します...")

    for i in range(TOTAL_RECORDS):
        is_f = (i < TOTAL_RECORDS * FOREIGNER_RATIO)
        customer_data_list.append(generate_customer_data(i + 1, is_f))

    # pandasのDataFrameに変換
    df = pd.DataFrame(customer_data_list)

    # スクリプトと同じディレクトリにCSVとして出力
    script_dir = os.path.dirname(__file__)
    output_path = os.path.join(script_dir, FILENAME)
    df.to_csv(output_path, index=False, encoding='utf-8-sig')

    print(f"\n完了しました！ ファイル '{output_path}' が作成されました。")
    print("\nデータサンプル（最初の5件）:")
    print(df.head())