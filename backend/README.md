# VoiceGuard — Backend

Python FastAPI backend for SIM swap fraud prevention via voice biometrics.

---

## What It Does

When a customer calls a telecom support line to request a SIM replacement, this backend:

1. Accepts the call recording
2. Separates the agent's voice from the customer's voice using AI speaker diarization
3. Generates a mathematical voiceprint (embedding) of the caller
4. Compares it against the voiceprint registered at account creation
5. Returns a confidence score and a fraud decision

---

## Architecture

```
POST /enroll                     POST /verification/start
      │                                    │
      ▼                                    ▼
 Save audio file              Save call recording
      │                                    │
      └──────────┬─────────────────────────┘
                 │  Background job (ThreadPoolExecutor)
                 ▼
       ┌─────────────────┐
       │  Audio Service  │  ffmpeg via imageio-ffmpeg
       │  normalize_audio│  → 16 kHz mono WAV
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  AssemblyAI     │  speaker_labels=True
       │  Diarization    │  speakers_expected=2
       └────────┬────────┘
                │  "Who spoke when?"
                ▼
       ┌─────────────────┐
       │  Speaker ID     │  Phrase match → heuristic fallback
       │  (Strategy B)   │  → extract customer-only audio
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  ECAPA-TDNN     │  SpeechBrain neural encoder
       │  Embedding      │  192-dim speaker vector
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Cosine         │  enrolled vector · caller vector
       │  Similarity     │  score in range [0, 1]
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Decision       │  score ≥ 0.82 → match
       │  Engine         │  score ≥ 0.65 → uncertain
       └─────────────────┘  score < 0.65 → fraud suspected
```

---

## Tech Stack

### API Layer
| Package | Version | Role |
|---------|---------|------|
| **FastAPI** | 0.115 | REST API framework with async support |
| **uvicorn** | 0.30 | ASGI server with hot-reload |
| **pydantic** | 2.7 | Request/response validation and settings |
| **python-multipart** | 0.0.9 | Multipart form data for audio file uploads |

### Voice Biometrics — Speaker Encoder
| Package | Role |
|---------|------|
| **SpeechBrain 1.0** | Loads and runs the ECAPA-TDNN model |
| **ECAPA-TDNN** (pretrained) | Neural speaker encoder trained on VoxCeleb2 — 1M+ utterances from 6,000+ speakers |
| **PyTorch 2.11 (CPU)** | Tensor computation for neural inference |
| **NumPy** | Cosine similarity computation on embeddings |

**Why ECAPA-TDNN?**
Traditional approaches (MFCC mean/std) capture room acoustics and microphone characteristics as much as the actual voice, causing false matches across recordings. ECAPA-TDNN is trained specifically to ignore recording conditions and focus on the vocal tract shape unique to each person — the geometry of their throat, mouth, and nasal cavity. Two different people saying the same words in the same room will produce embeddings that are far apart in the 192-dimensional space.

### Speaker Diarization
| Package | Role |
|---------|------|
| **AssemblyAI SDK** | Cloud API: transcribes audio and labels who spoke when |

AssemblyAI returns the full transcript with millisecond-level timestamps and speaker labels (`Speaker A`, `Speaker B`). The backend then identifies which speaker is the customer using:
- **Primary:** phrase matching — the customer is prompted to say *"I am the account holder and this is my voice verification"* during enrollment
- **Fallback 1:** agent phrase detection — scripted agent phrases ("how can I help you") identify the agent, leaving the other speaker as the customer
- **Fallback 2:** speaker order — the agent always speaks first, so the second speaker to appear is the customer
- **Fallback 3:** total speech duration — the speaker with more total speech is treated as the customer

### Audio Processing
| Package | Role |
|---------|------|
| **imageio-ffmpeg** | Bundles the ffmpeg binary — no system install required |
| **soundfile** | Sample-accurate WAV read/write and speaker segment slicing |

All uploaded audio (WebM from browser mic, MP3, M4A, WAV) is converted to **16 kHz mono WAV** before any processing. This is the format ECAPA-TDNN was trained on and ensures consistent embeddings regardless of input format.

### Storage & Jobs
| Component | Implementation |
|-----------|---------------|
| **Database** | JSON file (`data/voice_db.json`) — human-readable, zero setup |
| **Background jobs** | `asyncio` + `ThreadPoolExecutor` — keeps the API non-blocking while the pipeline runs |
| **Audio files** | Local filesystem under `uploads/enrollments/` and `uploads/calls/` |
| **Embeddings** | NumPy `.npy` files saved alongside each customer's enrollment |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/enroll` | Upload enrollment voice sample for a customer |
| `GET` | `/enroll/{customer_id}` | Poll enrollment status |
| `POST` | `/verification/start` | Upload call recording and start verification |
| `GET` | `/verification/{session_id}/status` | Poll verification pipeline status |
| `GET` | `/verification/{session_id}/result` | Fetch final decision and score |
| `GET` | `/verification` | List recent verifications |
| `GET` | `/stats` | Dashboard stats (enrollment count, fraud count, avg score) |
| `GET` | `/health` | Health check |

### Pipeline Status Values
```
uploaded → transcribing → diarized → speaker_selected → voice_compared → completed
                                                                       ↘ failed
```

### Decision Output
```json
{
  "score": 0.87,
  "decision": "match",
  "risk_level": "low",
  "recommended_action": "allow_sim_swap",
  "selected_speaker": "Speaker B",
  "customer_speech_seconds": 14.3,
  "notes": "Caller voice matched the enrolled voice above the acceptance threshold...",
  "transcript_segments": [...]
}
```

---

## Setup

### Prerequisites
- Python 3.13
- An AssemblyAI API key (free tier at [assemblyai.com](https://www.assemblyai.com))

### Install
```cmd
pip install -r requirements.txt
pip install audioop-lts        # Python 3.13 backport for audio ops
```

### Configure
Create `backend/.env`:
```env
ASSEMBLYAI_API_KEY=your_key_here
SIMILARITY_THRESHOLD_MATCH=0.82
SIMILARITY_THRESHOLD_UNCERTAIN=0.65
UPLOAD_DIR=./uploads
DATA_FILE=./data/voice_db.json
CORS_ORIGINS=["http://localhost:5173"]
AGENT_SPEAKS_FIRST=true
```

### Run
```cmd
py -m uvicorn main:app --reload
```

API available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

> **First run:** ECAPA-TDNN model files (~87 MB total) are downloaded automatically from HuggingFace and cached in `pretrained_models/ecapa-tdnn/`. Subsequent runs load from cache instantly.

---

## Project Structure

```
backend/
├── main.py                   # FastAPI app, CORS, startup
├── config.py                 # Settings loaded from .env
├── requirements.txt
├── .env.example
│
├── database/
│   ├── db.py                 # JSON file store (load/save/CRUD)
│   └── models.py             # Pydantic models for all data types
│
├── routers/
│   ├── enroll.py             # POST /enroll, GET /enroll/{id}
│   └── verification.py       # POST /verification/start, GET status/result
│
├── services/
│   ├── audio_service.py      # ffmpeg conversion + soundfile slicing
│   ├── assemblyai_service.py # Diarization + speaker identification logic
│   ├── biometric_service.py  # ECAPA-TDNN embedding + cosine similarity
│   └── decision_service.py   # Threshold logic → fraud decision
│
├── jobs/
│   └── job_queue.py          # Async background pipeline runner
│
├── uploads/                  # Runtime audio files (gitignored)
│   ├── enrollments/          # {customer_id}/raw.webm + normalized.wav + embedding.npy
│   └── calls/                # {session_id}/raw.webm + normalized.wav + customer_only.wav
│
├── data/
│   └── voice_db.json         # Live database (gitignored)
│
└── pretrained_models/
    └── ecapa-tdnn/           # Downloaded model weights (gitignored)
```

---

## Thresholds

Configurable via `.env`:

| Score | Decision | Risk | Action |
|-------|----------|------|--------|
| ≥ 0.82 | `match` | Low | Allow SIM swap |
| 0.65 – 0.81 | `uncertain` | Medium | Step-up verification |
| < 0.65 | `fraud_suspected` | High | Freeze account |

If customer speech is under 3 seconds, a `match` is downgraded to `uncertain` due to insufficient sample length.

---

## Notes for Production

This backend is intentionally simplified for demonstration. A production deployment would replace:

| Current | Production equivalent |
|---------|----------------------|
| JSON file store | PostgreSQL / MongoDB |
| In-process ThreadPoolExecutor | Celery + Redis |
| Local file storage | S3 / Azure Blob Storage |
| Fixed thresholds | Per-customer threshold calibration via ROC analysis |
| Single ECAPA-TDNN model | Ensemble with score normalisation and cohort scoring |
