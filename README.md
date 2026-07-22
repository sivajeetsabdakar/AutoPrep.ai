# AutoPrep.ai

AutoPrep.ai is an advanced educational platform designed to enrich the preparation journey of students targeting JEE and NEET exams. It offers multiple interactive features that leverage NLP and AI to enhance learning.
![HomePage](https://drive.google.com/uc?export=view&id=1hujGidryNFg2nDNalcruFpAZka1YKLCS)
---

## Deployed URLs

- Frontend: https://autoprep-ai-theta.vercel.app/
- Backend API: configure with `NEXT_PUBLIC_BACKEND_URL` in `Frontend/.env.local`

## Features

### 1. Generate Questions
Upload an image, and our NLP model (TF-IDF) will extract relevant Previous Year Questions based on the topic contained in image.
Helps in getting quick question for better practice & conceptual understanding.

![Generate Questions Screenshot](https://drive.google.com/uc?id=148BPMTOr2M9FXRFtAdZ5I-tk6xzLKuN5)

### 2. Ask StudyBuddy
An AI-powered chatbot designed to answer student queries based on the subject matter.
Provides instant responses to aid learning.

![Ask StudyBuddy Screenshot](https://drive.google.com/uc?id=11MpabFRhENOW7RD1uVZHnJxujXG_giOQ)

### 3. Question Me
Generates three random questions for JEE or NEET.
Covers all three subjects (Physics, Chemistry, and Mathematics for JEE; Physics, Chemistry, and Biology for NEET).
Enhances quick revision and problem-solving skills.

![Question Me Screenshot](https://drive.google.com/uc?id=18uCNzjJJ2RP2H040OR7rfA-Xz_JNrQvb)

### 4. Explore
Displays the latest edu-related news and updates.
Keeps students informed about crucial developments in the education sector.

![Explore Screenshot](https://drive.google.com/uc?id=1PPa0afJSiEt-6ZUmb8eVM6UcU05cmRTk)

### 5. Problem of the Day
Provides a daily problem from the dataset for each subject.
Assigns points for solving problems correctly.
Integrated Leaderboard to track scores and compare rankings with peers.

![Problem of the Day Screenshot](https://drive.google.com/uc?id=11MpabFRhENOW7RD1uVZHnJxujXG_giOQ)

### 6. My Progress
Tracks continuous practice-based progress.
Displays performance in graphical representation for better insight.

![My Progress Screenshot](https://drive.google.com/uc?id=1SPHk3fVIBDFboXY1XKfUoXiF1AGpwQzZ)


---


## Installation & Setup

### Prerequisites

- Node.js 20+ and npm
- Python 3.12+
- Tesseract OCR
- Neon Postgres database with pgvector enabled
- Gemini API key or OpenAI API key for embeddings/chat

### 1. Clone the repository

```sh
git clone https://github.com/sivajeetsabdakar/AutoPrep.ai.git
cd AutoPrep.ai
```

### 2. Backend setup

Create the backend environment file:

```sh
cd backend
cp .env.example .env
```

Update `backend/.env` with your values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
RAG_EMBEDDING_PROVIDER=gemini
RAG_EMBEDDING_MODEL=gemini-embedding-001
RAG_EMBEDDING_DIMENSION=384
GEMINI_API_KEY=your_gemini_api_key
AI_CHAT_URL=https://your-flinder-ai-url
AI_SHARED_TOKEN=your_shared_token
```

Install backend dependencies:

```sh
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

On macOS/Linux, activate the virtual environment with:

```sh
source .venv/bin/activate
```

Create the RAG tables in Neon by running `backend/rag/schema.sql` in the Neon SQL editor.

Ingest the question bank:

```sh
python -m rag.ingest
```

For a quick test ingest:

```sh
python -m rag.ingest --limit-per-file 25
```

Run the backend:

```sh
python server.py
```

The backend runs at `http://localhost:5000`.

Useful backend endpoints:

- `GET /rag/health`
- `POST /rag/search`
- `POST /rag/generate-questions`
- `POST /rag/studybuddy`
- `POST /rag/submit-question`
- `GET /get-questions`

### 3. Frontend setup

Open a new terminal from the repository root:

```sh
cd Frontend
cp .env.example .env.local
```

Update `Frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_a_long_random_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

Install frontend dependencies:

```sh
npm install
```

Run the frontend in development:

```sh
npm run dev
```

Open `http://localhost:3000`.

Build and run production locally:

```sh
npm run build
npm start
```

### 4. Docker backend

You can also run the Flask backend with Docker:

```sh
cd backend
docker build -t autoprep-backend .
docker run --env-file .env -p 5000:5000 autoprep-backend
```

### 5. Production deployment

Frontend deployment uses Vercel. Set these environment variables in the Vercel project:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api-url
NEXTAUTH_URL=https://autoprep-ai-theta.vercel.app
NEXTAUTH_SECRET=replace_with_a_long_random_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

Backend deployment can run on any Python/Docker host. Set the same values from `backend/.env.example` on the host and expose port `5000`.

---

## 🛠️ Tech Stack  
- 🎨 **Frontend:** Next.js / React
- ⚙️ **Backend:** Python Flask
- 🗄️ **Database:** Neon Postgres with pgvector
- 🧠 **AI & NLP:** OCR, retrieval, embeddings, and RAG over the question bank

---

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.
