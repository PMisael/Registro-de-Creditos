from flask import Flask
from app.config import Config
from app.extensions import db, migrate
from app.controller import api_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app,db)

    with app.app_context():
        from app.model import credito_entity

    app.register_blueprint(api_bp)

    @app.get("/")
    def saludo():
        return "API de Creditos (Flask + SQLite)", 200
    return app