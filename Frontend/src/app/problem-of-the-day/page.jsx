"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BookOpen, CheckCircle2, RefreshCcw, Target, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProblemOfDay() {
  const { data: session } = useSession()
  const [examType, setExamType] = useState("jee")
  const [problems, setProblems] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submittedAnswers, setSubmittedAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [saveStatus, setSaveStatus] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadProblems() {
      setIsLoading(true)
      setError("")
      setSelectedAnswers({})
      setSubmittedAnswers({})

      try {
        const response = await fetch(`/api/problem-of-the-day?examType=${examType}`, { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Could not load daily problems.")
        }
        if (mounted) {
          setProblems(data.dailyProblems?.problems || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Could not load daily problems.")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadProblems()
    return () => {
      mounted = false
    }
  }, [examType])

  const solvedCount = useMemo(
    () =>
      problems.filter((problem) => {
        const answer = normalizeAnswer(problem.answer)
        return answersMatch(submittedAnswers[problem.id], answer.value)
      }).length,
    [problems, submittedAnswers],
  )

  const activeTab = problems[0]?.subject || ""

  const handleSubmitAnswer = async (problem, value) => {
    setSubmittedAnswers((current) => ({ ...current, [problem.id]: value }))
    setSaveStatus("")

    if (!session?.user?.email) {
      setSaveStatus("Sign in to save this attempt to your progress.")
      return
    }

    try {
      const response = await fetch("/api/question-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionChunkId: problem.id,
          selectedAnswer: value,
          context: "problem_of_the_day",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Could not save attempt.")
      }
      setSaveStatus("Saved to your progress.")
    } catch (err) {
      setSaveStatus(err.message || "Could not save attempt.")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-accent">
              <Target className="h-4 w-4" />
              Daily practice
            </div>
            <h1 className="text-3xl font-bold tracking-normal md:text-4xl">Problem of the Day</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Solve one fresh question per subject and check your answer instantly.
            </p>
            {saveStatus && <p className="mt-2 text-sm text-muted-foreground">{saveStatus}</p>}
          </div>

          <div className="flex gap-2">
            <Button variant={examType === "jee" ? "default" : "outline"} onClick={() => setExamType("jee")}>
              JEE
            </Button>
            <Button variant={examType === "neet" ? "default" : "outline"} onClick={() => setExamType("neet")}>
              NEET
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                Today's Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-72 items-center justify-center text-muted-foreground">Loading daily questions...</div>
              ) : error ? (
                <div className="flex h-72 items-center justify-center text-center text-red-500">{error}</div>
              ) : problems.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-center text-muted-foreground">
                  No questions are available for this exam yet.
                </div>
              ) : (
                <Tabs defaultValue={activeTab} className="space-y-5">
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${problems.length}, minmax(0, 1fr))` }}>
                    {problems.map((problem) => (
                      <TabsTrigger key={problem.id} value={problem.subject} className="capitalize">
                        {problem.subject}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {problems.map((problem) => (
                    <TabsContent key={problem.id} value={problem.subject}>
                      <DailyProblem
                        problem={problem}
                        selectedAnswer={selectedAnswers[problem.id] || ""}
                        submittedAnswer={submittedAnswers[problem.id] || ""}
                        onSelect={(value) => setSelectedAnswers((current) => ({ ...current, [problem.id]: value }))}
                        onSubmit={(value) => handleSubmitAnswer(problem, value)}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-accent">
                  {solvedCount}/{problems.length || 0}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Correct answers in this browser session.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 text-accent" />
                  Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Questions refresh each day for the selected exam.</p>
                <p>Practice across Physics, Chemistry, and the exam-specific third subject.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function DailyProblem({ problem, selectedAnswer, submittedAnswer, onSelect, onSubmit }) {
  const answer = normalizeAnswer(problem.answer)
  const options = extractOptions(problem.text)
  const questionText = options.length >= 2 ? stripOptions(problem.text) : problem.text
  const hasSubmitted = Boolean(submittedAnswer)
  const isCorrect = hasSubmitted && answersMatch(submittedAnswer, answer.value)
  const isIntegerAnswer = answer.kind === "integer"

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium capitalize text-accent">
          {problem.examType?.toUpperCase()} {problem.subject}
          {problem.chapter ? ` - ${problem.chapter}` : ""}
        </p>
        <p className="whitespace-pre-line leading-7">{questionText || "Question image available"}</p>
      </div>

      {problem.image && <img src={problem.image} alt="Daily problem" className="max-h-[420px] w-full rounded-md border object-contain" />}

      {options.length >= 2 ? (
        <div className="grid gap-2">
          {options.map((option) => {
            const selected = submittedAnswer === option.value
            const correct = answersMatch(option.value, answer.value)
            return (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => onSubmit(option.value)}
                className={`h-auto justify-start whitespace-normal text-left ${
                  selected && correct
                    ? "border-green-500 bg-green-500/10 text-green-700"
                    : selected
                      ? "border-red-500 bg-red-500/10 text-red-700"
                      : ""
                }`}
              >
                <span className="mr-2 font-bold">({option.value})</span>
                <span>{option.label}</span>
              </Button>
            )
          })}
        </div>
      ) : isIntegerAnswer ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={selectedAnswer} onChange={(event) => onSelect(event.target.value)} placeholder="Enter your answer" />
          <Button onClick={() => onSubmit(selectedAnswer)} disabled={!selectedAnswer.trim()}>
            Check Answer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["1", "2", "3", "4"].map((option) => {
            const selected = submittedAnswer === option
            const correct = answersMatch(option, answer.value)
            return (
              <Button
                key={option}
                variant="outline"
                onClick={() => onSubmit(option)}
                className={
                  selected && correct
                    ? "border-green-500 bg-green-500/10 text-green-700"
                    : selected
                      ? "border-red-500 bg-red-500/10 text-red-700"
                      : ""
                }
              >
                ({option})
              </Button>
            )
          })}
        </div>
      )}

      {hasSubmitted && (
        <div className={`flex items-start gap-2 rounded-md border p-4 ${isCorrect ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-red-500/40 bg-red-500/10 text-red-700"}`}>
          {isCorrect ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
          <div>
            <p className="font-medium">{isCorrect ? "Correct" : "Wrong"}</p>
            {!isCorrect && <p className="mt-1 text-sm">Correct answer: {answer.display}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeAnswer(rawAnswer = "") {
  const raw = String(rawAnswer).trim()
  if (!raw) return { kind: "missing", value: "", display: "" }
  if (/^i/i.test(raw)) {
    const value = raw.slice(1).trim()
    return { kind: "integer", value: cleanAnswerValue(value), display: value }
  }
  const optionMatch = raw.match(/[1-4]/)
  const value = optionMatch ? optionMatch[0] : raw
  return { kind: "mcq", value: cleanAnswerValue(value), display: value }
}

function cleanAnswerValue(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^option\s+/i, "")
    .replace(/^\(|\)$/g, "")
}

function answersMatch(given, correct) {
  return cleanAnswerValue(given) === cleanAnswerValue(correct)
}

function extractOptions(text = "") {
  const matches = [...String(text).matchAll(/(?:^|\s)\(([1-4])\)\s*([\s\S]*?)(?=\s+\([1-4]\)\s*|$)/g)]
  return matches
    .map((match) => ({
      value: match[1],
      label: match[2].replace(/\s+/g, " ").trim(),
    }))
    .filter((option) => option.label)
}

function stripOptions(text = "") {
  const firstOption = String(text).search(/(?:^|\s)\([1-4]\)\s*/)
  if (firstOption === -1) return text
  return text.slice(0, firstOption).trim()
}
