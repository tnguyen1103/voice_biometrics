"""
In-process background job runner.
Uses asyncio + ThreadPoolExecutor since Resemblyzer is CPU-bound (synchronous).
"""
import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from config import settings
from database import db
from database.models import EnrollmentRecord, VerificationSession
from services import audio_service, assemblyai_service, biometric_service, decision_service

_executor = ThreadPoolExecutor(max_workers=4)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _update_enrollment(customer_id: str, **kwargs):
    record = db.get_customer(customer_id)
    if record is None:
        return
    for k, v in kwargs.items():
        setattr(record, k, v)
    record.updated_at = _now()
    db.save_customer(record)


def _update_session(session_id: str, **kwargs):
    session = db.get_session(session_id)
    if session is None:
        return
    for k, v in kwargs.items():
        setattr(session, k, v)
    session.updated_at = _now()
    db.save_session(session)


def _run_enrollment(customer_id: str, raw_audio_path: str):
    """Synchronous enrollment pipeline (runs in thread pool)."""
    enroll_dir = Path(settings.upload_dir) / "enrollments" / customer_id
    enroll_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: normalize audio
        normalized_path = str(enroll_dir / "normalized.wav")
        audio_service.normalize_audio(raw_audio_path, normalized_path)
        _update_enrollment(customer_id, status="processing")

        # Step 2: diarize to find customer speaker label
        transcript = assemblyai_service.transcribe_with_diarization(normalized_path)
        segments_by_speaker = assemblyai_service.get_speaker_segments(transcript)

        # Step 3: identify which speaker is the customer
        if segments_by_speaker:
            customer_label = assemblyai_service.identify_customer_speaker(
                segments_by_speaker, settings.agent_speaks_first
            )
        else:
            # Single speaker enrollment audio — no diarization needed
            customer_label = "A"

        # Step 4: extract customer-only audio
        all_segments = [s for segs in segments_by_speaker.values() for s in segs]
        if all_segments and segments_by_speaker:
            customer_audio_path = str(enroll_dir / "customer_only.wav")
            audio_service.extract_speaker_audio(
                normalized_path, all_segments, customer_label, customer_audio_path
            )
            embedding_source = customer_audio_path
        else:
            # Use full audio if no diarization (enrollment-only recording)
            embedding_source = normalized_path

        # Step 5: generate embedding
        embedding = biometric_service.generate_embedding(embedding_source)
        embedding_path = str(enroll_dir / "embedding.npy")
        biometric_service.save_embedding(embedding, embedding_path)

        _update_enrollment(
            customer_id,
            status="completed",
            embedding_path=embedding_path,
            speaker_label=customer_label,
        )

    except Exception as e:
        _update_enrollment(customer_id, status="failed", error=str(e))
        raise


def _run_verification(session_id: str, customer_id: str, raw_audio_path: str):
    """Synchronous verification pipeline (runs in thread pool)."""
    session_dir = Path(settings.upload_dir) / "calls" / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: normalize audio
        normalized_path = str(session_dir / "normalized.wav")
        audio_service.normalize_audio(raw_audio_path, normalized_path)
        _update_session(session_id, status="transcribing")

        # Step 2: diarize
        transcript = assemblyai_service.transcribe_with_diarization(normalized_path)
        segments_by_speaker = assemblyai_service.get_speaker_segments(transcript)
        all_segments = [s for segs in segments_by_speaker.values() for s in segs]
        _update_session(session_id, status="diarized")

        # Step 3: identify customer speaker
        customer_label = assemblyai_service.identify_customer_speaker(
            segments_by_speaker, settings.agent_speaks_first
        )
        _update_session(session_id, status="speaker_selected", selected_speaker=customer_label)

        # Step 4: extract customer-only audio
        customer_audio_path = str(session_dir / "customer_only.wav")
        audio_service.extract_speaker_audio(
            normalized_path, all_segments, customer_label, customer_audio_path
        )
        customer_speech_seconds = audio_service.get_audio_duration_seconds(customer_audio_path)

        # Step 5: compare voices
        enrollment_record = db.get_customer(customer_id)
        if not enrollment_record or not enrollment_record.embedding_path:
            raise ValueError(f"Customer {customer_id} has no completed enrollment")

        score, _ = biometric_service.compare_voices(
            enrollment_record.embedding_path, customer_audio_path
        )
        _update_session(session_id, status="voice_compared")

        # Step 6: make decision
        customer_segments = segments_by_speaker.get(customer_label, [])
        result = decision_service.make_decision(
            score=score,
            customer_speech_seconds=customer_speech_seconds,
            selected_speaker=f"Speaker {customer_label}",
            transcript_segments=customer_segments,
        )

        _update_session(session_id, status="completed", result=result)

    except Exception as e:
        _update_session(session_id, status="failed", error=str(e))
        raise


async def enqueue_enrollment(customer_id: str, raw_audio_path: str):
    """Submit enrollment job to thread pool."""
    loop = asyncio.get_event_loop()
    loop.run_in_executor(_executor, _run_enrollment, customer_id, raw_audio_path)


async def enqueue_verification(session_id: str, customer_id: str, raw_audio_path: str):
    """Submit verification job to thread pool."""
    loop = asyncio.get_event_loop()
    loop.run_in_executor(_executor, _run_verification, session_id, customer_id, raw_audio_path)
