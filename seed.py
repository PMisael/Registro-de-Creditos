from datetime import date, timedelta
import random

from app import create_app
from app.extensions import db
from app.model.credito_entity import Credito


class Seeder:
    def __init__(self, app):
        self.app = app

    def reset_creditos(self):
        """Elimina todos los créditos existentes"""
        Credito.query.delete()
        db.session.commit()
        print("🗑️  Créditos previos eliminados.")

    def generar_creditos(self, n=25):
        """Genera n créditos ficticios y los guarda en la BD"""
        clientes = [
            "Ana Pérez", "Juan López", "María Gómez",
            "Carlos Hernández", "Laura Torres",
            "Pedro Martínez", "Sofía Ramírez"
        ]
        base_date = date(2024, 1, 1)

        for _ in range(n):
            cliente = random.choice(clientes)
            monto = random.randint(2000, 100000)             # entre 2k y 100k
            tasa = round(random.uniform(5, 20), 2)          # entre 5% y 20%
            plazo = random.choice([6, 12, 24, 36])          # meses
            fecha = base_date + timedelta(days=random.randint(0, 600))

            credito = Credito(
                cliente=cliente,
                monto=monto,
                tasa_intereses=tasa,
                plazo=plazo,
                fecha_otorgamiento=fecha.strftime("%Y-%m-%d")
            )
            db.session.add(credito)

        db.session.commit()
        print(f"✅ {n} créditos insertados con éxito.")

    def run(self, n=75, reset=True):
        """Ejecuta la siembra completa"""
        with self.app.app_context():
            if reset:
                self.reset_creditos()
            self.generar_creditos(n)


if __name__ == "__main__":
    app = create_app()
    seeder = Seeder(app)
    seeder.run(n=25, reset=True)