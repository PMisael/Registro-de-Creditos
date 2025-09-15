# Dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Flask config
    FLASK_APP=run.py \
    FLASK_ENV=production

WORKDIR /app

# Dependencias del sistema (si hiciera falta)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Instala dependencias Python
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copia el proyecto
COPY . .

# Crea el directorio para la base (se monta como volumen)
RUN mkdir -p /data

# Entrypoint: aplica migraciones y arranca
# gunicorn buscará 'app' dentro de run.py -> app = create_app()
CMD flask db upgrade && gunicorn -b 0.0.0.0:5000 "run:app"

EXPOSE 5000