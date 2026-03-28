import json
import os
import tempfile
from pathlib import Path
from typing import Optional

from config import settings
from database.models import EnrollmentRecord, VerificationSession

_DB_PATH = Path(settings.data_file)


def _ensure_db_file():
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not _DB_PATH.exists():
        _DB_PATH.write_text(json.dumps({"customers": {}, "sessions": {}}))


def load_db() -> dict:
    _ensure_db_file()
    return json.loads(_DB_PATH.read_text())


def save_db(data: dict):
    _ensure_db_file()
    tmp = _DB_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(_DB_PATH)


def get_customer(customer_id: str) -> Optional[EnrollmentRecord]:
    db = load_db()
    raw = db["customers"].get(customer_id)
    if raw is None:
        return None
    return EnrollmentRecord(**raw)


def save_customer(record: EnrollmentRecord):
    db = load_db()
    db["customers"][record.customer_id] = record.model_dump()
    save_db(db)


def get_session(session_id: str) -> Optional[VerificationSession]:
    db = load_db()
    raw = db["sessions"].get(session_id)
    if raw is None:
        return None
    return VerificationSession(**raw)


def save_session(session: VerificationSession):
    db = load_db()
    db["sessions"][session.session_id] = session.model_dump()
    save_db(db)


def list_sessions() -> list[VerificationSession]:
    db = load_db()
    return [VerificationSession(**v) for v in db["sessions"].values()]


def get_stats() -> dict:
    db = load_db()
    sessions = list(db["sessions"].values())
    from datetime import datetime, date
    today = date.today().isoformat()
    today_sessions = [s for s in sessions if s.get("created_at", "").startswith(today)]
    fraud_count = sum(
        1 for s in sessions
        if s.get("result") and s["result"].get("decision") == "fraud_suspected"
    )
    scores = [
        s["result"]["score"] for s in sessions
        if s.get("result") and s["result"].get("score") is not None
    ]
    avg_score = round(sum(scores) / len(scores), 3) if scores else 0.0
    return {
        "total_enrollments": len(db["customers"]),
        "verifications_today": len(today_sessions),
        "fraud_detected": fraud_count,
        "avg_score": avg_score,
    }
