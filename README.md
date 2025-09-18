# 📊 Registro de Créditos (Flask + SQLite + Chart.js)
Aplicación web desarrollada en Python (Flask) con SQLite que permite:
- Registrar nuevos créditos.
- Listar, editar y eliminar créditos existentes.
- Filtrar por cliente y rango de fechas.
- Visualizar un dashboard interactivo con:
    - Evolución de todos los créditos otorgados.
    - Distribución de créditos por cliente.
    - Distribución por rangos de monto.

Interfaz construida con HTML + CSS + JavaScript y gráficas con Chart.js.

---

## 🚀 Tecnologías usadas
- Backend: Python 3.12, Flask, Flask-SQLAlchemy, Flask-Migrate
- Base de datos: SQLite
- Frontend: HTML, CSS, JavaScript, Chart.js
- Contenedores: Docker
- Servidor: Gunicorn (modo producción en Docker)

## 🐳 Ejecución con Docker
1. Construir imagen

``` bash
docker build -t registro-creditos .
```

2. Crear carpeta para persistencia en la base de datos
    - Linux 

    ``` bash
    mkdir -p data
    ```

    - Windows

    ``` bash
    mkdir data
    ```

3. Sembrar datos aleatorios de ejemplo (Opcional)

``` bash
docker build -t registro-creditos .
```



