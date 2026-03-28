"""
Audio preprocessing and speaker segment extraction.

Uses imageio-ffmpeg directly (subprocess) for format conversion so there is
no dependency on a system ffmpeg or pydub's prober detection.
Uses soundfile for all WAV read/write/slice operations.
"""
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

from database.models import SpeakerSegment

TARGET_SAMPLE_RATE = 16000
TARGET_CHANNELS = 1
MIN_SEGMENT_MS = 800  # discard segments shorter than this


def _get_ffmpeg() -> str:
    """Return path to the bundled ffmpeg binary."""
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def normalize_audio(input_path: str, output_path: str) -> str:
    """
    Convert any audio format to 16 kHz mono WAV using ffmpeg directly.
    Normalises loudness to -20 dBFS via ffmpeg's loudnorm filter.
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = _get_ffmpeg()
    result = subprocess.run(
        [
            ffmpeg,
            "-y",                    # overwrite without asking
            "-i", input_path,
            "-ac", str(TARGET_CHANNELS),
            "-ar", str(TARGET_SAMPLE_RATE),
            "-acodec", "pcm_s16le",  # standard 16-bit WAV
            "-af", "loudnorm=I=-20:TP=-2:LRA=11",
            output_path,
        ],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg conversion failed:\n{result.stderr.decode(errors='replace')}"
        )
    return output_path


def extract_speaker_audio(
    audio_path: str,
    segments: list[SpeakerSegment],
    speaker_label: str,
    output_path: str,
) -> str:
    """
    Cut and concatenate all segments for a specific speaker into one WAV.
    Uses soundfile for sample-accurate slicing of normalised WAV files.
    """
    data, sr = sf.read(audio_path, dtype="float32", always_2d=False)
    combined_chunks: list[np.ndarray] = []

    for seg in segments:
        if seg.speaker != speaker_label:
            continue
        seg_len_ms = seg.end_ms - seg.start_ms
        if seg_len_ms < MIN_SEGMENT_MS:
            continue
        start_sample = max(0, int(seg.start_ms / 1000 * sr))
        end_sample   = min(len(data), int(seg.end_ms / 1000 * sr))
        combined_chunks.append(data[start_sample:end_sample])

    if not combined_chunks:
        raise ValueError(
            f"No usable audio found for speaker {speaker_label} "
            f"(all segments below {MIN_SEGMENT_MS}ms or missing)"
        )

    combined = np.concatenate(combined_chunks)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_path, combined, sr, subtype="PCM_16")
    return output_path


def get_audio_duration_seconds(audio_path: str) -> float:
    """Return duration of a WAV file in seconds."""
    info = sf.info(audio_path)
    return info.duration
