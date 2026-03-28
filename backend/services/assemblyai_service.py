"""AssemblyAI speaker diarization integration."""
import assemblyai as aai
from config import settings
from database.models import SpeakerSegment

# Trigger phrases the customer is instructed to say during enrollment/verification
CUSTOMER_TRIGGER_PHRASES = [
    "i am the account holder",
    "this is my voice verification",
    "account holder",
    "voice verification",
]

# Agent phrases that identify the agent speaker
AGENT_PHRASES = [
    "how can i help",
    "how can i assist",
    "can you verify",
    "please confirm",
    "thank you for calling",
    "welcome to",
    "this is",
]


def _get_client() -> aai.Transcriber:
    aai.settings.api_key = settings.assemblyai_api_key
    return aai.Transcriber()


def transcribe_with_diarization(audio_path: str) -> aai.Transcript:
    """Upload audio to AssemblyAI and return transcript with speaker diarization."""
    transcriber = _get_client()
    config = aai.TranscriptionConfig(
        speaker_labels=True,
        speakers_expected=2,
    )
    transcript = transcriber.transcribe(audio_path, config=config)
    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"AssemblyAI transcription failed: {transcript.error}")
    return transcript


def get_speaker_segments(transcript: aai.Transcript) -> dict[str, list[SpeakerSegment]]:
    """Group utterances by speaker label and return as SpeakerSegment lists."""
    segments_by_speaker: dict[str, list[SpeakerSegment]] = {}
    if not transcript.utterances:
        return segments_by_speaker
    for utt in transcript.utterances:
        speaker = utt.speaker or "Unknown"
        duration_s = (utt.end - utt.start) / 1000.0
        seg = SpeakerSegment(
            speaker=speaker,
            text=utt.text or "",
            start_ms=utt.start,
            end_ms=utt.end,
            audio_duration_s=duration_s,
        )
        segments_by_speaker.setdefault(speaker, []).append(seg)
    return segments_by_speaker


def identify_customer_speaker(
    segments_by_speaker: dict[str, list[SpeakerSegment]],
    agent_speaks_first: bool = True,
) -> str:
    """
    Identify which diarized speaker is the customer using Strategy B
    (phrase detection) with fallback heuristics.
    """
    speakers = list(segments_by_speaker.keys())
    if not speakers:
        raise ValueError("No speakers found in diarization output")
    if len(speakers) == 1:
        return speakers[0]

    # Strategy B: Look for customer trigger phrases
    for speaker, segs in segments_by_speaker.items():
        full_text = " ".join(s.text.lower() for s in segs)
        if any(phrase in full_text for phrase in CUSTOMER_TRIGGER_PHRASES):
            return speaker

    # Fallback A: identify agent by their scripted phrases, return the other
    agent_speaker = None
    for speaker, segs in segments_by_speaker.items():
        full_text = " ".join(s.text.lower() for s in segs)
        if any(phrase in full_text for phrase in AGENT_PHRASES):
            agent_speaker = speaker
            break

    if agent_speaker:
        others = [s for s in speakers if s != agent_speaker]
        if others:
            return others[0]

    # Fallback B: if agent typically speaks first, the second distinct speaker is the customer
    if agent_speaks_first and len(speakers) >= 2:
        # Find the speaker of the second utterance overall
        all_segs = [
            (s.start_ms, speaker)
            for speaker, segs in segments_by_speaker.items()
            for s in segs
        ]
        all_segs.sort()
        seen = []
        for _, sp in all_segs:
            if sp not in seen:
                seen.append(sp)
            if len(seen) == 2:
                return seen[1]

    # Fallback C: speaker with the most total speech
    totals = {
        sp: sum(s.audio_duration_s for s in segs)
        for sp, segs in segments_by_speaker.items()
    }
    return max(totals, key=totals.__getitem__)
