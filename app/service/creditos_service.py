from datetime import datetime
from app.extensions import db
from app.model.credito_entity import Credito
from app.exceptions.errors import ValidationError, NotFoundError

class creditos_service():
    #---- Helper para validar datos ----
    @staticmethod
    def _validate_payload(payload: dict, require_all=True):
        required = ["cliente", "monto", "tasa_intereses", "plazo", "fecha_otorgamiento"]
        errors = {}

        # 1) Campos obligatorios
        if require_all:
            for f in required:
                if f not in payload:
                    errors[f] = "Campo obligatorio"

        # Helper para saber si ya hay error por obligatorio
        def missing_or_empty(name):
            return (name not in payload) or (payload.get(name) is None) or (str(payload.get(name)).strip() == "")

        # 2) cliente
        if not missing_or_empty("cliente"):
            cliente = str(payload.get("cliente")).strip()
            if not cliente:
                errors["cliente"] = "Requerido"

        # 3) monto
        if not missing_or_empty("monto") and "monto" not in errors:
            try:
                monto = float(payload.get("monto"))
                if monto <= 0:
                    errors["monto"] = "Debe ser mayor a 0"
            except Exception:
                errors["monto"] = "Debe ser numérico"

        # 4) tasa_intereses  (OJO: singular)
        if not missing_or_empty("tasa_intereses") and "tasa_intereses" not in errors:
            try:
                tasa = float(payload.get("tasa_intereses"))
                if tasa < 0 or tasa > 100:
                    errors["tasa_intereses"] = "Debe estar entre 0 y 100"
            except Exception:
                errors["tasa_intereses"] = "Debe ser numérico"

        # 5) plazo
        if not missing_or_empty("plazo") and "plazo" not in errors:
            try:
                plazo = int(payload.get("plazo"))
                if plazo <= 0:
                    errors["plazo"] = "Debe ser mayor a 0"
            except Exception:
                errors["plazo"] = "Debe ser entero"

        # 6) fecha_otorgamiento
        if not missing_or_empty("fecha_otorgamiento") and "fecha_otorgamiento" not in errors:
            try:
                datetime.strptime(payload.get("fecha_otorgamiento"), "%Y-%m-%d")
            except Exception:
                errors["fecha_otorgamiento"] = "Formato YYYY-MM-DD"

        if errors:
            raise ValidationError(errors)
    #
    #---- Lógica de negocio ----
    #
    @staticmethod
    def crear(data: dict) -> dict:
        creditos_service._validate_payload(data, require_all=True)
        c = Credito(
            cliente            = data["cliente"].strip(),
            monto              = float(data["monto"]),
            tasa_intereses     = float(data["tasa_intereses"]),
            plazo              = int(data["plazo"]),
            fecha_otorgamiento = data["fecha_otorgamiento"],
        )
        #
        db.session.add(c)
        db.session.commit()
        return c.to_JSON()
    #
    @staticmethod
    def listar(cliente, desde, hasta, page, page_size) -> dict:
        query = Credito.query
        #
        if cliente:
            query = query.filter(Credito.cliente.ilike(f'%{cliente}%'))
        if desde:
            query = query.filter(Credito.fecha_otorgamiento >= desde)
        if hasta:
            query = query.filter(Credito.fecha_otorgamiento <= hasta)
        #
        pagination = query.order_by(Credito.id.asc()).paginate(
            page=page, per_page=page_size, error_out=False
        )
        return{
            "items"     : [c.to_JSON() for c in pagination.items],
            "total"     : pagination.total,
            "page"      : pagination.page,
            "page_size" : pagination.per_page,
        }
    #
    @staticmethod
    def obtener(credito_id: int) -> dict:
        c = Credito.query.get(credito_id)
        if not c:
            raise NotFoundError("Credito no encontrado")
        #
        return c.to_JSON()
    #
    @staticmethod
    def editar(credito_id: int, data: dict) -> dict:
        c = Credito.query.get(credito_id)
        if not c:
            raise NotFoundError("Credito no encontrado")
        #
        creditos_service._validate_payload(data,require_all=True)
        #
        c.cliente            = data["cliente"].strip()
        c.monto              = float(data["monto"])
        c.tasa_intereses     = float(data["tasa_intereses"])
        c.plazo              = int(data["plazo"])
        c.fecha_otorgamiento = data["fecha_otorgamiento"]
        #
        db.session.commit()
        return c.to_JSON()
    #
    @staticmethod
    def eliminar(credito_id: int) -> None:
        c=Credito.query.get(credito_id)
        if not c:
            raise NotFoundError("Credito no encontrado")
        db.session.delete(c)
        db.session.commit()