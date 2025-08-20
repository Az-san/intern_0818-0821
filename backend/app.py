"""
ホテルコンシェルジュ向け旅行プラン作成補助APIアプリケーション
メインFlaskアプリケーションファイル
"""

from flask import Flask
from flask_cors import CORS
from routes.api_routes import api_bp

def create_app():
    """Flaskアプリケーションファクトリ"""
    app = Flask(__name__)
    
    # 設定
    app.config['JSON_AS_ASCII'] = False  # 日本語文字化け防止
    # CORS (dev)
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "OPTIONS"],
    )
    
    # APIルートを登録
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)
