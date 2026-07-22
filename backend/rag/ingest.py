from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from .config import get_config
from .csv_fallback import CSV_SOURCES
from .database import insert_question_chunks
from .embeddings import EmbeddingService


def build_rows(limit_per_file: int | None = None):
    config = get_config()
    embeddings = EmbeddingService(config)

    for (exam_type, subject), (filename, text_column, image_column) in CSV_SOURCES.items():
        path = config.csv_dir / filename
        if not path.exists():
            print(f"Skipping missing file: {path}")
            continue

        df = pd.read_csv(path)
        if limit_per_file:
            df = df.head(limit_per_file)

        for index, row in df.iterrows():
            question_text = str(row.get(text_column) or row.get("question") or row.get("chapter") or "").strip()
            answer = str(row.get("ans") or row.get("solution") or "").strip()
            image = str(row.get(image_column) or row.get("image") or row.get("questionImage") or "").strip()
            chapter = str(row.get("chapter") or "").strip() or None
            if not question_text and not image:
                continue

            searchable_text = " ".join(part for part in [subject, chapter or "", question_text, answer] if part)
            yield {
                "external_id": f"{filename}:{index}",
                "exam_type": exam_type,
                "subject": subject,
                "chapter": chapter,
                "question_text": question_text or f"{subject} question from {filename}",
                "answer": answer,
                "image": image,
                "source": filename,
                "embedding": embeddings.embed(
                    searchable_text,
                    task_type="RETRIEVAL_DOCUMENT",
                    title=f"{exam_type.upper()} {subject} {chapter or filename}",
                ),
            }


def main():
    parser = argparse.ArgumentParser(description="Ingest CSV question bank into Neon pgvector.")
    parser.add_argument("--limit-per-file", type=int, default=None)
    args = parser.parse_args()

    count = insert_question_chunks(get_config(), build_rows(args.limit_per_file))
    print(f"Ingested {count} question chunks.")


if __name__ == "__main__":
    main()
