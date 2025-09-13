from flask import jsonify
from . import api_bp

@api_bp.get("healt")
def healt():
    return jsonify({"Status":"ok"}),200