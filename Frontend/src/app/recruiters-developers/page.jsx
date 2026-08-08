import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Brain, CheckCircle2, Database, FileSearch, GitBranch, ShieldCheck } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "For Recruiters and Developers | AutoPrep.ai",
  description: "Architecture, backend flow, retrieval pipeline, and engineering notes for AutoPrep.ai.",
}

const architecturePoints = [
  {
    icon: FileSearch,
    title: "Notes to Practice",
    text: "Students upload a notes or question image, the backend extracts text with OCR, and the system returns matching JEE/NEET practice questions.",
  },
  {
    icon: Brain,
    title: "StudyBuddy",
    text: "The tutor retrieves relevant question-bank context, combines it with the current chat, and sends a focused prompt to the external chat service.",
  },
  {
    icon: ShieldCheck,
    title: "Question Review",
    text: "Submitted question images are checked for exam, subject, question text, answer, confidence, and duplicates before they can join the question bank.",
  },
  {
    icon: Database,
    title: "Progress and Metrics",
    text: "Attempts, answer correctness, streaks, leaderboard points, subject coverage, and weekly question activity are read from the same production data layer.",
  },
]

const flowSteps = [
  "Next.js pages collect the student's action: upload, doubt, daily problem attempt, or submission.",
  "Next.js API routes handle session checks and forward requests to the Python backend.",
  "Flask routes run OCR, retrieval, question review, progress recording, and dashboard aggregation.",
  "Neon Postgres with pgvector stores searchable question chunks, users, submissions, and attempts.",
  "The frontend renders practice cards, answer feedback, progress charts, and contribution rankings.",
]

const formulas = [
  {
    label: "Retrieval score",
    value: "score = 1 - cosine_distance(question_embedding, query_embedding)",
  },
  {
    label: "Duplicate check",
    value: "duplicate if similarity_score >= 0.92",
  },
  {
    label: "Accuracy",
    value: "accuracy = round((correct_attempts / total_attempts) * 100)",
  },
  {
    label: "Leaderboard",
    value: "points = accepted_submissions * 100",
  },
]

export default function RecruitersDevelopersPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b bg-accent px-4 py-12 text-accent-foreground md:px-8">
        <div className="mx-auto max-w-6xl">
          <Button asChild variant="secondary" className="mb-8">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">For Recruiters and Developers</p>
            <h1 className="text-4xl font-bold tracking-normal md:text-5xl">How AutoPrep.ai Works</h1>
            <p className="mt-4 text-lg leading-8 text-white/90">
              AutoPrep.ai is a full-stack JEE/NEET preparation platform with a Next.js frontend, a Python Flask backend, OCR,
              vector search, question review, daily practice, and progress tracking.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl space-y-10">
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Software Architecture</h2>
            <div className="overflow-hidden rounded-md border bg-white shadow-sm">
              <Image
                src="/software-architecture.png"
                alt="AutoPrep.ai software architecture diagram"
                width={2048}
                height={1152}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-auto w-full"
                priority
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {architecturePoints.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-accent" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">Request Flow</h2>
                <p className="mt-2 text-muted-foreground">
                  The application keeps the student-facing experience simple while separating frontend, backend, database, and external service concerns.
                </p>
              </div>

              <div className="space-y-3">
                {flowSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-md border bg-card p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-accent" />
                  Production Shape
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  The frontend is deployed on Vercel from the `Frontend` directory. The backend runs separately as a Dockerized
                  Flask/Gunicorn service on an OCI VM.
                </p>
                <p>
                  Neon Postgres stores question chunks, submissions, users, and attempts. pgvector powers semantic retrieval,
                  while CSV/TF-IDF fallback paths remain for compatibility.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Data and Retrieval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Question rows are normalized into `question_chunks` with exam, subject, chapter, question text, answer, image,
                  source, and a 384-dimensional embedding.
                </p>
                <p>
                  Generate and StudyBuddy embed the student's query, search by cosine distance, and return the closest practice
                  material for the selected exam and subject.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Uploaded question images are reviewed for file type, size, exam, subject, question text, answer, and confidence.
                  Invalid or duplicate submissions are rejected with a reason.
                </p>
                <p>
                  Accepted submissions are inserted into the same searchable question table, so they become available to Generate,
                  StudyBuddy, daily practice, and dashboard metrics.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">Key Scoring Rules</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {formulas.map((formula) => (
                <div key={formula.label} className="rounded-md border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <p className="font-medium">{formula.label}</p>
                  </div>
                  <code className="block rounded-md bg-muted p-3 text-xs text-muted-foreground">{formula.value}</code>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
