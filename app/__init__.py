from flask import Flask, render_template
import os
from app.config import Config
from app.extensions import db, migrate
from app.controller import api_bp
from app.exceptions.handlers import AppExceptionHandler

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    #
    db.init_app(app)
    migrate.init_app(app,db)
    #
    with app.app_context():
        from app.model import credito_entity
    #
    app.register_blueprint(api_bp)
    AppExceptionHandler.init_app(app)
    #
    @app.get("/")
    def saludo():
        return "API de Creditos (Flask + SQLite)", 200
    #
    @app.get("/app")
    def webapp():
        return render_template("index.html")
    return app