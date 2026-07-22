from __future__ import annotations

import base64
import json
import re
from binascii import Error as Base64Error

import requests

from .config import RagConfig
from .database import find_duplicate_question, record_question_submission
from .embeddings import EmbeddingService

MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_EXAMS = {"jee", "neet"}
ALLOWED_SUBJECTS = {
    "physics",
    "chemistry",
    "mathematics",
    "biology",
}


class SubmissionError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def submit_question(config: RagConfig, image_base64: str, user: dict) -> dict:
    normalized_image, mime_type, raw_bytes = normalize_image(image_base64)
    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise SubmissionError("Image must be 5MB or smaller.", 413)

    if not user.get("email"):
        raise SubmissionError("Authenticated user email is required.", 400)

    validation = validate_with_gemini(config, normalized_image, mime_type)
    rejection_reason = get_rejection_reason(config, validation)

    embedding = None
    duplicate = None
    if not rejection_reason:
        searchable_text = " ".join(
            [
                validation.get("exam_type", ""),
                validation.get("subject", ""),
                validation.get("chapter") or "",
                validation.get("question_text", ""),
                validation.get("answer", ""),
            ]
        )
        embedding = EmbeddingService(config).embed(
            searchable_text,
            task_type="RETRIEVAL_DOCUMENT",
            title=f"{validation['exam_type'].upper()} {validation['subject']} user submission",
        )
        duplicate = find_duplicate_question(
            config,
            embedding,
            validation["exam_type"],
            validation["subject"],
        )
        if duplicate and float(duplicate.get("score") or 0) >= config.duplicate_score_threshold:
            rejection_reason = "This question appears to already exist in the question bank."
        duplicate = format_duplicate(duplicate)

    status = "rejected" if rejection_reason else "accepted"
    record = record_question_submission(
        config,
        user=user,
        submission={
            "image": normalized_image,
            "status": status,
            "rejection_reason": rejection_reason,
            "validation": {
                **validation,
                "duplicate": duplicate,
            },
            "embedding": embedding,
        },
    )
    return {
        "status": status,
        "accepted": status == "accepted",
        "rejectionReason": rejection_reason,
        "submissionId": record["submission_id"],
        "questionChunkId": record["question_chunk_id"],
        "validation": validation,
        "duplicate": duplicate,
    }


def format_duplicate(duplicate: dict | None) -> dict | None:
    if not duplicate:
        return None
    return {
        "id": duplicate.get("id"),
        "exam_type": duplicate.get("exam_type"),
        "subject": duplicate.get("subject"),
        "chapter": duplicate.get("chapter"),
        "question_text": duplicate.get("question_text"),
        "source": duplicate.get("source"),
        "score": float(duplicate.get("score") or 0),
    }


def normalize_image(image_base64: str) -> tuple[str, str, bytes]:
    if not image_base64:
        raise SubmissionError("imageBase64 is required.")

    value = image_base64.strip()
    mime_type = "image/png"
    if value.startswith("data:"):
        header, _, payload = value.partition(",")
        match = re.match(r"data:(image\/(?:png|jpeg|jpg|webp));base64", header, re.I)
        if not match:
            raise SubmissionError("Only PNG, JPG, JPEG, or WEBP images are supported.")
        mime_type = match.group(1).lower().replace("image/jpg", "image/jpeg")
        value = payload

    try:
        raw_bytes = base64.b64decode(value, validate=True)
    except (Base64Error, ValueError) as exc:
        raise SubmissionError("Invalid base64 image.") from exc

    detected_mime = detect_mime(raw_bytes)
    if not detected_mime:
        raise SubmissionError("Only PNG, JPG, JPEG, or WEBP images are supported.")
    mime_type = detected_mime
    return f"data:{mime_type};base64,{base64.b64encode(raw_bytes).decode('utf-8')}", mime_type, raw_bytes


def detect_mime(raw_bytes: bytes) -> str | None:
    if raw_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if raw_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if raw_bytes.startswith(b"RIFF") and raw_bytes[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_with_gemini(config: RagConfig, image_data_url: str, mime_type: str) -> dict:
    if not config.gemini_api_key:
        raise SubmissionError("GEMINI_API_KEY is required for question validation.", 500)

    image_payload = image_data_url.split(",", 1)[1]
    prompt = """
You validate user-submitted exam question images for AutoPrep.ai.

Return only strict JSON with this shape:
{
  "is_valid": true,
  "exam_type": "jee",
  "subject": "physics",
  "chapter": "optional or null",
  "question_text": "full extracted question text",
  "answer": "extracted final answer or option",
  "confidence": 0.0,
  "reason": "short reason"
}

Rules:
- Accept only JEE or NEET question images.
- The image must contain both a question and its answer.
- exam_type must be "jee" or "neet".
- subject must be physics, chemistry, mathematics, or biology.
- JEE may use physics, chemistry, mathematics.
- NEET may use physics, chemistry, biology.
- Reject notes, theory pages, random images, non-exam content, or answerless questions.
- confidence must be between 0 and 1.
"""
    response = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": config.gemini_api_key,
        },
        json={
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_payload,
                            }
                        },
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 1000,
                "responseMimeType": "application/json",
            },
        },
        timeout=80,
    )
    response.raise_for_status()
    data = response.json()
    text = "".join(
        part.get("text", "")
        for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    ).strip()
    if not text:
        raise SubmissionError("Gemini returned an empty validation response.", 502)
    try:
        validation = json.loads(text)
    except json.JSONDecodeError as exc:
        raise SubmissionError("Gemini returned invalid validation JSON.", 502) from exc
    return clean_validation(validation)


def clean_validation(validation: dict) -> dict:
    exam_type = str(validation.get("exam_type") or "").strip().lower()
    subject = str(validation.get("subject") or "").strip().lower()
    chapter = validation.get("chapter")
    question_text = str(validation.get("question_text") or "").strip()
    answer = str(validation.get("answer") or "").strip()
    reason = str(validation.get("reason") or "").strip()
    try:
        confidence = float(validation.get("confidence") or 0)
    except (TypeError, ValueError):
        confidence = 0.0

    return {
        "is_valid": bool(validation.get("is_valid")),
        "exam_type": exam_type,
        "subject": subject,
        "chapter": str(chapter).strip() if chapter else None,
        "question_text": question_text,
        "answer": answer,
        "confidence": max(0.0, min(confidence, 1.0)),
        "reason": reason,
    }


def get_rejection_reason(config: RagConfig, validation: dict) -> str | None:
    if not validation.get("is_valid"):
        return validation.get("reason") or "Gemini did not classify this as a valid JEE/NEET question with answer."
    if validation.get("confidence", 0) < config.submission_confidence_threshold:
        return "Gemini confidence was too low to accept this question."
    if validation.get("exam_type") not in ALLOWED_EXAMS:
        return "Only JEE and NEET questions are accepted."
    if validation.get("subject") not in ALLOWED_SUBJECTS:
        return "Unsupported subject."
    if validation["exam_type"] == "jee" and validation["subject"] == "biology":
        return "JEE submissions cannot be classified as biology."
    if validation["exam_type"] == "neet" and validation["subject"] == "mathematics":
        return "NEET submissions cannot be classified as mathematics."
    if not validation.get("question_text"):
        return "Gemini could not extract question text."
    if not validation.get("answer"):
        return "Gemini could not extract an answer from the image."
    return None
