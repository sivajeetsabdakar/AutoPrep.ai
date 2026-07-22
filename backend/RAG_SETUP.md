# RAG Setup

AutoPrep.ai now supports a hosted RAG path with Neon Postgres + pgvector.

## 1. Configure Neon

Open the Neon SQL editor and run:

```sql
\i rag/schema.sql
```

If your SQL editor does not support `\i`, paste the contents of `backend/rag/schema.sql`.

## 2. Configure Backend Env

Copy `backend/.env.example` to `backend/.env` locally or set these on the OCI VM:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
RAG_EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=...
CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

Use `RAG_EMBEDDING_PROVIDER=gemini` to reuse the same Gemini key as Flinder AI for free-tier semantic retrieval. AutoPrep requests `gemini-embedding-001` with `outputDimensionality=384`, so Neon uses `vector(384)`.

```env
RAG_EMBEDDING_PROVIDER=gemini
RAG_EMBEDDING_MODEL=gemini-embedding-001
RAG_EMBEDDING_DIMENSION=384
GEMINI_API_KEY=the_same_key_used_by_flinder_ai
```

Use `RAG_EMBEDDING_PROVIDER=sentence-transformers` if you want a fully offline fallback on the OCI VM.

For the free chat path, connect the already-deployed Flinder AI service:

```env
AI_CHAT_URL=https://your-flinder-ai-url
AI_SHARED_TOKEN=the_same_token_set_on_flinder_ai
```

AutoPrep calls `POST /ask` with the retrieved RAG context and expects the Flinder AI response shape:

```json
{
  "model": "gemini-2.5-flash-lite",
  "response": "Generated text..."
}
```

## 3. Ingest Question Bank

From the `backend` directory:

```sh
python -m rag.ingest
```

For a quick smoke test:

```sh
python -m rag.ingest --limit-per-file 25
```

## 4. API Endpoints

- `GET /rag/health`
- `POST /rag/search`
- `POST /rag/generate-questions`
- `POST /rag/studybuddy`
- `POST /rag/submit-question`

The frontend API routes now call `/rag/generate-questions` and `/rag/studybuddy`.

`/rag/submit-question` accepts authenticated user metadata from the Next.js API route, validates an image with Gemini, rejects duplicates, and inserts accepted rows into `question_chunks`.
