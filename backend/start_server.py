"""
Flaskサーバー起動スクリプト
本番環境での起動に使用
"""

import os
from app import create_app

def main():
    """メイン関数"""
    print("ホテルコンシェルジュ向け旅行プラン作成API")
    print("=" * 50)
    
    # 環境変数から設定を読み込み
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"サーバー設定:")
    print(f"  ホスト: {host}")
    print(f"  ポート: {port}")
    print(f"  デバッグモード: {debug}")
    print()
    
    # アプリケーション作成
    app = create_app()
    
    print("APIエンドポイント:")
    print(f"  ヘルスチェック: http://{host}:{port}/api/health")
    print(f"  候補地取得: http://{host}:{port}/api/destinations")
    print(f"  ルート取得: http://{host}:{port}/api/route")
    print(f"  旅程作成: http://{host}:{port}/api/itinerary")
    print()
    
    print("サーバー起動中...")
    print("停止するには Ctrl+C を押してください")
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\nサーバーを停止しました")

if __name__ == '__main__':
    main()
