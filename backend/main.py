from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.enroll import router as enroll_router
from routers.verification import router as verification_router
from database import db as database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB file and upload dirs exist on startup
    database.load_db()
    from pathlib import Path
    Path(settings.upload_dir + "/enrollments").mkdir(parents=True, exist_ok=True)
    Path(settings.upload_dir + "/calls").mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="VoiceGuard API",
    description="SIM swap fraud prevention via voice biometrics",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enroll_router, prefix="/enroll", tags=["Enrollment"])
app.include_router(verification_router, prefix="/verification", tags=["Verification"])


@app.get("/stats")
async def get_stats():
    return database.get_stats()


@app.get("/health")
async def health():
    return {"status": "ok"}
