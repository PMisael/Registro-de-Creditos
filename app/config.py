from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SQLALCHEMY_DATABASE_URI=os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR/'app.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS=False
    JSON_SORT_KEYS=False
    TMP_KEY=os.getenv("TMP_KEY","pswd-temporal-2025")