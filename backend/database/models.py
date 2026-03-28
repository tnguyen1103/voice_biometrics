from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class SpeakerSegment(BaseModel):
    speaker: str
    text: str
    start_ms: int
    end_ms: int
    audio_duration_s: float


class VerificationResult(BaseModel):
    score: float
    decision: Literal["match", "uncertain", "fraud_suspected"]
    risk_level: Literal["low", "medium", "high"]
    recommended_action: Literal["allow_sim_swap", "step_up_verification", "freeze_account"]
    selected_speaker: str
    customer_speech_seconds: float
    notes: str
    transcript_segments: list[SpeakerSegment] = []


class EnrollmentRecord(BaseModel):
    customer_id: str
    status: Literal["uploaded", "processing", "completed", "failed"]
    audio_path: str
    embedding_path: Optional[str] = None
    speaker_label: Optional[str] = None
    created_at: str
    updated_at: str
    error: Optional[str] = None


class VerificationSession(BaseModel):
    session_id: str
    customer_id: str
    status: Literal[
        "uploaded", "transcribing", "diarized",
        "speaker_selected", "voice_compared", "completed", "failed"
    ]
    call_audio_path: str
    transcript_id: Optional[str] = None
    selected_speaker: Optional[str] = None
    result: Optional[VerificationResult] = None
    created_at: str
    updated_at: str
    error: Optional[str] = None
