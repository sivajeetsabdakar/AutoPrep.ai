from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


CSV_SOURCES = {
    ("jee", "physics"): ("Jp.csv", "question", "image"),
    ("jee", "chemistry"): ("Jc.csv", "question", "image"),
    ("jee", "mathematics"): ("Final_Maths_Jee.csv", "chapter", "questionImage"),
    ("neet", "physics"): ("Np.csv", "question", "image"),
    ("neet", "chemistry"): ("Nc.csv", "question", "image"),
    ("neet", "biology"): ("Nb.csv", "question", "image"),
}


@lru_cache(maxsize=16)
def _load_rows(csv_dir: str, exam_type: str, subject: str) -> list[dict]:
    source = CSV_SOURCES.get((exam_type, subject))
    if not source:
        return []

    filename, text_column, image_column = source
    path = Path(csv_dir) / filename
    if not path.exists():
        return []

    df = pd.read_csv(path)
    rows = []
    for index, row in df.iterrows():
        question_text = str(row.get(text_column) or row.get("question") or row.get("chapter") or "").strip()
        answer = str(row.get("ans") or row.get("solution") or "").strip()
        image = str(row.get(image_column) or row.get("image") or row.get("questionImage") or "").strip()
        chapter = str(row.get("chapter") or "").strip() or None
        if not question_text and not image:
            continue
        rows.append(
            {
                "id": f"{filename}:{index}",
                "exam_type": exam_type,
                "subject": subject,
                "chapter": chapter,
                "question_text": question_text,
                "answer": answer,
                "image": image,
                "source": filename,
            }
        )
    return rows


def search_csv(csv_dir: Path, query: str, exam_type: str | None, subject: str | None, limit: int) -> list[dict]:
    pairs = [
        key for key in CSV_SOURCES
        if (not exam_type or key[0] == exam_type) and (not subject or key[1] == subject)
    ]
    rows = []
    for pair_exam, pair_subject in pairs:
        rows.extend(_load_rows(str(csv_dir), pair_exam, pair_subject))

    if not rows:
        return []

    corpus = [row["question_text"] for row in rows]
    vectorizer = TfidfVectorizer(stop_words="english")
    vectors = vectorizer.fit_transform(corpus + [query])
    scores = cosine_similarity(vectors[-1], vectors[:-1])[0]
    ranked = scores.argsort()[::-1][:limit]

    results = []
    for index in ranked:
        row = dict(rows[index])
        row["score"] = float(scores[index])
        results.append(row)
    return results
