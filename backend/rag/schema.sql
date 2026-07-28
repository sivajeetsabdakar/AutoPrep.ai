CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id bigserial PRIMARY KEY,
    provider text NOT NULL DEFAULT 'google',
    provider_user_id text,
    email text NOT NULL UNIQUE,
    name text,
    image text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_submissions (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    image text NOT NULL,
    status text NOT NULL CHECK (status IN ('accepted', 'rejected')),
    rejection_reason text,
    validation jsonb NOT NULL,
    question_chunk_id bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_chunks (
    id bigserial PRIMARY KEY,
    external_id text NOT NULL UNIQUE,
    exam_type text NOT NULL CHECK (exam_type IN ('jee', 'neet')),
    subject text NOT NULL,
    chapter text,
    question_text text NOT NULL,
    answer text,
    image text,
    source text NOT NULL,
    embedding vector(384) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS question_chunks_exam_subject_idx
    ON question_chunks (exam_type, subject);

CREATE INDEX IF NOT EXISTS question_chunks_embedding_hnsw_idx
    ON question_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS question_submissions_user_idx
    ON question_submissions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS question_attempts (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    question_chunk_id bigint NOT NULL REFERENCES question_chunks(id),
    context text NOT NULL DEFAULT 'practice',
    exam_type text NOT NULL CHECK (exam_type IN ('jee', 'neet')),
    subject text NOT NULL,
    chapter text,
    selected_answer text NOT NULL,
    correct_answer text,
    is_correct boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_chunk_id, context)
);

CREATE INDEX IF NOT EXISTS question_attempts_user_created_idx
    ON question_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS question_attempts_user_correct_idx
    ON question_attempts (user_id, is_correct, created_at DESC);
