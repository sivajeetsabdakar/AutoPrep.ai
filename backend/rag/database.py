from __future__ import annotations

from contextlib import contextmanager
from typing import Iterable
import json

from .config import RagConfig
from .embeddings import vector_to_sql


@contextmanager
def get_connection(config: RagConfig):
    if not config.database_url:
        yield None
        return

    import psycopg

    conn = psycopg.connect(config.database_url)
    try:
        yield conn
    finally:
        conn.close()


def search_pgvector(config: RagConfig, query_embedding: list[float], filters: dict, limit: int) -> list[dict]:
    if not config.database_url:
        return []

    clauses = []
    params: list[object] = []
    if filters.get("exam_type"):
        clauses.append("exam_type = %s")
        params.append(filters["exam_type"])
    if filters.get("subject"):
        clauses.append("subject = %s")
        params.append(filters["subject"])

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
            id,
            exam_type,
            subject,
            chapter,
            question_text,
            answer,
            image,
            source,
            1 - (embedding <=> %s::vector) AS score
        FROM question_chunks
        {where_sql}
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """
    embedding_sql = vector_to_sql(query_embedding)
    all_params = [embedding_sql, *params, embedding_sql, limit]

    with get_connection(config) as conn:
        if conn is None:
            return []
        with conn.cursor() as cur:
            cur.execute(sql, all_params)
            columns = [desc.name for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]


def insert_question_chunks(config: RagConfig, rows: Iterable[dict]) -> int:
    if not config.database_url:
        raise RuntimeError("DATABASE_URL or NEON_DATABASE_URL is required for ingestion.")

    insert_sql = """
        INSERT INTO question_chunks (
            external_id,
            exam_type,
            subject,
            chapter,
            question_text,
            answer,
            image,
            source,
            embedding
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
        ON CONFLICT (external_id) DO UPDATE SET
            exam_type = EXCLUDED.exam_type,
            subject = EXCLUDED.subject,
            chapter = EXCLUDED.chapter,
            question_text = EXCLUDED.question_text,
            answer = EXCLUDED.answer,
            image = EXCLUDED.image,
            source = EXCLUDED.source,
            embedding = EXCLUDED.embedding,
            updated_at = now()
    """

    count = 0
    with get_connection(config) as conn:
        if conn is None:
            return 0
        with conn.cursor() as cur:
            for row in rows:
                cur.execute(
                    insert_sql,
                    (
                        row["external_id"],
                        row["exam_type"],
                        row["subject"],
                        row.get("chapter"),
                        row["question_text"],
                        row.get("answer"),
                        row.get("image"),
                        row["source"],
                        vector_to_sql(row["embedding"]),
                    ),
                )
                count += 1
        conn.commit()
    return count


def find_duplicate_question(config: RagConfig, embedding: list[float], exam_type: str, subject: str, limit: int = 1) -> dict | None:
    results = search_pgvector(
        config,
        embedding,
        {"exam_type": exam_type, "subject": subject},
        limit,
    )
    return results[0] if results else None


def record_question_submission(config: RagConfig, user: dict, submission: dict) -> dict:
    if not config.database_url:
        raise RuntimeError("DATABASE_URL or NEON_DATABASE_URL is required for submissions.")

    upsert_user_sql = """
        INSERT INTO users (provider, provider_user_id, email, name, image)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE SET
            provider_user_id = COALESCE(EXCLUDED.provider_user_id, users.provider_user_id),
            name = COALESCE(EXCLUDED.name, users.name),
            image = COALESCE(EXCLUDED.image, users.image),
            updated_at = now()
        RETURNING id
    """
    insert_submission_sql = """
        INSERT INTO question_submissions (
            user_id,
            image,
            status,
            rejection_reason,
            validation
        )
        VALUES (%s, %s, %s, %s, %s::jsonb)
        RETURNING id
    """
    update_submission_sql = """
        UPDATE question_submissions
        SET question_chunk_id = %s, updated_at = now()
        WHERE id = %s
    """
    insert_chunk_sql = """
        INSERT INTO question_chunks (
            external_id,
            exam_type,
            subject,
            chapter,
            question_text,
            answer,
            image,
            source,
            embedding
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'user_submission', %s::vector)
        ON CONFLICT (external_id) DO UPDATE SET
            exam_type = EXCLUDED.exam_type,
            subject = EXCLUDED.subject,
            chapter = EXCLUDED.chapter,
            question_text = EXCLUDED.question_text,
            answer = EXCLUDED.answer,
            image = EXCLUDED.image,
            source = EXCLUDED.source,
            embedding = EXCLUDED.embedding,
            updated_at = now()
        RETURNING id
    """

    with get_connection(config) as conn:
        if conn is None:
            raise RuntimeError("Database connection is not configured.")
        with conn.cursor() as cur:
            cur.execute(
                upsert_user_sql,
                (
                    user.get("provider") or "google",
                    user.get("id"),
                    user["email"],
                    user.get("name"),
                    user.get("image"),
                ),
            )
            user_id = cur.fetchone()[0]
            cur.execute(
                insert_submission_sql,
                (
                    user_id,
                    submission["image"],
                    submission["status"],
                    submission.get("rejection_reason"),
                    json.dumps(submission["validation"]),
                ),
            )
            submission_id = cur.fetchone()[0]
            chunk_id = None

            if submission["status"] == "accepted":
                cur.execute(
                    insert_chunk_sql,
                    (
                        f"submission:{submission_id}",
                        submission["validation"]["exam_type"],
                        submission["validation"]["subject"],
                        submission["validation"].get("chapter"),
                        submission["validation"]["question_text"],
                        submission["validation"]["answer"],
                        submission["image"],
                        vector_to_sql(submission["embedding"]),
                    ),
                )
                chunk_id = cur.fetchone()[0]
                cur.execute(update_submission_sql, (chunk_id, submission_id))

        conn.commit()

    return {
        "submission_id": submission_id,
        "question_chunk_id": chunk_id,
        "user_id": user_id,
    }


def get_dashboard_metrics(config: RagConfig) -> dict:
    if not config.database_url:
        return {
            "questionCount": 0,
            "acceptedSubmissionCount": 0,
            "rejectedSubmissionCount": 0,
            "contributorCount": 0,
            "subjectBreakdown": [],
            "examBreakdown": [],
            "weeklyIngest": [],
            "recentActivity": [],
        }

    with get_connection(config) as conn:
        if conn is None:
            return {}
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM question_chunks")
            question_count = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM question_submissions WHERE status = 'accepted'")
            accepted_submission_count = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM question_submissions WHERE status = 'rejected'")
            rejected_submission_count = cur.fetchone()[0]

            cur.execute("SELECT count(*) FROM users")
            contributor_count = cur.fetchone()[0]

            cur.execute(
                """
                SELECT subject, count(*) AS total
                FROM question_chunks
                GROUP BY subject
                ORDER BY total DESC, subject ASC
                """
            )
            subject_breakdown = [{"subject": row[0], "total": row[1]} for row in cur.fetchall()]

            cur.execute(
                """
                SELECT exam_type, count(*) AS total
                FROM question_chunks
                GROUP BY exam_type
                ORDER BY exam_type ASC
                """
            )
            exam_breakdown = [{"examType": row[0], "total": row[1]} for row in cur.fetchall()]

            cur.execute(
                """
                WITH days AS (
                    SELECT generate_series(current_date - interval '6 days', current_date, interval '1 day')::date AS day
                )
                SELECT days.day, count(question_chunks.id) AS total
                FROM days
                LEFT JOIN question_chunks ON question_chunks.created_at::date = days.day
                GROUP BY days.day
                ORDER BY days.day ASC
                """
            )
            weekly_ingest = [{"date": row[0].strftime("%d %b"), "items": row[1]} for row in cur.fetchall()]

            cur.execute(
                """
                SELECT label, detail, created_at
                FROM (
                    SELECT
                        'Accepted question submission' AS label,
                        upper((validation->>'exam_type')) || ' ' || initcap(validation->>'subject') AS detail,
                        created_at
                    FROM question_submissions
                    WHERE status = 'accepted'
                    UNION ALL
                    SELECT
                        'Rejected question submission' AS label,
                        COALESCE(rejection_reason, 'Validation rejected') AS detail,
                        created_at
                    FROM question_submissions
                    WHERE status = 'rejected'
                    UNION ALL
                    SELECT
                        'Question indexed' AS label,
                        upper(exam_type) || ' ' || initcap(subject) || COALESCE(' - ' || chapter, '') AS detail,
                        created_at
                    FROM question_chunks
                ) activity
                ORDER BY created_at DESC
                LIMIT 8
                """
            )
            recent_activity = [
                {
                    "action": row[0],
                    "detail": row[1],
                    "time": row[2].isoformat(),
                }
                for row in cur.fetchall()
            ]

    return {
        "questionCount": question_count,
        "acceptedSubmissionCount": accepted_submission_count,
        "rejectedSubmissionCount": rejected_submission_count,
        "contributorCount": contributor_count,
        "subjectBreakdown": subject_breakdown,
        "examBreakdown": exam_breakdown,
        "weeklyIngest": weekly_ingest,
        "recentActivity": recent_activity,
    }


def get_leaderboard(config: RagConfig, limit: int = 25) -> dict:
    if not config.database_url:
        return {"entries": [], "summary": {"contributors": 0, "acceptedSubmissions": 0}}

    with get_connection(config) as conn:
        if conn is None:
            return {"entries": [], "summary": {"contributors": 0, "acceptedSubmissions": 0}}
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    users.id,
                    users.name,
                    users.email,
                    users.image,
                    count(question_submissions.id) AS total_submissions,
                    count(question_submissions.id) FILTER (WHERE question_submissions.status = 'accepted') AS accepted_submissions,
                    count(question_submissions.id) FILTER (WHERE question_submissions.status = 'rejected') AS rejected_submissions,
                    max(question_submissions.created_at) AS latest_activity
                FROM users
                LEFT JOIN question_submissions ON question_submissions.user_id = users.id
                GROUP BY users.id
                HAVING count(question_submissions.id) > 0
                ORDER BY accepted_submissions DESC, total_submissions DESC, latest_activity DESC NULLS LAST
                LIMIT %s
                """,
                (max(1, min(int(limit), 100)),),
            )
            rows = cur.fetchall()

            cur.execute(
                """
                SELECT
                    count(DISTINCT user_id) AS contributors,
                    count(id) FILTER (WHERE status = 'accepted') AS accepted_submissions
                FROM question_submissions
                """
            )
            summary_row = cur.fetchone()

    entries = []
    for rank, row in enumerate(rows, start=1):
        user_id, name, email, image, total, accepted, rejected, latest_activity = row
        display_name = name or (email.split("@")[0] if email else "Contributor")
        accepted = int(accepted or 0)
        total = int(total or 0)
        rejected = int(rejected or 0)
        entries.append(
            {
                "rank": rank,
                "userId": str(user_id),
                "name": display_name,
                "avatar": image,
                "points": accepted * 100,
                "acceptedSubmissions": accepted,
                "rejectedSubmissions": rejected,
                "totalSubmissions": total,
                "latestActivity": latest_activity.isoformat() if latest_activity else None,
                "badge": _leaderboard_badge(rank, accepted),
            }
        )

    return {
        "entries": entries,
        "summary": {
            "contributors": int(summary_row[0] or 0),
            "acceptedSubmissions": int(summary_row[1] or 0),
        },
    }


def _leaderboard_badge(rank: int, accepted_count: int) -> str:
    if rank == 1 and accepted_count > 0:
        return "Top contributor"
    if rank <= 3 and accepted_count > 0:
        return "Core contributor"
    if accepted_count > 0:
        return "Verified contributor"
    return "New contributor"
