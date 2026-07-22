from __future__ import annotations

import requests

from .config import RagConfig, get_config
from .csv_fallback import search_csv
from .database import search_pgvector
from .embeddings import EmbeddingService


class RagService:
    def __init__(self, config: RagConfig | None = None):
        self.config = config or get_config()
        self.embeddings = EmbeddingService(self.config)

    def retrieve(self, query: str, exam_type: str | None = None, subject: str | None = None, limit: int = 8) -> list[dict]:
        filters = {
            "exam_type": _clean(exam_type),
            "subject": _clean(subject),
        }
        rows = []
        try:
            query_embedding = self.embeddings.embed(query, task_type="RETRIEVAL_QUERY")
            rows = search_pgvector(self.config, query_embedding, filters, limit)
        except Exception as exc:
            print(f"RAG vector retrieval failed, falling back to CSV: {exc}")

        if rows:
            return [self._format_question(row) for row in rows]

        fallback_rows = search_csv(
            csv_dir=self.config.csv_dir,
            query=query,
            exam_type=filters["exam_type"],
            subject=filters["subject"],
            limit=limit,
        )
        return [self._format_question(row) for row in fallback_rows]

    def answer(
        self,
        doubt: str,
        exam_type: str | None = None,
        subject: str | None = None,
        history: list[dict] | None = None,
    ) -> dict:
        sources = self.retrieve(doubt, exam_type=exam_type, subject=subject, limit=5)
        if self.config.ai_chat_url and self.config.ai_shared_token:
            reply = self._answer_with_external_ai(doubt, sources, history=history)
        elif self.config.openai_api_key and self.config.embedding_provider == "openai":
            reply = self._answer_with_openai(doubt, sources, history=history)
        else:
            reply = self._answer_without_llm(doubt, sources)
        return {"reply": reply, "sources": sources}

    def _answer_with_external_ai(self, doubt: str, sources: list[dict], history: list[dict] | None = None) -> str:
        prompt = self._build_studybuddy_prompt(doubt, sources, history=history)
        url = self.config.ai_chat_url.rstrip("/") + "/ask"
        try:
            response = requests.post(
                url,
                headers={"X-AI-Token": self.config.ai_shared_token},
                json={
                    "prompt": prompt,
                    "temperature": 0.35,
                    "max_output_tokens": 700,
                },
                timeout=70,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            fallback = self._answer_without_llm(doubt, sources)
            return f"{fallback}\n\nThe configured chat API could not be reached: {exc}"

        data = response.json()
        return data.get("response") or data.get("reply") or self._answer_without_llm(doubt, sources)

    def _answer_with_openai(self, doubt: str, sources: list[dict], history: list[dict] | None = None) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=self.config.openai_api_key)
        response = client.chat.completions.create(
            model=self.config.chat_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are StudyBuddy for JEE/NEET students. Answer using the retrieved context when it is relevant. "
                        "Be concise, explain the concept, and suggest practice from the sources. "
                        "If context is weak, say what is missing before giving general guidance."
                    ),
                },
                {"role": "user", "content": self._build_studybuddy_prompt(doubt, sources, history=history)},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content or ""

    def _build_studybuddy_prompt(self, doubt: str, sources: list[dict], history: list[dict] | None = None) -> str:
        context = "\n\n".join(
            f"Source {index + 1}: [{item.get('examType')} {item.get('subject')}] "
            f"{item.get('text') or 'Question image available'}\n"
            f"Answer: {item.get('ans') or 'Not available'}\n"
            f"Chapter: {item.get('chapter') or 'Unknown'}"
            for index, item in enumerate(sources)
        )
        conversation = _format_history(history)
        return (
            "SYSTEM PROMPT:\n"
            "You are StudyBuddy, AutoPrep.ai's focused AI tutor for Indian JEE and NEET aspirants. "
            "Act like a patient, rigorous coach: first understand the student's doubt, then teach the smallest "
            "useful concept, then solve or guide step by step. Use simple language, equations when helpful, and "
            "exam-relevant shortcuts only after the core idea is clear. Keep answers concise unless the student asks "
            "for a full derivation. If the student asks a follow-up, use the previous conversation naturally. "
            "Use retrieved RAG context when it is relevant, especially stored questions, answers, chapters, and hints. "
            "If the RAG context is weak or unrelated, say that briefly and answer from general knowledge. "
            "Never invent that a question exists in the question bank if it is not in the retrieved context. "
            "For unsafe, cheating, or non-study requests, refuse briefly and redirect to learning.\n\n"
            f"RECENT CONVERSATION:\n{conversation or 'No previous turns in this chat.'}\n\n"
            f"CURRENT STUDENT MESSAGE:\n{doubt}\n\n"
            f"RETRIEVED RAG CONTEXT:\n{context or 'No matching sources found.'}\n\n"
            "RESPONSE FORMAT:\n"
            "- Start with the direct answer or key idea.\n"
            "- Then explain in clear steps.\n"
            "- End with a small practice tip or what the student should ask next when useful."
        )

    def _answer_without_llm(self, doubt: str, sources: list[dict]) -> str:
        if not sources:
            return "I could not find matching material in the question bank yet. Try adding the exam and subject, or ingest the Neon vector index."

        top = sources[0]
        subject = top.get("subject", "the selected subject")
        reply = [
            f"I found related {subject} practice material from the question bank.",
            f"Most relevant match: {top.get('text') or 'question image available'}",
        ]
        if top.get("ans"):
            reply.append(f"Stored answer: {top['ans']}")
        reply.append("Configure AI_CHAT_URL and AI_SHARED_TOKEN to turn this retrieved context into a full generated explanation.")
        return "\n\n".join(reply)

    def _format_question(self, row: dict) -> dict:
        return {
            "id": row.get("id"),
            "examType": row.get("exam_type"),
            "subject": row.get("subject"),
            "chapter": row.get("chapter"),
            "text": row.get("question_text") or "",
            "question": row.get("question_text") or "",
            "ans": row.get("answer") or "",
            "image": row.get("image") or "",
            "hint": _build_hint(row),
            "score": row.get("score"),
            "source": row.get("source"),
        }


def _clean(value: str | None) -> str | None:
    value = (value or "").strip().lower()
    return value or None


def _format_history(history: list[dict] | None) -> str:
    if not history:
        return ""

    turns = []
    for item in history[-10:]:
        role = _clean(item.get("role")) if isinstance(item, dict) else None
        content = (item.get("content") or "").strip() if isinstance(item, dict) else ""
        if role not in {"user", "assistant"} or not content:
            continue
        label = "Student" if role == "user" else "StudyBuddy"
        turns.append(f"{label}: {content[:1500]}")
    return "\n\n".join(turns)


def _build_hint(row: dict) -> str:
    chapter = row.get("chapter")
    subject = row.get("subject")
    if chapter:
        return f"Review {chapter} and compare the given conditions with this question."
    if subject:
        return f"Identify the core {subject} concept and eliminate options that contradict it."
    return "Focus on the definitions and givens that overlap with your uploaded content."
