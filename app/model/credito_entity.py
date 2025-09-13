from app.extensions import db

class Credito(db.Model):
    __tablename__='creditos'

    id                 = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cliente            = db.Column(db.String(120), nullable=False)
    monto              = db.Column(db.Float, nullable=False)
    tasa_intereses     = db.Column(db.Float, nullable=False)
    plazo              = db.Column(db.Integer, nullable=False)
    fecha_otorgamiento = db.Column(db.String(10), nullable=False)

    def to_JSON(self):
        return {
            "id": self.id,
            "cliente": self.cliente,
            "monto": self.monto,
            "tasa_intereses": self.tasa_intereses,
            "plazo": self.plazo,
            "fecha_otorgamiento": self.fecha_otorgamiento,
        }