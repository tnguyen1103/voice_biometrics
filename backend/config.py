from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    assemblyai_api_key: str = ""
    similarity_threshold_match: float = 0.82
    similarity_threshold_uncertain: float = 0.65
    upload_dir: str = "./uploads"
    data_file: str = "./data/voice_db.json"
    cors_origins: list[str] = ["http://localhost:5173"]
    agent_speaks_first: bool = True
    max_audio_duration_seconds: int = 300

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


settings = Settings()
