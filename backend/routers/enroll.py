from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime, timezone
from pathlib import Path
import shutil

from config import settings
from database import db
from database.models import EnrollmentRecord
from jobs.job_queue import enqueue_enrollment

router = APIRouter()

ALLOWED_TYPES = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/ogg", "audio/webm",
    "application/octet-stream",  # fallback for some browsers
}


def _normalize_content_type(raw: str | None) -> str:
    """Strip codec params: 'audio/webm;codecs=opus' → 'audio/webm'."""
    if not raw:
        return "application/octet-stream"
    return raw.split(";")[0].strip().lower()


def _guess_ext(content_type: str, filename: str) -> str:
    ext_map = {
        "audio/wav": "wav", "audio/wave": "wav", "audio/x-wav": "wav",
        "audio/mpeg": "mp3", "audio/mp3": "mp3",
        "audio/mp4": "m4a", "audio/m4a": "m4a", "audio/x-m4a": "m4a",
        "audio/ogg": "ogg",
        "audio/webm": "webm",
    }
    if content_type in ext_map:
        return ext_map[content_type]
    suffix = Path(filename).suffix.lstrip(".")
    return suffix or "webm"


@router.post("")
async def enroll_customer(
    customer_id: str = Form(...),
    audio: UploadFile = File(...),
):
    content_type = _normalize_content_type(audio.content_type)
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {audio.content_type}. Use WAV, MP3, M4A, OGG, or WebM.",
        )

    ext = _guess_ext(content_type, audio.filename or "")
    enroll_dir = Path(settings.upload_dir) / "enrollments" / customer_id
    enroll_dir.mkdir(parents=True, exist_ok=True)
    raw_path = str(enroll_dir / f"raw.{ext}")

    with open(raw_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    now = datetime.now(timezone.utc).isoformat()
    record = EnrollmentRecord(
        customer_id=customer_id,
        status="uploaded",
        audio_path=raw_path,
        created_at=now,
        updated_at=now,
    )
    db.save_customer(record)

    await enqueue_enrollment(customer_id, raw_path)

    return {"customer_id": customer_id, "status": "uploaded"}


@router.get("/{customer_id}")
async def get_enrollment(customer_id: str):
    record = db.get_customer(customer_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found")
    return record.model_dump()
