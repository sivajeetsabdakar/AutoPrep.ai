# AutoPrep.ai Technical Analysis

## 1. System Overview

AutoPrep.ai is a JEE/NEET preparation platform with a Next.js frontend and a Python Flask backend. The app helps students retrieve relevant practice questions, ask a StudyBuddy assistant, practice random questions, and contribute new question images into the question bank.

The current architecture is:

```txt
Next.js frontend on Vercel
  -> Next.js API proxy routes
  -> Flask backend on Python/OCI VM
      -> OCR and image processing
      -> Gemini validation and embeddings
      -> Neon Postgres + pgvector
      -> Flinder AI chat API for generated StudyBuddy responses
```

The system started as a CSV-backed question retrieval app using TF-IDF. It has now been extended with a RAG pipeline using Neon `pgvector`, Gemini embeddings, Gemini multimodal validation, and an external Gemini-powered chat API.

## 2. Frontend

The frontend lives in `Frontend/` and uses Next.js App Router.

Main user-facing pages:

- `/` - home page and feature overview.
- `/generate` - upload notes/question image and retrieve matching practice questions.
- `/studybuddy` - ask a doubt and receive an AI response grounded in retrieved question-bank context.
- `/question-me` - random JEE/NEET practice questions.
- `/submit-question` - authenticated question contribution flow.
- `/auth` - Google sign-in/sign-out page.
- `/dashboard`, `/leaderboard`, `/explore`, `/problem-of-the-day` - currently mostly static/prototype feature surfaces.

Frontend API routes act as a controlled proxy to the Flask backend:

- `/api/generate` -> backend `/rag/generate-questions`
- `/api/studybuddy` -> backend `/rag/studybuddy`
- `/api/get-questions` -> backend `/get-questions`
- `/api/submit-question` -> backend `/rag/submit-question`
- `/api/auth/[...nextauth]` -> NextAuth Google auth

The frontend uses NextAuth with Google provider. The session provider wraps the app in `layout.js`, and protected features check session state through `useSession()` or `getServerSession()`.

## 3. Backend

The backend lives in `backend/` and is a Flask app exposed from `server.py`.

Older backend features still exist:

- OCR extraction through Tesseract.
- CSV-based subject retrieval modules.
- Random question retrieval from CSVs.
- PDF highlighting utilities.

The newer RAG implementation lives under `backend/rag/`.

Important backend RAG modules:

- `config.py` - reads runtime configuration from environment variables.
- `embeddings.py` - creates embeddings using Gemini, OpenAI, SentenceTransformers, or hash fallback.
- `database.py` - Neon/pgvector queries, inserts, user records, and submission persistence.
- `service.py` - high-level retrieval and StudyBuddy response orchestration.
- `routes.py` - Flask routes under `/rag`.
- `ingest.py` - CSV-to-vector ingestion script.
- `submissions.py` - user question submission validation, duplicate detection, and accepted-question insertion.
- `schema.sql` - additive Neon schema.
- `reset_schema.sql` - destructive reset schema for development/reseeding.

## 4. Database: Neon Postgres + pgvector

Neon is the main database. It stores users, question submissions, and vector-searchable question chunks.

Core tables:

### `question_chunks`

This is the RAG retrieval table.

It stores:

- `external_id`
- `exam_type`
- `subject`
- `chapter`
- `question_text`
- `answer`
- `image`
- `source`
- `embedding vector(384)`

Rows can come from:

- CSV ingestion
- accepted user submissions

The vector index uses HNSW:

```sql
CREATE INDEX question_chunks_embedding_hnsw_idx
ON question_chunks USING hnsw (embedding vector_cosine_ops);
```

### `users`

Stores local user records linked to Google auth.

Fields include:

- provider
- provider user id
- email
- name
- profile image

### `question_submissions`

Stores audit history for every authenticated question submission.

It keeps:

- submitter user id
- raw image as base64/data URL
- accepted/rejected status
- rejection reason
- Gemini validation JSON
- linked `question_chunk_id` when accepted

This separation matters because rejected submissions are not added to RAG, but the system can still explain why they were rejected and preserve an audit trail.

## 5. RAG Pipeline

RAG means Retrieval-Augmented Generation. AutoPrep uses RAG mainly for two flows:

1. Matching uploaded notes/images to relevant practice questions.
2. Grounding StudyBuddy answers in retrieved question-bank context.

### Ingestion

CSV question banks are ingested using:

```sh
cd backend
python -m rag.ingest
```

The ingestion script:

1. Reads CSV files from `backend/csvFiles`.
2. Normalizes each row into a question document.
3. Builds searchable text from exam, subject, chapter, question, and answer.
4. Embeds the text.
5. Inserts or updates the row in `question_chunks`.

For a small test:

```sh
python -m rag.ingest --limit-per-file 25
```

### Embeddings

The main embedding provider is Gemini:

```env
RAG_EMBEDDING_PROVIDER=gemini
RAG_EMBEDDING_MODEL=gemini-embedding-001
RAG_EMBEDDING_DIMENSION=384
```

The code calls Gemini `embedContent` with `outputDimensionality=384`, so Neon can use `vector(384)` instead of storing very large vectors.

Embedding task types:

- `RETRIEVAL_DOCUMENT` for indexed question-bank rows.
- `RETRIEVAL_QUERY` for student questions/searches.

Fallback providers exist:

- `sentence-transformers` for local/offline embeddings.
- `hash` for no-key local development.
- `openai` remains supported but is not required.

### Retrieval

At query time:

1. The query text is embedded.
2. The backend searches `question_chunks` with pgvector cosine similarity.
3. Optional filters restrict by `exam_type` and `subject`.
4. Top matching rows are formatted for frontend use.

The core SQL computes similarity as:

```sql
1 - (embedding <=> query_embedding) AS score
```

If vector retrieval fails, the service falls back to CSV/TF-IDF retrieval so the app still has a local development path.

## 6. Generate Questions Flow

The `/generate` page lets users upload an image and choose exam/subject.

Flow:

1. Frontend converts the image to base64.
2. `/api/generate` sends it to backend `/rag/generate-questions`.
3. Backend extracts searchable text using OCR.
4. Extracted text is embedded.
5. Neon pgvector retrieves relevant questions.
6. Frontend renders returned question images/text/answers/hints.

This is retrieval, not pure generation. The questions come from the stored question bank.

## 7. StudyBuddy Flow

StudyBuddy uses RAG plus an external chat API.

Flow:

1. User enters a doubt.
2. `/api/studybuddy` forwards it to `/rag/studybuddy`.
3. Backend retrieves relevant context from `question_chunks`.
4. Backend builds a prompt containing:
   - student doubt
   - retrieved sources
   - instructions to answer using context when relevant
5. Backend sends the prompt to the deployed Flinder AI API.
6. Flinder AI calls Gemini Flash-Lite and returns generated text.
7. Frontend displays the response and retrieved sources.

Flinder AI endpoint:

```env
AI_CHAT_URL=https://qounuxa2da.execute-api.ap-south-1.amazonaws.com/dev
AI_SHARED_TOKEN=...
```

The token is sent through the `X-AI-Token` header. The token must remain server-side.

## 8. Auth-Gated Question Submission

The `/submit-question` page lets signed-in users contribute new question images.

Rules:

- User must sign in with Google.
- Upload must be an image.
- Max size is 5MB.
- Image must contain a JEE/NEET question and its answer.
- Gemini decides whether the submission is valid.
- Duplicates are rejected.
- Accepted submissions are added to RAG immediately.

### Frontend Submission Flow

1. User signs in through `/auth`.
2. User opens `/submit-question`.
3. User uploads one image.
4. Client validates file type and size.
5. `/api/submit-question` checks server-side session.
6. The API route forwards image and user metadata to backend `/rag/submit-question`.

### Backend Submission Flow

1. Validate base64 image and detect MIME type.
2. Reject unsupported image formats or images over 5MB.
3. Send the image to Gemini multimodal validation.
4. Gemini returns strict JSON:

```json
{
  "is_valid": true,
  "exam_type": "jee",
  "subject": "physics",
  "chapter": "optional",
  "question_text": "extracted question",
  "answer": "extracted answer",
  "confidence": 0.92,
  "reason": "short explanation"
}
```

5. Backend rejects if:
   - not valid
   - confidence is too low
   - unsupported exam or subject
   - question text is missing
   - answer is missing
   - JEE is classified as biology
   - NEET is classified as mathematics
6. If valid, backend embeds the extracted question/answer text.
7. Backend searches `question_chunks` for near-duplicates.
8. If similarity is above `DUPLICATE_SCORE_THRESHOLD`, reject as duplicate.
9. Store submission in `question_submissions`.
10. If accepted, insert into `question_chunks` with:

```txt
source = user_submission
external_id = submission:{submission_id}
```

The accepted user question becomes searchable by Generate, StudyBuddy, and RAG search.

## 9. Configuration

Frontend environment:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_long_random_secret
GOOGLE_CLIENT_ID=replace_with_google_oauth_client_id
GOOGLE_CLIENT_SECRET=replace_with_google_oauth_client_secret
```

Backend environment:

```env
DATABASE_URL=postgresql://...
RAG_EMBEDDING_PROVIDER=gemini
RAG_EMBEDDING_MODEL=gemini-embedding-001
RAG_EMBEDDING_DIMENSION=384
GEMINI_API_KEY=...
AI_CHAT_URL=https://qounuxa2da.execute-api.ap-south-1.amazonaws.com/dev
AI_SHARED_TOKEN=...
SUBMISSION_CONFIDENCE_THRESHOLD=0.7
DUPLICATE_SCORE_THRESHOLD=0.92
CORS_ORIGINS=http://localhost:3000,https://your-vercel-domain.vercel.app
```

Secrets must not be committed. Use `.env` locally and platform secrets on Vercel/OCI.

## 10. Deployment Shape

Recommended deployment:

- Frontend: Vercel
- Backend: OCI Oracle VM running Flask/Gunicorn
- Database: Neon Postgres
- Vector search: Neon pgvector
- Chat generation: existing Flinder AI API
- Image storage v1: base64 in Neon

Backend Dockerfile runs:

```txt
gunicorn --bind 0.0.0.0:5000 server:app
```

## 11. Verification Commands

Frontend:

```sh
cd Frontend
npm run lint
npm run build
```

Backend:

```sh
python -m compileall backend -q
```

RAG ingestion:

```sh
cd backend
python -m rag.ingest --limit-per-file 25
python -m rag.ingest
```

Health check:

```sh
curl http://localhost:5000/rag/health
```

## 12. Current Known Limitations

- Auth is implemented with Google/NextAuth, but Google OAuth credentials must be configured.
- User image storage is base64 in Neon for v1; object storage should replace this later.
- AI-only approval can misclassify images; admin moderation can be added later.
- Some older pages still use static/demo data.
- Some older backend TF-IDF modules remain for compatibility and fallback.
- Full production ingestion should be run after confirming Gemini quota and Neon schema.

