"""
Voice biometric embedding using SpeechBrain ECAPA-TDNN speaker encoder.

Pre-trained on VoxCeleb2 (1M+ utterances, 6000+ speakers).
Produces 192-dim speaker embeddings that cleanly separate different voices
regardless of recording conditions, language, or content.

First run downloads the model (~80 MB) to pretrained_models/.
"""
from __future__ import annotations
import numpy as np
import torch
import torchaudio
from pathlib import Path

# torchaudio 2.x removed list_audio_backends() but SpeechBrain still calls it.
if not hasattr(torchaudio, "list_audio_backends"):
    torchaudio.list_audio_backends = lambda: ["soundfile"]

# huggingface_hub removed use_auth_token in favour of token.
# SpeechBrain 1.0+ also looks for custom.py which old model repos don't have.
# Both issues patched here.
import huggingface_hub as _hf
_real_hf_download = _hf.hf_hub_download

def _patched_hf_download(*args, **kwargs):
    # Fix 1: rename deprecated use_auth_token → token
    if "use_auth_token" in kwargs:
        kwargs["token"] = kwargs.pop("use_auth_token")
    # Fix 2: if custom.py is missing from the repo (404), create an empty stub
    filename = kwargs.get("filename", args[1] if len(args) > 1 else "")
    try:
        return _real_hf_download(*args, **kwargs)
    except Exception as e:
        if "custom.py" in str(filename) and ("404" in str(e) or "EntryNotFound" in type(e).__name__):
            stub = Path(_MODEL_SAVE_DIR) / "custom.py"
            stub.parent.mkdir(parents=True, exist_ok=True)
            stub.write_text("# stub — model has no custom module\n")
            return str(stub)
        raise

_hf.hf_hub_download = _patched_hf_download

TARGET_SR = 16000
_MODEL_SAVE_DIR = str(Path(__file__).parent.parent / "pretrained_models" / "ecapa-tdnn")
_encoder = None


def get_encoder():
    """Load (or return cached) ECAPA-TDNN encoder."""
    global _encoder
    if _encoder is None:
        from speechbrain.inference.speaker import EncoderClassifier
        from speechbrain.utils.fetching import LocalStrategy
        _encoder = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir=_MODEL_SAVE_DIR,
            run_opts={"device": "cpu"},
            local_strategy=LocalStrategy.COPY,  # avoids symlinks (requires admin on Windows)
        )
    return _encoder


def _load_waveform(audio_path: str) -> torch.Tensor:
    """Load audio as a (1, N) float32 tensor resampled to TARGET_SR.
    Uses soundfile instead of torchaudio.load() — torchaudio 2.11 removed
    its legacy backends and now requires torchcodec which isn't available.
    """
    import soundfile as sf
    data, fs = sf.read(audio_path, dtype="float32", always_2d=True)
    # soundfile returns (samples, channels) → transpose to (channels, samples)
    signal = torch.from_numpy(data.T)
    if fs != TARGET_SR:
        signal = torchaudio.functional.resample(signal, fs, TARGET_SR)
    if signal.shape[0] > 1:          # stereo → mono
        signal = signal.mean(dim=0, keepdim=True)
    return signal


def generate_embedding(audio_path: str) -> np.ndarray:
    """Return a 192-dim L2-normalised speaker embedding."""
    encoder = get_encoder()
    signal  = _load_waveform(audio_path)

    with torch.no_grad():
        emb = encoder.encode_batch(signal)   # (1, 1, 192)

    vec  = emb.squeeze().numpy().astype(np.float32)
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


def save_embedding(embedding: np.ndarray, output_path: str) -> str:
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    np.save(output_path, embedding)
    return output_path


def load_embedding(embedding_path: str) -> np.ndarray:
    return np.load(embedding_path)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def compare_voices(
    enrollment_embedding_path: str,
    verification_audio_path: str,
) -> tuple[float, np.ndarray]:
    enrolled     = load_embedding(enrollment_embedding_path)
    verification = generate_embedding(verification_audio_path)
    if enrolled.shape != verification.shape:
        raise ValueError(
            f"Embedding dimension mismatch ({enrolled.shape[0]} vs "
            f"{verification.shape[0]}). Re-enroll the customer."
        )
    score = cosine_similarity(enrolled, verification)
    return score, verification
