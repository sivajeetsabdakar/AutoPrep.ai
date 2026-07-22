from __future__ import annotations

import hashlib

import numpy as np
import requests
from sklearn.feature_extraction.text import HashingVectorizer

from .config import RagConfig


class EmbeddingService:
    def __init__(self, config: RagConfig):
        self.config = config
        self._hash_vectorizer = HashingVectorizer(
            n_features=config.embedding_dimension,
            alternate_sign=False,
            norm="l2",
            stop_words="english",
        )
        self._openai_client = None

    def embed(self, text: str, task_type: str | None = None, title: str | None = None) -> list[float]:
        text = (text or "").strip()
        if not text:
            return [0.0] * self.config.embedding_dimension

        if self.config.embedding_provider == "openai":
            return self._embed_openai(text)
        if self.config.embedding_provider == "gemini":
            return self._embed_gemini(text, task_type=task_type, title=title)
        if self.config.embedding_provider in {"sentence-transformers", "sentence_transformers", "local"}:
            return self._embed_sentence_transformers(text)

        return self._embed_hash(text)

    def _embed_openai(self, text: str) -> list[float]:
        if not self.config.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required when RAG_EMBEDDING_PROVIDER=openai.")

        if self._openai_client is None:
            from openai import OpenAI

            self._openai_client = OpenAI(api_key=self.config.openai_api_key)

        response = self._openai_client.embeddings.create(
            model=self.config.embedding_model,
            input=text[:12000],
        )
        return response.data[0].embedding

    def _embed_hash(self, text: str) -> list[float]:
        vector = self._hash_vectorizer.transform([text]).toarray()[0]
        if not np.any(vector):
            digest = hashlib.sha256(text.encode("utf-8")).digest()
            vector[0] = digest[0] / 255
        return vector.astype(float).tolist()

    def _embed_gemini(self, text: str, task_type: str | None = None, title: str | None = None) -> list[float]:
        if not self.config.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when RAG_EMBEDDING_PROVIDER=gemini.")

        model = self.config.embedding_model
        if model.startswith("models/"):
            model = model.removeprefix("models/")

        config = {
            "outputDimensionality": self.config.embedding_dimension,
            "autoTruncate": True,
        }
        if task_type:
            config["taskType"] = task_type
        if title and task_type == "RETRIEVAL_DOCUMENT":
            config["title"] = title

        payload = {
            "model": f"models/{model}",
            "content": {"parts": [{"text": text[:12000]}]},
            "embedContentConfig": config,
            "outputDimensionality": self.config.embedding_dimension,
        }
        if task_type:
            payload["taskType"] = task_type
        if title and task_type == "RETRIEVAL_DOCUMENT":
            payload["title"] = title

        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.config.gemini_api_key,
            },
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        values = response.json().get("embedding", {}).get("values") or []
        if len(values) != self.config.embedding_dimension:
            raise RuntimeError(
                f"Gemini returned {len(values)} dimensions, expected {self.config.embedding_dimension}."
            )
        return [float(value) for value in values]

    def _embed_sentence_transformers(self, text: str) -> list[float]:
        if not hasattr(self, "_sentence_model"):
            from sentence_transformers import SentenceTransformer

            self._sentence_model = SentenceTransformer(self.config.embedding_model)

        vector = self._sentence_model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return np.asarray(vector, dtype=float).tolist()


def vector_to_sql(vector: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in vector) + "]"
