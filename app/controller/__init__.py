from flask import Blueprint

api_bp=Blueprint("api", __name__,url_prefix="/api")

from app.controller import creditos_controller