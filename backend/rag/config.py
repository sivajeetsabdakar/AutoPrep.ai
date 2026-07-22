import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RagConfig:
    database_url: str | None
    embedding_provider: str
    embedding_model: str
    embedding_dimension: int
    gemini_api_key: str | None
    openai_api_key: str | None
    chat_model: str
    ai_chat_url: str | None
    ai_shared_token: str | None
    submission_confidence_threshold: float
    duplicate_score_threshold: float
    csv_dir: Path


def get_config() -> RagConfig:
    base_dir = Path(__file__).resolve().parents[1]
    provider = os.getenv("RAG_EMBEDDING_PROVIDER", "sentence-transformers").lower()
    model = os.getenv("RAG_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    dimension = int(os.getenv("RAG_EMBEDDING_DIMENSION", "384"))

    return RagConfig(
        database_url=os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL"),
        embedding_provider=provider,
        embedding_model=model,
        embedding_dimension=dimension,
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        chat_model=os.getenv("RAG_CHAT_MODEL", "gpt-4o-mini"),
        ai_chat_url=os.getenv("AI_CHAT_URL") or os.getenv("AI_URL"),
        ai_shared_token=os.getenv("AI_SHARED_TOKEN"),
        submission_confidence_threshold=float(os.getenv("SUBMISSION_CONFIDENCE_THRESHOLD", "0.7")),
        duplicate_score_threshold=float(os.getenv("DUPLICATE_SCORE_THRESHOLD", "0.92")),
        csv_dir=base_dir / "csvFiles",
    )
