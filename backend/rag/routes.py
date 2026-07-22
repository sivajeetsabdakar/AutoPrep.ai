from __future__ import annotations

from flask import Blueprint, jsonify, request

from basetoimage import main as extract_image_text

from .service import RagService
from .config import get_config
from .database import get_dashboard_metrics, get_leaderboard
from .submissions import SubmissionError, submit_question

rag_bp = Blueprint("rag", __name__, url_prefix="/rag")


@rag_bp.get("/health")
def health():
    service = RagService()
    return jsonify(
        {
            "status": "ok",
            "databaseConfigured": bool(service.config.database_url),
            "externalChatConfigured": bool(service.config.ai_chat_url and service.config.ai_shared_token),
            "embeddingProvider": service.config.embedding_provider,
            "embeddingModel": service.config.embedding_model,
            "embeddingDimension": service.config.embedding_dimension,
        }
    )


@rag_bp.post("/generate-questions")
def generate_questions():
    data = request.get_json(silent=True) or {}
    exam_type = _clean(data.get("examType"))
    subject = _clean(data.get("subject"))
    image_base64 = data.get("ImageBase64String")
    query_text = (data.get("text") or "").strip()
    limit = _limit(data.get("topK"), default=8)

    if exam_type not in {"jee", "neet"}:
        return jsonify({"error": "examType must be either 'jee' or 'neet'."}), 400
    if not subject:
        return jsonify({"error": "subject is required."}), 400
    if not image_base64 and not query_text:
        return jsonify({"error": "Provide ImageBase64String or text."}), 400

    extracted_text = query_text
    if image_base64:
        extracted_text = extract_image_text(image_base64)

    if not extracted_text.strip():
        return jsonify({"error": "Could not extract searchable text."}), 422

    questions = RagService().retrieve(
        query=extracted_text,
        exam_type=exam_type,
        subject=subject,
        limit=limit,
    )
    return jsonify({"status": "success", "extractedText": extracted_text, "questions": questions})


@rag_bp.post("/studybuddy")
def studybuddy():
    data = request.get_json(silent=True) or {}
    doubt = (data.get("doubt") or data.get("message") or "").strip()
    if not doubt:
        return jsonify({"error": "doubt is required."}), 400

    result = RagService().answer(
        doubt=doubt,
        exam_type=data.get("examType"),
        subject=data.get("subject"),
        history=data.get("messages") or data.get("history") or [],
    )
    return jsonify({"status": "success", **result})


@rag_bp.post("/search")
def search():
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required."}), 400

    questions = RagService().retrieve(
        query=query,
        exam_type=data.get("examType"),
        subject=data.get("subject"),
        limit=_limit(data.get("topK"), default=8),
    )
    return jsonify({"status": "success", "results": questions})


@rag_bp.get("/dashboard-metrics")
def dashboard_metrics():
    return jsonify({"status": "success", "metrics": get_dashboard_metrics(get_config())})


@rag_bp.get("/leaderboard")
def leaderboard():
    return jsonify(
        {
            "status": "success",
            "leaderboard": get_leaderboard(
                get_config(),
                limit=_limit(request.args.get("limit"), default=25),
            ),
        }
    )


@rag_bp.post("/submit-question")
def submit_question_route():
    data = request.get_json(silent=True) or {}
    user = data.get("user") or {}
    image_base64 = data.get("imageBase64") or data.get("ImageBase64String")

    try:
        result = submit_question(
            get_config(),
            image_base64=image_base64,
            user=user,
        )
        http_status = 200 if result["accepted"] else 422
        return jsonify({"status": "success", **result}), http_status
    except SubmissionError as exc:
        return jsonify({"status": "error", "error": str(exc)}), exc.status_code
    except Exception as exc:
        print(f"Question submission failed: {exc}")
        return jsonify({"status": "error", "error": "Failed to process question submission."}), 500


def _clean(value):
    return (value or "").strip().lower()


def _limit(value, default):
    try:
        return max(1, min(int(value), 20))
    except (TypeError, ValueError):
        return default
