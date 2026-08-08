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

## 13. Current Implementation Update

This section was added after the latest implementation pass. It does not remove the earlier analysis; it records what changed after the first RAG/auth/submission rollout.

### Production URLs and Repository Deployment

Current production frontend:

```txt
https://autoprep-ai-theta.vercel.app/
```

The Vercel project is connected to the GitHub repository:

```txt
github.com/sivajeetsabdakar/AutoPrep.ai
```

Because the repository contains both backend and frontend code, Vercel is configured with:

```txt
Root Directory: Frontend
Production Branch: main
Framework: Next.js
```

This means pushes to `main` trigger frontend production deployments automatically. The backend is deployed separately on an OCI Oracle VM as a Dockerized Flask/Gunicorn service.

### Provider-Neutral UI

The UI no longer exposes the underlying model/provider name in student-facing text. For example, the submission page now says "AI validation" instead of naming the validation provider. Technical configuration and internal documentation can still reference providers because they matter for deployment, debugging, and cost/quotas.

### Updated Frontend Page Status

Several pages that were earlier static/prototype surfaces have now been moved to live data:

- `/dashboard` uses real Neon/RAG metrics through `/api/dashboard-metrics`.
- `/leaderboard` uses real user submission/contribution data through `/api/leaderboard`.
- `/problem-of-the-day` uses real daily questions from Neon `question_chunks` through `/api/problem-of-the-day`.
- `/explore` uses a live education news RSS feed with official-source fallbacks.
- `/studybuddy` persists previous chat turns in browser local storage and sends recent conversation context to the backend.

Static fake names, fake dashboard metrics, fake leaderboard rows, fake daily-problem streaks, and fake homepage testimonials/stats were removed from the implemented UI surfaces.

## 14. Expanded RAG Architecture

The RAG system is now the central knowledge layer for Generate, StudyBuddy, user submissions, dashboard metrics, leaderboard contribution tracking, and daily practice.

### RAG Data Model

The main retrieval table is still:

```txt
question_chunks
```

Each row represents one searchable question item. The important fields are:

- `external_id` - stable id from CSV ingestion or `submission:{id}` for accepted user uploads.
- `exam_type` - `jee` or `neet`.
- `subject` - physics, chemistry, mathematics, or biology depending on exam.
- `chapter` - optional extracted or CSV-provided chapter/topic.
- `question_text` - text used for display and retrieval.
- `answer` - stored answer used for answer checking and StudyBuddy context.
- `image` - original/base64 question image when available.
- `source` - CSV/source marker or `user_submission`.
- `embedding vector(384)` - semantic vector used by pgvector search.
- `created_at` / `updated_at` - used for dashboard activity and weekly ingest charts.

The most important design decision is that accepted user submissions become rows in the same `question_chunks` table. This means new validated questions immediately become available to all RAG-powered flows without a second data format.

### Retrieval Path

For semantic retrieval:

1. The frontend sends a search-like user input to a Next.js API route.
2. The Next.js API route proxies the request to Flask.
3. Flask calls `RagService.retrieve()`.
4. The query is embedded as `RETRIEVAL_QUERY`.
5. `search_pgvector()` searches Neon with optional exam/subject filters.
6. Rows are sorted by cosine distance using pgvector.
7. The backend formats rows into frontend-safe source objects.

The query similarity score is computed as:

```sql
1 - (embedding <=> %s::vector) AS score
```

The HNSW index keeps this fast:

```sql
CREATE INDEX question_chunks_embedding_hnsw_idx
ON question_chunks USING hnsw (embedding vector_cosine_ops);
```

If vector retrieval fails, `RagService.retrieve()` falls back to CSV search. That fallback exists for development resilience and old-data compatibility; production should normally use Neon pgvector.

### Generate Page RAG

The Generate flow is retrieval-based, not free-form question invention.

Current flow:

```txt
/generate
  -> /api/generate
  -> /rag/generate-questions
  -> OCR text extraction
  -> query embedding
  -> pgvector search
  -> matching question_chunks
  -> frontend answerable cards
```

The user uploads an image, the backend extracts searchable text, and RAG retrieves the closest stored questions. This keeps practice grounded in the actual indexed question bank.

### StudyBuddy RAG and Conversation Memory

StudyBuddy now has three grounding layers:

1. Current student message.
2. Recent local conversation history.
3. Retrieved question-bank context.

Frontend behavior:

- Chat messages are stored in browser `localStorage` under `autoprep.studybuddy.messages`.
- The most recent user/assistant turns are sent to `/api/studybuddy`.
- Retrieved sources are shown below the assistant answer.
- Retrieved question cards are interactive: students can click MCQ options or enter integer answers.
- The UI gives correct/wrong feedback using the stored answer from `question_chunks`.

Backend behavior:

```txt
/rag/studybuddy
  -> RagService.answer()
  -> retrieve(doubt, exam_type, subject)
  -> _build_studybuddy_prompt(doubt, sources, history)
  -> external chat API or fallback response
```

The StudyBuddy system prompt instructs the assistant to:

- act as a focused JEE/NEET tutor,
- use RAG context when relevant,
- use previous conversation naturally for follow-ups,
- avoid inventing question-bank facts,
- redirect unsafe or cheating-oriented requests back to learning,
- keep answers concise unless the student asks for more depth.

The retrieved source cards are intentionally separate from the generated explanation. This lets the student both read the tutor response and directly practice matching retrieved questions.

### User Submission to RAG

The authenticated submission flow extends the RAG index with validated user content.

Current flow:

```txt
/submit-question
  -> NextAuth session required
  -> image upload max 5MB
  -> /api/submit-question
  -> /rag/submit-question
  -> AI validation/extraction
  -> duplicate check with embedding similarity
  -> question_submissions audit row
  -> accepted question_chunks row
```

Important safeguards:

- Upload must be an image.
- Upload must be at most 5MB.
- The image must contain a JEE/NEET-style question.
- An answer must be detected.
- Exam/subject combinations are restricted:
  - JEE: physics, chemistry, mathematics
  - NEET: physics, chemistry, biology
- Low-confidence validation is rejected.
- Duplicates are rejected using embedding similarity against existing `question_chunks`.

Accepted rows use:

```txt
source = user_submission
external_id = submission:{submission_id}
```

Rejected rows stay in `question_submissions` for audit/history but are not inserted into `question_chunks`, so they do not pollute retrieval.

### Duplicate Detection

Duplicate detection uses the same embedding stack as retrieval:

1. Extracted question + answer text is embedded.
2. The backend searches `question_chunks` filtered by exam and subject.
3. The closest match is inspected.
4. If similarity is above `DUPLICATE_SCORE_THRESHOLD`, the submission is rejected.

Default threshold:

```env
DUPLICATE_SCORE_THRESHOLD=0.92
```

This protects the RAG index from repeated submissions and keeps leaderboard/contribution counts meaningful.

### Daily Problem RAG

`/problem-of-the-day` is no longer a hardcoded sample page.

Frontend path:

```txt
/problem-of-the-day
  -> /api/problem-of-the-day?examType=jee|neet
  -> /rag/problem-of-the-day
```

Backend path:

```txt
get_problem_of_the_day(config, exam_type)
  -> select one daily question per subject from question_chunks
```

Subject sets:

```txt
JEE:  physics, chemistry, mathematics
NEET: physics, chemistry, biology
```

The selection uses a stable daily rotation:

```sql
row_number() OVER (
  PARTITION BY subject
  ORDER BY md5(COALESCE(external_id, id::text) || current_date::text)
) AS daily_rank
```

This means:

- the same day returns stable questions,
- a new calendar date rotates the selected questions,
- every subject gets one daily item when rows exist,
- the source is real Neon data, not a frontend fixture.

The frontend then normalizes the stored answer and supports:

- MCQ option selection,
- integer-answer input,
- immediate correct/wrong feedback,
- correct answer reveal only after an incorrect submission.

### Dashboard Metrics from RAG

`/dashboard` now calls:

```txt
/api/dashboard-metrics
  -> /rag/dashboard-metrics
```

The backend aggregates live data from Neon:

- total indexed questions from `question_chunks`,
- accepted submission count,
- rejected submission count,
- contributor count from `users`,
- subject breakdown,
- exam breakdown,
- weekly ingest counts,
- recent RAG/submission activity.

This turns the dashboard into a platform/RAG health view instead of fake personal progress metrics.

### Leaderboard from RAG Contributions

`/leaderboard` now calls:

```txt
/api/leaderboard
  -> /rag/leaderboard
```

The leaderboard is based on real authenticated user submission activity:

- users come from the Neon `users` table,
- accepted/rejected/total counts come from `question_submissions`,
- points are derived from accepted submissions,
- entries only appear after users submit real questions.

Current scoring:

```txt
points = accepted_submissions * 100
```

This intentionally avoids fake rows. If there are no approved contributors, the page shows an honest empty state.

### Explore Page

The Explore page was changed from old hardcoded 2024 content to live education news via RSS, with official NTA/JEE/NEET fallback cards. It is not part of RAG retrieval, but it now follows the same principle: avoid stale static data in production UI.

## 15. Current Live API Surface

Important backend RAG routes:

- `GET /rag/health`
- `POST /rag/search`
- `POST /rag/generate-questions`
- `POST /rag/studybuddy`
- `POST /rag/submit-question`
- `POST /rag/question-attempts`
- `POST /rag/user-progress`
- `GET /rag/dashboard-metrics`
- `GET /rag/leaderboard`
- `GET /rag/problem-of-the-day?examType=jee|neet`

Important frontend proxy routes:

- `GET /api/problem-of-the-day`
- `GET /api/dashboard-metrics`
- `GET /api/leaderboard`
- `POST /api/question-attempts`
- `GET /api/user-progress`
- `POST /api/studybuddy`
- `POST /api/generate`
- `POST /api/submit-question`
- `GET /api/get-questions`
- `/api/auth/[...nextauth]`

## 16. Mathematical Formulas and Scoring Rules

This section lists the formulas and rule-based calculations used by AutoPrep.ai. Most production retrieval uses vector embeddings and pgvector. Older CSV fallback paths still use TF-IDF with cosine similarity.

### Vector Similarity for RAG Retrieval

Each question and user query is represented as an embedding vector:

```txt
q = [q1, q2, ..., q384]
d = [d1, d2, ..., d384]
```

Cosine similarity is conceptually:

```txt
cosine_similarity(q, d) = (q . d) / (||q|| * ||d||)
```

In Neon pgvector, AutoPrep uses cosine distance through the `<=>` operator and converts it into a similarity score:

```sql
1 - (embedding <=> query_embedding) AS score
```

Rows are ranked by ascending cosine distance:

```sql
ORDER BY embedding <=> query_embedding
```

Interpretation:

- Higher `score` means the stored question is semantically closer to the student query.
- Lower cosine distance means a better match.
- The Generate and StudyBuddy flows return the top-K closest rows.

### Top-K Retrieval

The backend limits retrieval to a bounded number of best matches:

```txt
TopK(query) = first K rows after sorting by cosine distance ascending
```

The route layer clamps K into a small range:

```txt
limit = max(1, min(requested_limit, 20))
```

The Generate flow currently sends:

```txt
topK = 8
```

### Duplicate Detection

For an accepted-looking user submission, the backend embeds the extracted question and answer, searches for the closest existing question in the same exam and subject, and compares the score to a configured threshold:

```txt
duplicate if similarity_score >= DUPLICATE_SCORE_THRESHOLD
```

Default:

```env
DUPLICATE_SCORE_THRESHOLD=0.92
```

This prevents near-identical submissions from being inserted into `question_chunks`.

### Submission Confidence Threshold

Gemini multimodal validation returns a confidence value in the range `0.0` to `1.0`. AutoPrep accepts the extracted question only if the confidence meets the configured minimum:

```txt
accept_validation if confidence >= SUBMISSION_CONFIDENCE_THRESHOLD
```

Default:

```env
SUBMISSION_CONFIDENCE_THRESHOLD=0.7
```

The frontend displays this as a percentage:

```txt
display_confidence = round(confidence * 100)
```

### TF-IDF Fallback Retrieval

Legacy CSV retrieval and the RAG CSV fallback use TF-IDF when pgvector retrieval is unavailable.

Term frequency:

```txt
tf(t, d) = count(t in d) / total_terms(d)
```

Inverse document frequency:

```txt
idf(t) = log(N / df(t))
```

TF-IDF weight:

```txt
tfidf(t, d) = tf(t, d) * idf(t)
```

The implementation uses scikit-learn `TfidfVectorizer`, which handles tokenization, normalization, and smoothing internally. Similarity is then computed with cosine similarity:

```txt
cosine_similarity(query_vector, document_vector)
```

Examples in the older subject modules:

- Chemistry keeps results only when `score > 0.2`.
- Mathematics chooses the most similar chapter only when `similarity_score > 0.5`.
- The newer CSV fallback ranks all available rows by TF-IDF cosine similarity and returns the requested top-K.

### Daily Problem Rotation

Daily problems are selected with a stable pseudo-random ordering per subject:

```sql
row_number() OVER (
  PARTITION BY subject
  ORDER BY md5(COALESCE(external_id, id::text) || current_date::text)
) AS daily_rank
```

The selected daily problem is:

```txt
daily_problem(subject, date) = row where daily_rank = 1
```

This makes the result stable for a calendar date while rotating automatically on the next date.

### Answer Checking

Stored and selected answers are normalized before comparison:

```txt
normalized_answer = trim(lowercase(answer))
```

Additional cleanup removes common wrappers:

```txt
"Option 2" -> "2"
"(2)" -> "2"
"i 42" -> "42" for integer-answer questions
```

Correctness is exact equality after normalization:

```txt
is_correct = normalized_selected_answer == normalized_correct_answer
```

### User Progress Metrics

Total attempts:

```txt
total_attempts = count(question_attempts)
```

Correct attempts:

```txt
correct_attempts = count(question_attempts where is_correct = true)
```

Incorrect attempts:

```txt
incorrect_attempts = max(0, total_attempts - correct_attempts)
```

Accuracy:

```txt
accuracy_percent = round((correct_attempts / total_attempts) * 100)
```

If `total_attempts = 0`, accuracy is reported as `0`.

Solved questions:

```txt
solved_questions = count(distinct question_chunk_id)
```

### Practice Streak

The backend builds the set of distinct attempt dates for a user and counts consecutive active days ending today. If the user has no attempt today but did attempt yesterday, the streak starts from yesterday:

```txt
cursor = today if today in attempt_days else yesterday
streak = consecutive days where cursor in attempt_days
```

This allows an active streak to remain visible until the next missed day fully passes.

### Leaderboard Scoring

Leaderboard points are based only on accepted question submissions:

```txt
points = accepted_submissions * 100
```

Ranking order:

```txt
accepted_submissions desc,
total_submissions desc,
latest_activity desc
```

Badges are assigned from rank and accepted count:

```txt
rank 1 with accepted_count > 0 -> Top contributor
rank 2 or 3 with accepted_count > 0 -> Core contributor
accepted_count > 0 -> Verified contributor
otherwise -> New contributor
```

### Dashboard Aggregations

Acceptance rate:

```txt
acceptance_rate = round((accepted_submissions / total_submissions) * 100)
```

If `total_submissions = 0`, acceptance rate is `0`.

Subject coverage bar values are normalized to the largest subject count:

```txt
subject_coverage_percent = round((subject_total / max_subject_total) * 100)
```

Weekly ingest and weekly attempt charts use seven calendar buckets:

```txt
date range = current_date - 6 days through current_date
```

### Relative Time Display

Recent activity timestamps are shown with rounded units:

```txt
minutes = max(1, round((now - timestamp) / 60000))
hours = round(minutes / 60)
days = round(hours / 24)
```

The frontend displays minutes when `< 60`, hours when `< 24`, and days after that.

## 17. Verification Snapshot

Latest verification commands used:

```sh
python -m compileall backend -q
cd Frontend
npm run lint
npm run build
```

Live checks performed after deployment:

```txt
GET https://autoprep-ai-theta.vercel.app/problem-of-the-day -> 200
GET https://autoprep-ai-theta.vercel.app/submit-question -> 200
GET https://autoprep-ai-theta.vercel.app/leaderboard -> 200
GET https://autoprep-ai-theta.vercel.app/question-me -> 200
GET https://autoprep-ai-theta.vercel.app/ -> 200
```

The live daily problem API returned real JEE subject coverage:

```txt
physics, chemistry, mathematics
```

The backend daily problem endpoint also returned NEET coverage:

```txt
physics, chemistry, biology
```

## 18. Updated Known Limitations and Next Improvements

The earlier known limitations still matter, but the static/prototype statement has been reduced in scope by the recent work. The largest remaining improvements are:

- Persist personal quiz attempts and daily-problem results per authenticated user instead of browser-only/session-only checking.
- Add a real `question_attempts` table for per-user accuracy, streaks, solved counts, and personal progress.
- Move base64 image storage from Neon rows to object storage once volume grows.
- Add admin review/moderation for accepted and rejected user submissions.
- Add source-quality labels to distinguish CSV-ingested rows from user-submitted rows.
- Add better option parsing for questions whose choices are stored in unusual formats or only as images.
- Add server-side answer checking endpoints if client-side answer reveal needs stricter anti-cheat behavior.
- Add automated end-to-end tests for submission, RAG search, daily problem answer checking, and StudyBuddy source cards.

