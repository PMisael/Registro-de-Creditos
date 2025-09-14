from flask import request, jsonify
from . import api_bp
from app.service.creditos_service import creditos_service


class creditos_controller:
    #
    @staticmethod
    @api_bp.get("/healt")
    def healt():
        return jsonify({"Status":"ok"}),200
    #
    @staticmethod
    @api_bp.get("/creditos")
    def listar():
        args      = request.args
        page      = max(1,args.get("page", default=1, type=int))
        page_size = max(1,min(args.get("page_size", default=20, type=int), 100))
        #
        return jsonify(creditos_service.listar(
            cliente=args.get("cliente"),
            desde= args.get("desde"),
            hasta=args.get("hasta"),
            page=page,
            page_size=page_size
        )), 200
    #
    @staticmethod
    @api_bp.get("/creditos/<int:credito_id>")
    def detalle(credito_id: int):
        result = creditos_service.obtener(credito_id)
        return result, 200
    #
    @staticmethod
    @api_bp.post("/creditos")
    def crear():
        data=request.get_json(silent=True) or {}
        print(data)
        return jsonify(creditos_service.crear(data)), 201
    #
    @staticmethod
    @api_bp.put("/creditos/<int:credito_id>")
    def editar(credito_id: int):
        data   = request.get_json(silent=True) or {}
        result = creditos_service.editar(credito_id, data)
        return jsonify(result), 200
    #
    @staticmethod
    @api_bp.delete("/creditos/<int:credito_id>")
    def borrar(credito_id: int):
        creditos_service.eliminar(credito_id)
        return "", 204