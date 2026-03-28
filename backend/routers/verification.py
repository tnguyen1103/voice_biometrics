from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from pathlib import Path
import uuid
import shutil

from config import settings
from database import db
from database.models import VerificationSession
from jobs.job_queue import enqueue_verification

router = APIRouter()

ALLOWED_TYPES = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/ogg", "audio/webm",
    "application/octet-stream",
}

_STATUS_TO_STEP = {
    "uploaded": 0,
    "transcribing": 1,
    "diarized": 2,
    "speaker_selected": 3,
    "voice_compared": 4,
    "completed": 5,
    "failed": -1,
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


@router.post("/start")
async def start_verification(
    customer_id: str = Form(...),
    audio: UploadFile = File(...),
):
    # Validate customer is enrolled
    enrollment = db.get_customer(customer_id)
    if enrollment is None:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found. Enroll first.")
    if enrollment.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Customer '{customer_id}' enrollment is not complete (status: {enrollment.status}).",
        )

    content_type = _normalize_content_type(audio.content_type)
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {audio.content_type}")

    session_id = str(uuid.uuid4())
    ext = _guess_ext(content_type, audio.filename or "")
    session_dir = Path(settings.upload_dir) / "calls" / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    raw_path = str(session_dir / f"raw.{ext}")

    with open(raw_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    now = datetime.now(timezone.utc).isoformat()
    session = VerificationSession(
        session_id=session_id,
        customer_id=customer_id,
        status="uploaded",
        call_audio_path=raw_path,
        created_at=now,
        updated_at=now,
    )
    db.save_session(session)

    await enqueue_verification(session_id, customer_id, raw_path)

    return {"session_id": session_id, "customer_id": customer_id, "status": "uploaded"}


@router.get("/{session_id}/status")
async def get_verification_status(session_id: str):
    session = db.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return {
        "session_id": session_id,
        "status": session.status,
        "pipeline_step": _STATUS_TO_STEP.get(session.status, 0),
        "error": session.error,
    }


@router.get("/{session_id}/result")
async def get_verification_result(session_id: str):
    session = db.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    if session.status not in ("completed", "failed"):
        return JSONResponse(status_code=202, content={
            "session_id": session_id,
            "status": session.status,
            "message": "Verification still in progress",
            "pipeline_step": _STATUS_TO_STEP.get(session.status, 0),
        })
    return session.model_dump()


@router.get("")
async def list_verifications():
    sessions = db.list_sessions()
    result = []
    for s in sorted(sessions, key=lambda x: x.created_at, reverse=True)[:50]:
        result.append({
            "session_id": s.session_id,
            "customer_id": s.customer_id,
            "status": s.status,
            "created_at": s.created_at,
            "decision": s.result.decision if s.result else None,
            "score": s.result.score if s.result else None,
        })
    return result
