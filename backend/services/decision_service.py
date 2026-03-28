"""Risk decisioning engine: convert similarity score into a fraud decision."""
from config import settings
from database.models import VerificationResult, SpeakerSegment

MIN_SPEECH_FOR_CONFIDENT_MATCH = 3.0  # seconds


def make_decision(
    score: float,
    customer_speech_seconds: float,
    selected_speaker: str,
    transcript_segments: list[SpeakerSegment],
) -> VerificationResult:
    """Apply threshold logic to produce a decision object."""
    score = round(score, 4)

    if score >= settings.similarity_threshold_match:
        decision = "match"
        risk_level = "low"
        action = "allow_sim_swap"
    elif score >= settings.similarity_threshold_uncertain:
        decision = "uncertain"
        risk_level = "medium"
        action = "step_up_verification"
    else:
        decision = "fraud_suspected"
        risk_level = "high"
        action = "freeze_account"

    # Downgrade confident match if customer speech is too short
    if decision == "match" and customer_speech_seconds < MIN_SPEECH_FOR_CONFIDENT_MATCH:
        decision = "uncertain"
        risk_level = "medium"
        action = "step_up_verification"
        notes = (
            f"Voice similarity score ({score:.2f}) exceeded acceptance threshold, "
            f"but customer speech duration ({customer_speech_seconds:.1f}s) is too short "
            f"for a high-confidence decision. Step-up verification recommended."
        )
    elif decision == "match":
        notes = (
            f"Caller voice matched the enrolled voice above the acceptance threshold "
            f"(score {score:.2f}). Identity verified with {customer_speech_seconds:.1f}s of speech."
        )
    elif decision == "uncertain":
        notes = (
            f"Voice similarity score ({score:.2f}) is in the ambiguous range. "
            f"Could not confidently confirm or deny caller identity. "
            f"Additional verification is required before proceeding."
        )
    else:
        notes = (
            f"Voice similarity score ({score:.2f}) is below the mismatch threshold. "
            f"The caller's voice does not match the enrolled SIM owner. "
            f"Possible SIM swap fraud attempt — account has been flagged."
        )

    return VerificationResult(
        score=score,
        decision=decision,
        risk_level=risk_level,
        recommended_action=action,
        selected_speaker=selected_speaker,
        customer_speech_seconds=round(customer_speech_seconds, 2),
        notes=notes,
        transcript_segments=transcript_segments,
    )
